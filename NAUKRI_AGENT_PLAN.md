# Naukri Auto-Pilot Agent — Implementation Plan

> Status: DESIGN (approved) → BUILD IN PROGRESS
> Date: 2026-11-13

## 1. Goal

Replace the "browse Naukri manually → extension captures cURL → jobs appear" pipeline
with an **autonomous server-side agent** that:

1. Logs in to Naukri with stored credentials
2. Searches jobs from the user's profile (roles × locations)
3. Dedupes against everything ever seen/applied
4. Scores jobs against the user profile (`tailoredMatcher`)
5. Auto-applies to high-match jobs, answering questionnaires with AI
6. Tracks **platform-level truth** (what Naukri actually knows) and a full
   **audit trail** of every answer it gave, viewable in the UI

### Locked design decisions

| Decision | Choice |
|---|---|
| Session/auth | **Stored credentials** (server auto-login) |
| Apply mode | **Full auto-apply** (score threshold + guardrails) |
| Trigger | **Manual run** for now ("Run Agent" button) — scheduler added later |
| Job store | **MongoDB** (`JobCache` model) |
| Duplicates | **Never** — unique `jobId` index + `company:title` fingerprint upsert |
| Platform truth | Track "applied on real Naukri" via 3 signals (below) |
| Questionnaires | Every Q → A stored permanently for agent-quality review |

---

## 2. Architecture

```
 MANUAL TRIGGER (POST /api/agent/run  — "Run Agent" button)
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│ ORCHESTRATOR  (src/lib/naukriAgent/orchestrator.ts)          │
│                                                              │
│ 1. SESSION     stored creds → NaukriService.login()          │
│                → token cached in Mongo (reuse until 401)     │
│                                                              │
│ 2. PLAN        query matrix: profile roles[] × locations[]   │
│                (budgeted: max N search calls per run)        │
│                                                              │
│ 3. HARVEST     searchJobs() per query, paced w/ jitter       │
│                → normalize via formatNaukriJob()             │
│                                                              │
│ 4. STORE       upsert into JobCache (unique jobId)           │
│                existing job → update lastSeenAt/score ONLY   │
│                                                              │
│ 5. FILTER      skip from apply queue if:                     │
│                status ∈ {applied, skipped, tracked}          │
│                OR platformApplied == true                    │
│                                                              │
│ 6. SCORE       tailoredMatcher.scoreJobForProfile()          │
│                                                              │
│ 7. AUTO-APPLY  if score ≥ threshold AND company not in       │
│                blacklist AND daily cap not hit:              │
│                  a) pre-check getJobDetails():               │
│                     hideApplyButton / external URL → skip    │
│                  b) questionnaire? → generateAnswers() (AI)  │
│                     → store every Q&A in JobCache            │
│                  c) applyJob() → record response             │
│                     "already applied" → platformApplied=true │
│                                                              │
│ 8. REPORT      AgentRun doc: counts, timings, errors         │
└──────────────────────────────────────────────────────────────┘
```

### Platform-truth signals (priority order)

```
 1. APPLY RESPONSE (strongest)      apply-workflow rejects "already applied"
                                    → platformApplied = true, status = applied
 2. JOB DETAILS PRE-CHECK (free)    hideApplyButton: true, applyRedirectUrl,
                                    companyApplyUrl (external) → skip attempt
 3. LOCAL LEDGER (memory)           JobCache status / platformApplied flags
                                    → omitted from every future batch
```

---

## 3. Data models

### `JobCache` — one document per job, EVER (src/models/JobCache.ts)

```ts
{
  jobId: string            // unique index — hard dedup guarantee
  fingerprint: string      // unique sparse — `${company}:${title}` lowercase
  // job fields
  title, company, location, experience, salary, url: string
  skills: string[]
  postedAgo?: string
  // scoring
  matchScore: number
  reasons: string[]
  matchingSkills: string[]
  missingSkills: string[]
  // state
  status: 'new' | 'queued' | 'applied' | 'failed' | 'skipped' | 'tracked'
  platformApplied: boolean
  platformSource: 'apply-response' | 'hide-apply-button' | 'manual-browse' | 'extension-event' | null
  lastPlatformCheckAt: Date
  // apply audit
  apply: {
    attempts: number
    lastAttemptAt: Date
    success: boolean
    httpStatus?: number
    errorSnippet?: string
    runId?: ObjectId
  }
  // questionnaire audit trail (the agent's "report card")
  questionnaire: [{
    questionId: string
    question: string
    answer: string
    source: 'ai' | 'fallback'
    model?: string
  }]
  // provenance
  firstSeenAt: Date
  lastSeenAt: Date
  harvestRuns: ObjectId[]   // AgentRun ids that saw this job
}
```

Indexes: `{ jobId: 1 } unique`, `{ fingerprint: 1 } unique sparse`, `{ matchScore: -1 }`, `{ status: 1 }`.

### `AgentRun` — what the agent did, per run (src/models/AgentRun.ts)

```ts
{
  startedAt, finishedAt: Date
  trigger: 'manual' | 'schedule'        // schedule added later
  status: 'running' | 'success' | 'partial' | 'failed'
  // counters
  stats: {
    queriesRun, pagesFetched, rawJobsSeen, newJobs, duplicateJobs,
    scoredJobs, applyAttempts, applied, applyFailed, skippedAppliedOnPlatform,
    skippedExternal, questionnairesAnswered, aiAnswers, fallbackAnswers
  }
  // per-query breakdown
  queries: [{ keyword, location, page, jobsFound, newJobs, error? }]
  // per-application outcome
  applications: [{
    jobId, title, company, matchScore,
    outcome: 'applied' | 'already-applied-on-platform' | 'external' | 'failed',
    httpStatus?, errorSnippet?, questionnaireCount
  }]
  errors: [{ at, context, message }]
  sessionIdPresent: boolean
}
```

### AgentConfig (fields on existing User/profile doc)

```ts
{
  autoApplyEnabled: boolean       // master switch (default true for v1 testing)
  applyThreshold: number          // default 70
  dailyApplyCap: number           // default 15
  maxSearchCallsPerRun: number    // default 12
  companyBlacklist: string[]
}
```

---

## 4. Agent activity tracking in the UI

**Where:** new **"Agent Activity"** panel/section on `/job-search` (collapsible below
the results header) + a dedicated page `/agent-activity` for full history.

### UI layers (drill-down: run → application → answers)

```
┌─ LAYER 1: RUN HISTORY ──────────────────────────────────────────────┐
│  Every orchestrator execution = one row                             │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ ● Run #42 — Nov 13, 2:41 PM            SUCCESS     4m 12s    │  │
│  │   Found 18 (3 new) · Applied 5 · Skipped 2 applied-on-Naukri  │  │
│  │   1 external · 0 failed · 6 questionnaires answered           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ ● Run #41 — Nov 13, 10:02 AM            PARTIAL    1m 30s     │  │
│  │   2 queries failed (429 rate limit) · Applied 1               │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
        │ click a run
        ▼
┌─ LAYER 2: PER-JOB OUTCOMES ─────────────────────────────────────────┐
│  applications[] of that run                                         │
│                                                                     │
│  ✓ APPLIED        Developer L3        Wipro      70%   2 answers    │
│  ⟳ ALREADY ON     Hiring Fresher…     Info Edge  78%   (skip saved) │
│     PLATFORM                                                        │
│  ↗ EXTERNAL       AI-Enabled FS Dev   Zensar     63%   open on web  │
│  ✗ FAILED         Devops Engineer     TCS        55%   HTTP 412 …   │
└─────────────────────────────────────────────────────────────────────┘
        │ click a job
        ▼
┌─ LAYER 3: QUESTIONNAIRE AUDIT ──────────────────────────────────────┐
│  Every question the agent answered, and HOW                         │
│                                                                     │
│  Q: "Are you comfortable with hybrid work in Pune?"                 │
│  A: "Yes"                          [AI · llama-3 · confidence high] │
│                                                                     │
│  Q: "Notice period?"                                                │
│  A: "Experienced professional with…" [FALLBACK ⚠ no AI answer]      │
│                                                                     │
│  → lets the user judge answer quality and re-train prompts          │
└─────────────────────────────────────────────────────────────────────┘
```

### API endpoints

| Endpoint | Purpose |
|---|---|
| `POST /api/agent/run` | Trigger orchestrator; returns AgentRun id immediately, run continues |
| `GET /api/agent/runs?limit=20` | Layer 1 list |
| `GET /api/agent/runs/[id]` | Layer 2 (applications[]) |
| `GET /api/agent/jobs/[jobId]/questionnaire` | Layer 3 (or embedded in runs/[id] payload) |
| `GET /api/agent/config` / `PUT` | Read/update AgentConfig (threshold, cap, blacklist) |

UI files: `src/app/agent-activity/page.tsx` (full history) +
`AgentActivityPanel` component embedded on `/job-search` (latest run summary + link).

Live status while running: `Run #43 — RUNNING… (step 4/8: harvesting)` via polling
`GET /api/agent/runs/[id]` every 2s until status != running.

---

## 5. Build order (each step compiles + verifies before next)

| # | Task | Files | Verify |
|---|---|---|---|
| 1 | `JobCache` + `AgentRun` models + indexes | `src/models/JobCache.ts`, `src/models/AgentRun.ts` | tsc; index creation on connect |
| 2 | Session manager (login, token cache, 401 → re-login) | `src/lib/naukriAgent/session.ts` | manual script: login + one searchJobs call |
| 3 | Orchestrator (harvest → dedupe → score → store; apply guarded by config) | `src/lib/naukriAgent/orchestrator.ts` | run with autoApply OFF → JobCache populated, no dupes on 2nd run |
| 4 | Apply engine (pre-check → answers → apply → record) | `src/lib/naukriAgent/applyEngine.ts` | run with threshold high + small cap on live account |
| 5 | API routes (run, runs list, run detail, config) | `src/app/api/agent/**` | curl each endpoint |
| 6 | UI: Run button + run report | `job-search/page.tsx`, `AgentActivityPanel` | click-through in browser |
| 7 | UI: `/agent-activity` full history (3 layers) | `src/app/agent-activity/page.tsx` | click-through |
| 8 | (later) Scheduler wrapper + cron/interval | `orchestrator` already pure fn | — |

## 6. Guardrails (v1)

- `dailyApplyCap` + `maxSearchCallsPerRun` enforced in orchestrator
- 2–4s jitter between Naukri calls; existing `retryWithBackoff` for 5xx/429
- Re-running is idempotent: never re-applies (JobCache status + platformApplied)
- External jobs (companyApplyUrl / isExternal) → never auto-applied, surfaced with link
- `dryRun` flag on `POST /api/agent/run` for testing without live applies
- Every apply failure recorded with HTTP status + body snippet (AgentRun.errors)

## 7. Later (post-v1 backlog)

- [ ] Scheduled runs (interval in dev / cron hitting API route in prod)
- [ ] Hybrid auth fallback via extension session events
- [ ] Notification digest (Telegram/email) per run
- [ ] Answer-quality feedback loop: mark bad answers → prompt improvement
- [ ] LinkedIn/Indeed adapters behind same orchestrator interface
