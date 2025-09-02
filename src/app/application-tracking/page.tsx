'use client';

import React, { useState, useEffect } from 'react';

import AppLayout from '@/components/AppLayout';
import { Card, Modal, Select, message, Tag } from 'antd';
import { 
  Briefcase, 
  Plus, 
  Filter, 
  Calendar, 
  MapPin, 
  Building, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Trash2
} from 'lucide-react';
import dayjs from 'dayjs';

interface Job {
  _id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  status: string;
  datePosted: string;
  description: string;
  priority: string;
  platform: string;
  notes?: string;
  aiScore?: number;
  aiReasons?: string[];
}

const ApplicationTrackingPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all'
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/applications');
      if (response.ok) {
        const data = await response.json();
        // Map applications to job-like objects for display
        const mappedJobs = Array.isArray(data) ? data.map(app => ({
          _id: app._id,
          jobId: app.jobId?.jobId || '',
          title: app.jobId?.title || '',
          company: app.jobId?.company || '',
          location: app.jobId?.location || '',
          salary: app.jobId?.salary || '',
          status: app.status || '',
          datePosted: app.jobId?.datePosted || '',
          description: app.jobId?.description || '',
          priority: app.priority || 'medium',
          platform: app.platform || '',
          notes: app.notes || '',
          aiScore: app.jobId?.aiScore,
          aiReasons: app.jobId?.aiReasons || []
        })) : [];
        setJobs(mappedJobs);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      message.error('Failed to fetch jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (jobId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        message.success('Status updated successfully');
        fetchJobs();
      } else {
        message.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Failed to update status');
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Job deleted successfully');
        fetchJobs();
      } else {
        message.error('Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      message.error('Failed to delete job');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'saved': return 'blue';
      case 'applied': return 'orange';
      case 'interviewing': return 'purple';
      case 'offered': return 'green';
      case 'rejected': return 'red';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'offered':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'interviewing':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-danger';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-text-muted';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredJobs = jobs.filter(job => {
    if (filters.status !== 'all' && job.status !== filters.status) return false;
    if (filters.priority !== 'all' && job.priority !== filters.priority) return false;
    return true;
  });

  return (
    <AppLayout showFooter={false}>
      <div className="p-8 bg-bg min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Application Tracking</h1>
              <p className="text-text-muted text-lg">Track and manage your job applications</p>
            </div>
            
            <button
              onClick={() => setDetailModalVisible(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-success hover:from-success hover:to-primary text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Add Job
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center mb-8">
            <Select
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              className="w-40"
              placeholder="Status"
            >
              <Select.Option value="all">All Status</Select.Option>
              <Select.Option value="saved">Saved</Select.Option>
              <Select.Option value="applied">Applied</Select.Option>
              <Select.Option value="interviewing">Interviewing</Select.Option>
              <Select.Option value="offered">Offered</Select.Option>
              <Select.Option value="rejected">Rejected</Select.Option>
            </Select>

            <Select
              value={filters.priority}
              onChange={(value) => setFilters({ ...filters, priority: value })}
              className="w-40"
              placeholder="Priority"
            >
              <Select.Option value="all">All Priorities</Select.Option>
              <Select.Option value="high">High</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="low">Low</Select.Option>
            </Select>
          </div>

          {/* Jobs List */}
          <div className="space-y-4">
            {filteredJobs.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-bg-light rounded-full flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-12 h-12 text-text-muted" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No jobs found</h3>
                <p className="text-text-muted text-center mb-6 max-w-md mx-auto">
                  {jobs.length === 0 
                    ? "Start tracking your jobs to stay organized and increase your success rate."
                    : "No jobs match your current filters. Try adjusting your search criteria."
                  }
                </p>
              </div>
            )}

            {filteredJobs.map((job) => (
              <Card
                key={job._id}
                className="bg-bg-card border border-border hover:border-primary/50 transition-all duration-300 group"
                style={{ padding: '24px' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-primary" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                          {job.title}
                        </h3>
                        <Tag 
                          color={getStatusColor(job.status)}
                          icon={getStatusIcon(job.status)}
                        >
                          {formatStatus(job.status)}
                        </Tag>
                        <span className={`text-xs font-medium uppercase ${getPriorityColor(job.priority)}`}>
                          {job.priority} Priority
                        </span>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-text-muted">
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {job.company}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Posted {dayjs(job.datePosted).format('MMM DD, YYYY')}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="capitalize">{job.platform || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick Status Update */}
                    <Select
                      value={job.status}
                      onChange={(value) => handleStatusUpdate(job._id, value)}
                      className="w-40"
                      size="small"
                    >
                      <Select.Option value="saved">Saved</Select.Option>
                      <Select.Option value="applied">Applied</Select.Option>
                      <Select.Option value="interviewing">Interviewing</Select.Option>
                      <Select.Option value="offered">Offered</Select.Option>
                      <Select.Option value="rejected">Rejected</Select.Option>
                    </Select>

                    <button
                      onClick={() => {
                        setSelectedJob(job);
                        setDetailModalVisible(true);
                      }}
                      className="flex items-center justify-center p-2 bg-bg-light hover:bg-primary/20 text-text hover:text-primary rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(job._id)}
                      className="flex items-center justify-center p-2 bg-bg-light hover:bg-danger/20 text-text hover:text-danger rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notes */}
                {job.notes && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-text">{job.notes}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Detail Modal */}
          {selectedJob && (
            <Modal
              title={`${selectedJob.title} at ${selectedJob.company}`}
              open={detailModalVisible}
              onCancel={() => setDetailModalVisible(false)}
              footer={null}
              width={800}
              className="job-detail-modal"
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Status</label>
                  <Tag color={getStatusColor(selectedJob.status)}>
                    {formatStatus(selectedJob.status)}
                  </Tag>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Priority</label>
                  <span className={`font-medium capitalize ${getPriorityColor(selectedJob.priority)}`}>
                    {selectedJob.priority}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Posted Date</label>
                  <p className="text-text">{dayjs(selectedJob.datePosted).format('MMMM DD, YYYY')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Location</label>
                  <p className="text-text">{selectedJob.location}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Description</label>
                  <p className="text-text whitespace-pre-wrap">{selectedJob.description}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Notes</label>
                  <textarea
                    value={selectedJob.notes || ''}
                    onChange={(e) => {
                      const newNotes = e.target.value;
                      setSelectedJob(prev => prev ? { ...prev, notes: newNotes } : null);
                    }}
                    className="w-full px-3 py-2 bg-bg-light border border-border rounded-lg text-text focus:border-primary focus:outline-none resize-none"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={async () => {
                      if (!selectedJob) return;
                      try {
                        const response = await fetch(`/api/jobs/${selectedJob._id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ notes: selectedJob.notes }),
                        });
                        if (response.ok) {
                          message.success('Notes updated successfully');
                          setDetailModalVisible(false);
                          fetchJobs();
                        } else {
                          message.error('Failed to update notes');
                        }
                      } catch (error) {
                        console.error('Error updating notes:', error);
                        message.error('Failed to update notes');
                      }
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
                  >
                    Save Notes
                  </button>
                  <button
                    onClick={() => setDetailModalVisible(false)}
                    className="px-4 py-2 bg-bg-light text-text rounded-lg hover:bg-bg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ApplicationTrackingPage;
