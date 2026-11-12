'use client';

import React, { useState, useEffect } from 'react';
import { Select, DatePicker, AutoComplete } from 'antd';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import AppLayout from '@/components/AppLayout';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { Briefcase, MapPin, Globe, X, Maximize2, ArrowLeft, Clock, Flag, FileText } from 'lucide-react';

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
  mode?: 'modal' | 'page'; // when 'page', render as a full page instead of a modal
}

interface ValidationErrors {
  title?: string;
  company?: string;
  location?: string;
  jobUrl?: string;
  description?: string;
  notes?: string;
}

const ClearButton = ({ onClick, label, className = '' }: { onClick: () => void; label: string; className?: string }) => (
  <Button
    type="button"
    variant="ghost"
    onClick={onClick}
    aria-label={label}
    className={`absolute p-1 w-6 h-6 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-transparent ${className}`}
  >
    <X className="w-3.5 h-3.5" />
  </Button>
);

const DEFAULT_PLATFORMS = ['LinkedIn', 'Indeed', 'Glassdoor', 'Company Website', 'Referral', 'Other'];

const CreateJobModal = ({ visible, onClose, onJobCreated, job, mode = 'modal' }: CreateJobModalProps) => {
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
  const [fullscreenField, setFullscreenField] = useState<'description' | 'notes' | null>(null);

  // Fetch resumes when modal opens
  useEffect(() => {
    if (visible) {
      fetchResumes();
    }
  }, [visible]);

  // Suggestions pulled from previously saved applications
  interface SuggestionApp {
    jobTitle?: string;
    title?: string;
    company?: string;
    location?: string;
    platform?: string;
    jobId?: { title?: string; company?: string; location?: string };
  }
  const [suggestions, setSuggestions] = useState<{
    titles: string[];
    companies: string[];
    locations: string[];
    platforms: string[];
  }>({
    titles: [],
    companies: [],
    locations: [],
    platforms: []
  });

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/applications?limit=50');
        if (!response.ok) return;
        const data = await response.json();
        const apps: SuggestionApp[] = Array.isArray(data) ? data : data.applications || [];
        const unique = (items: Array<string | undefined>) => Array.from(new Set(items.filter((i): i is string => Boolean(i))));
        if (!cancelled) {
          setSuggestions({
            titles: unique(apps.map((a) => a.jobId?.title || a.jobTitle || a.title)),
            companies: unique(apps.map((a) => a.jobId?.company || a.company)),
            locations: unique(apps.map((a) => a.jobId?.location || a.location)),
            platforms: unique(apps.map((a) => a.platform))
          });
        }
      } catch {
        // ignore suggestion errors
      }
    })();
    return () => { cancelled = true; };
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
      setFullscreenField(null);

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
    setFullscreenField(null);
  };

  const validateField = (field: string, value?: string): string | undefined => {
    const text = value ?? '';
    switch (field) {
      case 'title':
        if (!text.trim()) return 'Job title is required';
        if (text.trim().length < 2) return 'Job title must be at least 2 characters';
        if (text.trim().length > 100) return 'Job title must be less than 100 characters';
        return undefined;

      case 'company':
        if (!text.trim()) return 'Company name is required';
        if (text.trim().length < 2) return 'Company name must be at least 2 characters';
        if (text.trim().length > 100) return 'Company name must be less than 100 characters';
        return undefined;

      case 'location':
        if (text && text.length > 100) return 'Location must be less than 100 characters';
        return undefined;

      case 'jobUrl':
        if (text && text.trim()) {
          try {
            new URL(text.trim());
          } catch {
            return 'Please enter a valid URL';
          }
        }
        return undefined;

      case 'description':
        if (text && text.length > 5000) return 'Description must be less than 5000 characters';
        return undefined;

      case 'notes':
        if (text && text.length > 2000) return 'Notes must be less than 2000 characters';
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

  const handleFieldChange = (field: string, value?: string) => {
    const safe = value ?? '';
    const error = validateField(field, safe);
    setErrors(prev => ({ ...prev, [field]: error }));

    switch (field) {
      case 'title': setTitle(safe); break;
      case 'company': setCompany(safe); break;
      case 'location': setLocation(safe); break;
      case 'jobUrl': setJobUrl(safe); break;
      case 'description': setDescription(safe); break;
      case 'notes': setNotes(safe); break;
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
        status: status || 'saved',
        priority: priority || 'medium',
        platform: platform || 'other',
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

  const formContent = (
    <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
              Job Title <span className="text-[var(--danger)]">*</span>
            </label>
            <AutoComplete
              value={title}
              onChange={(value: string) => handleFieldChange('title', value)}
              options={suggestions.titles.map((t) => ({ value: t }))}
              filterOption={(input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
              placeholder="e.g. Senior Frontend Developer"
              prefix={<Briefcase className="w-4 h-4 text-[var(--text-muted)]" />}
              allowClear
              status={errors.title ? 'error' : undefined}
              className="w-full"
            />
            {errors.title && <p className="text-[var(--danger)] text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
              Company <span className="text-[var(--danger)]">*</span>
            </label>
            <AutoComplete
              value={company}
              onChange={(value: string) => handleFieldChange('company', value)}
              options={suggestions.companies.map((c) => ({ value: c }))}
              filterOption={(input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
              placeholder="e.g. Tech Corp"
              prefix={<Briefcase className="w-4 h-4 text-[var(--text-muted)]" />}
              allowClear
              status={errors.company ? 'error' : undefined}
              className="w-full"
            />
            {errors.company && <p className="text-[var(--danger)] text-xs mt-1">{errors.company}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Location</label>
            <AutoComplete
              value={location}
              onChange={(value: string) => handleFieldChange('location', value)}
              options={suggestions.locations.map((l) => ({ value: l }))}
              filterOption={(input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
              placeholder="e.g. Remote, New York"
              prefix={<MapPin className="w-4 h-4 text-[var(--text-muted)]" />}
              allowClear
              status={errors.location ? 'error' : undefined}
              className="w-full"
            />
            {errors.location && <p className="text-[var(--danger)] text-xs mt-1">{errors.location}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Job URL</label>
            <div className={`relative flex items-center bg-[var(--bg-deep)] border rounded-lg transition-colors ${errors.jobUrl ? 'border-[var(--danger)]' : 'border-[var(--border)]'}`}>
              <Globe className="ml-3 w-4 h-4 text-[var(--text-muted)] flex-shrink-0 pointer-events-none" />
              <input
                type="text"
                value={jobUrl}
                onChange={(e) => handleFieldChange('jobUrl', e.target.value)}
                placeholder="https://..."
                className="w-full h-8 pl-2 pr-8 bg-transparent border-none outline-none text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
              />
              {jobUrl && (
                <ClearButton
                  onClick={() => handleFieldChange('jobUrl', '')}
                  label="Clear URL"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 w-7 h-7 rounded-lg"
                />
              )}
            </div>
            {errors.jobUrl && <p className="text-[var(--danger)] text-xs mt-1">{errors.jobUrl}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Status</label>
            <Select
              value={status || undefined}
              onChange={(v) => setStatus(v ?? '')}
              prefix={<Clock className="w-4 h-4 text-[var(--text-muted)]" />}
              showSearch
              allowClear
              placeholder="Select status"
              options={[
                { value: 'saved', label: 'Saved' },
                { value: 'applied', label: 'Applied' },
                { value: 'interviewing', label: 'Interviewing' },
                { value: 'offered', label: 'Offered' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'expired', label: 'Expired' },
              ]}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Priority</label>
            <Select
              value={priority || undefined}
              onChange={(v) => setPriority(v ?? '')}
              prefix={<Flag className="w-4 h-4 text-[var(--text-muted)]" />}
              showSearch
              allowClear
              placeholder="Select priority"
              options={[
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Platform</label>
            <AutoComplete
              value={platform}
              onChange={(value: string) => setPlatform(value)}
              options={[...new Set([...DEFAULT_PLATFORMS, ...suggestions.platforms])].map((p) => ({ value: p }))}
              filterOption={(input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
              prefix={<Globe className="w-4 h-4 text-[var(--text-muted)]" />}
              allowClear
              placeholder="e.g. LinkedIn, AngelList"
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Date Posted</label>
            <div className="relative">
              <DatePicker
                value={datePosted ? dayjs(datePosted) : null}
                onChange={(d) => setDatePosted(d ? d.format('YYYY-MM-DD') : '')}
                allowClear
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Resume Used</label>
            <div className="relative">
              <Select
                value={selectedResumeId || undefined}
                onChange={(v) => setSelectedResumeId(v ?? '')}
                prefix={<FileText className="w-4 h-4 text-[var(--text-muted)]" />}
                showSearch
                allowClear
                placeholder="Select a resume"
                options={resumes.map((resume) => ({
                  value: resume._id,
                  label: resume.title,
                }))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-[var(--text-muted)]">Description</label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenField(fullscreenField === 'description' ? null : 'description');
              }}
              aria-label={fullscreenField === 'description' ? 'Collapse description' : 'Expand description'}
              className="px-2 py-0.5 text-xs flex items-center gap-1"
            >
              {fullscreenField === 'description' ? (
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
          </div>
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Job description..."
              className={`w-full px-4 pr-9 py-2 bg-[var(--bg-deep)] border rounded-lg text-[var(--text-main)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none resize-none transition-colors duration-200 ${errors.description ? 'border-[var(--danger)]' : 'border-[var(--border)]'} ${fullscreenField === 'description' ? 'h-[50vh] md:h-[58vh] text-base' : 'min-h-[100px]'}`}
            />
            {description && (
              <ClearButton
                onClick={() => handleFieldChange('description', '')}
                label="Clear description"
                className="right-2 top-2"
              />
            )}
          </div>
          {errors.description && <p className="text-[var(--danger)] text-xs mt-1">{errors.description}</p>}
          <p className="text-[var(--text-dim)] text-xs text-right">{description.length}/5000</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-[var(--text-muted)]">Notes</label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenField(fullscreenField === 'notes' ? null : 'notes');
              }}
              aria-label={fullscreenField === 'notes' ? 'Collapse notes' : 'Expand notes'}
              className="px-2 py-0.5 text-xs flex items-center gap-1"
            >
              {fullscreenField === 'notes' ? (
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
          </div>
          <div className="relative">
            <textarea
              value={notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder="Additional notes..."
              className={`w-full px-4 pr-9 py-2 bg-[var(--bg-deep)] border rounded-lg text-[var(--text-main)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none resize-none transition-colors duration-200 ${errors.notes ? 'border-[var(--danger)]' : 'border-[var(--border)]'} ${fullscreenField === 'notes' ? 'h-[44vh] md:h-[52vh] text-base' : 'min-h-[76px]'}`}
            />
            {notes && (
              <ClearButton
                onClick={() => handleFieldChange('notes', '')}
                label="Clear notes"
                className="right-2 top-2"
              />
            )}
          </div>
          {errors.notes && <p className="text-[var(--danger)] text-xs mt-1">{errors.notes}</p>}
          <p className="text-[var(--text-dim)] text-xs text-right">{notes.length}/2000</p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="ghost"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={loading}
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-dim)] transition-colors flex items-center gap-2"
          >
            {job ? "Update Job" : "Add Job"}
          </Button>
        </div>
    </div>
  );

  if (mode === 'page') {
    return (
      <AppLayout showFooter={false}>
        <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="px-3 py-2 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-[var(--text-main)]">
            {job ? 'Edit Job Application' : 'Add New Job Application'}
          </h1>
          {formContent}
        </div>
      </AppLayout>
    );
  }

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
      {formContent}
    </Modal>
  );
};

export default CreateJobModal;
