'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Tag, AlertCircle, Repeat } from 'lucide-react';
import { FormInput, FormTextarea, FormSelect, FormDateInput } from '@/components/ui/FormInput';

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
}) => {
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
                setFormData({
                    title: editingReminder.title || '',
                    description: editingReminder.description || '',
                    dueDate: editingReminder.dueDate ? new Date(editingReminder.dueDate).toISOString().split('T')[0] : '',
                    dueTime: editingReminder.dueTime || '09:00',
                    type: editingReminder.type || 'follow_up',
                    priority: editingReminder.priority || 'medium',
                    applicationId: editingReminder.applicationId?._id || '',
                    jobId: editingReminder.jobId?._id || '',
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

    const fetchApplicationsAndJobs = async () => {
        try {
            // Fetch applications
            const appsResponse = await fetch('/api/applications');
            if (appsResponse.ok) {
                const appsData = await appsResponse.json();
                setApplications(appsData.applications || []);
            }

            // Fetch jobs
            const jobsResponse = await fetch('/api/jobs/search');
            if (jobsResponse.ok) {
                const jobsData = await jobsResponse.json();
                setJobs(jobsData.jobs || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
                onSuccess();
                onClose();
            } else {
                const error = await response.json();
                console.error('Error saving reminder:', error);
            }
        } catch (error) {
            console.error('Error saving reminder:', error);
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-bg-card rounded-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-primary" />
                        {editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-text-muted hover:text-text hover:bg-bg-light rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, dueTime: e.target.value })}
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <FormSelect
                                    label="Related Application"
                                    value={formData.applicationId}
                                    onChange={(value) => setFormData({ ...formData, applicationId: value })}
                                options={[
                                    { value: '', label: 'None' },
                                    ...applications.map((app: any) => ({
                                        value: app._id,
                                        label: `${app.jobId?.title || 'Unknown Job'} - ${app.status}`
                                    }))
                                ]}
                            />
                            {formData.applicationId && (
                                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                                        <span className="text-primary font-medium">Linked to Application</span>
                                    </div>
                                    {(() => {
                                        const selectedApp = applications.find((app: any) => app._id === formData.applicationId);
                                        return selectedApp ? (
                                            <div className="mt-2 text-xs text-text-muted">
                                                <div>Job: {selectedApp.jobId?.title || 'Unknown'}</div>
                                                <div>Company: {selectedApp.jobId?.company || 'Unknown'}</div>
                                                <div>Status: {selectedApp.status}</div>
                                            </div>
                                        ) : null;
                                    })()}
                                </div>
                            )}
                        </div>

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

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-dark border border-border hover:border-border-light rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                            {editingReminder ? 'Update Reminder' : 'Create Reminder'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateReminderModal;