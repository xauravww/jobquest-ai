'use client';

import React, { useState, useEffect } from 'react';
import { Tag, AlertCircle, Repeat } from 'lucide-react';
import { FormInput, FormTextarea, FormSelect, FormDateInput } from '../ui/FormInput';
import { Modal, Button } from 'antd';
import toast from 'react-hot-toast';

import { ToastPosition } from 'react-hot-toast';

// Adjust toast position for better visibility
const toastOptions = {
  position: 'topCenter' as ToastPosition,
  duration: 4000,
  style: {
    zIndex: 9999,
  },
};

interface CreateReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingReminder?: any;
}

const CreateReminderModal: React.FC<CreateReminderModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    editingReminder
}): JSX.Element => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        dueTime: '09:00',
        type: 'follow_up',
        priority: 'medium',
        applicationId: '',
        jobId: '',
        tags: '',
        color: '#3b82f6',
        isRecurring: false,
        recurrencePattern: 'weekly',
        recurrenceInterval: 1,
        recurrenceEndDate: '',
        notifications: [
            { type: 'in_app', timing: 'on_time' }
        ]
    });
    const [loading, setLoading] = useState(false);
    const [applications, setApplications] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchApplicationsAndJobs();
            if (editingReminder) {
                console.log('Editing Reminder jobId:', editingReminder.jobId);
                setFormData({
                    title: editingReminder.title || '',
                    description: editingReminder.description || '',
                    dueDate: editingReminder.dueDate ? new Date(editingReminder.dueDate).toISOString().split('T')[0] : '',
                    dueTime: editingReminder.dueTime || '09:00',
                    type: editingReminder.type || 'follow_up',
                    priority: editingReminder.priority || 'medium',
                    applicationId: editingReminder.applicationId?._id || '',
                    jobId: typeof editingReminder.jobId === 'string' ? editingReminder.jobId : editingReminder.jobId?._id || '',
                    tags: editingReminder.tags?.join(', ') || '',
                    color: editingReminder.color || '#3b82f6',
                    isRecurring: editingReminder.isRecurring || false,
                    recurrencePattern: editingReminder.recurrencePattern || 'weekly',
                    recurrenceInterval: editingReminder.recurrenceInterval || 1,
                    recurrenceEndDate: editingReminder.recurrenceEndDate ? new Date(editingReminder.recurrenceEndDate).toISOString().split('T')[0] : '',
                    notifications: editingReminder.notifications || [{ type: 'in_app', timing: 'on_time' }]
                });
            } else {
                // Reset form for new reminder
                setFormData({
                    title: '',
                    description: '',
                    dueDate: '',
                    dueTime: '09:00',
                    type: 'follow_up',
                    priority: 'medium',
                    applicationId: '',
                    jobId: '',
                    tags: '',
                    color: '#3b82f6',
                    isRecurring: false,
                    recurrencePattern: 'weekly',
                    recurrenceInterval: 1,
                    recurrenceEndDate: '',
                    notifications: [{ type: 'in_app', timing: 'on_time' }]
                });
            }
        }
    }, [isOpen, editingReminder]);
    useEffect(() => {
        if (isOpen) {
            fetchApplicationsAndJobs();
            if (editingReminder) {
                console.log('Editing Reminder jobId:', editingReminder.jobId);
                setFormData({
                    title: editingReminder.title || '',
                    description: editingReminder.description || '',
                    dueDate: editingReminder.dueDate ? new Date(editingReminder.dueDate).toISOString().split('T')[0] : '',
                    dueTime: editingReminder.dueTime || '09:00',
                    type: editingReminder.type || 'follow_up',
                    priority: editingReminder.priority || 'medium',
                    applicationId: editingReminder.applicationId?._id || '',
                    jobId: typeof editingReminder.jobId === 'string' ? editingReminder.jobId : editingReminder.jobId?._id || '',
                    tags: editingReminder.tags?.join(', ') || '',
                    color: editingReminder.color || '#3b82f6',
                    isRecurring: editingReminder.isRecurring || false,
                    recurrencePattern: editingReminder.recurrencePattern || 'weekly',
                    recurrenceInterval: editingReminder.recurrenceInterval || 1,
                    recurrenceEndDate: editingReminder.recurrenceEndDate ? new Date(editingReminder.recurrenceEndDate).toISOString().split('T')[0] : '',
                    notifications: editingReminder.notifications || [{ type: 'in_app', timing: 'on_time' }]
                });
            } else {
                // Reset form for new reminder
                setFormData({
                    title: '',
                    description: '',
                    dueDate: '',
                    dueTime: '09:00',
                    type: 'follow_up',
                    priority: 'medium',
                    applicationId: '',
                    jobId: '',
                    tags: '',
                    color: '#3b82f6',
                    isRecurring: false,
                    recurrencePattern: 'weekly',
                    recurrenceInterval: 1,
                    recurrenceEndDate: '',
                    notifications: [{ type: 'in_app', timing: 'on_time' }]
                });
            }
        }
    }, [isOpen, editingReminder]);

    useEffect(() => {
        console.log('Jobs list:', jobs);
    }, [jobs]);

const fetchApplicationsAndJobs = async () => {
        try {
            // Fetch jobs only from /api/jobs
            const jobsResponse = await fetch('/api/jobs');
            let jobsFromApi: any[] = [];
            if (jobsResponse.ok) {
                const jobsData = await jobsResponse.json();
                jobsFromApi = Array.isArray(jobsData) ? jobsData : [];
            }
            setJobs(jobsFromApi);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleSubmit = async () => {
        console.log('Create button clicked');

        // Validation
        if (!formData.title.trim()) {
            toast.error('Please enter a title for the reminder.');
            return;
        }
        if (!formData.dueDate) {
            toast.error('Please select a due date.');
            return;
        }
        if (!formData.type) {
            toast.error('Please select a reminder type.');
            return;
        }
        const date = new Date(formData.dueDate);
        if (isNaN(date.getTime())) {
            toast.error('Please select a valid due date.');
            return;
        }
        if (formData.jobId && !jobs.find(job => job._id === formData.jobId)) {
            toast.error('Selected job is invalid.');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                dueDate: new Date(formData.dueDate).toISOString(),
                recurrenceEndDate: formData.recurrenceEndDate ? new Date(formData.recurrenceEndDate).toISOString() : null,
                applicationId: formData.applicationId || null,
                jobId: formData.jobId || null
            };

            const url = editingReminder ? `/api/reminders/${editingReminder._id}` : '/api/reminders';
            const method = editingReminder ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                toast.success('Reminder created successfully!', toastOptions);
                onSuccess();
                onClose();
            } else {
                const error = await response.json();
                console.error('Error saving reminder:', error);
                toast.error(error.error || 'Failed to create reminder. Please try again.', toastOptions);
            }
        } catch (error) {
            console.error('Error saving reminder:', error);
            toast.error('Failed to create reminder. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const reminderTypes = [
        { value: 'follow_up', label: 'Follow Up' },
        { value: 'interview_prep', label: 'Interview Preparation' },
        { value: 'application_deadline', label: 'Application Deadline' },
        { value: 'interview_scheduled', label: 'Interview Scheduled' },
        { value: 'offer_response', label: 'Offer Response' },
        { value: 'networking', label: 'Networking' },
        { value: 'skill_development', label: 'Skill Development' },
        { value: 'job_search', label: 'Job Search' },
        { value: 'custom', label: 'Custom' }
    ];
    const priorityOptions = [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' }
    ];
    const recurrenceOptions = [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' }
    ];
    const notificationTypes = [
        { value: 'in_app', label: 'In-App' },
        { value: 'email', label: 'Email' },
        { value: 'push', label: 'Push' }
    ];
    const notificationTimings = [
        { value: 'on_time', label: 'On Time' },
        { value: '15_min_before', label: '15 minutes before' },
        { value: '1_hour_before', label: '1 hour before' },
        { value: '1_day_before', label: '1 day before' },
        { value: '1_week_before', label: '1 week before' }
    ];

    return (
        <Modal
            title={
                <div className="flex items-center gap-2 text-white">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    {editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
                </div>
            }
            open={isOpen}
            onCancel={onClose}
            width={672}
            className="custom-dark-modal"
            maskStyle={{
                backdropFilter: 'blur(3px)',
                backgroundColor: 'rgba(10, 15, 28, 0.7)'
            }}
            footer={[
                <Button key="back" onClick={onClose}>
                    Cancel
                </Button>,
                <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
                    {editingReminder ? 'Update Reminder' : 'Create Reminder'}
                </Button>,
            ]}
        >
            <div className="max-h-[65vh] overflow-y-auto pr-4 -mr-4">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white">Basic Information</h3>
                        <FormInput
                            label="Title"
                            value={formData.title}
                            onChange={(value) => setFormData({ ...formData, title: value })}
                            placeholder="Enter reminder title"
                            required
                        />
                        <FormTextarea
                            label="Description"
                            value={formData.description}
                            onChange={(value) => setFormData({ ...formData, description: value })}
                            placeholder="Enter reminder description (optional)"
                            rows={3}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormDateInput
                                label="Due Date"
                                value={formData.dueDate}
                                onChange={(value) => setFormData({ ...formData, dueDate: value })}
                                required
                            />
                            <FormInput
                                label="Due Time"
                                type="time"
                                value={formData.dueTime}
                                onChange={(value) => setFormData({ ...formData, dueTime: value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormSelect
                                label="Type"
                                value={formData.type}
                                onChange={(value) => setFormData({ ...formData, type: value })}
                                options={reminderTypes}
                                required
                            />
                            <FormSelect
                                label="Priority"
                                value={formData.priority}
                                onChange={(value) => setFormData({ ...formData, priority: value })}
                                options={priorityOptions}
                                required
                            />
                        </div>
                    </div>

                    {/* Associations */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                            <Tag className="w-5 h-5" />
                            Associations
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <FormSelect
                                    label="Related Job"
                                    value={formData.jobId}
                                    onChange={(value) => setFormData({ ...formData, jobId: value })}
                                    options={[
                                        { value: '', label: 'None' },
                                        ...jobs.map((job: any) => ({
                                            value: job._id,
                                            label: `${job.title} at ${job.company}`
                                        }))
                                    ]}
                                    showSearch
                                    filterOption={(input, option) =>
                                        (String(option?.label) ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                />
                                {formData.jobId && (
                                    <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="w-2 h-2 bg-success rounded-full"></div>
                                            <span className="text-success font-medium">Linked to Job</span>
                                        </div>
                                        {(() => {
                                            const selectedJob = jobs.find((job: any) => job._id === formData.jobId);
                                            return selectedJob ? (
                                                <div className="mt-2 text-xs text-text-muted">
                                                    <div>Title: {selectedJob.title}</div>
                                                    <div>Company: {selectedJob.company}</div>
                                                    <div>Location: {selectedJob.location || 'Not specified'}</div>
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                        <FormInput
                            label="Tags"
                            value={formData.tags}
                            onChange={(value) => setFormData({ ...formData, tags: value })}
                            placeholder="Enter tags separated by commas"
                        />
                        <div>
                            <label className="block text-sm font-medium text-text-muted mb-2">
                                Color
                            </label>
                            <input
                                type="color"
                                value={formData.color}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, color: e.target.value })}
                                className="w-16 h-10 rounded border border-border bg-bg-light"
                            />
                        </div>
                    </div>

                    {/* Recurrence */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isRecurring"
                                checked={formData.isRecurring}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, isRecurring: e.target.checked })}
                                className="w-4 h-4 text-primary"
                            />
                            <label htmlFor="isRecurring" className="text-sm font-medium text-white flex items-center gap-2">
                                <Repeat className="w-4 h-4" />
                                Make this a recurring reminder
                            </label>
                        </div>
                        {formData.isRecurring && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                                <FormSelect
                                    label="Pattern"
                                    value={formData.recurrencePattern}
                                    onChange={(value) => setFormData({ ...formData, recurrencePattern: value })}
                                    options={recurrenceOptions}
                                />
                                <FormInput
                                    label="Interval"
                                    type="number"
                                    value={formData.recurrenceInterval.toString()}
                                    onChange={(value) => setFormData({ ...formData, recurrenceInterval: parseInt(value) || 1 })}
                                    min="1"
                                />
                                <FormDateInput
                                    label="End Date"
                                    value={formData.recurrenceEndDate}
                                    onChange={(value) => setFormData({ ...formData, recurrenceEndDate: value })}
                                />
                            </div>
                        )}
                    </div>

                    {/* Notifications */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white">Notifications</h3>
                        {formData.notifications.map((notification, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-bg-light rounded-lg">
                                <FormSelect
                                    label="Type"
                                    value={notification.type}
                                    onChange={(value) => {
                                        const newNotifications = [...formData.notifications];
                                        newNotifications[index] = { ...notification, type: value };
                                        setFormData({ ...formData, notifications: newNotifications });
                                    }}
                                    options={notificationTypes}
                                />
                                <FormSelect
                                    label="Timing"
                                    value={notification.timing}
                                    onChange={(value) => {
                                        const newNotifications = [...formData.notifications];
                                        newNotifications[index] = { ...notification, timing: value };
                                        setFormData({ ...formData, notifications: newNotifications });
                                    }}
                                    options={notificationTimings}
                                />
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => {
                                setFormData({
                                    ...formData,
                                    notifications: [...formData.notifications, { type: 'in_app', timing: 'on_time' }]
                                });
                            }}
                            className="text-white hover:text-primary/80 text-sm font-medium"
                        >
                            + Add Notification
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default CreateReminderModal;