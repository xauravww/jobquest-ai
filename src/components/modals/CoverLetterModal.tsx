'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Spin, Alert, Input, Collapse, Select } from 'antd';
import { FileText, Sparkles, Briefcase, X, Copy, ChevronDown, ChevronUp, ChevronsRight } from 'lucide-react';
import toast from 'react-hot-toast';

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
    if(coverLetter) {
        navigator.clipboard.writeText(coverLetter);
        toast.success('Copied to clipboard!');
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      className="custom-dark-modal"
      title={
        <div className="flex items-center gap-3 text-white">
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="text-xl font-semibold">AI Cover Letter Assistant</span>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Inputs */}
        <div className="space-y-4">
          {job && (
            <Card className="bg-bg-card border-border" bodyStyle={{ padding: '16px' }}>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/20 rounded-lg"><Briefcase className="w-6 h-6 text-primary" /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{job.title}</h3>
                  <p className="text-primary font-medium">{job.company}</p>
                </div>
              </div>
            </Card>
          )}

          <Card
            title={
                <div className="flex justify-between items-center text-white">
                    <span>Job Description</span>
                    <Button icon={<ChevronsRight/>} onClick={handleExtractContent} size="small" disabled={isExtracted}>Extract Text</Button>
                </div>
            }
            className="bg-bg-card border-border"
            bodyStyle={{ padding: '16px' }}
            >
          <Input.TextArea
                value={extractedContent}
                onChange={(e) => setExtractedContent(e.target.value)}
                placeholder="Click 'Extract Text' or paste the job description here."
                rows={8}
                className="bg-bg-light text-text"
              />
          </Card>
          
          <Card
            title={<span className="text-white font-medium">Cover Letter Style</span>}
            className="bg-bg-card border-border"
            bodyStyle={{ padding: '16px' }}
          >
            <Select
              value={coverLetterType}
              onChange={setCoverLetterType}
              className="w-full"
              size="large"
              options={[
                {
                  value: 'concise',
                  label: 'Concise (150-200 words)',
                  description: 'Brief and to the point, perfect for busy hiring managers'
                },
                {
                  value: 'detailed',
                  label: 'Detailed (300-400 words)',
                  description: 'Comprehensive storytelling with specific examples'
                },
                {
                  value: 'professional',
                  label: 'Professional (250-350 words)',
                  description: 'Formal corporate style, traditional structure'
                }
              ]}
              optionRender={(option) => (
                <div className="py-2">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.data.description}</div>
                </div>
              )}
            />
          </Card>

          <Collapse ghost expandIcon={({ isActive }) => isActive ? <ChevronUp /> : <ChevronDown />} items={[{
            key: '1',
            label: <span className="text-white font-medium">Customize Your Profile for this Letter</span>,
            children: <Input.TextArea
              value={profileDetails}
              onChange={(e) => setProfileDetails(e.target.value)}
              placeholder="Add or edit your profile details to customize the cover letter"
              rows={6}
              className="bg-bg-light text-text"
            />
          }]} />

        </div>

        {/* Right Column: Output & Actions */}
        <div className="flex flex-col space-y-4">
            <Card className="bg-bg-card border-border flex-grow flex flex-col" bodyStyle={{ padding: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="flex-grow flex flex-col items-center justify-center space-y-4 text-center">
                    
                    {!coverLetter && !generating && (
                        <>
                            <div className="p-4 bg-primary/10 rounded-full border-4 border-primary/20">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">Ready to Generate?</h3>
                            <p className="text-text-muted text-sm max-w-xs">
                                Once you have the job description, click the button below to generate your personalized cover letter.
                            </p>
                        </>
                    )}

                    <Button
                        type="primary"
                        size="large"
                        icon={<Sparkles className="w-5 h-5" />}
                        onClick={handleGenerateCoverLetter}
                        loading={generating}
                        disabled={!job || !isExtracted}
                        className="h-12 w-full max-w-xs bg-gradient-to-r from-primary to-success hover:from-success hover:to-primary border-0 font-semibold"
                    >
                        {generating ? 'Generating...' : 'Generate Cover Letter'}
                    </Button>
                    <p className="text-center text-xs text-text-muted">AI resume builder is coming soon!</p>
                </div>

                {error && (
                <Alert message="Error" description={error} type="error" showIcon closable onClose={() => setError('')} className="mt-4"/>
                )}

                {(generating || coverLetter) && (
                    <div className="mt-4">
                        {generating ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
                                <Spin size="large" />
                                <p className="text-text-muted mt-4">Our AI is writing your personalized cover letter...</p>
                            </div>
                        ) : (
                        <div className="space-y-4">
                            <div className="bg-bg-light p-4 rounded-lg border border-border max-h-80 overflow-y-auto">
                            <pre className="text-text whitespace-pre-wrap font-sans text-sm leading-relaxed">{coverLetter}</pre>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button onClick={() => setCoverLetter('')} icon={<X className="w-4 h-4" />}>Discard</Button>
                                <Button onClick={handleCopy} icon={<Copy className="w-4 h-4" />}>Copy</Button>
                                <Button
                                    type="primary"
                                    onClick={handleSaveCoverLetter}
                                    loading={loading}
                                    icon={<FileText className="w-4 h-4" />}
                                >
                                    {loading ? 'Saving...' : 'Save to Notes'}
                                </Button>
                            </div>
                        </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
      </div>
    </Modal>
  );
};

export default CoverLetterModal;