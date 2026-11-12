'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import AppLayout from '@/components/AppLayout';
import { FileText, Briefcase, X, Copy, ChevronsRight, AlertCircle, RefreshCw, Maximize2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { CoverLetterType } from '@/lib/coverLetterPrompt';

interface Job {
  _id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  status: string;
  datePosted: string;
  description: string;
  priority: string;
  platform: string;
  url: string;
  notes?: string;
  createdAt: string;
  appliedDate: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  gpa?: string;
  startDate?: string;
  endDate?: string;
}

interface WorkExperience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface UserProfile {
  name: string;
  experience: WorkExperience[];
  firstName?: string;
  lastName?: string;
  email?: string;
  location?: string;
  bio?: string;
  skills?: string[] | string;
  experienceYears?: number | string;
  targetRole?: string;
  education?: Education[];
  workExperience?: WorkExperience[];
}

interface CoverLetterModalProps {
  visible: boolean;
  onClose: () => void;
  job: Job | undefined;
  userProfile: UserProfile;
  variant?: 'modal' | 'page'; // when 'page', render as a full page instead of a modal
}

type DraftMode = 'quick' | 'guided';

const STYLE_OPTIONS: { value: CoverLetterType; label: string }[] = [
  { value: 'concise', label: 'Concise (150-200 words)' },
  { value: 'detailed', label: 'Detailed (300-400 words)' },
  { value: 'professional', label: 'Professional (250-350 words)' },
  { value: 'jargon_free', label: 'Easy English (150-250 words)' },
  { value: 'twitter_dm', label: 'Twitter DM (40-80 words)' },
  { value: 'linkedin_dm', label: 'LinkedIn DM (70-120 words)' },
];

const GUIDED_QUESTIONS = [
  { id: 'why', question: 'Why are you interested in this role and company?', placeholder: 'e.g. their mission, product, or values you connect with.' },
  { id: 'strengths', question: 'What are your top two strengths or experiences most relevant to this job?', placeholder: 'e.g. led a data migration, built a forecasting model, owned a client account.' },
  { id: 'achievement', question: 'Tell us about a specific achievement or project you are proud of that relates to this role.', placeholder: 'Include numbers or metrics if you can.' },
  { id: 'extra', question: 'Anything else you would like the hiring team to know? (optional)', placeholder: 'Optional.' },
];

const mdComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-xl font-bold text-white mb-3">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-lg font-semibold text-white mt-4 mb-2">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-base font-semibold text-white mt-4 mb-2">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-3 leading-relaxed text-[var(--text-main)]">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      className="text-[var(--primary)] underline"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-[var(--primary)] pl-4 my-3 italic text-[var(--text-muted)]">
      {children}
    </blockquote>
  ),
};

const CoverLetterModal = ({ visible, onClose, job, userProfile, variant = 'modal' }: CoverLetterModalProps) => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [error, setError] = useState('');
  const [profileDetails, setProfileDetails] = useState('');
  const [extractedContent, setExtractedContent] = useState('');
  const [styles, setStyles] = useState<CoverLetterType[]>(['detailed']);
  const [mode, setMode] = useState<DraftMode>('quick');
  const [guidedStep, setGuidedStep] = useState(0);
  const [guidedAnswers, setGuidedAnswers] = useState<string[]>(Array(GUIDED_QUESTIONS.length).fill(''));
  const [expandedJobDesc, setExpandedJobDesc] = useState(false);

  const buildProfileString = (profile: UserProfile) => {
    if (!profile) return '';
    return `Profile Summary:
Name: ${profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim()}
Email: ${profile.email || ''}
Location: ${profile.location || ''}
Current Role: ${profile.targetRole || ''}
Skills: ${Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills || ''}
Experience: ${profile.experienceYears || 0} years

${profile.workExperience && profile.workExperience.length > 0 ? `Work Experience:
${profile.workExperience.map((exp: WorkExperience) => `• ${exp.position} at ${exp.company} (${exp.startDate || ''} - ${exp.endDate || 'Present'})
  ${exp.description || ''}`).join('\n\n')}` : ''}

${profile.education && profile.education.length > 0 ? `Education:
${profile.education.map((edu: Education) => `• ${edu.degree} in ${edu.field} from ${edu.institution} ${edu.gpa ? `(GPA: ${edu.gpa})` : ''}`).join('\n')}` : ''}`;
  };

  useEffect(() => {
    if (!visible) return;

    // Reset states when modal opens
    setCoverLetter('');
    setError('');
    setGenerating(false);
    setExtractedContent('');
    setMode('quick');
    setGuidedStep(0);
    setGuidedAnswers(Array(GUIDED_QUESTIONS.length).fill(''));
    setExpandedJobDesc(false);

    // Auto-fetch the user's profile so we never rely on seeded/passed data
    (async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          const mapped: UserProfile = {
            name: data.personalInfo?.fullName || `${data.profile?.firstName || ''} ${data.profile?.lastName || ''}`.trim(),
            firstName: data.personalInfo?.firstName || data.profile?.firstName,
            lastName: data.personalInfo?.lastName || data.profile?.lastName,
            email: data.personalInfo?.email || data.email,
            location: data.personalInfo?.location || data.profile?.location,
            bio: data.professionalInfo?.bio || data.profile?.bio,
            skills: data.professionalInfo?.skills || data.profile?.skills,
            experienceYears: data.professionalInfo?.experience || data.profile?.experienceYears,
            targetRole: data.preferences?.targetRole || data.professionalInfo?.currentRole || data.profile?.title,
            workExperience: data.professionalInfo?.workExperience || data.profile?.workExperience,
            education: data.professionalInfo?.education || data.profile?.education,
            experience: data.professionalInfo?.workExperience || data.profile?.workExperience || [],
          };
          setProfileDetails(buildProfileString(mapped));
          return;
        }
      } catch {
        // fall through to prop fallback
      }
      // Fallback to the passed-in profile only if fetching fails
      if (userProfile) {
        setProfileDetails(buildProfileString(userProfile));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const toggleStyle = (style: CoverLetterType) => {
    setStyles((prev) => {
      if (prev.includes(style)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== style);
      }
      return [...prev, style];
    });
  };

  const handleExtractContent = () => {
    if (job?.description) {
      setExtractedContent(job.description);
      toast.success('Job description extracted!');
    } else {
      setExtractedContent('No description available to extract.');
      toast.error('No description found for this job.');
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!job) return;

    setGenerating(true);
    setError('');
    try {
      const response = await fetch('/api/ai/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: job._id,
          jobTitle: job.title,
          company: job.company,
          jobDescription: extractedContent,
          location: job.location,
          profileDetails: profileDetails,
          coverLetterType: styles,
          guidedAnswers:
            mode === 'guided'
              ? GUIDED_QUESTIONS.map((q, i) => ({
                  question: q.question,
                  answer: (guidedAnswers[i] || '').trim(),
                })).filter((a) => a.answer)
              : undefined,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to generate cover letter');
      }

      setCoverLetter(data?.coverLetter || '');
      toast.success('Cover letter generated successfully!');
    } catch (error) {
      console.error('Error generating cover letter:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate cover letter. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveCoverLetter = async () => {
    if (!job || !coverLetter) return;

    setLoading(true);
    try {
      let existingNotes = '';
      try {
        const appRes = await fetch(`/api/applications/${job._id}`);
        if (appRes.ok) {
          const app = await appRes.json();
          existingNotes = app?.notes || '';
        }
      } catch {
        // ignore read failures; save the cover letter on its own
      }

      const styleLabel = STYLE_OPTIONS.filter((o) => styles.includes(o.value))
        .map((o) => o.label)
        .join(', ');
      const header = styleLabel ? `Cover Letter (${styleLabel}):\n${coverLetter}` : `Cover Letter:\n${coverLetter}`;
      const notes = existingNotes ? `${existingNotes}\n\n${header}` : header;

      const response = await fetch(`/api/applications/${job._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to save cover letter');
      }

      toast.success('Cover letter saved to application notes!');
      onClose();
    } catch (error) {
      console.error('Error saving cover letter:', error);
      toast.error('Failed to save cover letter');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (coverLetter) {
      navigator.clipboard.writeText(coverLetter);
      toast.success('Copied to clipboard!');
    }
  };

  const formContent = (
    <div className="space-y-4">
        {job && (
          <div className="bg-[var(--bg-surface)] rounded-xl p-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[var(--primary)]/20 rounded-lg border border-[var(--primary)]/30">
                <Briefcase className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white mb-1 truncate">{job.title}</h3>
                <p className="text-[var(--primary)] font-medium truncate">{job.company}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-[var(--bg-surface)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-medium">Job Description</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedJobDesc(!expandedJobDesc);
                }}
                aria-label={expandedJobDesc ? 'Collapse job description' : 'Expand job description'}
                className="px-2 py-0.5 text-xs flex items-center gap-1"
              >
                {expandedJobDesc ? (
                  <>
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    Expand
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={handleExtractContent}
                size="sm"
                className="px-3"
              >
                <ChevronsRight className="w-3 h-3" />
                Extract Text
              </Button>
            </div>
          </div>
          <textarea
            value={extractedContent}
            onChange={(e) => setExtractedContent(e.target.value)}
            placeholder="Click 'Extract Text' or paste the job description here."
            className={`w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-dim)] focus:border-[var(--primary)] focus:outline-none resize-none transition-colors duration-200 ${expandedJobDesc ? 'h-[50vh] md:h-[58vh] text-base' : 'min-h-[140px]'}`}
          />
        </div>

        <div className="bg-[var(--bg-surface)] rounded-xl p-4">
          <span className="block text-white font-medium mb-3">Cover Letter Style</span>
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map((opt) => {
              const active = styles.includes(opt.value);
              return (
                <Button
                  key={opt.value}
                  type="button"
                  variant={active ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => toggleStyle(opt.value)}
                  aria-pressed={active}
                  className="rounded-lg px-3 py-1.5 text-xs"
                >
                  {opt.label}
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            {styles.length > 1 ? 'Multiple styles selected; they are blended together.' : 'One style selected.'}
          </p>
        </div>

        {!coverLetter && !generating && !error && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={mode === 'quick' ? 'primary' : 'ghost'}
                onClick={() => setMode('quick')}
                className="justify-center"
              >
                Quick
              </Button>
              <Button
                variant={mode === 'guided' ? 'primary' : 'ghost'}
                onClick={() => setMode('guided')}
                className="justify-center"
              >
                Guided
              </Button>
            </div>

            {mode === 'quick' && (
              <div className="bg-[var(--bg-surface)] rounded-xl p-8 flex flex-col items-center justify-center text-center">
                <h3 className="text-xl font-bold text-white mb-2">Ready to Generate?</h3>
                <p className="text-[var(--text-muted)] text-sm max-w-xs mb-6">
                  We will build your cover letter from your profile and this job.
                </p>
                <Button
                  variant="primary"
                  onClick={handleGenerateCoverLetter}
                  disabled={!job}
                  className="px-8 py-3"
                >
                  <span>Generate Cover Letter</span>
                </Button>
              </div>
            )}

            {mode === 'guided' && (
              <div className="bg-[var(--bg-surface)] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-medium">Guided questions</span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {guidedStep + 1} / {GUIDED_QUESTIONS.length}
                  </span>
                </div>
                <div className="flex gap-1 mb-4">
                  {GUIDED_QUESTIONS.map((q, i) => (
                    <div
                      key={q.id}
                      className={`h-1 flex-1 rounded-full ${
                        i <= guidedStep ? 'bg-[var(--primary)]' : 'bg-[var(--bg-raised)]'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm font-medium text-white mb-2">
                  {GUIDED_QUESTIONS[guidedStep].question}
                </p>
                <textarea
                  value={guidedAnswers[guidedStep] || ''}
                  onChange={(e) => {
                    const next = [...guidedAnswers];
                    next[guidedStep] = e.target.value;
                    setGuidedAnswers(next);
                  }}
                  placeholder={GUIDED_QUESTIONS[guidedStep].placeholder}
                  rows={4}
                  className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-dim)] focus:border-[var(--primary)] focus:outline-none resize-none transition-colors duration-200"
                />
                <div className="flex justify-between pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setGuidedStep((s) => Math.max(0, s - 1))}
                    disabled={guidedStep === 0}
                    className="px-4 py-2"
                  >
                    Back
                  </Button>
                  {guidedStep < GUIDED_QUESTIONS.length - 1 ? (
                    <Button
                      variant="secondary"
                      onClick={() => setGuidedStep((s) => s + 1)}
                      className="px-4 py-2"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={handleGenerateCoverLetter}
                      disabled={!job}
                      className="px-6 py-2"
                    >
                      <span>Generate Cover Letter</span>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-xl p-4">
            <div className="flex items-start gap-3 text-[var(--danger)] text-left">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm">Error</h4>
                <p className="text-sm opacity-90">{error}</p>
              </div>
              <Button variant="ghost" onClick={() => setError('')} aria-label="Dismiss error" className="ml-auto hover:bg-[var(--danger)]/20 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-end pt-3">
              <Button
                variant="secondary"
                onClick={handleGenerateCoverLetter}
                disabled={!job}
                className="px-4 py-2"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {generating && (
          <div className="bg-[var(--bg-surface)] rounded-xl p-6">
            <div className="w-full space-y-3">
              <div className="h-6 bg-gray-700 rounded w-1/3 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-11/12 animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {coverLetter && !generating && (
          <div className="bg-[var(--bg-surface)] rounded-xl p-6">
            <div className="bg-[var(--bg-deep)] p-6 rounded-xl overflow-y-auto text-left shadow-inner max-h-[480px]">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {coverLetter}
              </ReactMarkdown>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={handleGenerateCoverLetter}
                disabled={!job}
                className="px-4 py-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Regenerate</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCoverLetter('')}
                className="px-4 py-2"
              >
                <X className="w-4 h-4" />
                <span>Discard</span>
              </Button>
              <Button
                variant="ghost"
                onClick={handleCopy}
                className="px-4 py-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveCoverLetter}
                isLoading={loading}
                className="px-4 py-2"
              >
                <FileText className="w-4 h-4" />
                <span>Save to Notes</span>
              </Button>
            </div>
          </div>
        )}
    </div>
  );

  if (variant === 'page') {
    return (
      <AppLayout showFooter={false}>
        <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="px-3 py-2 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-[var(--text-main)]">AI Cover Letter Assistant</h1>
          {formContent}
        </div>
      </AppLayout>
    );
  }

  return (
    <Modal
      isOpen={visible}
      onClose={onClose}
      title="AI Cover Letter Assistant"
      width="max-w-2xl"
    >
      {formContent}
    </Modal>
  );
};

export default CoverLetterModal;