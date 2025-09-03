'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, Modal, Select, message, Tag, Table, Popconfirm } from 'antd';
import {
  Briefcase, Plus, Bell, Eye, Trash2, Calendar, Clock
} from 'lucide-react';
import dayjs from 'dayjs';
import CreateReminderModal from '@/components/modals/CreateReminderModal';
import CreateEventModal from '@/components/modals/CreateEventModal';

// I've defined these mock interfaces for a clear example,
// you would use your actual interfaces.
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
  notes?: string;
}

interface Reminder {
  _id: string;
  title: string;
  dueDate: string;
  type: string;
  priority: string;
}

const ApplicationTrackingPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);

  // Fetch jobs from API
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/applications');
        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }
        const applications = await response.json();

        // Transform API response to match the Job interface
        const transformedJobs: Job[] = applications.map((app: any) => ({
          _id: app._id,
          jobId: app.jobId || app._id,
          title: app.jobTitle || app.title || 'Unknown Title',
          company: app.company || 'Unknown Company',
          location: app.location || 'Unknown Location',
          status: app.status || 'submitted',
          datePosted: app.createdAt || app.datePosted || new Date().toISOString(),
          description: app.description || '',
          priority: app.priority || 'medium',
          platform: app.platform || 'other',
          notes: app.notes || ''
        }));

        setJobs(transformedJobs);
      } catch (error) {
        console.error('Error fetching applications:', error);
        message.error('Failed to load applications');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();

    // Mock API call to get reminders (keeping as is since task only mentioned jobs)
    const mockReminders: Reminder[] = [
      { _id: 'r1', title: 'Follow-up with recruiter at Data Solutions Co.', dueDate: dayjs().add(1, 'day').toISOString(), type: 'follow-up', priority: 'high' },
      { _id: 'r2', title: 'Prepare for interview with Tech Innovators', dueDate: dayjs().add(3, 'day').toISOString(), type: 'interview', priority: 'high' },
    ];

    setReminders(mockReminders);
  }, []);

  const handleStatusUpdate = async (jobId: string, newStatus: string) => {
    // Implement your API call here
    console.log(`Updating job ${jobId} to status ${newStatus}`);
    // On success:
    // message.success('Status updated successfully');
  };

  const handleDelete = async (jobId: string) => {
    // Implement your API call here
    console.log(`Deleting job ${jobId}`);
    // On success:
    // message.success('Job deleted successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'orange';
      case 'interviewing': return 'purple';
      case 'offered': return 'green';
      case 'rejected': return 'red';
      case 'submitted': return 'cyan';
      default: return 'blue';
    }
  };

  const getPriorityTagColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'default';
    }
  };

  const jobColumns = useMemo(() => [
    {
      title: 'Job Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a: Job, b: Job) => a.title.localeCompare(b.title),
      render: (text: string, record: Job) => (
        <span className="font-semibold text-text-light cursor-pointer hover:underline" onClick={() => { setSelectedJob(record); setDetailModalVisible(true); }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Company',
      dataIndex: 'company',
      key: 'company',
      sorter: (a: Job, b: Job) => a.company.localeCompare(b.company),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="uppercase text-xs tracking-wider">
          {status}
        </Tag>
      ),
    filters: [...new Set(jobs.map(j => j.status))].map(status => ({ text: status, value: status })),
    onFilter: (value: boolean | React.Key, record: Job) => record.status === value,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityTagColor(priority)} className="uppercase text-xs tracking-wider">
          {priority}
        </Tag>
      ),
    filters: [...new Set(jobs.map(j => j.priority))].map(p => ({ text: p, value: p })),
    onFilter: (value: boolean | React.Key, record: Job) => record.priority === value,
    },
    {
      title: 'Date Posted',
      dataIndex: 'datePosted',
      key: 'datePosted',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a: Job, b: Job) => dayjs(a.datePosted).unix() - dayjs(b.datePosted).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Job) => (
        <div className="flex items-center gap-2">
          <Select
            value={record.status}
            onChange={(value) => handleStatusUpdate(record._id, value)}
            className="w-32"
            size="small"
          >
            <Select.Option value="saved">Saved</Select.Option>
            <Select.Option value="applied">Applied</Select.Option>
            <Select.Option value="interviewing">Interviewing</Select.Option>
            <Select.Option value="offered">Offered</Select.Option>
            <Select.Option value="rejected">Rejected</Select.Option>
          </Select>
          <Popconfirm
            title="Are you sure?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
            className="text-white"
          >
            <button
              className="flex items-center justify-center w-8 h-8 bg-danger/20 hover:bg-danger/30 text-danger rounded-lg transition-all duration-200"
              title="Delete Job"
              aria-label="Delete job application"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ], [jobs]);

  return (
    <AppLayout showFooter={false}>
      <div className="p-8 bg-bg min-h-screen">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Application Tracking</h1>
              <p className="text-text-muted text-lg">Track and manage your job applications</p>
            </div>
            <button
              onClick={() => { /* Open create job modal */ }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-success hover:from-success hover:to-primary text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Add Job
            </button>
          </div>

          {/* Upcoming Reminders Section */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" />
              Upcoming Reminders
            </h2>
            <div className="space-y-4">
              {reminders.length > 0 ? (
                reminders.map((reminder) => (
                  <Card key={reminder._id} className="bg-bg-card border-l-4 border-primary/50 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-white mb-1">{reminder.title}</h3>
                        <div className="flex items-center gap-2 text-text-muted text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {dayjs(reminder.dueDate).format('MMM DD, YYYY')}</span>
                          <span className="bg-bg-light px-2 py-0.5 rounded-full text-xs capitalize">{reminder.type}</span>
                        </div>
                      </div>
                      <Tag color={getPriorityTagColor(reminder.priority)} className="uppercase text-xs tracking-wider">
                        {reminder.priority} Priority
                      </Tag>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 bg-bg-card rounded-lg border border-border">
                  <div className="w-16 h-16 bg-bg-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-text-muted" />
                  </div>
                  <p className="text-text-muted">No upcoming reminders.</p>
                </div>
              )}
            </div>
          </div>

          {/* Jobs List - Main Content */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" />
              Job Applications
            </h2>
            <Table
              loading={loading}
              dataSource={jobs}
              rowKey="_id"
              pagination={{ pageSize: 10, position: ['bottomCenter'] }}
              scroll={{ x: 'max-content' }}
              className="custom-dark-table" // Custom class for styling
              columns={jobColumns}
            />
          </div>

          {/* Detail Modal */}
          {selectedJob && (
            <Modal
              title={<span className="text-white">{selectedJob.title} at {selectedJob.company}</span>}
              open={detailModalVisible}
              onCancel={() => setDetailModalVisible(false)}
              footer={null}
              width={800}
              className="custom-dark-modal" // Custom class for styling
            >
              <div className="space-y-6 text-text">
                {/* ... (Existing modal content) */}
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setDetailModalVisible(false)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </Modal>
          )}

          {/* Reminder & Event Modals */}
          <CreateReminderModal
            isOpen={reminderModalVisible}
            onClose={() => setReminderModalVisible(false)}
            onSuccess={() => { /* ... */ }}
            editingReminder={null}
          />
          <CreateEventModal
            isOpen={eventModalVisible}
            onClose={() => setEventModalVisible(false)}
            onSuccess={() => { /* ... */ }}
            editingEvent={null}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default ApplicationTrackingPage;