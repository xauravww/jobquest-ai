'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { Briefcase, MapPin, Globe, Calendar, FileText, AlertCircle } from 'lucide-react';

interface Job {
  createdAt: string;
  appliedDate: string;
  _id: string;
  jobId?: string;
  title: string;
  company: string;
  location?: string;
  url?: string;
  jobUrl?: string;
  status: string;
  datePosted: string;
  description?: string;
  priority: string;
  platform: string;
  notes?: string;
  resumeUsed?: string | { _id: string };
}

interface CreateJobModalProps {
  visible: boolean;
  onClose: () => void;
  onJobCreated: (newJob: Job | null) => void;
  job?: Job | null; // Optional job prop for edit mode
}

interface ValidationErrors {
  title?: string;
  company?: string;
  location?: string;
  jobUrl?: string;
  description?: string;
  notes?: string;
}

const CreateJobModal = ({ visible, onClose, onJobCreated, job }: CreateJobModalProps) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [status, setStatus] = useState('saved');
  const [priority, setPriority] = useState('medium');
  const [platform, setPlatform] = useState('other');
  const [datePosted, setDatePosted] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  // New states for resumes
  const [resumes, setResumes] = useState<{ _id: string; title: string }[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');

  // Fetch resumes when modal opens
  useEffect(() => {
    if (visible) {
      fetchResumes();
    }
  }, [visible]);

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/resumes');
      if (!response.ok) throw new Error('Failed to fetch resumes');
      const data = await response.json();
      setResumes(data);
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  };

  // Pre-populate form when editing
  useEffect(() => {
    if (job && visible) {
      setTitle(job.title || '');
      setCompany(job.company || '');
      setLocation(job.location || '');
      setJobUrl(job.url || job.jobUrl || '');
      setStatus(job.status || 'saved');
      setPriority(job.priority || 'medium');
      setPlatform(job.platform || 'other');
      setDatePosted(job.datePosted ? dayjs(job.datePosted).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'));
      setDescription(job.description || '');
      setNotes(job.notes || '');
      setErrors({});

      // Pre-select resume if available
      if (job.resumeUsed && typeof job.resumeUsed === 'string') {
        setSelectedResumeId(job.resumeUsed);
      } else if (job.resumeUsed && typeof job.resumeUsed === 'object' && '_id' in job.resumeUsed && job.resumeUsed._id) {
        setSelectedResumeId(job.resumeUsed._id as string);
        const id = job.resumeUsed._id as unknown;
        if (typeof id === 'object' && id !== null && 'toString' in id && typeof (id as { toString: () => string }).toString === 'function') {
          // Handle mongoose ObjectId case
          setSelectedResumeId((id as { toString: () => string }).toString());
        } else {
          setSelectedResumeId('');
        }
      }
    } else if (!job && visible) {
      resetForm();
      setSelectedResumeId('');
    }
  }, [job, visible]);

  const resetForm = () => {
    setTitle('');
    setCompany('');
    setLocation('');
    setJobUrl('');
    setStatus('saved');
    setPriority('medium');
    setPlatform('other');
    setDatePosted(dayjs().format('YYYY-MM-DD'));
    setDescription('');
    setNotes('');
    setErrors({});
    setSelectedResumeId('');
  };

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'title':
        if (!value.trim()) return 'Job title is required';
        if (value.trim().length < 2) return 'Job title must be at least 2 characters';
        if (value.trim().length > 100) return 'Job title must be less than 100 characters';
        return undefined;

      case 'company':
        if (!value.trim()) return 'Company name is required';
        if (value.trim().length < 2) return 'Company name must be at least 2 characters';
        if (value.trim().length > 100) return 'Company name must be less than 100 characters';
        return undefined;

      case 'location':
        if (value && value.length > 100) return 'Location must be less than 100 characters';
        return undefined;

      case 'jobUrl':
        if (value && value.trim()) {
          try {
            new URL(value.trim());
          } catch {
            return 'Please enter a valid URL';
          }
        }
        return undefined;

      case 'description':
        if (value && value.length > 5000) return 'Description must be less than 5000 characters';
        return undefined;

      case 'notes':
        if (value && value.length > 2000) return 'Notes must be less than 2000 characters';
        return undefined;

      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    const titleError = validateField('title', title);
    if (titleError) newErrors.title = titleError;

    const companyError = validateField('company', company);
    if (companyError) newErrors.company = companyError;

    const locationError = validateField('location', location);
    if (locationError) newErrors.location = locationError;

    const jobUrlError = validateField('jobUrl', jobUrl);
    if (jobUrlError) newErrors.jobUrl = jobUrlError;

    const descriptionError = validateField('description', description);
    if (descriptionError) newErrors.description = descriptionError;

    const notesError = validateField('notes', notes);
    if (notesError) newErrors.notes = notesError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: string, value: string) => {
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));

    switch (field) {
      case 'title': setTitle(value); break;
      case 'company': setCompany(value); break;
      case 'location': setLocation(value); break;
      case 'jobUrl': setJobUrl(value); break;
      case 'description': setDescription(value); break;
      case 'notes': setNotes(value); break;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        _id: job?._id,
        jobTitle: title.trim(),
        company: company.trim(),
        location: location.trim(),
        jobUrl: jobUrl.trim(),
        status,
        priority,
        platform,
        datePosted: datePosted ? new Date(datePosted).toISOString() : null,
        description: description.trim(),
        notes: notes.trim(),
        applicationMethod: 'manual',
        resumeUsed: selectedResumeId || null,
      };

      // If resumeUsed is an ID, convert to string ID for backend
      if (selectedResumeId && typeof selectedResumeId === 'object' && selectedResumeId !== null && '_id' in selectedResumeId) {
        payload.resumeUsed = (selectedResumeId as { _id: string })._id;
      } else if (selectedResumeId && typeof selectedResumeId === 'string') {
        payload.resumeUsed = selectedResumeId;
      }

      const response = await fetch(job ? `/api/applications/${job._id}` : '/api/applications', {
        method: job ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job ? { id: job._id, ...payload } : { jobs: [payload] }),
      });

      if (!response.ok) {
        throw new Error(job ? 'Failed to update job application' : 'Failed to create job application');
      }

      const responseData = await response.json();
      toast.success(job ? 'Job application updated successfully' : 'Job application created successfully');
      if (responseData && responseData.applications && responseData.applications.length > 0) {
        onJobCreated(responseData.applications[0]);
      } else if (responseData && !Array.isArray(responseData.applications)) {
        onJobCreated(responseData);
      } else {
        onJobCreated(null);
      }
      resetForm();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(job ? 'Failed to update job application' : 'Failed to create job application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={visible}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title={job ? "Edit Job Application" : "Add New Job Application"}
      width="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
              Job Title <span className="text-[var(--danger)]">*</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="e.g. Senior Frontend Developer"
                className={`w-full pl-10 pr-4 py-2 bg-[var(--bg-deep)] border rounded-xl text-white focus:outline-none transition-colors ${errors.title ? 'border-[var(--danger)] focus:border-[var(--danger)]' : 'border-[var(--border-glass)] focus:border-[var(--primary)]'}`}
              />
            </div>
            {errors.title && <p className="text-[var(--danger)] text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
              Company <span className="text-[var(--danger)]">*</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={company}
                onChange={(e) => handleFieldChange('company', e.target.value)}
                placeholder="e.g. Tech Corp"
                className={`w-full pl-10 pr-4 py-2 bg-[var(--bg-deep)] border rounded-xl text-white focus:outline-none transition-colors ${errors.company ? 'border-[var(--danger)] focus:border-[var(--danger)]' : 'border-[var(--border-glass)] focus:border-[var(--primary)]'}`}
              />
            </div>
            {errors.company && <p className="text-[var(--danger)] text-xs mt-1">{errors.company}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={location}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                placeholder="e.g. Remote, New York"
                className={`w-full pl-10 pr-4 py-2 bg-[var(--bg-deep)] border rounded-xl text-white focus:outline-none transition-colors ${errors.location ? 'border-[var(--danger)] focus:border-[var(--danger)]' : 'border-[var(--border-glass)] focus:border-[var(--primary)]'}`}
              />
            </div>
            {errors.location && <p className="text-[var(--danger)] text-xs mt-1">{errors.location}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Job URL</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={jobUrl}
                onChange={(e) => handleFieldChange('jobUrl', e.target.value)}
                placeholder="https://..."
                className={`w-full pl-10 pr-4 py-2 bg-[var(--bg-deep)] border rounded-xl text-white focus:outline-none transition-colors ${errors.jobUrl ? 'border-[var(--danger)] focus:border-[var(--danger)]' : 'border-[var(--border-glass)] focus:border-[var(--primary)]'}`}
              />
            </div>
            {errors.jobUrl && <p className="text-[var(--danger)] text-xs mt-1">{errors.jobUrl}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none appearance-none"
            >
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
              <option value="interviewing">Interviewing</option>
              <option value="offered">Offered</option>
              <option value="rejected">Rejected</option>
              <option value="submitted">Submitted</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none appearance-none"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none appearance-none"
            >
              <option value="linkedin">LinkedIn</option>
              <option value="indeed">Indeed</option>
              <option value="glassdoor">Glassdoor</option>
              <option value="company-website">Company Website</option>
              <option value="referral">Referral</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Date Posted</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="date"
                value={datePosted}
                onChange={(e) => setDatePosted(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Resume Used</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none appearance-none"
              >
                <option value="">Select a resume...</option>
                {resumes.map((resume) => (
                  <option key={resume._id} value={resume._id}>
                    {resume.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Job description..."
            rows={3}
            className={`w-full px-4 py-2 bg-[var(--bg-deep)] border rounded-xl text-white focus:outline-none resize-none transition-colors ${errors.description ? 'border-[var(--danger)] focus:border-[var(--danger)]' : 'border-[var(--border-glass)] focus:border-[var(--primary)]'}`}
          />
          {errors.description && <p className="text-[var(--danger)] text-xs mt-1">{errors.description}</p>}
          <p className="text-[var(--text-dim)] text-xs text-right">{description.length}/5000</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            placeholder="Additional notes..."
            rows={2}
            className={`w-full px-4 py-2 bg-[var(--bg-deep)] border rounded-xl text-white focus:outline-none resize-none transition-colors ${errors.notes ? 'border-[var(--danger)] focus:border-[var(--danger)]' : 'border-[var(--border-glass)] focus:border-[var(--primary)]'}`}
          />
          {errors.notes && <p className="text-[var(--danger)] text-xs mt-1">{errors.notes}</p>}
          <p className="text-[var(--text-dim)] text-xs text-right">{notes.length}/2000</p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-glass)]">
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>}
            {job ? "Update Job" : "Add Job"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateJobModal;
