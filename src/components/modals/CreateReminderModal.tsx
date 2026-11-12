'use client';

import React, { useState, useEffect } from 'react';
import { Select, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { Tag, AlertCircle, Repeat, Clock, FileText, Plus, Trash2, Bell } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface Reminder {
    _id: string;
    title: string;
    description?: string;
    dueDate: string;
    dueTime: string;
    type: string;
    priority: string;
    applicationId?: { _id: string };
    tags?: string[];
    color?: string;
    isRecurring?: boolean;
    recurrencePattern?: string;
    recurrenceInterval?: number;
    recurrenceEndDate?: string;
    notifications?: { type: string; timing: string }[];
}

interface Application {
    _id: string;
    jobTitle?: string;
    jobId?: {
        title?: string;
        company?: string;
        location?: string;
    };
}

interface FormData {
    title: string;
    description: string;
    dueDate: string;
    dueTime: string;
    type: string;
    priority: string;
    applicationId: string;
    tags: string;
    color: string;
    isRecurring: boolean;
    recurrencePattern: string;
    recurrenceInterval: number;
    recurrenceEndDate: string;
    notifications: { type: string; timing: string }[];
}

interface CreateReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingReminder?: Reminder;
    defaultDate?: string;
    defaultApplication?: Application | undefined;
}

const CreateReminderModal: React.FC<CreateReminderModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    editingReminder,
    defaultDate,
    defaultApplication
}) => {

    const [formData, setFormData] = useState<FormData>({
        title: '',
        description: '',
        dueDate: '',
        dueTime: '09:00',
        type: 'follow_up',
        priority: 'medium',
        applicationId: '',
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
    const [applications, setApplications] = useState<Application[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchApplications();
            if (editingReminder) {
                setFormData({
                    title: editingReminder.title || '',
                    description: editingReminder.description || '',
                    dueDate: editingReminder.dueDate ? new Date(editingReminder.dueDate).toISOString().split('T')[0] : '',
                    dueTime: editingReminder.dueTime || '09:00',
                    type: editingReminder.type || 'follow_up',
                    priority: editingReminder.priority || 'medium',
                    applicationId: editingReminder.applicationId?._id || '',
                    tags: editingReminder.tags?.join(', ') || '',
                    color: editingReminder.color || '#3b82f6',
                    isRecurring: editingReminder.isRecurring || false,
                    recurrencePattern: editingReminder.recurrencePattern || 'weekly',
                    recurrenceInterval: editingReminder.recurrenceInterval || 1,
                    recurrenceEndDate: editingReminder.recurrenceEndDate ? new Date(editingReminder.recurrenceEndDate).toISOString().split('T')[0] : '',
                    notifications: editingReminder.notifications || [{ type: 'in_app', timing: 'on_time' }]
                });
            } else if (defaultApplication) {
                setFormData({
                    title: '',
                    description: '',
                    dueDate: defaultDate || '',
                    dueTime: '09:00',
                    type: 'follow_up',
                    priority: 'medium',
                    applicationId: defaultApplication._id || '',
                    tags: '',
                    color: '#3b82f6',
                    isRecurring: false,
                    recurrencePattern: 'weekly',
                    recurrenceInterval: 1,
                    recurrenceEndDate: '',
                    notifications: [{ type: 'in_app', timing: 'on_time' }]
                });
            } else {
                setFormData({
                    title: '',
                    description: '',
                    dueDate: defaultDate || '',
                    dueTime: '09:00',
                    type: 'follow_up',
                    priority: 'medium',
                    applicationId: '',
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
    }, [isOpen, editingReminder, defaultApplication, defaultDate]);

    const fetchApplications = async () => {
        try {
            const response = await fetch('/api/applications');
            if (response.ok) {
                const data = await response.json();
                const apps = Array.isArray(data) ? data : data.applications || [];
                setApplications(apps);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            toast.error('Please enter a title');
            return;
        }
        if (!formData.dueDate) {
            toast.error('Please select a due date');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
                dueDate: new Date(formData.dueDate).toISOString(),
                recurrenceEndDate: formData.recurrenceEndDate ? new Date(formData.recurrenceEndDate).toISOString() : null,
                applicationId: formData.applicationId || null
            };

            const url = editingReminder ? `/api/reminders/${editingReminder._id}` : '/api/reminders';
            const method = editingReminder ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success(editingReminder ? 'Reminder updated successfully' : 'Reminder created successfully');
                onSuccess();
                onClose();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to save reminder');
            }
        } catch (error) {
            console.error('Error saving reminder:', error);
            toast.error('Failed to save reminder');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
            width="max-w-2xl"
        >
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                {/* Basic Information */}
                <section className="space-y-4">
                    <h3 className="text-lg font-medium text-[var(--text-main)] pb-2">Basic Information</h3>

                    <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Title <span className="text-[var(--danger)]">*</span></label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Enter reminder title"
                            className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Enter description (optional)"
                            rows={2}
                            className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Due Date <span className="text-[var(--danger)]">*</span></label>
                            <DatePicker
                                value={formData.dueDate ? dayjs(formData.dueDate) : null}
                                onChange={(d) => setFormData({ ...formData, dueDate: d ? d.format('YYYY-MM-DD') : '' })}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Due Time <span className="text-[var(--danger)]">*</span></label>
                            <input
                                type="time"
                                value={formData.dueTime}
                                onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                                className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Type</label>
                            <Select
                                value={formData.type}
                                onChange={(v) => setFormData({ ...formData, type: v })}
                                options={[
                                    { value: 'follow_up', label: 'Follow Up' },
                                    { value: 'interview_prep', label: 'Interview Preparation' },
                                    { value: 'application_deadline', label: 'Application Deadline' },
                                    { value: 'interview_scheduled', label: 'Interview Scheduled' },
                                    { value: 'offer_response', label: 'Offer Response' },
                                    { value: 'networking', label: 'Networking' },
                                    { value: 'skill_development', label: 'Skill Development' },
                                    { value: 'job_search', label: 'Job Search' },
                                    { value: 'custom', label: 'Custom' },
                                ]}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Priority</label>
                            <Select
                                value={formData.priority}
                                onChange={(v) => setFormData({ ...formData, priority: v })}
                                options={[
                                    { value: 'low', label: 'Low' },
                                    { value: 'medium', label: 'Medium' },
                                    { value: 'high', label: 'High' },
                                    { value: 'urgent', label: 'Urgent' },
                                ]}
                                className="w-full"
                            />
                        </div>
                    </div>
                </section>

                {/* Associations */}
                <section className="space-y-4">
                    <h3 className="text-lg font-medium text-[var(--text-main)] pb-2 flex items-center gap-2">
                        <Tag className="w-5 h-5" /> Associations
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Related Application</label>
                        <Select
                            value={formData.applicationId}
                            onChange={(v) => setFormData({ ...formData, applicationId: v })}
                            options={[
                                { value: '', label: 'None' },
                                ...applications.map((app) => ({
                                    value: app._id,
                                    label: `${app.jobId?.title || 'Untitled'} at ${app.jobId?.company || 'Unknown Company'}`,
                                })),
                            ]}
                            className="w-full"
                        />

                        {formData.applicationId && (() => {
                            const selectedApp = applications.find(app => app._id === formData.applicationId);
                            return selectedApp ? (
                                <div className="mt-3 p-3 bg-[var(--success)]/10 rounded-xl">
                                    <div className="flex items-center gap-2 text-sm mb-1">
                                        <div className="w-2 h-2 bg-[var(--success)] rounded-full"></div>
                                        <span className="text-[var(--success)] font-medium">Linked to Application</span>
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)]">
                                        {selectedApp.jobId?.title} at {selectedApp.jobId?.company}
                                    </div>
                                </div>
                            ) : null;
                        })()}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Tags</label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            placeholder="Enter tags separated by commas"
                            className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                        />
                    </div>
                </section>

                {/* Recurrence */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isRecurring"
                            checked={formData.isRecurring}
                            onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                            className="rounded border-[var(--border-glass)] bg-[var(--bg-deep)] text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                        <label htmlFor="isRecurring" className="text-[var(--text-main)] font-medium flex items-center gap-2 cursor-pointer">
                            <Repeat className="w-4 h-4" />
                            Recurring Reminder
                        </label>
                    </div>

                    {formData.isRecurring && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6 border-l-2 border-[var(--border-glass)]">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Pattern</label>
                                <Select
                                    value={formData.recurrencePattern}
                                    onChange={(v) => setFormData({ ...formData, recurrencePattern: v })}
                                    options={[
                                        { value: 'daily', label: 'Daily' },
                                        { value: 'weekly', label: 'Weekly' },
                                        { value: 'monthly', label: 'Monthly' },
                                    ]}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Interval</label>
                                <input
                                    type="number"
                                    value={formData.recurrenceInterval}
                                    onChange={(e) => setFormData({ ...formData, recurrenceInterval: parseInt(e.target.value) || 1 })}
                                    min="1"
                                    className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-[var(--text-main)] focus:border-[var(--primary)] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">End Date</label>
                                <DatePicker
                                    value={formData.recurrenceEndDate ? dayjs(formData.recurrenceEndDate) : null}
                                    onChange={(d) => setFormData({ ...formData, recurrenceEndDate: d ? d.format('YYYY-MM-DD') : '' })}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    )}
                </section>

                {/* Notifications */}
                <section className="space-y-4">
                    <h3 className="text-lg font-medium text-[var(--text-main)] pb-2 flex items-center gap-2">
                        <Bell className="w-5 h-5" /> Notifications
                    </h3>

                    <div className="space-y-3">
                        {formData.notifications.map((notification, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-[var(--bg-deep)] rounded-xl relative group">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Type</label>
                                    <Select
                                        value={notification.type}
                                        onChange={(v) => {
                                            const newNotifications = [...formData.notifications];
                                            newNotifications[index] = { ...notification, type: v };
                                            setFormData({ ...formData, notifications: newNotifications });
                                        }}
                                        options={[
                                            { value: 'in_app', label: 'In-App' },
                                            { value: 'email', label: 'Email' },
                                            { value: 'push', label: 'Push' },
                                        ]}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Timing</label>
                                    <Select
                                        value={notification.timing}
                                        onChange={(v) => {
                                            const newNotifications = [...formData.notifications];
                                            newNotifications[index] = { ...notification, timing: v };
                                            setFormData({ ...formData, notifications: newNotifications });
                                        }}
                                        options={[
                                            { value: 'on_time', label: 'On Time' },
                                            { value: '15_min_before', label: '15 minutes before' },
                                            { value: '1_hour_before', label: '1 hour before' },
                                            { value: '1_day_before', label: '1 day before' },
                                            { value: '1_week_before', label: '1 week before' },
                                        ]}
                                        className="w-full"
                                    />
                                </div>
                                {formData.notifications.length > 1 && (
                                    <Button
                                        variant="danger"
                                        onClick={() => {
                                            const newNotifications = [...formData.notifications];
                                            newNotifications.splice(index, 1);
                                            setFormData({ ...formData, notifications: newNotifications });
                                        }}
                                        aria-label={`Remove notification ${index + 1}`}
                                        className="absolute -top-2 -right-2 bg-[var(--danger)] text-[var(--bg-deep)] rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                )}
                            </div>
                        ))}

                        <Button
                            variant="secondary"
                            onClick={() => {
                                setFormData({
                                    ...formData,
                                    notifications: [...formData.notifications, { type: 'in_app', timing: 'on_time' }]
                                });
                            }}
                            className="w-full py-2 border border-dashed border-[var(--border-glass)] rounded-xl text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Notification</span>
                        </Button>
                    </div>
                </section>

                <div className="flex justify-end gap-3 pt-6">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 rounded-xl bg-[var(--primary)] text-[var(--bg-deep)] font-bold hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && <div className="w-4 h-4 border-2 border-[var(--bg-deep)] border-t-transparent rounded-full animate-spin"></div>}
                        {editingReminder ? 'Update Reminder' : 'Create Reminder'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default CreateReminderModal;