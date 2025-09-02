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
  Trash2,
  Phone,
  Video,
  Mail,
  MessageSquare
} from 'lucide-react';
import { FormInput } from '@/components/ui/FormInput';
import dayjs from 'dayjs';

interface Application {
  _id: string;
  jobId: {
    title: string;
    company: string;
    location: string;
    salary?: string;
  };
  applicationId: string;
  status: string;
  appliedDate: string;
  lastStatusUpdate: string;
  expectedResponseDate?: string;
  applicationMethod: string;
  platform: string;
  notes?: string;
  priority: string;
  communications: Array<{
    date: string;
    type: string;
    direction: string;
    subject: string;
    content: string;
    contactPerson?: string;
  }>;
  interviews: Array<{
    scheduledDate: string;
    type: string;
    interviewer?: string;
    notes?: string;
    result?: string;
  }>;
  offer?: {
    salary: number;
    currency: string;
    benefits: string[];
    startDate?: string;
    responseDeadline?: string;
  };
}

const ApplicationTrackingPage = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    platform: 'all',
    priority: 'all',
    dateRange: null as unknown
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications');
      if (response.ok) {
        const data = await response.json();
        // Ensure data is always an array
        setApplications(Array.isArray(data) ? data : []);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      message.error('Failed to fetch applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        message.success('Status updated successfully');
        fetchApplications();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Failed to update status');
    }
  };

  const handleDelete = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Application deleted successfully');
        fetchApplications();
      }
    } catch (error) {
      console.error('Error deleting application:', error);
      message.error('Failed to delete application');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'blue';
      case 'under_review': return 'orange';
      case 'phone_screening': return 'purple';
      case 'technical_interview': return 'cyan';
      case 'final_interview': return 'magenta';
      case 'offer_received': return 'green';
      case 'accepted': return 'success';
      case 'rejected': return 'red';
      case 'withdrawn': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'offer_received':
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
      case 'withdrawn':
        return <XCircle className="w-4 h-4" />;
      case 'phone_screening':
      case 'technical_interview':
      case 'final_interview':
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
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const filteredApplications = (applications || []).filter(app => {
    if (filters.status !== 'all' && app.status !== filters.status) return false;
    if (filters.platform !== 'all' && app.platform !== filters.platform) return false;
    if (filters.priority !== 'all' && app.priority !== filters.priority) return false;
    return true;
  });

  const stats = {
    total: applications?.length || 0,
    submitted: applications?.filter(a => a.status === 'submitted').length || 0,
    interviewing: applications?.filter(a => 
      ['phone_screening', 'technical_interview', 'final_interview'].includes(a.status)
    ).length || 0,
    offers: applications?.filter(a => a.status === 'offer_received').length || 0,
    rejected: applications?.filter(a => a.status === 'rejected').length || 0
  };

  if (loading) {
    return (
      <AppLayout showFooter={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

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
              onClick={() => setAddModalVisible(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-success hover:from-success hover:to-primary text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Add Application
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card className="bg-bg-card border border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">{stats.total}</div>
                <div className="text-text-muted text-sm">Total Applications</div>
              </div>
            </Card>

            <Card className="bg-bg-card border border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">{stats.submitted}</div>
                <div className="text-text-muted text-sm">Submitted</div>
              </div>
            </Card>

            <Card className="bg-bg-card border border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400 mb-1">{stats.interviewing}</div>
                <div className="text-text-muted text-sm">Interviewing</div>
              </div>
            </Card>

            <Card className="bg-bg-card border border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-success mb-1">{stats.offers}</div>
                <div className="text-text-muted text-sm">Offers</div>
              </div>
            </Card>

            <Card className="bg-bg-card border border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-danger mb-1">{stats.rejected}</div>
                <div className="text-text-muted text-sm">Rejected</div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-bg-card border border-border mb-8">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-text-muted" />
                <span className="text-text-muted text-sm">Filters:</span>
              </div>

              <Select
                value={filters.status}
                onChange={(value) => setFilters({ ...filters, status: value })}
                className="w-40"
                placeholder="Status"
              >
                <Select.Option value="all">All Status</Select.Option>
                <Select.Option value="submitted">Submitted</Select.Option>
                <Select.Option value="under_review">Under Review</Select.Option>
                <Select.Option value="phone_screening">Phone Screening</Select.Option>
                <Select.Option value="technical_interview">Technical Interview</Select.Option>
                <Select.Option value="final_interview">Final Interview</Select.Option>
                <Select.Option value="offer_received">Offer Received</Select.Option>
                <Select.Option value="accepted">Accepted</Select.Option>
                <Select.Option value="rejected">Rejected</Select.Option>
              </Select>

              <Select
                value={filters.platform}
                onChange={(value) => setFilters({ ...filters, platform: value })}
                className="w-40"
                placeholder="Platform"
              >
                <Select.Option value="all">All Platforms</Select.Option>
                <Select.Option value="naukri">Naukri</Select.Option>
                <Select.Option value="linkedin">LinkedIn</Select.Option>
                <Select.Option value="indeed">Indeed</Select.Option>
                <Select.Option value="company_website">Company Website</Select.Option>
                <Select.Option value="other">Other</Select.Option>
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

              <button
                onClick={() => setFilters({ status: 'all', platform: 'all', priority: 'all', dateRange: null })}
                className="px-4 py-2 bg-bg-light hover:bg-bg text-text-muted hover:text-text rounded-lg transition-colors text-sm"
              >
                Clear Filters
              </button>
            </div>
          </Card>

          {/* Applications List */}
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <Card
                key={application._id}
                className="bg-bg-card border border-border hover:border-primary/50 transition-all duration-300 group"
                styles={{ body: { padding: '24px' } }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-primary" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                          {application.jobId.title}
                        </h3>
                        <Tag 
                          color={getStatusColor(application.status)}
                          icon={getStatusIcon(application.status)}
                        >
                          {formatStatus(application.status)}
                        </Tag>
                        <span className={`text-xs font-medium uppercase ${getPriorityColor(application.priority)}`}>
                          {application.priority} Priority
                        </span>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-text-muted">
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {application.jobId.company}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {application.jobId.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Applied {dayjs(application.appliedDate).format('MMM DD, YYYY')}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="capitalize">{application.platform}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick Status Update */}
                    <Select
                      value={application.status}
                      onChange={(value) => handleStatusUpdate(application._id, value)}
                      className="w-40"
                      size="small"
                    >
                      <Select.Option value="submitted">Submitted</Select.Option>
                      <Select.Option value="under_review">Under Review</Select.Option>
                      <Select.Option value="phone_screening">Phone Screening</Select.Option>
                      <Select.Option value="technical_interview">Technical Interview</Select.Option>
                      <Select.Option value="final_interview">Final Interview</Select.Option>
                      <Select.Option value="offer_received">Offer Received</Select.Option>
                      <Select.Option value="accepted">Accepted</Select.Option>
                      <Select.Option value="rejected">Rejected</Select.Option>
                      <Select.Option value="withdrawn">Withdrawn</Select.Option>
                    </Select>

                    <button
                      onClick={() => {
                        setSelectedApplication(application);
                        setDetailModalVisible(true);
                      }}
                      className="flex items-center justify-center p-2 bg-bg-light hover:bg-primary/20 text-text hover:text-primary rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(application._id)}
                      className="flex items-center justify-center p-2 bg-bg-light hover:bg-danger/20 text-text hover:text-danger rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Additional Info */}
                {(application.communications.length > 0 || application.interviews.length > 0) && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-4 text-sm">
                      {application.communications.length > 0 && (
                        <div className="flex items-center gap-1 text-text-muted">
                          <MessageSquare className="w-4 h-4" />
                          {application.communications.length} communication{application.communications.length !== 1 ? 's' : ''}
                        </div>
                      )}
                      {application.interviews.length > 0 && (
                        <div className="flex items-center gap-1 text-text-muted">
                          <Video className="w-4 h-4" />
                          {application.interviews.length} interview{application.interviews.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}

            {/* Empty State */}
            {filteredApplications.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-bg-light rounded-full flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-12 h-12 text-text-muted" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No applications found</h3>
                <p className="text-text-muted text-center mb-6 max-w-md mx-auto">
                  {applications.length === 0 
                    ? "Start tracking your job applications to stay organized and increase your success rate."
                    : "No applications match your current filters. Try adjusting your search criteria."
                  }
                </p>
                <button
                  onClick={() => setAddModalVisible(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-success hover:from-success hover:to-primary text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Application
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Detail Modal */}
        <ApplicationDetailModal
          visible={detailModalVisible}
          application={selectedApplication}
          onClose={() => {
            setDetailModalVisible(false);
            setSelectedApplication(null);
          }}
          onUpdate={fetchApplications}
        />

        {/* Add Application Modal */}
        <AddApplicationModal
          visible={addModalVisible}
          onClose={() => setAddModalVisible(false)}
          onAdd={fetchApplications}
        />
      </div>
    </AppLayout>
  );
};

// Application Detail Modal Component
const ApplicationDetailModal = ({ visible, application, onClose }: {
  visible: boolean;
  application: Application | null;
  onClose: () => void;
  onUpdate: () => void;
}) => {
  if (!application) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'blue';
      case 'under_review': return 'orange';
      case 'phone_screening': return 'purple';
      case 'technical_interview': return 'cyan';
      case 'final_interview': return 'magenta';
      case 'offer_received': return 'green';
      case 'accepted': return 'success';
      case 'rejected': return 'red';
      case 'withdrawn': return 'default';
      default: return 'default';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-danger';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-text-muted';
    }
  };

  return (
    <Modal
      title={`${application.jobId.title} at ${application.jobId.company}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className="application-detail-modal"
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Status</label>
            <Tag color={getStatusColor(application.status)}>
              {formatStatus(application.status)}
            </Tag>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Priority</label>
            <span className={`font-medium capitalize ${getPriorityColor(application.priority)}`}>
              {application.priority}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Applied Date</label>
            <p className="text-text">{dayjs(application.appliedDate).format('MMMM DD, YYYY')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Platform</label>
            <p className="text-text capitalize">{application.platform}</p>
          </div>
        </div>

        {/* Notes */}
        {application.notes && (
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Notes</label>
            <div className="bg-bg-light rounded-lg p-4">
              <p className="text-text">{application.notes}</p>
            </div>
          </div>
        )}

        {/* Communications */}
        {application.communications.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Communications</label>
            <div className="space-y-3">
              {application.communications.map((comm, index) => (
                <div key={index} className="bg-bg-light rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {comm.type === 'email' && <Mail className="w-4 h-4 text-primary" />}
                    {comm.type === 'phone' && <Phone className="w-4 h-4 text-success" />}
                    {comm.type === 'message' && <MessageSquare className="w-4 h-4 text-secondary" />}
                    <span className="font-medium text-white">{comm.subject}</span>
                    <span className="text-xs text-text-muted">
                      {dayjs(comm.date).format('MMM DD, YYYY')}
                    </span>
                  </div>
                  <p className="text-text-muted text-sm">{comm.content}</p>
                  {comm.contactPerson && (
                    <p className="text-text-secondary text-xs mt-1">Contact: {comm.contactPerson}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interviews */}
        {application.interviews.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Interviews</label>
            <div className="space-y-3">
              {application.interviews.map((interview, index) => (
                <div key={index} className="bg-bg-light rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="w-4 h-4 text-primary" />
                    <span className="font-medium text-white capitalize">{interview.type} Interview</span>
                    <span className="text-xs text-text-muted">
                      {dayjs(interview.scheduledDate).format('MMM DD, YYYY HH:mm')}
                    </span>
                    {interview.result && (
                      <Tag color={interview.result === 'passed' ? 'green' : interview.result === 'failed' ? 'red' : 'orange'}>
                        {interview.result}
                      </Tag>
                    )}
                  </div>
                  {interview.interviewer && (
                    <p className="text-text-muted text-sm">Interviewer: {interview.interviewer}</p>
                  )}
                  {interview.notes && (
                    <p className="text-text text-sm mt-2">{interview.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offer Details */}
        {application.offer && (
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Offer Details</label>
            <div className="bg-success/10 border border-success/20 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-muted mb-1">Salary</label>
                  <p className="text-success font-semibold">
                    {application.offer.currency} {application.offer.salary.toLocaleString()}
                  </p>
                </div>
                {application.offer.startDate && (
                  <div>
                    <label className="block text-xs text-text-muted mb-1">Start Date</label>
                    <p className="text-text">{dayjs(application.offer.startDate).format('MMM DD, YYYY')}</p>
                  </div>
                )}
              </div>
              {application.offer.benefits.length > 0 && (
                <div className="mt-3">
                  <label className="block text-xs text-text-muted mb-1">Benefits</label>
                  <div className="flex flex-wrap gap-1">
                    {application.offer.benefits.map((benefit, index) => (
                      <Tag key={index} color="green">{benefit}</Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// Add Application Modal Component
const AddApplicationModal = ({ visible, onClose, onAdd }: {
  visible: boolean;
  onClose: () => void;
  onAdd: () => void;
}) => {
  const [form, setForm] = useState({
    jobTitle: '',
    company: '',
    location: '',
    platform: 'linkedin',
    status: 'submitted',
    priority: 'medium',
    notes: ''
  });

  const handleSubmit = async () => {
    if (!form.jobTitle || !form.company) {
      message.error('Job title and company are required');
      return;
    }

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        message.success('Application added successfully');
        onAdd();
        onClose();
        setForm({
          jobTitle: '',
          company: '',
          location: '',
          platform: 'linkedin',
          status: 'submitted',
          priority: 'medium',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error adding application:', error);
      message.error('Failed to add application');
    }
  };

  return (
    <Modal
      title="Add New Application"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Add Application"
    >
      <div className="space-y-4">
        <FormInput
          label="Job Title *"
          value={form.jobTitle}
          onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
          placeholder="e.g., Senior Software Engineer"
          icon={<Briefcase className="w-4 h-4" />}
        />

        <FormInput
          label="Company *"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          placeholder="e.g., Google"
          icon={<Building className="w-4 h-4" />}
        />

        <FormInput
          label="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="e.g., San Francisco, CA"
          icon={<MapPin className="w-4 h-4" />}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Platform</label>
            <select
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
              className="w-full px-3 py-2 bg-bg-light border border-border rounded-lg text-text focus:border-primary focus:outline-none"
            >
              <option value="linkedin">LinkedIn</option>
              <option value="naukri">Naukri</option>
              <option value="indeed">Indeed</option>
              <option value="company_website">Company Website</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-3 py-2 bg-bg-light border border-border rounded-lg text-text focus:border-primary focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-bg-light border border-border rounded-lg text-text focus:border-primary focus:outline-none resize-none"
            placeholder="Any additional notes about this application..."
          />
        </div>
      </div>
    </Modal>
  );
};

export default ApplicationTrackingPage;