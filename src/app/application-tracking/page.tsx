'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { Modal, Select, Tag, Table, Popconfirm, Input, DatePicker, Button } from 'antd';
import {
  Briefcase, Plus, Search, RefreshCw, Edit, Sparkles
} from 'lucide-react';
import { RiDeleteBin6Line } from 'react-icons/ri';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import CreateJobModal from '@/components/modals/CreateJobModal';
import CoverLetterModal from '@/components/modals/CoverLetterModal';

const { Search: AntSearch } = Input;
const { RangePicker } = DatePicker;


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

const ApplicationTrackingPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingJob, setAddingJob] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | undefined>(undefined);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [createJobModalVisible, setCreateJobModalVisible] = useState(false);
  const [coverLetterModalVisible, setCoverLetterModalVisible] = useState(false);
  const [selectedJobForCoverLetter, setSelectedJobForCoverLetter] = useState<Job | undefined>(undefined);

  // New state for user profile
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    experience: [],
    firstName: '',
    lastName: '',
    email: '',
    location: '',
    bio: '',
    skills: [],
    experienceYears: '',
    targetRole: '',
    education: [],
    workExperience: []
  });

  // Pagination and filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        const data = await response.json();
        setUserProfile({
          ...data,
          name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          experience: data.workExperience || [],
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error('Failed to load user profile');
      }
    };
    fetchUserProfile();
  }, []);

  // ... rest of the component code unchanged ...

  // Function to fetch jobs with filters and pagination
  const fetchJobs = useCallback(async (page: number, limit: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (searchText) params.append('search', searchText);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (platformFilter) params.append('platform', platformFilter);
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.append('dateFrom', dateRange[0].toISOString());
        params.append('dateTo', dateRange[1].toISOString());
      }

      const response = await fetch(`/api/applications?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      const data = await response.json();

      // Transform API response to match the Job interface
      const transformedJobs: Job[] = data.applications.map((app: ApiApplication) => {
        const jobData = typeof app.jobId === 'object' ? app.jobId : {};
        return {
          _id: app._id,
          jobId: typeof app.jobId === 'object' ? app.jobId?._id || app._id : app.jobId || app._id,
          title: (jobData as PopulatedJob)?.title || app.jobTitle || app.title || 'Unknown Title',
          company: (jobData as PopulatedJob)?.company || app.company || 'Unknown Company',
          location: (jobData as PopulatedJob)?.location || app.location || 'Unknown Location',
          status: app.status || 'submitted',
          datePosted: app.appliedDate || (jobData as PopulatedJob)?.datePosted || app.createdAt || app.datePosted || new Date().toISOString(),
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
      setJobs([]);
      setFilteredJobs([]);
    } finally {
      setLoading(false);
    }
  }, [searchText, statusFilter, priorityFilter, platformFilter, dateRange]);

  useEffect(() => {
    fetchJobs(currentPage, pageSize);

    // Mock API call to get reminders (keeping as is since task only mentioned jobs)
    // const mockReminders: Reminder[] = [
    //   { _id: 'r1', title: 'Follow-up with recruiter at Data Solutions Co.', dueDate: dayjs().add(1, 'day').toISOString(), type: 'follow-up', priority: 'high' },
    //   { _id: 'r2', title: 'Prepare for interview with Tech Innovators', dueDate: dayjs().add(3, 'day').toISOString(), type: 'interview', priority: 'high' },
    // ];

    // setReminders(mockReminders);
  }, [fetchJobs, currentPage, pageSize]);

  // Filter jobs based on search and filter criteria
  useEffect(() => {
    // Remove client-side filtering since backend handles it now
    setFilteredJobs(jobs);
  }, [jobs]);





  // Removed unused handleStatusUpdate to fix eslint warning

  const handleDelete = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/applications/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete application');
      }

      // Update local state
      const updatedJobs = jobs.filter(job => job._id !== jobId);
      setJobs(updatedJobs);
      setFilteredJobs(updatedJobs);
      toast.success('Application deleted successfully');
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');
    }
  }, [jobs]);




  const clearFilters = () => {
    setSearchText('');
    setStatusFilter('');
    setPriorityFilter('');
    setPlatformFilter('');
    setDateRange(null);
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

  // Remove unused jobColumns variable to fix eslint warning

  return (
    <AppLayout showFooter={false}>
      <div className="p-8 bg-bg min-h-screen">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="flex justify-between items-center mt-5">
            <div>
              <div className="text-4xl font-bold text-white mb-2">Application Tracking</div>
              <p className="text-text-muted text-lg">Track and manage your job applications</p>
            </div>
            <button
              onClick={() => {
                setSelectedJob(undefined);
                setCreateJobModalVisible(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-success hover:from-success hover:to-primary text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Add Job
            </button>
          </div>


          {/* Jobs List - Main Content */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" />
              Job Applications
            </h2>

            {/* Filters and Search */}
            <div className="mb-6 p-6 filter-panel rounded-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-r from-primary to-primary/80 rounded-lg">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">Search & Filters</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white mb-3">Search</label>
                <AntSearch
                  placeholder="Search jobs, companies, locations..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full"
                  allowClear
                  size="large"
                  enterButton={<Search className="w-5 h-5 text-white" />}
                />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white mb-3">Status</label>
                  <Select
                    placeholder="All Statuses"
                    value={statusFilter || undefined}
                    onChange={setStatusFilter}
                    className="w-full"
                    allowClear
                    size="large"
                  >
                    <Select.Option value="saved">Saved</Select.Option>
                    <Select.Option value="applied">Applied</Select.Option>
                    <Select.Option value="interviewing">Interviewing</Select.Option>
                    <Select.Option value="offered">Offered</Select.Option>
                    <Select.Option value="rejected">Rejected</Select.Option>
                    <Select.Option value="submitted">Submitted</Select.Option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white mb-3">Priority</label>
                  <Select
                    placeholder="All Priorities"
                    value={priorityFilter || undefined}
                    onChange={setPriorityFilter}
                    className="w-full"
                    allowClear
                    size="large"
                  >
                    <Select.Option value="high">High</Select.Option>
                    <Select.Option value="medium">Medium</Select.Option>
                    <Select.Option value="low">Low</Select.Option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-white mb-3">Platform</label>
                  <Select
                    placeholder="All Platforms"
                    value={platformFilter || undefined}
                    onChange={setPlatformFilter}
                    className="w-full"
                    allowClear
                    size="large"
                  >
                    <Select.Option value="linkedin">LinkedIn</Select.Option>
                    <Select.Option value="indeed">Indeed</Select.Option>
                    <Select.Option value="glassdoor">Glassdoor</Select.Option>
                    <Select.Option value="company-website">Company Website</Select.Option>
                    <Select.Option value="referral">Referral</Select.Option>
                    <Select.Option value="other">Other</Select.Option>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="flex-1 space-y-2">
                  <label className="block text-sm font-semibold text-white mb-3">Date Range</label>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                className="w-full max-w-sm"
                format="MMM DD, YYYY"
                size="large"
                popupClassName="custom-dark-datepicker"
                suffixIcon={<Search className="w-5 h-5 text-white" />}
              />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={clearFilters}
                    icon={<RefreshCw className="w-4 h-4" />}
                    className="flex items-center gap-2 h-10 px-6 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 border-0 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105"
                    size="large"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-white font-medium">
                    Showing {filteredJobs.length} of {jobs.length} applications
                  </span>
                  {(searchText || statusFilter || priorityFilter || platformFilter || dateRange) && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-primary font-medium">Filters applied</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          <div className="overflow-x-auto">
            <Table
              loading={loading || addingJob}
              dataSource={filteredJobs}
              rowKey="_id"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalCount,
              position: ['bottomCenter'],
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} applications`,
              pageSizeOptions: ['5', '10', '20', '50'],
              size: 'default',
              onChange: (page, pageSize) => {
                setCurrentPage(page);
                setPageSize(pageSize);
              }
            }}
              scroll={{ x: 'max-content' }}
              className="custom-dark-table"
              columns={[
                {
                  title: 'Job Title',
                  dataIndex: 'title',
                  key: 'title',
                  sorter: (a: Job, b: Job) => a.title.localeCompare(b.title),
                  render: (text: string, record: Job) => (
                    <span className="font-semibold text-text-light cursor-pointer hover:underline" onClick={() => { setSelectedJob(record); setCreateJobModalVisible(true); }}>
                      {text}
                    </span>
                  ),
                  responsive: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
                  width: 150,
                },
                {
                  title: 'Company',
                  dataIndex: 'company',
                  key: 'company',
                  sorter: (a: Job, b: Job) => a.company.localeCompare(b.company),
                  responsive: ['sm', 'md', 'lg', 'xl', 'xxl'],
                  width: 120,
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
                  responsive: ['sm', 'md', 'lg', 'xl', 'xxl'],
                  width: 100,
                },
                {
                  title: 'Location',
                  dataIndex: 'location',
                  key: 'location',
                  sorter: (a: Job, b: Job) => a.location.localeCompare(b.location),
                  responsive: ['md', 'lg', 'xl', 'xxl'],
                  width: 120,
                },
                {
                  title: 'Platform',
                  dataIndex: 'platform',
                  key: 'platform',
                  render: (platform: string) => (
                    <Tag color="blue" className="uppercase text-xs tracking-wider">
                      {platform}
                    </Tag>
                  ),
                  responsive: ['lg', 'xl', 'xxl'],
                  width: 100,
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
                  responsive: ['lg', 'xl', 'xxl'],
                  width: 100,
                },
                {
                  title: 'Date Posted',
                  dataIndex: 'datePosted',
                  key: 'datePosted',
                  render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
                  sorter: (a: Job, b: Job) => dayjs(a.datePosted).unix() - dayjs(b.datePosted).unix(),
                  responsive: ['xl', 'xxl'],
                  width: 120,
                },
                {
                  title: 'URL',
                  dataIndex: 'url',
                  key: 'url',
                  render: (url: string) => url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      Link
                    </a>
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  ),
                  responsive: ['lg', 'xl', 'xxl'],
                  width: 150,
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_: unknown, record: Job) => (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedJobForCoverLetter(record);
                          setCoverLetterModalVisible(true);
                        }}
                        className="flex items-center justify-center w-9 h-9 bg-purple-500/20 hover:bg-purple-500/30 text-purple-500 hover:text-purple-400 rounded-lg transition-all duration-200 hover:scale-105"
                        title="Generate Cover Letter"
                        aria-label="Generate cover letter"
                      >
                        <Sparkles className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedJob(record);
                          setCreateJobModalVisible(true);
                        }}
                        className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 rounded-lg transition-all duration-200 hover:scale-105"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                        <span className="sr-only">Edit</span>
                      </button>
                      <Popconfirm
                        title="Are you sure you want to delete this application?"
                        onConfirm={() => {
                          handleDelete(record._id);
                        }}
                        okText="Yes"
                        cancelText="No"
                      >
                        <button
                          className="flex items-center gap-2 px-4 py-3 bg-danger text-white border border-danger rounded-lg transition-all duration-200 hover:scale-105"
                          title="Delete"
                        >
                          <RiDeleteBin6Line className="w-5 h-5" />
                          <span className="sr-only">Delete</span>
                        </button>
                      </Popconfirm>
                    </div>
                  ),
                  responsive: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
                  width: 150,
                },
              ]}
            />
          </div>
          </div>



          {/* Reminder & Event Modals */}
          {/* Reminder Modal */}
          <Modal
            open={false} // Control visibility as needed
            onCancel={() => {}}
            footer={null}
            width={600}
            className="custom-dark-modal"
          >
            {/* Import and render reminders page or component here */}
            {/* For example, you can import RemindersPage and render it */}
            {/* <RemindersPage /> */}
          </Modal>

          {/* Event Modal */}
          <Modal
            open={eventModalVisible}
            onCancel={() => setEventModalVisible(false)}
            footer={null}
            width={800}
            className="custom-dark-modal"
            bodyStyle={{ backgroundColor: '#000000' }}
          >
            {/* Import and render events page or component here */}
            {/* For example, you can import EventsPage and render it */}
            {/* <EventsPage /> */}
          </Modal>

          {/* Create Job Modal */}
          <CreateJobModal
            visible={createJobModalVisible}
            onClose={() => setCreateJobModalVisible(false)}
              onJobCreated={(newJob) => {
                if (!newJob) return;
                setAddingJob(true);
                // Transform newJob to match Job interface
                const jobData = typeof newJob.jobId === 'object' ? newJob.jobId : {};
                const transformedJob: Job = {
                  _id: newJob._id || '',
                  jobId: newJob._id || '',
                  title: (jobData as PopulatedJob)?.title || newJob.title || 'Unknown Title',
                  company: (jobData as PopulatedJob)?.company || newJob.company || 'Unknown Company',
                  location: (jobData as PopulatedJob)?.location || newJob.location || 'Unknown Location',
                  status: newJob.status || 'submitted',
                  datePosted: newJob.appliedDate || (jobData as PopulatedJob)?.datePosted || newJob.createdAt || newJob.datePosted || new Date().toISOString(),
                  description: (jobData as PopulatedJob)?.description || newJob.description || '',
                  priority: newJob.priority || 'medium',
                  platform: newJob.platform || 'other',
                  url: newJob.jobUrl || (jobData as PopulatedJob)?.url || '',
                  notes: newJob.notes || '',
                  createdAt: newJob.createdAt || new Date().toISOString(),
                  appliedDate: newJob.appliedDate || new Date().toISOString()
                };

                if (selectedJob) {
                  // Update existing job
                  setJobs(prev => prev.map(job => job._id === transformedJob._id ? transformedJob : job));
                  setFilteredJobs(prev => prev.map(job => job._id === transformedJob._id ? transformedJob : job));
                  toast.success('Job application updated successfully');
                } else {
                  // Add new job
                  setJobs(prev => [transformedJob, ...prev]);
                  setFilteredJobs(prev => [transformedJob, ...prev]);
                  toast.success('Job application added successfully');
                }
                setAddingJob(false);
              }}
            job={selectedJob}
          />

          {/* Cover Letter Modal */}
          <CoverLetterModal
            visible={coverLetterModalVisible}
            onClose={() => setCoverLetterModalVisible(false)}
            job={selectedJobForCoverLetter}
            userProfile={userProfile}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default ApplicationTrackingPage;
