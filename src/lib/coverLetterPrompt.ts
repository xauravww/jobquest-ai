export type CoverLetterType =
  | 'concise'
  | 'detailed'
  | 'professional'
  | 'jargon_free'
  | 'twitter_dm'
  | 'linkedin_dm';

interface TypeSpec {
  kind: 'letter' | 'dm';
  paragraphs: string;
  maxWords: number;
  tone: string;
}

const TYPE_SPECS: Record<CoverLetterType, TypeSpec> = {
  concise: {
    kind: 'letter',
    paragraphs: '150-200 words, 2-3 short paragraphs',
    maxWords: 200,
    tone: 'Direct, polished, high-impact. Every sentence earns its place.',
  },
  detailed: {
    kind: 'letter',
    paragraphs: '300-400 words, 3-4 paragraphs',
    maxWords: 400,
    tone: 'Storytelling and conversational, yet still professional. Show personality and genuine passion.',
  },
  professional: {
    kind: 'letter',
    paragraphs: '250-350 words, 3 paragraphs',
    maxWords: 350,
    tone: 'Formal but warm, corporate, focused on qualifications and value proposition.',
  },
  jargon_free: {
    kind: 'letter',
    paragraphs: '150-250 words, 2-3 short paragraphs',
    maxWords: 250,
    tone: 'Plain, jargon-free easy English. Short sentences, simple everyday words, no buzzwords, no corporate speak.',
  },
  twitter_dm: {
    kind: 'dm',
    paragraphs: '40-80 words, one short, punchy message',
    maxWords: 80,
    tone: 'Casual, confident, human. Short lines. No formality, no fluff, no emojis, no pitching.',
  },
  linkedin_dm: {
    kind: 'dm',
    paragraphs: '70-120 words, a concise LinkedIn-style message',
    maxWords: 120,
    tone: 'Professional yet friendly and direct, as if messaging on LinkedIn. Warm, concise, respectful, human.',
  },
};

const METHOD = `You are an expert career counselor who writes "killer" cover letters. A cover letter is a MARKETING TOOL, not an autobiography: it sells the candidate as the solution to the company's problem in a scannable, compelling way.

## The method (follow in order)
1. Analyze the job description. Separate "what you'll do" from "qualifications". Identify the requirements the candidate genuinely satisfies, including "preferred" / nice-to-have items.
2. Match skill to requirement. For every matched requirement, cite the candidate's own evidence using the SAME KEYWORDS as the job description (if the posting says "QuickBooks", write "QuickBooks", not "accounting software"). Pick only the TWO strongest matches.
3. Show why this company. Reference the company specifically: its mission, the problem it solves, its product, what makes it unique, its stated values/policies, or its community/employee-development programs.`;

const LETTER_STRUCTURE = `## Proven structure (cover letter)
1. Opening (1-2 sentences): who the candidate is, what they want, and what they believe in. Emphasize strengths and mention something specific to THIS company.
2. Transition: a summary statement of the value the candidate brings (with concrete numbers/results), flowing into the experiences ahead. Example cadence: "Over the last [period], I [result]... And now I'm excited to contribute and grow at [Company]. Three things make me the perfect fit for this position:"
3. Skill & Qualification Match: turn the two strongest matches into story sentences, not bullet lists. Frame each through an interview-story theme (Leading People · Taking initiative · Affinity for challenging work · Affinity for different types of work · Affinity for specific work · Dealing with failure · Managing conflict · Driven by curiosity). Be specific: HALF THE WORDS, TWICE THE EXAMPLES, and sprinkle in numbers/impact.
4. Why this company: weave the two best reasons together (ideally one value-driven and one industry/topic-driven; if the candidate uses the product, lead with that).
5. Conclusion: state what the candidate wants and why, ending with a confident, forward-looking close (e.g. "...my experience is a really good fit for [Company] and this position. I look forward to hearing from you.").`;

const DM_STRUCTURE = `## Cold-DM formula (a short message)
Write ONE short, human message, not a formal letter. Follow this three-step plan:
1. Opening line: start with something specific about them / their company — not small talk, not about the candidate. (e.g. "Saw [company] is hiring for X…" or "Noticed your team works on Y…")
2. Value offer: in one sentence, say what the candidate can concretely do for them based on THEIR need. Skip the candidate's full history.
3. Simple call to action: make replying easy and low-pressure. (e.g. "Open to a quick chat?" or "Can I share a quick idea?")`;

/**
 * Build the system prompt for the cover-letter generator from the
 * r/datascience "My Guide To Writing A Killer Cover Letter" methodology
 * (https://www.reddit.com/r/datascience/comments/tag8l5/).
 *
 * Core idea: a cover letter is a marketing tool, not an autobiography.
 */
export function buildCoverLetterSystemPrompt(
  type: CoverLetterType | CoverLetterType[] = 'detailed'
): string {
  const selected = (Array.isArray(type) ? type : [type]).filter(Boolean);
  const specs = selected.map((t) => TYPE_SPECS[t]);
  const kind: 'letter' | 'dm' = specs.some((s) => s.kind === 'dm') ? 'dm' : 'letter';
  const tightest = specs.reduce((a, b) => (a.maxWords <= b.maxWords ? a : b));
  const maxWords = tightest.maxWords;
  const toneLines = [...new Set(specs.map((s) => s.tone))].join(' ');
  const structure = kind === 'dm' ? DM_STRUCTURE : LETTER_STRUCTURE;
  const dmRules =
    kind === 'dm'
      ? `
- COLD-DM RULES: Keep it short (aim well under the max). Use their name and company. Mention ONE specific detail about THEM. Lead with value to them, not the candidate's own story. Do NOT pitch or ask for a call up front. End with ONE simple, low-pressure next step. No buzzwords, no emojis. Sound like a real human.
- TONE: Write like a real person messaging casually — natural, warm, conversational. Do NOT write stiff, formal, or overly "proper" prose. Use light punctuation (commas, full stops) so it is easy to read, but let it flow the way people actually talk.`
      : '';
  const styleList = selected.join(', ');

  return `${METHOD}

${structure}

## Hard rules
- Output ONLY the message/letter body. No preamble, no explanations, no section labels.
- Write in Markdown for clean rendering (paragraphs; use "-" bullet lists only if needed). Do NOT wrap the body in code fences.
- ANTI-HALLUCINATION (non-negotiable): Use ONLY facts explicitly present in the provided candidate profile, guided answers, and job details. Never invent, infer, or imply employers/company names, roles, projects, titles, dates, metrics, schools, or achievements that are not stated. If a fact is missing, omit it or rephrase generically — never fabricate. Where you reference experience, mirror exactly what the profile states (same company names, same roles, same numbers).
- No placeholders like [Your Name]; substitute real details or gracefully omit them.
- Speak the employer's language (mirror the job posting's keywords). Avoid generic buzzwords and vague claims.
- If guided answers are provided, weave them in as accurate personalization input; never contradict or embellish them.
- Tailor the message to THIS role and company, never generic boilerplate.
- Requested styles to blend: ${styleList}. Satisfy all of them consistently; where they overlap, follow the tighter requirement.
- Format: ${tightest.paragraphs} (max ${maxWords} words).
- Tone: ${toneLines}${dmRules}`;
}
