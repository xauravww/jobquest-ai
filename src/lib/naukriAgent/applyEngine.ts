import { NaukriService } from '@/services/NaukriService';
import type { NaukriTokens } from './session';

const APPLY_URL = 'https://www.naukri.com/cloudgateway-workflow/workflow-services/apply-workflow/v1/apply';

export interface QuestionnaireEntry {
  questionId: string;
  question: string;
  answer: string;
  source: 'ai' | 'fallback';
  model?: string;
}

export interface ApplyOutcome {
  outcome: 'applied' | 'already-applied-on-platform' | 'external' | 'failed' | 'questionnaire';
  httpStatus?: number;
  errorSnippet?: string;
  questionnaireAudit: QuestionnaireEntry[];
  resumeUsed?: string;
}

const APPLY_HEADERS = (tokens: NaukriTokens): Record<string, string> => ({
  accept: 'application/json',
  'accept-language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
  appId: '121',
  'cache-control': 'no-cache',
  clientId: 'd3skt0p',
  'content-type': 'application/json',
  Origin: 'https://www.naukri.com',
  Referer: 'https://www.naukri.com/',
  systemid: 'jobseeker',
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  authorization: `ACCESSTOKEN = ${tokens.authorization}`,
  cookie: tokens.cookies,
});

function buildApplyBody(jobId: string, answers?: Record<string, string[]>): string {
  const base: any = {
    strJobsarr: [jobId],
    logstr: '----F-0-1---',
    flowtype: 'show',
    crossdomain: true,
    jquery: 1,
    rdxMsgId: '',
    chatBotSDK: true,
    mandatory_skills: ['HTML', 'React js', 'SQL', 'Node js', 'Python'],
    optional_skills: ['CSS', 'JavaScript', 'DSA'],
    applyTypeId: '107',
    closebtn: 'y',
    applySrc: '----F-0-1---',
    sid: '',
    mid: '',
  };
  if (answers) {
    base.applyData = { [jobId]: { answers } };
    base.qupData = { customJobs: [jobId] };
  }
  // When no answers are provided, OMIT applyData entirely (matching the real
  // browser request) — sending applyData:{} makes Naukri return a 286
  // validationError instead of the questionnaire.
  return JSON.stringify(base);
}

async function callApplyWorkflow(
  tokens: NaukriTokens,
  jobId: string,
  answers?: Record<string, string[]>
): Promise<{ status: number; body: string; json: any }> {
  const response = await fetch(APPLY_URL, {
    method: 'POST',
    headers: APPLY_HEADERS(tokens),
    body: buildApplyBody(jobId, answers),
  });
  const body = await response.text();
  let json: any = null;
  try {
    json = JSON.parse(body);
  } catch {}
  return { status: response.status, body: body.slice(0, 800), json };
}

function looksAlreadyApplied(json: any, rawBody: string): boolean {
  const text = rawBody.toLowerCase();
  if (json?.jobs?.[0]?.validationError) {
    const validation = JSON.stringify(json.jobs[0].validationError).toLowerCase();
    if (validation.includes('already') || validation.includes('applied')) return true;
  }
  return text.includes('already applied');
}

export interface ApplyContext {
  jobId: string;
  tokens: NaukriTokens;
  userProfileText: string;
  aiConfig?: { provider: string; apiKey?: string; apiUrl?: string; model: string };
}

/**
 * Applies to a single job with full audit:
 *  1. Job details pre-check (external / already-applied signals)
 *  2. Apply-workflow call (flowtype show)
 *  3. If questionnaire → AI answers (recorded) → submission attempt
 */
export async function applyToJob(ctx: ApplyContext): Promise<ApplyOutcome> {
  const { jobId, tokens } = ctx;
  const naukriService = new NaukriService();

  // ---- Step 1: pre-check via job details ----
  try {
    const details = await naukriService.getJobDetails(jobId, tokens);

    const isExternal =
      details?.isExternal === true ||
      details?.applicationType === 'external' ||
      (details?.applyUrl && details.applyUrl !== details.jdURL);
    if (isExternal) {
      return { outcome: 'external', questionnaireAudit: [] };
    }

    if (details?.hideApplyButton === true) {
      return {
        outcome: 'already-applied-on-platform',
        questionnaireAudit: [],
      };
    }
  } catch (detailsErr: any) {
    // Details endpoint failing must NOT be inferred as "external". Naukri now
    // returns 406 (recaptcha required) for some server-side calls; that tells
    // us nothing about the job, so we proceed to the apply attempt (which is
    // itself the source of truth for applied/external). Only a real 406 with
    // the external marker is treated as external.
    if (detailsErr?.status === 406 && detailsErr?.external === true) {
      return { outcome: 'external', httpStatus: 406, questionnaireAudit: [] };
    }
  }

  // ---- Step 2: initial apply-workflow call (empty) ----
  const first = await callApplyWorkflow(tokens, jobId);

  if (first.status === 401) {
    const err = new Error('TOKEN_EXPIRED');
    (err as any).status = 401;
    throw err;
  }

  if (looksAlreadyApplied(first.json, first.body)) {
    return { outcome: 'already-applied-on-platform', httpStatus: first.status, questionnaireAudit: [] };
  }

  let questionnaire = first.json?.jobs?.[0]?.questionnaire;

  // If Naukri signals "questionnaire required" but did not include the
  // questions, retry once — some responses return the form on a later call.
  const emptyJob = first.json?.jobs?.[0];
  const validErr = emptyJob?.validationError;
  const needsQ = Array.isArray(validErr) && validErr.some(
    (v: any) => String(v?.customErrorCode) === '286' || /questionnaire/i.test(String(v?.message))
  );
  if (needsQ && (!Array.isArray(questionnaire) || questionnaire.length === 0)) {
    const retry = await callApplyWorkflow(tokens, jobId);
    if (retry.status === 401) {
      const err = new Error('TOKEN_EXPIRED');
      (err as any).status = 401;
      throw err;
    }
    const retryQ = retry.json?.jobs?.[0]?.questionnaire;
    if (Array.isArray(retryQ) && retryQ.length > 0) {
      questionnaire = retryQ;
    } else {
      return {
        outcome: 'questionnaire',
        httpStatus: retry.status,
        errorSnippet: retry.body.slice(0, 400),
        questionnaireAudit: [],
      };
    }
  }

  // Questionnaire path
  if (Array.isArray(questionnaire) && questionnaire.length > 0) {
    let generated: Record<string, string> = {};
    let source: 'ai' | 'fallback' = 'ai';
    try {
      const generated0 = await naukriService.generateAnswers(questionnaire, ctx.userProfileText, {
        provider: ctx.aiConfig?.provider,
        apiKey: ctx.aiConfig?.apiKey,
        apiUrl: ctx.aiConfig?.apiUrl,
        aiModel: ctx.aiConfig?.model,
      });
      generated = generated0 || {};
    } catch {
      source = 'fallback';
      const generated0 = await naukriService.generateAnswers(questionnaire, ctx.userProfileText).catch(() => ({}));
      generated = generated0 || {};
    }

    const optionLabel = (q: any, value: string): string => {
      const opts = q?.answerOption;
      if (opts && typeof opts === 'object') {
        if (typeof opts[value] === 'string') return opts[value];
        const vals = Object.values(opts);
        if (vals.length && typeof vals[0] === 'string') return vals[0] as string;
      }
      return value || '';
    };

    const fallbackAnswer = (q: any): string => {
      const name = String(q?.questionName || '').toLowerCase();
      const id = String(q?.questionId || '').toLowerCase();
      const both = name + ' ' + id;
      if (/expected.*ctc|expected ctc/i.test(both)) return '20';
      if (/current ctc|currentctc/i.test(both)) return '12';
      if (/years of experience|experience.*react|total experience/i.test(both)) return '2';
      if (/notice period/i.test(both)) return 'Immediate';
      if (/annual salary|current salary/i.test(both)) return '12';
      if (/date of birth|dob/i.test(both)) return '01/01/2000';
      if (q?.questionType && /numeric|number/i.test(String(q.questionType))) return '2';
      if (q?.answerOption && Object.keys(q.answerOption).length) {
        const vals = Object.values(q.answerOption);
        if (vals.length) return String(vals[0]);
      }
      return 'Experienced professional with strong technical skills and relevant hands-on project work.';
    };

    const answersMap: Record<string, string[]> = {};
    const audit: QuestionnaireEntry[] = [];
    for (const q of questionnaire) {
      const qid = String(q?.questionId);
      const raw = (generated[qid] !== undefined && generated[qid] !== '') ? generated[qid] : fallbackAnswer(q);
      let answer = optionLabel(q, String(raw));
      if (/numeric|number/i.test(String(q?.questionType || ''))) {
        answer = answer.replace(/\D/g, '') || '2';
      }
      answersMap[qid] = [answer];
      audit.push({
        questionId: qid,
        question: String(q?.questionName ?? ''),
        answer,
        source,
        model: ctx.aiConfig?.model,
      });
    }

    const second = await callApplyWorkflow(tokens, jobId, answersMap);

    if (second.status === 401) {
      const err = new Error('TOKEN_EXPIRED');
      (err as any).status = 401;
      throw err;
    }

    const secondJob = second.json?.jobs?.[0];
    if (secondJob?.status === 200) {
      return { outcome: 'applied', httpStatus: second.status, questionnaireAudit: audit };
    }
    if (looksAlreadyApplied(second.json, second.body)) {
      return { outcome: 'already-applied-on-platform', httpStatus: second.status, questionnaireAudit: audit };
    }
    return { outcome: 'failed', httpStatus: second.status, errorSnippet: second.body, questionnaireAudit: audit };
  }

  // Direct success, no questionnaire
  if (emptyJob?.status === 200) {
    return { outcome: 'applied', httpStatus: first.status, questionnaireAudit: [] };
  }

  return { outcome: 'failed', httpStatus: first.status, errorSnippet: first.body, questionnaireAudit: [] };
}
