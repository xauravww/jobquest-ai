'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  Briefcase, Plus, Search, RefreshCw, Edit, Sparkles, Bell,
  MapPin, Globe, Calendar, Trash2, ExternalLink, Filter, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Clock, AlertCircle
} from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import CreateJobModal from '@/components/modals/CreateJobModal';
import CoverLetterModal from '@/components/modals/CoverLetterModal';
import { notificationService } from '@/services/NotificationService';
import { telegramService } from '@/services/TelegramService';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/ui/Modal';

// --- Types ---
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
  resumeUsed?: string | { _id: string };
}

interface PopulatedJob {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  datePosted: string;
  url?: string;
}

interface ApiApplication {
  _id: string;
  jobId?: string | PopulatedJob;
  jobTitle?: string;
  title?: string;
  company?: string;
  location?: string;
  status?: string;
  createdAt?: string;
  appliedDate?: string;
  datePosted?: string;
  description?: string;
  priority?: string;
  platform?: string;
  notes?: string;
  resumeUsed?: string;
}

interface UserProfile {
  name: string;
  experience: any[];
  firstName?: string;
  lastName?: string;
  email?: string;
  location?: string;
  bio?: string;
  skills?: string[] | string;
  experienceYears?: number | string;
  targetRole?: string;
  education?: any[];
  workExperience?: any[];
}

const ApplicationTrackingPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | undefined>(undefined);

  // Modals
  const [createJobModalVisible, setCreateJobModalVisible] = useState(false);
  const [coverLetterModalVisible, setCoverLetterModalVisible] = useState(false);
  const [selectedJobForCoverLetter, setSelectedJobForCoverLetter] = useState<Job | undefined>(undefined);

  // Reminder Modal State
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [selectedJobForReminder, setSelectedJobForReminder] = useState<Job | undefined>(undefined);
  const [reminderForm, setReminderForm] = useState({
    title: '',
    description: '',
    dueDate: dayjs().add(1, 'week').format('YYYY-MM-DD'),
    dueTime: '09:00',
    priority: 'medium',
    type: 'follow_up'
  });

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '', experience: [], firstName: '', lastName: '', email: '', location: '', bio: '', skills: [], experienceYears: '', targetRole: '', education: [], workExperience: []
  });

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');

  // Fetch User Profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          setUserProfile({
            ...data,
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            experience: data.workExperience || [],
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    fetchUserProfile();
  }, []);

  // Fetch Jobs
  const fetchJobs = useCallback(async (page: number, limit: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (searchText) params.append('search', searchText);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (platformFilter !== 'all') params.append('platform', platformFilter);

      const response = await fetch(`/api/applications?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch applications');

      const data = await response.json();

      const transformedJobs: Job[] = data.applications.map((app: ApiApplication) => {
        const jobData = typeof app.jobId === 'object' ? app.jobId : {};
        return {
          _id: app._id,
          jobId: typeof app.jobId === 'object' ? app.jobId?._id || app._id : app.jobId || app._id,
          title: (jobData as PopulatedJob)?.title || app.jobTitle || app.title || 'Unknown Title',
          company: (jobData as PopulatedJob)?.company || app.company || 'Unknown Company',
          location: (jobData as PopulatedJob)?.location || app.location || 'Unknown Location',
          status: app.status || 'saved',
          datePosted: (jobData as PopulatedJob)?.datePosted || app.datePosted || app.createdAt || new Date().toISOString(),
          description: (jobData as PopulatedJob)?.description || app.description || '',
          priority: app.priority || 'medium',
          platform: app.platform || 'other',
          url: (jobData as PopulatedJob)?.url || '',
          notes: app.notes || '',
          createdAt: app.createdAt || new Date().toISOString(),
          appliedDate: app.appliedDate || new Date().toISOString(),
          resumeUsed: app.resumeUsed || undefined
        };
      });

      setJobs(transformedJobs);
      setFilteredJobs(transformedJobs);
      setCurrentPage(page);
      setPageSize(limit);
      setTotalCount(data.totalCount || 0);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [searchText, statusFilter, priorityFilter, platformFilter]);

  useEffect(() => {
    fetchJobs(currentPage, pageSize);
  }, [fetchJobs, currentPage, pageSize]);

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    try {
      const response = await fetch(`/api/applications/${jobId}`, { method: 'DELETE' });
      if (response.ok) {
        setJobs(prev => prev.filter(job => job._id !== jobId));
        setFilteredJobs(prev => prev.filter(job => job._id !== jobId));
        toast.success('Application deleted');
      } else {
        toast.error('Failed to delete application');
      }
    } catch (error) {
      toast.error('Failed to delete application');
    }
  };

  const handleCreateReminder = async () => {
    try {
      if (!reminderForm.title.trim()) {
        toast.error('Please enter a reminder title');
        return;
      }

      const payload = {
        title: reminderForm.title,
        description: reminderForm.description,
        dueDate: new Date(reminderForm.dueDate).toISOString(),
        dueTime: reminderForm.dueTime,
        type: reminderForm.type,
        priority: reminderForm.priority,
        status: 'pending',
        tags: [],
        applicationId: selectedJobForReminder?._id || null
      };

      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success('Reminder created successfully!');
        setReminderModalVisible(false);

        // Notifications
        await notificationService.createNotification({
          title: 'Reminder Setup',
          message: `Reminder set for ${selectedJobForReminder?.title}`,
          type: 'info'
        });

        if (telegramService.isConnectedToTelegram()) {
          await telegramService.sendNotification('Reminder', `Reminder set for ${selectedJobForReminder?.title}`, 'reminder');
        }
      } else {
        toast.error('Failed to create reminder');
      }
    } catch (error) {
      toast.error('Failed to create reminder');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-[var(--primary)]/20 text-[var(--primary)] border-[var(--primary)]/30';
      case 'interviewing': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'offered': return 'bg-[var(--success)]/20 text-[var(--success)] border-[var(--success)]/30';
      case 'rejected': return 'bg-[var(--danger)]/20 text-[var(--danger)] border-[var(--danger)]/30';
      case 'submitted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'expired': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-glass)]';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-[var(--danger)]';
      case 'medium': return 'text-[var(--warning)]';
      case 'low': return 'text-[var(--success)]';
      default: return 'text-[var(--text-muted)]';
    }
  };

  return (
    <AppLayout showFooter={false}>
      <div className="p-6 lg:p-8 min-h-screen space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-[var(--primary)]/20 rounded-xl border border-[var(--primary)]/30">
                <Briefcase className="w-8 h-8 text-[var(--primary)]" />
              </div>
              Application Tracking
            </h1>
            <p className="text-[var(--text-muted)] mt-2 ml-16">Track and manage your job applications effectively</p>
          </div>

          <button
            onClick={() => {
              setSelectedJob(undefined);
              setCreateJobModalVisible(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-xl shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Application</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-[var(--bg-surface)]/30 backdrop-blur-xl rounded-2xl p-6 border border-[var(--border-glass)]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters & Search</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search jobs, companies..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white placeholder-[var(--text-dim)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none appearance-none"
              >
                <option value="all">All Statuses</option>
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="interviewing">Interviewing</option>
                <option value="offered">Offered</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none appearance-none"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <button
                onClick={() => { setSearchText(''); setStatusFilter('all'); setPriorityFilter('all'); setPlatformFilter('all'); }}
                className="px-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-white hover:border-[var(--primary)] rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Job List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_var(--primary-glow)]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <motion.div
                    key={job._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[var(--bg-surface)]/50 border border-[var(--border-glass)] hover:border-[var(--primary)]/30 rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-[var(--primary)]/5 group"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--secondary)]/20 flex items-center justify-center border border-[var(--primary)]/30 text-[var(--primary)] font-bold text-xl">
                          {job.company.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white group-hover:text-[var(--primary)] transition-colors cursor-pointer" onClick={() => { setSelectedJob(job); setCreateJobModalVisible(true); }}>
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              {job.company}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Posted: {dayjs(job.datePosted).format('MMM D')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                        <span className={`text-xs font-bold uppercase tracking-wider ${getPriorityColor(job.priority)}`}>
                          {job.priority} Priority
                        </span>
                      </div>

                      <div className="flex items-center gap-2 lg:ml-auto">
                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                            title="View Job Post"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setSelectedJobForCoverLetter(job);
                            setCoverLetterModalVisible(true);
                          }}
                          className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                          title="Generate Cover Letter"
                        >
                          <Sparkles className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedJobForReminder(job);
                            setReminderForm({
                              title: `Follow up: ${job.title} at ${job.company}`,
                              description: '',
                              dueDate: dayjs().add(1, 'week').format('YYYY-MM-DD'),
                              dueTime: '09:00',
                              priority: 'medium',
                              type: 'follow_up'
                            });
                            setReminderModalVisible(true);
                          }}
                          className="p-2 text-[var(--warning)] hover:text-[var(--warning)]/80 hover:bg-[var(--warning)]/10 rounded-lg transition-colors"
                          title="Set Reminder"
                        >
                          <Bell className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => { setSelectedJob(job); setCreateJobModalVisible(true); }}
                          className="p-2 text-[var(--primary)] hover:text-[var(--primary)]/80 hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(job._id)}
                          className="p-2 text-[var(--danger)] hover:text-[var(--danger)]/80 hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-16 border border-dashed border-[var(--border-glass)] rounded-2xl bg-[var(--bg-surface)]/20">
                  <div className="w-20 h-20 bg-[var(--bg-surface)] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Briefcase className="w-10 h-10 text-[var(--text-muted)]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No applications found</h3>
                  <p className="text-[var(--text-muted)] mb-6">
                    {searchText || statusFilter !== 'all'
                      ? 'Try adjusting your filters to see more results.'
                      : 'Start tracking your job search by adding your first application.'}
                  </p>
                  <button
                    onClick={() => { setSelectedJob(undefined); setCreateJobModalVisible(true); }}
                    className="px-6 py-3 bg-[var(--primary)] text-black font-bold rounded-xl hover:bg-[var(--primary)]/90 transition-all"
                  >
                    Add Application
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {totalCount > pageSize && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-[var(--bg-surface)] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-[var(--text-muted)]">
              Page {currentPage} of {Math.ceil(totalCount / pageSize)}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / pageSize), p + 1))}
              disabled={currentPage === Math.ceil(totalCount / pageSize)}
              className="p-2 rounded-lg hover:bg-[var(--bg-surface)] disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateJobModal
        visible={createJobModalVisible}
        onClose={() => setCreateJobModalVisible(false)}
        onJobCreated={() => { fetchJobs(currentPage, pageSize); setCreateJobModalVisible(false); }}
        job={selectedJob}
      />

      <CoverLetterModal
        visible={coverLetterModalVisible}
        onClose={() => setCoverLetterModalVisible(false)}
        job={selectedJobForCoverLetter}
        userProfile={userProfile}
      />

      <Modal
        isOpen={reminderModalVisible}
        onClose={() => setReminderModalVisible(false)}
        title="Set Follow-up Reminder"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Title</label>
            <input
              type="text"
              value={reminderForm.title}
              onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Date</label>
              <input
                type="date"
                value={reminderForm.dueDate}
                onChange={(e) => setReminderForm({ ...reminderForm, dueDate: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Time</label>
              <input
                type="time"
                value={reminderForm.dueTime}
                onChange={(e) => setReminderForm({ ...reminderForm, dueTime: e.target.value })}
                className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Priority</label>
            <select
              value={reminderForm.priority}
              onChange={(e) => setReminderForm({ ...reminderForm, priority: e.target.value })}
              className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setReminderModalVisible(false)}
              className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateReminder}
              className="px-4 py-2 rounded-xl bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary)]/90 transition-colors"
            >
              Set Reminder
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
};

export default ApplicationTrackingPage;
