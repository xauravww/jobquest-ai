'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Spin, Alert, Divider, Input, Checkbox } from 'antd';
import { FileText, Sparkles, User, Briefcase, X } from 'lucide-react';
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
  degree: string;
  field: string;
  institution: string;
}

interface WorkExperience {
  position: string;
  company: string;
  startDate?: string;
  endDate?: string;
  description: string;
}

interface UserProfile {
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
  const [includeUrlContent, setIncludeUrlContent] = useState(true);
  const [extractedJobContent, setExtractedJobContent] = useState('');

  useEffect(() => {
    if (visible) {
      const profileText = `
Name: ${userProfile.firstName || ''} ${userProfile.lastName || ''}
Email: ${userProfile.email || ''}
Location: ${userProfile.location || ''}
Bio: ${userProfile.bio || ''}
Skills: ${Array.isArray(userProfile.skills) ? userProfile.skills.join(', ') : userProfile.skills || ''}
Experience: ${userProfile.experienceYears || ''} years
Current Role: ${userProfile.targetRole || ''}
Education: ${Array.isArray(userProfile.education) ? userProfile.education.map((edu: Education) => edu.degree + ' in ' + edu.field + ' from ' + edu.institution).join('; ') : ''}
Work Experience: ${Array.isArray(userProfile.workExperience) ? userProfile.workExperience.slice(0, 2).map((exp: WorkExperience) => exp.position + ' at ' + exp.company + ' (' + (exp.startDate ? new Date(exp.startDate).getFullYear() : 'Present') + ' - ' + (exp.endDate ? new Date(exp.endDate).getFullYear() : 'Present') + '): ' + exp.description).join('; ') : ''}
      `.trim();
      setProfileDetails(profileText);
    } else {
      setCoverLetter('');
      setError('');
      setGenerating(false);
      setProfileDetails('');
      setExtractedJobContent('');
    }
  }, [visible, userProfile]);

  const handleGenerateCoverLetter = async () => {
    if (!job) return;

    setGenerating(true);
    setError('');

    try {
      // Get AI configuration from localStorage
      let aiConfig = null;
      if (typeof window !== 'undefined') {
        const savedConfig = localStorage.getItem('ai-provider-config');
        if (savedConfig) {
          try {
            aiConfig = JSON.parse(savedConfig);
          } catch (e) {
            console.warn('Failed to parse AI config, using defaults');
          }
        }
      }

      const response = await fetch('/api/ai/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: job._id,
          jobTitle: job.title,
          company: job.company,
          jobDescription: job.description,
          location: job.location,
          profileDetails: profileDetails || JSON.stringify(userProfile),
          aiConfig: aiConfig,
          jobUrl: includeUrlContent ? job.url : null,
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
          coverLetterUsed: coverLetter,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save cover letter');
      }

      toast.success('Cover letter saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving cover letter:', error);
      toast.error('Failed to save cover letter');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeCreation = () => {
    // Resume creation is disabled as per requirements
    toast('Resume creation feature is coming soon!', { icon: 'ℹ️' });
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className="custom-dark-modal"
      bodyStyle={{ backgroundColor: '#000000' }}
      title={
        <div className="flex items-center gap-3 text-white">
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="text-xl font-semibold">AI Assistant</span>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Job Information */}
        {job && (
          <Card
            className="bg-bg-card border border-border"
            bodyStyle={{ padding: '16px' }}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/20 rounded-lg">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">{job.title}</h3>
                <p className="text-primary font-medium mb-2">{job.company}</p>
                <div className="flex items-center gap-4 text-sm text-text-muted">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {job.location}
                  </span>
                </div>
                {job.description && (
                  <p className="text-text text-sm mt-3 line-clamp-3">{job.description}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Profile Details Input */}
        <Card
          className="bg-bg-card border border-border"
          bodyStyle={{ padding: '16px' }}
          title={<span className="text-white">Your Profile Details (optional)</span>}
        >
          <Input.TextArea
            value={profileDetails}
            onChange={(e) => setProfileDetails(e.target.value)}
            placeholder="Add or edit your profile details to customize the cover letter"
            rows={6}
            className="bg-bg-light text-white"
            style={{ color: 'white', backgroundColor: '#1a1a1a' }}
          />
        </Card>

        {/* URL Content Extraction */}
        <Card
          className="bg-bg-card border border-border"
          bodyStyle={{ padding: '16px' }}
          title={<span className="text-white">Extract Job Posting Content</span>}
        >
          <Input.TextArea
            value={extractedJobContent}
            onChange={(e) => setExtractedJobContent(e.target.value)}
            placeholder="Extracted job posting content will appear here. You can edit it before generating the cover letter."
            rows={6}
            className="bg-bg-light text-white"
            style={{ color: 'white', backgroundColor: '#1a1a1a' }}
          />
          <Button
            type="default"
            onClick={async () => {
              if (!job?.url) {
                toast.error('No job URL available to extract content');
                return;
              }
              setGenerating(true);
              try {
                const response = await fetch('/api/ai/extract-job-url-content', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url: job.url }),
                });
                if (!response.ok) {
                  throw new Error('Failed to extract content');
                }
                const data = await response.json();
                setExtractedJobContent(data.content);
                toast.success('Job posting content extracted');
              } catch (error) {
                toast.error('Failed to extract job posting content');
              } finally {
                setGenerating(false);
              }
            }}
            className="w-full mt-2"
          >
            Extract Job Posting Content
          </Button>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            type="primary"
            size="large"
            icon={<Sparkles className="w-5 h-5" />}
            onClick={handleGenerateCoverLetter}
            loading={generating}
            disabled={!job}
            className="h-12 bg-gradient-to-r from-primary to-success hover:from-success hover:to-primary border-0"
          >
            {generating ? 'Generating...' : 'Generate Cover Letter'}
          </Button>

          <Button
            size="large"
            icon={<FileText className="w-5 h-5" />}
            onClick={handleResumeCreation}
            disabled
            className="h-12 bg-gray-600 hover:bg-gray-500 border-0 opacity-50 cursor-not-allowed"
          >
            Resume Creation (Coming Soon)
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError('')}
          />
        )}

        {/* Generated Cover Letter */}
        {coverLetter && (
          <>
            <Divider className="border-border" />
            <Card
              className="bg-bg-card border border-border"
              title={
                <div className="flex items-center gap-2 text-white">
                  <FileText className="w-5 h-5 text-primary" />
                  Generated Cover Letter
                </div>
              }
              bodyStyle={{ padding: '16px' }}
            >
              <div className="space-y-4">
                <div className="bg-bg-light p-4 rounded-lg border border-border">
                  <pre className="text-white whitespace-pre-wrap font-sans text-sm leading-relaxed" style={{ color: 'white' }}>
                    {coverLetter}
                  </pre>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    onClick={() => setCoverLetter('')}
                    icon={<X className="w-4 h-4" />}
                    className="border-border text-text hover:text-white"
                  >
                    Discard
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleSaveCoverLetter}
                    loading={loading}
                    icon={<FileText className="w-4 h-4" />}
                    className="bg-gradient-to-r from-primary to-success hover:from-success hover:to-primary border-0"
                  >
                    {loading ? 'Saving...' : 'Save Cover Letter'}
                  </Button>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Loading State */}
        {generating && (
          <div className="text-center py-8">
            <Spin size="large" />
            <p className="text-text-muted mt-4">Generating your personalized cover letter...</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CoverLetterModal;

