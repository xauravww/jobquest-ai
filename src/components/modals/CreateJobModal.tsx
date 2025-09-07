import React, { useState } from 'react';
import { Modal, Input, Select, DatePicker, Button } from 'antd';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

const { TextArea } = Input;

interface Job {
  _id: string;
  jobId?: string;
  jobTitle: string;
  company: string;
  location?: string;
  jobUrl?: string;
  status: string;
  datePosted: string;
  description?: string;
  priority: string;
  platform: string;
  notes?: string;
}

interface CreateJobModalProps {
  visible: boolean;
  onClose: () => void;
  onJobCreated: (newJob: Job) => void;
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({ visible, onClose, onJobCreated }) => {
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

  const resetForm = () => {
    setTitle('');
    setCompany('');
    setLocation('');
    setStatus('saved');
    setPriority('medium');
    setPlatform('other');
    setDatePosted(null);
    setDescription('');
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!title.trim() || !company.trim()) {
      toast.error('Please fill in at least Job Title and Company.');
      return;
    }

    setLoading(true);
    try {
    const payload = {
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
    };

    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobs: [payload] }),
    });

      if (!response.ok) {
        throw new Error('Failed to create job application');
      }

      const responseData = await response.json();
      toast.success('Job application created successfully');
      if (responseData && responseData.applications && responseData.applications.length > 0) {
        onJobCreated(responseData.applications[0]);
      } else {
        onJobCreated(null);
      }
      resetForm();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create job application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Add New Job Application"
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
          Add Job
        </Button>,
      ]}
      width={700}
      className="custom-dark-modal"
      bodyStyle={{ backgroundColor: '#000000' }}
    >
      <div className="space-y-4 text-text">
        <div>
          <label className="block text-sm font-semibold text-white mb-1">Job Title *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Job Title"
            size="large"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-white mb-1">Company *</label>
          <Input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company"
            size="large"
          />
        </div>
      <div>
        <label className="block text-sm font-semibold text-white mb-1">Location</label>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          size="large"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-white mb-1">Job URL</label>
        <Input
          value={jobUrl}
          onChange={(e) => setJobUrl(e.target.value)}
          placeholder="Job URL"
          size="large"
        />
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
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={3}
          size="large"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-white mb-1">Notes</label>
        <TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
          rows={2}
          size="large"
        />
      </div>
      </div>
    </Modal>
  );
};

export default CreateJobModal;
