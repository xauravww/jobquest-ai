// Shared, pure builder for the cover-letter generation prompt. Kept separate
// from the API route so it can be unit-tested against a known profile (e.g.
// the seeded demo user) without hitting the DB or an LLM.

export interface GuidedAnswer {
  question: string;
  answer: string;
}

interface WorkItem {
  position?: string;
  company?: string;
  startDate?: unknown;
  endDate?: unknown;
  description?: string;
}

interface ProjectItem {
  name?: string;
  description?: string;
}

interface AchievementItem {
  title?: string;
  description?: string;
}

interface CertificationItem {
  name?: string;
  issuer?: string;
}

interface EducationItem {
  degree?: string;
  field?: string;
  institution?: string;
}

export interface ProfileBundle {
  name?: string;
  email?: string;
  phone?: string;
  currentRole?: string;
  experience?: number | string;
  location?: string;
  skills?: string[] | string;
  bio?: string;
  workExperience?: WorkItem[];
  projects?: ProjectItem[];
  achievements?: AchievementItem[];
  certifications?: CertificationItem[];
  education?: EducationItem[];
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface BuildUserPromptParams {
  jobTitle: string;
  company: string;
  location?: string;
  jobDescription?: string;
  profileDetails?: string;
  guidedAnswers?: GuidedAnswer[];
  fallbackProfile?: ProfileBundle;
}

function year(value: unknown): string {
  if (!value) return 'Present';
  const d = value instanceof Date ? value : new Date(value as string | number);
  return Number.isNaN(d.getTime()) ? String(value) : String(d.getFullYear());
}

function listSkills(skills: string[] | string | undefined): string {
  if (Array.isArray(skills)) return skills.join(', ');
  return skills ? String(skills) : '';
}

export function buildUserPrompt(p: BuildUserPromptParams): string {
  const { jobTitle, company, location, jobDescription, profileDetails, guidedAnswers, fallbackProfile } = p;
  const u: ProfileBundle = fallbackProfile || {};

  return `Please generate a professional cover letter for the following:

Job Information:
- Position: ${jobTitle}
- Company: ${company}
- Location: ${location || 'Not specified'}
- Job Description: ${jobDescription || 'Not provided'}

${profileDetails ? `Candidate Profile Details:\n${profileDetails}` : `Candidate Profile:
- Name: ${u.name || ''}
- Email: ${u.email || ''}
- Phone: ${u.phone || ''}
- Current Role: ${u.currentRole || ''}
- Years of Experience: ${u.experience ?? 0} years
- Location: ${u.location || ''}
- Skills: ${listSkills(u.skills)}
- Bio/Summary: ${u.bio || ''}

${u.workExperience && u.workExperience.length ? `Work Experience:
${u.workExperience
  .map((exp) => `- ${exp.position || ''} at ${exp.company || ''} (${year(exp.startDate)} - ${year(exp.endDate)})
  ${exp.description || 'No description provided'}`)
  .join('\n\n')}` : ''}

${u.projects && u.projects.length ? `Key Projects:
${u.projects.filter((proj) => proj.name && proj.description).map((proj) => `- ${proj.name}: ${proj.description}`).join('\n')}` : ''}

${u.achievements && u.achievements.length ? `Achievements:
${u.achievements.map((a) => `- ${a.title}: ${a.description}`).join('\n')}` : ''}

${u.certifications && u.certifications.length ? `Certifications:
${u.certifications.map((c) => `- ${c.name} from ${c.issuer}`).join('\n')}` : ''}

${u.education && u.education.length ? `Education:
${u.education.map((edu) => `- ${edu.degree || ''} in ${edu.field || ''} from ${edu.institution || ''}`).join('\n')}` : ''}

Contact Information:
- LinkedIn: ${u.linkedinUrl || 'Not provided'}
- GitHub: ${u.githubUrl || 'Not provided'}
- Portfolio: ${u.portfolioUrl || 'Not provided'}`}

${guidedAnswers && guidedAnswers.length ? `Candidate's guided answers (treat as accurate personalization input; weave them in where relevant, never contradict or embellish them):
${guidedAnswers.map((g) => `- ${g.question}: ${g.answer}`).join('\n')}
` : ''}Please generate a compelling cover letter that highlights the candidate's specific achievements, work experience, and projects. Use ONLY the actual details provided above; never add company names, employers, roles, dates, numbers, or achievements that are not present in this data. Make it personal and authentic by referencing only the specific experiences and accomplishments listed.`;
}
