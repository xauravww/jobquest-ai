import { describe, it, expect } from 'vitest';
import { buildCoverLetterSystemPrompt } from '@/lib/coverLetterPrompt';
import { buildUserPrompt, type ProfileBundle } from '@/lib/coverLetterBuilder';

// ---------------------------------------------------------------------------
// Fixtures mirroring scripts/seed.js for the demo user (demo@seed.local)
// ---------------------------------------------------------------------------
const DEMO_PROFILE: ProfileBundle = {
  name: 'Demo User',
  email: 'demo@seed.local',
  phone: '+91 98765 43210',
  currentRole: 'Software Engineer',
  experience: 3,
  location: 'Remote',
  skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'GraphQL', 'AWS'],
  bio: 'Full-stack developer with 3 years of experience building web products with React and Node.js.',
  workExperience: [
    {
      position: 'Full Stack Developer',
      company: 'Acme Software',
      startDate: new Date(),
      endDate: new Date(),
      description: 'Built internal dashboards and REST APIs used by 40k monthly users.',
    },
  ],
  education: [{ degree: 'B.Tech', field: 'Computer Science', institution: 'National Institute of Technology' }],
  projects: [{ name: 'JobQuest AI', description: 'AI-assisted job application tracker.' }],
  certifications: [{ name: 'AWS Certified Developer', issuer: 'Amazon Web Services' }],
  linkedinUrl: 'https://linkedin.com/in/demouser',
  githubUrl: 'https://github.com/demouser',
  portfolioUrl: 'https://demouser.dev',
};

function buildDemoProfileDetails(): string {
  return [
    'Profile Summary:',
    'Name: Demo User',
    'Email: demo@seed.local',
    'Location: Remote',
    'Current Role: Software Engineer',
    'Skills: React, Node.js, TypeScript, MongoDB, GraphQL, AWS',
    'Experience: 3 years',
    '',
    'Work Experience:',
    '• Full Stack Developer at Acme Software (... - Present)',
    '  Built internal dashboards and REST APIs used by 40k monthly users.',
    '',
    'Education:',
    '• B.Tech in Computer Science from National Institute of Technology',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Anti-hallucination guard (heuristic, used to validate generated output)
// ---------------------------------------------------------------------------
const FOREIGN_EMPLOYERS = [
  'Google', 'Stripe', 'Facebook', 'Meta', 'Amazon', 'Microsoft',
  'Netflix', 'Uber', 'Apple', 'Razorpay', 'Flipkart', 'Tesla',
];

const EMPLOYMENT_MARKERS = [
  'worked', 'time at', 'experience at', 'previously', 'stint',
  'interned', 'employed', 'served', 'was responsible', 'assisted',
  'helped', 'led', 'built', 'developed', 'delivered', 'collaborated',
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sentenceContaining(letter: string, company: string): string {
  const re = new RegExp(`\\b${escapeRegex(company)}\\b`, 'i');
  return letter.split(/[.\n]/).find((s) => re.test(s)) || '';
}

function detectHallucinatedEmployers(letter: string, allowedCompanies: string[] = []): string[] {
  const bad: string[] = [];
  for (const company of FOREIGN_EMPLOYERS) {
    if (allowedCompanies.includes(company)) continue;
    const sentence = sentenceContaining(letter, company);
    if (!sentence) continue;
    const hasMarker = EMPLOYMENT_MARKERS.some((m) =>
      new RegExp(`\\b${escapeRegex(m).replace(/ /g, '\\s+')}`, 'i').test(sentence),
    );
    if (hasMarker) bad.push(company);
  }
  return bad;
}

// ---------------------------------------------------------------------------
// Tests: system prompt
// ---------------------------------------------------------------------------
describe('buildCoverLetterSystemPrompt', () => {
  const types = ['concise', 'detailed', 'professional'] as const;
  const expectedLength = { concise: '150-200 words', detailed: '300-400 words', professional: '250-350 words' };

  for (const type of types) {
    it(`type "${type}" contains anti-hallucination + no-placeholder rules`, () => {
      const prompt = buildCoverLetterSystemPrompt(type);
      expect(prompt).toContain('ANTI-HALLUCINATION');
      expect(prompt).toContain('No placeholders');
      expect(prompt).toContain('Output ONLY the');
      expect(prompt).toContain(expectedLength[type]);
    });
  }

  it('keeps the full 5-part "killer" structure', () => {
    const prompt = buildCoverLetterSystemPrompt('detailed');
    for (const section of ['Opening', 'Transition', 'Skill & Qualification Match', 'Why this company', 'Conclusion']) {
      expect(prompt).toContain(section);
    }
  });

  it('supports Easy English (jargon-free), Twitter DM and LinkedIn DM styles', () => {
    expect(buildCoverLetterSystemPrompt('jargon_free')).toContain('jargon-free');
    expect(buildCoverLetterSystemPrompt('jargon_free')).toContain('ANTI-HALLUCINATION');

    const twitter = buildCoverLetterSystemPrompt('twitter_dm');
    expect(twitter).toContain('short message');
    expect(twitter).toContain('ANTI-HALLUCINATION');
    expect(twitter).not.toContain('Proven structure (cover letter)');

    const linkedin = buildCoverLetterSystemPrompt('linkedin_dm');
    expect(linkedin).toContain('short message');
    expect(linkedin).toContain('ANTI-HALLUCINATION');
    expect(linkedin).not.toContain('Proven structure (cover letter)');
  });

  it('blends multiple selected styles', () => {
    const prompt = buildCoverLetterSystemPrompt(['detailed', 'jargon_free']);
    expect(prompt).toContain('jargon-free');
    expect(prompt).toContain('Requested styles to blend: detailed, jargon_free');
  });

  it('uses DM structure and tightest length when a DM style is selected among several', () => {
    const prompt = buildCoverLetterSystemPrompt(['concise', 'twitter_dm']);
    expect(prompt).toContain('short message');
    expect(prompt).not.toContain('Proven structure (cover letter)');
    expect(prompt).toContain('(max 80 words)');
  });
});

// ---------------------------------------------------------------------------
// Tests: user prompt fidelity (does what we feed the model match demo profile?)
// ---------------------------------------------------------------------------
describe('buildUserPrompt profile fidelity', () => {
  const params = {
    jobTitle: 'Senior Frontend Engineer',
    company: 'Stripe',
    location: 'Remote',
    jobDescription: 'Build UI with React and TypeScript.',
  };

  it('uses the provided profileDetails (auto-fetched profile) verbatim', () => {
    const prompt = buildUserPrompt({ ...params, profileDetails: buildDemoProfileDetails() });
    expect(prompt).toContain('Acme Software');
    expect(prompt).toContain('National Institute of Technology');
    expect(prompt).toContain('React');
    expect(prompt).toContain('Node.js');
    expect(prompt).toContain('40k');
    expect(prompt).toContain('demo@seed.local');
  });

  it('falls back to the DB profile when no profileDetails are sent', () => {
    const prompt = buildUserPrompt({ ...params, fallbackProfile: DEMO_PROFILE });
    expect(prompt).toContain('Acme Software');
    expect(prompt).toContain('National Institute of Technology');
    expect(prompt).toContain('React');
    expect(prompt).toContain('demo@seed.local');
    expect(prompt).toContain('3 years');
  });

  it('does NOT inject any foreign employer into the prompt', () => {
    const prompt = buildUserPrompt({ ...params, profileDetails: buildDemoProfileDetails() });
    expect(detectHallucinatedEmployers(prompt)).toEqual([]);
  });

  it('includes guided answers only when provided', () => {
    const withoutGuided = buildUserPrompt({ ...params, profileDetails: buildDemoProfileDetails() });
    expect(withoutGuided).not.toContain("Candidate's guided answers");

    const withGuided = buildUserPrompt({
      ...params,
      profileDetails: buildDemoProfileDetails(),
      guidedAnswers: [
        { question: 'Why this company?', answer: 'I admire Stripe engineering culture.' },
        { question: 'Top strength?', answer: 'I led a migration of a legacy dashboard.' },
      ],
    });
    expect(withGuided).toContain("Candidate's guided answers");
    expect(withGuided).toContain('I admire Stripe engineering culture.');
    expect(withGuided).toContain('I led a migration of a legacy dashboard.');
  });

  it('carries the anti-fabrication closing instruction', () => {
    const prompt = buildUserPrompt({ ...params, profileDetails: buildDemoProfileDetails() });
    expect(prompt).toContain('never add company names, employers, roles, dates, numbers');
  });
});

// ---------------------------------------------------------------------------
// Tests: anti-hallucination guard on generated letter text
// ---------------------------------------------------------------------------
describe('detectHallucinatedEmployers', () => {
  it('flags a foreign employer claimed as past employment', () => {
    const letter = 'I am a full-stack developer. During my time at Google, I led a large team.';
    expect(detectHallucinatedEmployers(letter)).toContain('Google');
  });

  it('does not flag genuine interest in a company', () => {
    const letter = 'I am excited about Stripe mission to simplify online payments.';
    expect(detectHallucinatedEmployers(letter)).toEqual([]);
  });

  it('does not flag the candidate real employer (Acme Software)', () => {
    const letter = 'At Acme Software I built dashboards and APIs used by 40k users.';
    expect(detectHallucinatedEmployers(letter)).toEqual([]);
  });

  it('returns empty for a clean, profile-faithful letter', () => {
    const letter = [
      'I am a full-stack engineer with 3 years of experience.',
      'At Acme Software I built internal dashboards and REST APIs.',
      'I graduated with a B.Tech in Computer Science from the National Institute of Technology.',
      'I am excited to contribute to Stripe mission.',
    ].join('\n');
    expect(detectHallucinatedEmployers(letter)).toEqual([]);
  });

  it('does not flag profile-allowed companies even if listed', () => {
    const letter = 'My time at Stripe taught me a lot about payments.';
    expect(detectHallucinatedEmployers(letter, ['Stripe'])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Optional live smoke test against a local LLM (skipped by default).
// Run with: COVER_LETTER_LIVE=1 npx vitest run src/lib/__tests__/coverLetterGenerator.test.ts
// ---------------------------------------------------------------------------
describe.skipIf(!process.env.COVER_LETTER_LIVE)('live LLM fidelity smoke test', () => {
  it('generated letter does not hallucinate foreign employers', async () => {
    const AiFilterService = (await import('@/lib/aiFilterService')).default;
    const service = new AiFilterService();
    service.saveConfig({
      provider: 'lm-studio',
      model: process.env.LM_MODEL || 'local-model',
      apiUrl: process.env.LM_STUDIO_URL || 'http://localhost:1234',
      apiKey: '',
    });

    const systemPrompt = buildCoverLetterSystemPrompt('detailed');
    const userPrompt = buildUserPrompt({
      jobTitle: 'Senior Frontend Engineer',
      company: 'Stripe',
      location: 'Remote',
      jobDescription: 'Build UI with React and TypeScript for the payments platform.',
      profileDetails: buildDemoProfileDetails(),
    });

    const letter = await service.generateCoverLetter(systemPrompt, userPrompt, undefined, 800);
    expect(letter).toBeTruthy();
    expect(detectHallucinatedEmployers(letter)).toEqual([]);
  });
});
