import connectDB from '@/lib/db';
import mongoose from 'mongoose';
import JobCache from '@/models/JobCache';
import AgentRun, { IAgentRunApplication, IAgentRunQuery } from '@/models/AgentRun';
import { getOrCreateAgentConfig } from '@/models/AgentConfig';
import User from '@/models/User';
import { formatNaukriJob, NaukriParsedJob, getCapturedKeywordSearchJobs } from '@/lib/naukriService';
import { scoreJobForProfile, TailoredJob } from '@/lib/tailoredMatcher';
import { NaukriService } from '@/services/NaukriService';
import { getTokens, withFreshTokens, invalidateSession } from './session';
import { applyToJob } from './applyEngine';
import { browserKeywordSearch } from './browserSearch';

const JITTER_MIN_MS = 2000;
const JITTER_MAX_MS = 4000;

function jitter() {
  return new Promise((r) => setTimeout(r, JITTER_MIN_MS + Math.random() * (JITTER_MAX_MS - JITTER_MIN_MS)));
}

export interface RunAgentOptions {
  dryRun?: boolean;
  keywords?: string[];
  locations?: string[];
}

export async function runAgent(
  userId: string,
  opts: RunAgentOptions = {}
): Promise<string> {
  await connectDB();

  const run = await AgentRun.create({ userId, trigger: 'manual', dryRun: !!opts.dryRun, status: 'running' });
  const runId = (run._id as mongoose.Types.ObjectId).toString();

  // Fire and forget — the API route responds immediately, the UI polls AgentRun.
  void (async () => {
    try {
      await executeRun(userId, runId, opts);
    } catch (err: any) {
      console.error('[Agent] run failed:', err);
      await AgentRun.findByIdAndUpdate(runId, {
        status: 'failed',
        finishedAt: new Date(),
        $push: { errors: { at: new Date(), context: 'orchestrator', message: err?.message || 'unknown' } },
      });
    }
  })();

  return runId;
}

async function executeRun(
  userId: string,
  runId: string,
  opts: RunAgentOptions
): Promise<void> {
  const pushError = (context: string, message: string) =>
    AgentRun.findByIdAndUpdate(runId, {
      $push: { errors: { at: new Date(), context, message: String(message).slice(0, 500) } },
    });

  const setStep = async (step: string) => {
    await AgentRun.findByIdAndUpdate(runId, { currentStep: step });
  };

  // ---- Load user, config, profile ----
  await setStep('loading-profile');
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const config = await getOrCreateAgentConfig(userId);

  const p = user.profile || {};
  const userProfileText = `Name: ${user.name || 'Not provided'}
Email: ${user.email}
Title: ${p.title || 'Not specified'}
Experience: ${p.experience || 0} years
Skills: ${p.skills?.join(', ') || 'Not specified'}
Education: ${p.education?.map((e: any) => `${e.degree} in ${e.field} from ${e.institution}`).join(', ') || 'Not specified'}
Bio: ${p.bio || 'Not provided'}
Summary: ${p.summary || 'Not provided'}`;

  // ---- Session (guard: credentials must exist) ----
  await setStep('login');
  await getTokens(userId).catch(async (err) => {
    await pushError('session', err?.message || 'login failed');
    throw err;
  });

  // ---- Resume guard: Naukri applies with the resume attached to the Naukri ACCOUNT ----
  // The resume lives in the resman dashboard (cvInfo.fileName); the legacy
  // /jobapi/v3/profile endpoint 404s and is NOT a reliable source.
  const PROFILE_URL = 'https://www.naukri.com/cloudgateway-mynaukri/resman-aggregator-services/v1/users/self/dashboard';
  let resumeUsed = 'unknown';
  try {
    const tokens0 = await getTokens(userId);
    const profileRes = await fetch(PROFILE_URL, {
      headers: {
        accept: 'application/json',
        appid: '121',
        clientid: 'd3skt0p',
        systemid: 'Naukri',
        authorization: `Bearer ${tokens0.authorization}`,
        cookie: tokens0.cookies,
      },
    });
    if (profileRes.ok) {
      const profileJson = await profileRes.json();
      resumeUsed =
        profileJson?.cvInfo?.fileName ||
        profileJson?.resume?.fileName ||
        profileJson?.resumeFileName ||
        'unknown';
    }
  } catch {
    resumeUsed = 'unknown';
  }

  await AgentRun.findByIdAndUpdate(runId, { resumeUsed });

  // ---- Plan ----
  await setStep('planning');

  const decodeKw = (s: string): string => {
    try {
      return decodeURIComponent(s).trim().replace(/%20/g, ' ');
    } catch {
      return s.trim().replace(/%20/g, ' ');
    }
  };

  const roles = (opts.keywords && opts.keywords.length > 0)
    ? opts.keywords.map(decodeKw).filter(Boolean)
    : (user.preferences?.targetRole
        ? [decodeKw(user.preferences.targetRole)]
        : ['full stack developer', 'software engineer']);

  const locations = (opts.locations && opts.locations.length > 0)
    ? opts.locations.map(decodeKw).filter(Boolean)
    : (user.preferences?.locations?.length
        ? user.preferences.locations.map(decodeKw).filter(Boolean)
        : ['']); // '' = all-India

  const blacklisted = config.companyBlacklist.map((c: string) => c.toLowerCase().trim());

  // ---- Harvest: ALWAYS combine all three sources so each run discovers new jobs.
  // 1. Captured in-browser keyword searches (extension logs).
  // 2. Local-browser keyword searches (headful Chromium under Xvfb).
  // 3. Recommended-feed harvest (server-side recom-jobs).
  // ----------------------------------------------------------------
  await setStep('harvesting');
  const rawJobs: NaukriParsedJob[] = [];
  const queryReports: IAgentRunQuery[] = [];
  let searchCalls = 0;

  // 1. In-browser keyword searches captured by the extension (no extra work).
  const captured = getCapturedKeywordSearchJobs();
  for (const c of captured) rawJobs.push(c);
  if (captured.length > 0) {
    queryReports.push({ keyword: 'captured-browser-search', location: 'all', page: 1, jobsFound: captured.length, newJobs: 0 });
  }

  // 2. Autonomous local-browser keyword searches. Naukri's keyword-search API is
  //    gated behind reCAPTCHA for plain HTTP, so we spawn a headful Chromium
  //    (under Xvfb) with the stored session cookies to run the search as a real
  //    browser. This is the only way to get arbitrary keyword searches.
  outer: for (const role of roles) {
    for (const loc of locations) {
      if (searchCalls >= config.maxSearchCallsPerRun) break outer;
      try {
        const jobs = await browserKeywordSearch(role, loc);
        searchCalls++;
        rawJobs.push(...jobs);
        queryReports.push({ keyword: role, location: loc || 'all-India', page: 1, jobsFound: jobs.length, newJobs: 0 });
        await jitter();
      } catch (err: any) {
        queryReports.push({
          keyword: role, location: loc || 'all-India', page: 1, jobsFound: 0, newJobs: 0,
          error: String(err?.message || 'browser search failed').slice(0, 200),
        });
        await pushError(`bsearch:${role}:${loc}`, err?.message || 'browser search failed');
      }
    }
  }

  // 3. Recommended-feed harvest (server-side, no reCAPTCHA). Adds the curated
  //    feed on top of browser results — broader coverage.
  try {
    const res = await withFreshTokens(userId, async (tokens) => {
      const service = new NaukriService();
      return service.getRecommendedJobs({
        authorization: tokens.authorization,
        cookies: tokens.cookies,
      });
    });
    searchCalls++;
    const list: NaukriParsedJob[] = (res?.jobDetails || []).map((j: any) => formatNaukriJob(j));
    rawJobs.push(...list);
    queryReports.push({ keyword: 'recommended', location: 'all', page: 1, jobsFound: list.length, newJobs: 0 });
  } catch (err: any) {
    queryReports.push({
      keyword: 'recommended', location: 'all', page: 1, jobsFound: 0, newJobs: 0,
      error: String(err?.message || 'harvest failed').slice(0, 200),
    });
    await pushError(`harvest:recom:1`, err?.message || 'harvest failed');
  }

  // ---- Store: upsert, never duplicate ----
  await setStep('storing');
  const seen = new Set<string>();
  const uniqueJobs: NaukriParsedJob[] = [];
  for (const j of rawJobs) {
    const fp = `${j.company.toLowerCase().trim()}:${j.title.toLowerCase().trim()}`;
    if (seen.has(j.jobId) || seen.has(fp)) continue;
    seen.add(j.jobId);
    seen.add(fp);
    uniqueJobs.push(j);
  }

  let newJobs = 0;
  let duplicateJobs = 0;
  const scoredJobs: TailoredJob[] = [];

  for (const job of uniqueJobs) {
    const fp = `${job.company.toLowerCase().trim()}:${job.title.toLowerCase().trim()}`;
    const existing = await JobCache.findOne({ $or: [{ jobId: job.jobId }, { fingerprint: fp }] });

    const scored = scoreJobForProfile(job, {
      name: user.name,
      email: user.email,
      headline: p.title,
      skills: p.skills || [],
      desiredRoles: user.preferences?.targetRole ? [user.preferences.targetRole] : [],
      desiredLocations: user.preferences?.locations || [],
    });
    const skillScored = scored;

    if (existing) {
      duplicateJobs++;
      await JobCache.updateOne(
        { _id: existing._id },
        {
          $set: {
            matchScore: skillScored.matchScore,
            reasons: skillScored.reasons,
            matchingSkills: skillScored.matchingSkills,
            missingSkills: skillScored.missingSkills,
            lastSeenAt: new Date(),
            applicationType: job.applicationType || existing.applicationType || 'unknown',
            ...(job.externalApplyUrl ? { externalApplyUrl: job.externalApplyUrl } : {}),
          },
          $addToSet: { harvestRuns: runId },
        }
      );
      continue;
    }

    newJobs++;
    await JobCache.create({
      jobId: job.jobId,
      fingerprint: fp,
      title: job.title,
      company: job.company,
      location: job.location,
      experience: job.experience,
      salary: job.salary,
      url: job.url,
      skills: job.skills,
      postedAgo: job.postedAgo,
      description: job.description,
      applicationType: job.applicationType || 'unknown',
      ...(job.externalApplyUrl ? { externalApplyUrl: job.externalApplyUrl } : {}),
      matchScore: skillScored.matchScore,
      reasons: skillScored.reasons,
      matchingSkills: skillScored.matchingSkills,
      missingSkills: skillScored.missingSkills,
      status: 'new',
      harvestRuns: [runId],
    });
    scoredJobs.push(skillScored);
  }

  await AgentRun.findByIdAndUpdate(runId, {
    stats: {
      queriesRun: searchCalls,
      pagesFetched: searchCalls,
      rawJobsSeen: rawJobs.length,
      newJobs,
      duplicateJobs,
      scoredJobs: newJobs,
    },
    queries: queryReports,
  });

  // ---- Apply phase ----
  if (opts.dryRun) {
    await AgentRun.findByIdAndUpdate(runId, {
      status: 'success',
      finishedAt: new Date(),
      currentStep: 'done (dry-run)',
    });
    return;
  }

  if (!config.autoApplyEnabled) {
    await AgentRun.findByIdAndUpdate(runId, {
      status: 'success',
      finishedAt: new Date(),
      currentStep: 'done (auto-apply disabled)',
    });
    return;
  }

  if (resumeUsed === 'unknown' || !resumeUsed) {
    // Resume guard: cannot confirm which resume Naukri will use → do not apply
    await pushError('resume-guard', 'Could not confirm active resume on Naukri account; auto-apply aborted for this run.');
    await AgentRun.findByIdAndUpdate(runId, {
      status: 'partial',
      finishedAt: new Date(),
      currentStep: 'done (resume unconfirmed)',
    });
    return;
  }

  await setStep('applying');

  // Daily cap: count applies already made today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const appliedToday = await JobCache.countDocuments({
    status: 'applied',
    'apply.lastAttemptAt': { $gte: startOfDay },
  });

  const blacklistSet = new Set(blacklisted);
  const candidates = scoredJobs
    .filter((j) => j.matchScore >= config.applyThreshold)
    .filter((j) => !blacklistSet.has(j.company.toLowerCase().trim()))
    .sort((a, b) => b.matchScore - a.matchScore);

  const applications: IAgentRunApplication[] = [];
  const errors: Array<{ at: Date; context: string; message: string }> = [];
  let aiAnswersTotal = 0;
  let fallbackAnswersTotal = 0;

  for (const job of candidates) {
    if (appliedToday + applications.filter((a) => a.outcome === 'applied').length >= config.dailyApplyCap) {
      await pushError('apply-cap', `Daily apply cap (${config.dailyApplyCap}) reached; stopping applications.`);
      break;
    }

    try {
      const outcome = await withFreshTokens(userId, async (tokens) =>
        applyToJob({
          jobId: job.jobId,
          tokens,
          userProfileText,
          aiConfig: {
            provider: user.aiConfig?.provider || 'lm-studio',
            apiKey: user.aiConfig?.apiKey,
            apiUrl: user.aiConfig?.apiUrl,
            model: user.aiConfig?.model || 'local-model',
          },
        })
      );

      const application: IAgentRunApplication = {
        jobId: job.jobId,
        title: job.title,
        company: job.company,
        matchScore: job.matchScore,
        outcome: outcome.outcome === 'applied' && opts.dryRun ? 'dry-run' : outcome.outcome,
        httpStatus: outcome.httpStatus,
        errorSnippet: outcome.errorSnippet?.slice(0, 400),
        questionnaireCount: outcome.questionnaireAudit.length,
        aiAnswers: outcome.questionnaireAudit.filter((q) => q.source === 'ai').length,
        fallbackAnswers: outcome.questionnaireAudit.filter((q) => q.source === 'fallback').length,
        resumeUsed,
      };

      aiAnswersTotal += application.aiAnswers;
      fallbackAnswersTotal += application.fallbackAnswers;

      const cacheUpdate: Record<string, unknown> = {
        status: outcome.outcome === 'applied' ? 'applied' : outcome.outcome === 'external' ? 'skipped' : outcome.outcome === 'failed' ? 'failed' : 'applied',
        platformApplied: outcome.outcome !== 'failed' && outcome.outcome !== 'external',
        lastPlatformCheckAt: new Date(),
        'apply.attempts': 1,
        'apply.lastAttemptAt': new Date(),
        'apply.success': outcome.outcome === 'applied',
        'apply.httpStatus': outcome.httpStatus,
        'apply.errorSnippet': outcome.errorSnippet?.slice(0, 400),
        'apply.runId': runId,
        'apply.resumeUsed': resumeUsed,
      };
      if (outcome.outcome === 'external') {
        cacheUpdate['platformApplied'] = false;
        cacheUpdate['status'] = 'skipped';
      }
      if (outcome.questionnaireAudit.length > 0) {
        cacheUpdate['questionnaire'] = outcome.questionnaireAudit.map((q) => ({
          ...q,
          answeredAt: new Date(),
        }));
      }

      await JobCache.updateOne({ jobId: job.jobId }, { $set: cacheUpdate });
      applications.push(application);

      // Mirror successful auto-applies into the Application collection so they
      // appear in the application-tracking table + dashboard.
      if (!opts.dryRun && outcome.outcome === 'applied') {
        try {
          const Application = (await import('@/models/Application')).default;
          const Job = (await import('@/models/Job')).default;
          let jobDoc = await Job.findOne({ jobId: job.jobId, userId });
          if (!jobDoc) {
            jobDoc = await Job.create({
              userId,
              jobId: job.jobId,
              title: job.title,
              company: job.company,
              location: job.location,
              description: job.description || `Key Skills: ${(job.skills || []).join(', ')}`,
              salary: job.salary,
              skills: job.skills || [],
              source: 'naukri',
              url: job.url,
              status: 'applied',
            });
          } else {
            await Job.updateOne({ _id: jobDoc._id }, { $set: { status: 'applied' } });
          }
          await Application.create({
            userId,
            jobId: jobDoc._id,
            applicationId: `naukri_agent_${job.jobId}_${Date.now()}`,
            status: 'applied',
            appliedDate: new Date(),
            applicationMethod: 'auto_apply',
            platform: 'naukri',
            resumeUsed: null,
          });
        } catch (appErr: any) {
          console.error('[agent] failed to mirror application to tracking:', appErr?.message);
        }
      }

      await AgentRun.findByIdAndUpdate(runId, { $push: { applications: application } });
      await jitter();
    } catch (err: any) {
      if (err?.message === 'TOKEN_EXPIRED' || err?.status === 401) {
        invalidateSession(userId);
        await pushError(`apply:${job.jobId}`, 'token expired mid-run');
        continue;
      }
      errors.push({ at: new Date(), context: `apply:${job.jobId}`, message: String(err?.message || 'apply failed').slice(0, 500) });
      await pushError(`apply:${job.jobId}`, err?.message || 'apply failed');
    }
  }

  // ---- Finalize run report ----
  const current: any = await AgentRun.findById(runId);
  const hadErrors = errors.length > 0 || (current?.errors?.length ?? 0) > 0;

  await AgentRun.findByIdAndUpdate(runId, {
    status: hadErrors ? 'partial' : 'success',
    finishedAt: new Date(),
    currentStep: 'done',
    $set: {
      'stats.applyAttempts': applications.length,
      'stats.applied': applications.filter((a) => a.outcome === 'applied').length,
      'stats.applyFailed': applications.filter((a) => a.outcome === 'failed').length,
      'stats.skippedAppliedOnPlatform': applications.filter((a) => a.outcome === 'already-applied-on-platform').length,
      'stats.skippedExternal': applications.filter((a) => a.outcome === 'external').length,
      'stats.questionnairesAnswered': applications.reduce((s, a) => s + a.questionnaireCount, 0),
      'stats.aiAnswers': aiAnswersTotal,
      'stats.fallbackAnswers': fallbackAnswersTotal,
    },
    errors: [...(current?.errors || []), ...errors],
  });
}
