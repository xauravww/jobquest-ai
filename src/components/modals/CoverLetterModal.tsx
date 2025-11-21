'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { FileText, Sparkles, Briefcase, X, Copy, ChevronDown, ChevronUp, ChevronsRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
}

const CoverLetterModal = ({ visible, onClose, job, userProfile }: CoverLetterModalProps) => {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [error, setError] = useState('');
  const [profileDetails, setProfileDetails] = useState('');
  const [extractedContent, setExtractedContent] = useState('');
  const [isExtracted, setIsExtracted] = useState(false);
  const [coverLetterType, setCoverLetterType] = useState<'concise' | 'detailed' | 'professional'>('detailed');
  const [showProfileDetails, setShowProfileDetails] = useState(false);

  useEffect(() => {
    if (visible) {
      // Reset states when modal opens
      setCoverLetter('');
      setError('');
      setGenerating(false);
      setExtractedContent('');
      setIsExtracted(false);

      // Pre-populate profile details from the userProfile prop
      const profileString = userProfile ? `Profile Summary:
Name: ${userProfile.name || `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()}
Email: ${userProfile.email || ''}
Location: ${userProfile.location || ''}
Current Role: ${userProfile.targetRole || ''}
Skills: ${Array.isArray(userProfile.skills) ? userProfile.skills.join(', ') : userProfile.skills || ''}
Experience: ${userProfile.experienceYears || 0} years

${userProfile.workExperience && userProfile.workExperience.length > 0 ? `Work Experience:
${userProfile.workExperience.map((exp: WorkExperience) => `• ${exp.position} at ${exp.company} (${exp.startDate || ''} - ${exp.endDate || 'Present'})
  ${exp.description || ''}`).join('\n\n')}` : ''}

${userProfile.education && userProfile.education.length > 0 ? `Education:
${userProfile.education.map((edu: Education) => `• ${edu.degree} in ${edu.field} from ${edu.institution} ${edu.gpa ? `(GPA: ${edu.gpa})` : ''}`).join('\n')}` : ''}` : '';
      setProfileDetails(profileString);
    }
  }, [visible, userProfile]);

  const handleExtractContent = () => {
    if (job?.description) {
      setExtractedContent(job.description);
      setIsExtracted(true);
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
          coverLetterType: coverLetterType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate cover letter');
      }

      const data = await response.json();
      setCoverLetter(data.coverLetter);
      toast.success('Cover letter generated successfully!');
    } catch (error) {
      console.error('Error generating cover letter:', error);
      setError('Failed to generate cover letter. Please try again.');
      toast.error('Failed to generate cover letter');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveCoverLetter = async () => {
    if (!job || !coverLetter) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/applications/${job._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: `Cover Letter:\n${coverLetter}`,
        }),
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

  return (
    <Modal
      isOpen={visible}
      onClose={onClose}
      title="AI Cover Letter Assistant"
      width="max-w-6xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Inputs */}
        <div className="space-y-4">
          {job && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl p-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[var(--primary)]/20 rounded-lg border border-[var(--primary)]/30">
                  <Briefcase className="w-6 h-6 text-[var(--primary)]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{job.title}</h3>
                  <p className="text-[var(--primary)] font-medium">{job.company}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white font-medium">Job Description</span>
              <button
                onClick={handleExtractContent}
                disabled={isExtracted}
                className="text-xs px-3 py-1.5 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30 rounded-lg hover:bg-[var(--primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <ChevronsRight className="w-3 h-3" />
                Extract Text
              </button>
            </div>
            <textarea
              value={extractedContent}
              onChange={(e) => setExtractedContent(e.target.value)}
              placeholder="Click 'Extract Text' or paste the job description here."
              rows={8}
              className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none resize-none"
            />
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl p-4">
            <span className="block text-white font-medium mb-3">Cover Letter Style</span>
            <select
              value={coverLetterType}
              onChange={(e) => setCoverLetterType(e.target.value as any)}
              className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none appearance-none"
            >
              <option value="concise">Concise (150-200 words) - Brief and to the point</option>
              <option value="detailed">Detailed (300-400 words) - Comprehensive storytelling</option>
              <option value="professional">Professional (250-350 words) - Formal corporate style</option>
            </select>
          </div>

          <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl overflow-hidden">
            <button
              onClick={() => setShowProfileDetails(!showProfileDetails)}
              className="w-full flex items-center justify-between p-4 text-white font-medium hover:bg-[var(--bg-glass)] transition-colors"
            >
              <span>Customize Your Profile for this Letter</span>
              {showProfileDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <AnimatePresence>
              {showProfileDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0">
                    <textarea
                      value={profileDetails}
                      onChange={(e) => setProfileDetails(e.target.value)}
                      placeholder="Add or edit your profile details to customize the cover letter"
                      rows={6}
                      className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none resize-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Right Column: Output & Actions */}
        <div className="flex flex-col space-y-4 h-full">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl p-6 flex-grow flex flex-col h-full min-h-[500px]">
            <div className="flex-grow flex flex-col items-center justify-center space-y-4 text-center h-full">

              {!coverLetter && !generating && (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="p-4 bg-[var(--primary)]/10 rounded-full border-4 border-[var(--primary)]/20 mb-4">
                    <Sparkles className="w-8 h-8 text-[var(--primary)]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Ready to Generate?</h3>
                  <p className="text-[var(--text-muted)] text-sm max-w-xs mb-6">
                    Once you have the job description, click the button below to generate your personalized cover letter.
                  </p>
                  <button
                    onClick={handleGenerateCoverLetter}
                    disabled={!job || !isExtracted}
                    className="px-8 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-xl shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Cover Letter</span>
                  </button>
                  <p className="text-center text-xs text-[var(--text-muted)] mt-4">AI resume builder is coming soon!</p>
                </div>
              )}

              {error && (
                <div className="w-full p-4 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-xl flex items-start gap-3 text-[var(--danger)] text-left">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Error</h4>
                    <p className="text-sm opacity-90">{error}</p>
                  </div>
                  <button onClick={() => setError('')} className="ml-auto hover:bg-[var(--danger)]/20 p-1 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {(generating || coverLetter) && (
                <div className="w-full h-full flex flex-col">
                  {generating ? (
                    <div className="flex flex-col items-center justify-center h-full flex-grow">
                      <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_var(--primary-glow)] mb-4"></div>
                      <p className="text-[var(--text-muted)]">Our AI is writing your personalized cover letter...</p>
                    </div>
                  ) : (
                    <div className="space-y-4 flex flex-col h-full">
                      <div className="bg-[var(--bg-deep)] p-6 rounded-xl border border-[var(--border-glass)] overflow-y-auto flex-grow text-left shadow-inner">
                        <pre className="text-[var(--text-main)] whitespace-pre-wrap font-sans text-sm leading-relaxed">{coverLetter}</pre>
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={() => setCoverLetter('')}
                          className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-white transition-colors flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Discard</span>
                        </button>
                        <button
                          onClick={handleCopy}
                          className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-white transition-colors flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </button>
                        <button
                          onClick={handleSaveCoverLetter}
                          disabled={loading}
                          className="px-4 py-2 rounded-xl bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <FileText className="w-4 h-4" />}
                          <span>{loading ? 'Saving...' : 'Save to Notes'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CoverLetterModal;