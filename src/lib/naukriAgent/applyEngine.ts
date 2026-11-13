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
  outcome: 'applied' | 'already-applied-on-platform' | 'external' | 'failed';
  httpStatus?: number;
  errorSnippet?: string;
  questionnaireAudit: QuestionnaireEntry[];
  resumeUsed?: string;
}

const APPLY_HEADERS = (tokens: NaukriTokens): Record<string, string> => ({
  accept: 'application/json',
  'accept-language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
  appid: '121',
  'cache-control': 'no-cache',
  clientid: 'd3skt0p',
  'content-type': 'application/json',
  gid: 'LOCATION,INDUSTRY,EDUCATION,FAREA_ROLE',
  pragma: 'no-cache',
  priority: 'u=1, i',
  nkparam: 'jH9QnltH+MuGKLwVCzx6nuqLOex1fiLfmrNahP7GLA0SQihJC6d0hDFoJXV65lyEzWcAjLQ7SuUTKBlHw4Artw==',
  'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'x-requested-with': 'XMLHttpRequest',
  systemid: 'Naukri',
  'Referer-Policy': 'strict-origin-when-cross-origin',
  authorization: `Bearer ${tokens.authorization}`,
  cookie: tokens.cookies,
});

function buildApplyBody(jobId: string, answers?: Record<string, string>): string {
  const applyData = answers ? JSON.stringify(answers).slice(1, -1) : '';
  return `{"strJobsarr":["${jobId}"],"applyData":{${applyData}},"logstr":"--drecomm_profile-2-F-0-1--17140801091455348-","flowtype":"show","crossdomain":true,"jquery":1,"rdxMsgId":"","chatBotSDK":true,"mandatory_skills":["CSS","HTML","React.Js"],"optional_skills":["Typescript","Angular"],"applyTypeId":"107","closebtn":"y","applySrc":"drecomm_profile","sid":"17140801091455348","mid":""}`;
}

async function callApplyWorkflow(
  tokens: NaukriTokens,
  jobId: string,
  answers?: Record<string, string>
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
    // Details endpoint failing is non-fatal — proceed with apply attempt
    if (detailsErr?.status === 406) {
      return { outcome: 'external', httpStatus: 406, questionnaireAudit: [] };
    }
  }

  // ---- Step 2: initial apply-workflow call ----
  const first = await callApplyWorkflow(tokens, jobId);

  if (first.status === 401) {
    const err = new Error('TOKEN_EXPIRED');
    (err as any).status = 401;
    throw err;
  }

  if (looksAlreadyApplied(first.json, first.body)) {
    return { outcome: 'already-applied-on-platform', httpStatus: first.status, questionnaireAudit: [] };
  }

  const jobResult = first.json?.jobs?.[0];
  const questionnaire = jobResult?.questionnaire;

  // Direct success, no questionnaire
  if (jobResult?.status === 200 && !questionnaire) {
    return { outcome: 'applied', httpStatus: first.status, questionnaireAudit: [] };
  }

  // ---- Step 3: questionnaire path ----
  if (Array.isArray(questionnaire) && questionnaire.length > 0) {
    let answers: Record<string, string> = {};
    let audit: QuestionnaireEntry[] = [];
    try {
      const aiConfig = ctx.aiConfig;
      const generated = await naukriService.generateAnswers(questionnaire, ctx.userProfileText, {
        provider: aiConfig?.provider,
        apiKey: aiConfig?.apiKey,
        apiUrl: aiConfig?.apiUrl,
        aiModel: aiConfig?.model,
      });
      answers = generated || {};

      audit = questionnaire.map((q: any) => {
        const answer = String(answers[q.questionId] ?? '');
        return {
          questionId: String(q.questionId),
          question: String(q.questionName ?? ''),
          answer,
          source: 'ai' as const,
          model: aiConfig?.model,
        };
      });
    } catch {
      // Fallback answers so the submission attempt still has data
      const generated = await naukriService.generateAnswers(questionnaire, ctx.userProfileText);
      answers = generated || {};
      audit = questionnaire.map((q: any) => ({
        questionId: String(q.questionId),
        question: String(q.questionName ?? ''),
        answer: String(answers[q.questionId] ?? ''),
        source: 'fallback' as const,
      }));
    }

    const second = await callApplyWorkflow(tokens, jobId, answers);

    if (second.status === 401) {
      const err = new Error('TOKEN_EXPIRED');
      (err as any).status = 401;
      throw err;
    }

    const secondJob = second.json?.jobs?.[0];
    if (secondJob?.status === 200) {
      return {
        outcome: 'applied',
        httpStatus: second.status,
        questionnaireAudit: audit,
      };
    }
    if (looksAlreadyApplied(second.json, second.body)) {
      return {
        outcome: 'already-applied-on-platform',
        httpStatus: second.status,
        questionnaireAudit: audit,
      };
    }

    return {
      outcome: 'failed',
      httpStatus: second.status,
      errorSnippet: second.body,
      questionnaireAudit: audit,
    };
  }

  return {
    outcome: 'failed',
    httpStatus: first.status,
    errorSnippet: first.body,
    questionnaireAudit: [],
  };
}
