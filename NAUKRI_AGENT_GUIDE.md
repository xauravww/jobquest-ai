# Naukri Auto-Pilot Agent — How It Works

> Runtime guide / architecture reference. Companion to `NAUKRI_AGENT_PLAN.md`
> (the build plan) and `NAUKRI_AUTOMATION_API.md` (the Naukri API notes).

## 1. What it is

An autonomous server-side agent that harvests Naukri jobs, scores them against
your profile, auto-applies to the best matches, and keeps a full audit trail of
everything it did (including every questionnaire answer). It removes the need to
manually browse Naukri, search, or apply.

One-line flow:

```
 RUN AGENT → import → score → dedupe → apply (guarded) → report in UI
```

## 2. Architecture map

```
 MANUAL TRIGGER  (POST /api/agent/run — "Run Agent" button)
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ ORCHESTRATOR  src/lib/naukriAgent/orchestrator.ts                    │
│ 1 SESSION      reuse captured browser session, else stored creds     │
│ 2 RESUME       read active resume on Naukri account (guard)          │
│ 3 PLAN         role × location query matrix from profile             │
│ 4 HARVEST      [[ three sources, see below ]]                       │
│ 5 STORE        upsert into JobCache (unique jobId / fingerprint)     │
│ 6 SCORE        tailoredMatcher (skills + role + location + exp)      │
│ 7 APPLY        threshold + cap + blacklist + resume guard            │
│                → pre-check → answers → applyJob → record             │
│ 8 REPORT       AgentRun document (stats, queries, applications)      │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
 UI: AgentActivityPanel (Jobs page) + /agent-activity (full history)
```

## 3. Files

| Area | Path |
|---|---|
| Orchestrator | `src/lib/naukriAgent/orchestrator.ts` |
| Session management | `src/lib/naukriAgent/session.ts` |
| Apply engine | `src/lib/naukriAgent/applyEngine.ts` |
| Local-browser search | `src/lib/naukriAgent/browserSearch.ts` |
| Browser search worker (subprocess) | `scripts/browser-search-worker.mjs` |
| Scoring | `src/lib/tailoredMatcher.ts` |
| Naukri API service | `src/services/NaukriService.ts` |
| Log-based job parsing | `src/lib/naukriService.ts` |
| Models | `src/models/JobCache.ts`, `AgentRun.ts`, `AgentConfig.ts`, `NaukriSession.ts`, `NaukriCredential.ts` |
| API routes | `src/app/api/agent/*` (`run`, `runs`, `runs/[id]`, `config`, `session`) |
| UI | `src/components/agent/AgentActivityPanel.tsx`, `src/app/agent-activity/page.tsx` |

## 4. Session & auth (no password required)

The agent prefers the **live browser session captured from the extension** —
no password ever stored.

```
 Browser (you logged into Naukri)
   │  "Capture session" button (Agent panel → Setup)
   ▼
 Extension reads cookies + nauk_at token (chrome.cookies)
   │  POST /api/agent/session
   ▼
 NaukriSession (Mongo)   ← stored per-user
   │
   ▼
 session.ts getTokens():  1. captured NaukriSession (12h TTL)
                          2. fallback: stored credentials password-login
                          3. on 401 → drop stale session, re-auth
```

- `NaukriSession` model stores the captured cookies + auth token (never returned to the UI).
- 401 handling in `withFreshTokens` re-auths once and retries.

## 5. Harvest sources (why three)

Naukri now gates its **keyword search API** behind reCAPTCHA — a plain server
HTTP call returns `406 {"message":"recaptcha required"}` regardless of headers.
So the agent uses three sources:

| # | Source | How | When |
|---|---|---|---|
| 1 | **Captured browser searches** | reads `data/agent-curl-logs/www.naukri.com.jsonl`, parses `jobapi/v3/search` responses the extension captured | always (if logs exist) |
| 2 | **Local-browser search** | spawns headful Chromium under Xvfb with your session cookies, navigates the SRP, captures the in-browser search response | if no captured logs |
| 3 | **`recom-jobs`** | POST `jobapi/v2/search/recom-jobs` (no recaptcha) | fallback |

**Local-browser search details** (`browserSearch.ts` + `browser-search-worker.mjs`):
- Spawns `xvfb-run -a node scripts/browser-search-worker.mjs '{"keyword","location"}'`
- Uses system Chrome (`/usr/bin/google-chrome-stable` or chromium), **headful** (headless is fingerprint-detected), reduced automation fingerprint
- Injects stored cookies, loads the SRP URL, listens for the `jobapi/v3/search` response, returns parsed jobs
- ~15–20s per query; count is capped by `maxSearchCallsPerRun`

## 6. Storage & dedupe (`JobCache`)

One document per job, forever. **Never duplicates:**

- Unique index on `jobId`, plus a unique sparse `fingerprint` (`company:title` lowercase)
- Re-visiting a job only updates `lastSeenAt` / score; status/platform flags are untouched
- On every harvest batch, jobs already `applied` / `skipped` / `tracked` or with `platformApplied=true` are omitted from the apply queue

Key fields: `jobId`, `fingerprint`, job facts, `matchScore`, `reasons`, status,
`platformApplied` + `platformSource`, `apply` audit, `questionnaire[]` trail,
`firstSeenAt` / `lastSeenAt`, `harvestRuns`.

## 7. Scoring

`tailoredMatcher.scoreJobForProfile(job, profile)` gives 0–99:

```
 Skills overlap       ≤ 45 pts
 Title / role fit     ≤ 35 pts
 Location fit          ≤ 15 pts
 Experience bracket    ≤  5 pts
 total = min(99, max(40, sum))
```

## 8. Auto-apply & guards

Condition to apply: `score ≥ applyThreshold` AND not blacklisted AND daily cap
not reached AND **resume guard passes**.

```
 1. Resume guard   active resume on Naukri account must be confirmable
                   (read from profile API). If unknown → abort applies.
 2. Pre-check      getJobDetails → external URL? skip (mark external)
                   hideApplyButton? → platformApplied=true, skip
 3. Questionnaire  if the apply-workflow returns questions → AI answers
                   (generateAnswers) → every Q&A recorded in JobCache
                   → submit; if Naukri says "already applied" → platformApplied
 4. Record         outcome: applied | already-applied-on-platform | external | failed
                   + httpStatus + snippet + questionnaire audit
```

Config (`AgentConfig`): `autoApplyEnabled`, `applyThreshold`, `dailyApplyCap`,
`maxSearchCallsPerRun`, `companyBlacklist`.

## 9. The agent's report card

Every run writes an `AgentRun` document with stats, per-query breakdown, per-application outcomes, and errors. The UI shows it three layers deep:

| Layer | Shows |
|---|---|
| Run history | run status, duration, counts (found/new/applied/failed/skipped/Q&A) |
| Per-job outcomes | each application: outcome, HTTP status, error snippet, answer counts |
| Questionnaire audit | every Q → A, source (`AI` vs `FALLBACK`), and model |

Endpoints: `GET /api/agent/runs`, `GET /api/agent/runs/[id]` (attaches questionnaire from JobCache), `GET/PUT /api/agent/config`, `POST /api/agent/run` (`dryRun` flag).

## 10. How to run it

1. Be logged into Naukri in your browser (extension installed).
2. Open the Jobs page → **Agent Activity** panel → **Setup** → **Capture session**.
3. (Optional) tune threshold / daily cap / search budget.
4. Click **Run Agent** (keep **Dry-run** ON first to test without real applies).
5. Inspect results in the panel or `/agent-activity`.

## 11. Runtime requirements

- MongoDB (models are Mongoose)
- For local-browser search: a local server with **Chrome/Chromium** and **Xvfb**
  (`/usr/bin/xvfb-run`). If absent, the agent falls back to captured-log/recom harvest.
- AI answers use your AI config (`user.aiConfig` / AIConfig) — LM Studio, Ollama,
  OpenAI-compatible, or Gemini.

## 12. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Harvest `406 "recaptcha required"` | Plain server-side keyword search is blocked. Ensure the captured-log or local-browser path is used (not the v3 HTTP search). |
| "No response from extension" on capture | Reload the extension (`chrome://extensions` → ⟳) **and** the page; be logged into Naukri. |
| Auto-apply never fires | Check resume guard — if `resumeUsed` is unknown the agent aborts applies. Set an active resume on your Naukri account. |
| Stale session (401s) | Re-capture the session from the extension; or set stored credentials as fallback. |
| Browser search returns 0 | Confirm Chrome + Xvfb exist; run a single query; check `scripts/browser-search-worker.mjs` standalone. |

## 13. Known limitations

- Keyword search requires the local browser (hard limit from Naukri's reCAPTCHA).
- Questionnaire answer submission format is best-effort (Naukri's exact payload for
  answering is not fully reverse-engineered); the AI answers are always recorded
  so quality is reviewable.
- Runs are manual; the orchestrator is a plain async function so a scheduler can
  wrap it later.
- Naukri API internals (appid, nkparam, systemid, sid) are copied from captured
  traffic and may break if Naukri changes them — the curl logger keeps feeding
  those observations.
