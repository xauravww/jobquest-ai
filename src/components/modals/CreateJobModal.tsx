import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, DatePicker, Button } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

const { TextArea } = Input;

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

const CreateJobModal: React.FC<CreateJobModalProps> = ({ visible, onClose, onJobCreated, job }) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [status, setStatus] = useState('saved');
  const [priority, setPriority] = useState('medium');
  const [platform, setPlatform] = useState('other');
  const [datePosted, setDatePosted] = useState<dayjs.Dayjs | null>(null);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  // New states for resumes
  const [resumes, setResumes] = useState<{ _id: string; title: string }[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(undefined);

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
      setDatePosted(job.datePosted ? dayjs(job.datePosted) : null);
      setDescription(job.description || '');
      setNotes(job.notes || '');
      setErrors({});

      // Pre-select resume if available
      if (job.resumeUsed && typeof job.resumeUsed === 'string') {
        setSelectedResumeId(job.resumeUsed);
      } else if (job.resumeUsed && typeof job.resumeUsed === 'object' && job.resumeUsed._id) {
        setSelectedResumeId(job.resumeUsed._id);
      } else {
        setSelectedResumeId(undefined);
      }
    } else if (!job && visible) {
      resetForm();
      setSelectedResumeId(undefined);
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
    setDatePosted(null);
    setDescription('');
    setNotes('');
    setErrors({});
    setSelectedResumeId(undefined);
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
        if (value && value.length > 1000) return 'Description must be less than 1000 characters';
        return undefined;

      case 'notes':
        if (value && value.length > 500) return 'Notes must be less than 500 characters';
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
      case 'title':
        setTitle(value);
        break;
      case 'company':
        setCompany(value);
        break;
      case 'location':
        setLocation(value);
        break;
      case 'jobUrl':
        setJobUrl(value);
        break;
      case 'description':
        setDescription(value);
        break;
      case 'notes':
        setNotes(value);
        break;
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
        datePosted: datePosted ? datePosted.toISOString() : new Date().toISOString(),
        description: description.trim(),
        notes: notes.trim(),
        applicationMethod: 'manual',
        resumeUsed: selectedResumeId || null,
      };

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
      title={job ? "Edit Job Application" : "Add New Job Application"}
      open={visible}
      onCancel={() => {
        resetForm();
        onClose();
      }}
      footer={[
        <Button key="cancel" onClick={() => {
          resetForm();
          onClose();
        }}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          {job ? "Update Job" : "Add Job"}
        </Button>,
      ]}
    style={{ maxWidth: '700px', width: '90vw' }}
    className="custom-dark-modal"
    bodyStyle={{ backgroundColor: '#000000' }}
  >
      <div className="space-y-4 text-text">
        <div>
          <label className="block text-sm font-semibold text-white mb-1">
            Job Title <span className="text-red-500">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="Job Title"
            size="large"
            status={errors.title ? 'error' : ''}
          />
          {errors.title && <div className="text-red-500 text-sm mt-1">{errors.title}</div>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-white mb-1">
            Company <span className="text-red-500">*</span>
          </label>
          <Input
            value={company}
            onChange={(e) => handleFieldChange('company', e.target.value)}
            placeholder="Company"
            size="large"
            status={errors.company ? 'error' : ''}
          />
          {errors.company && <div className="text-red-500 text-sm mt-1">{errors.company}</div>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-white mb-1">Location</label>
          <Input
            value={location}
            onChange={(e) => handleFieldChange('location', e.target.value)}
            placeholder="Location"
            size="large"
            status={errors.location ? 'error' : ''}
          />
          {errors.location && <div className="text-red-500 text-sm mt-1">{errors.location}</div>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-white mb-1">Job URL</label>
          <Input
            value={jobUrl}
            onChange={(e) => handleFieldChange('jobUrl', e.target.value)}
            placeholder="https://example.com/job-posting"
            size="large"
            status={errors.jobUrl ? 'error' : ''}
          />
          {errors.jobUrl && <div className="text-red-500 text-sm mt-1">{errors.jobUrl}</div>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-white mb-1">Status</label>
          <Select
            value={status}
            onChange={setStatus}
            size="large"
            className="w-full"
          >
            <Select.Option value="saved">Saved</Select.Option>
            <Select.Option value="applied">Applied</Select.Option>
            <Select.Option value="interviewing">Interviewing</Select.Option>
            <Select.Option value="offered">Offered</Select.Option>
            <Select.Option value="rejected">Rejected</Select.Option>
            <Select.Option value="submitted">Submitted</Select.Option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-white mb-1">Priority</label>
          <Select
            value={priority}
            onChange={setPriority}
            size="large"
            className="w-full"
          >
            <Select.Option value="high">High</Select.Option>
            <Select.Option value="medium">Medium</Select.Option>
            <Select.Option value="low">Low</Select.Option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-white mb-1">Platform</label>
          <Select
            value={platform}
            onChange={setPlatform}
            size="large"
            className="w-full"
          >
            <Select.Option value="linkedin">LinkedIn</Select.Option>
            <Select.Option value="indeed">Indeed</Select.Option>
            <Select.Option value="glassdoor">Glassdoor</Select.Option>
            <Select.Option value="company-website">Company Website</Select.Option>
            <Select.Option value="referral">Referral</Select.Option>
            <Select.Option value="other">Other</Select.Option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-white mb-1">Date Posted</label>
          <DatePicker
            value={datePosted}
            onChange={setDatePosted}
            size="large"
            className="w-full"
            format="MMM DD, YYYY"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-white mb-1">Description</label>
          <TextArea
            value={description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Job description"
            rows={3}
            size="large"
            status={errors.description ? 'error' : ''}
          />
          {errors.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
          <div className="text-gray-400 text-xs mt-1">{description.length}/1000 characters</div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-white mb-1">Notes</label>
          <TextArea
            value={notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            placeholder="Additional notes"
            rows={2}
            size="large"
            status={errors.notes ? 'error' : ''}
          />
          {errors.notes && <div className="text-red-500 text-sm mt-1">{errors.notes}</div>}
          <div className="text-gray-400 text-xs mt-1">{notes.length}/500 characters</div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-white mb-1">Resume</label>
          <Select
            showSearch
            placeholder="Select a resume"
            optionFilterProp="children"
            value={selectedResumeId}
            onChange={(value) => setSelectedResumeId(value)}
            size="large"
            className="w-full"
filterOption={(input: string, option?: DefaultOptionType) => {
              if (typeof option?.children === 'string') {
                return (option.children as string).toLowerCase().includes(input.toLowerCase());
              }
              return false;
            }}
            allowClear={true}
            >
              {resumes.map((resume: { _id: string; title: string }) => (
                <Select.Option key={resume._id} value={resume._id}>
                  {resume.title}
                </Select.Option>
              ))}
            </Select>
        </div>
      </div>
    </Modal>
  );
};

export default CreateJobModal;
