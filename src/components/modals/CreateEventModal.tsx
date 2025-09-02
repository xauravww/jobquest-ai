'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, FileText, Plus, Trash2 } from 'lucide-react';
import { FormInput, FormTextarea, FormSelect, FormDateInput } from '@/components/ui/FormInput';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingEvent?: any;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingEvent
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',
    isAllDay: false,
    timezone: 'UTC',
    type: 'interview',
    status: 'scheduled',
    priority: 'medium',
    applicationId: '',
    jobId: '',
    reminderId: '',
    location: {
      address: '',
      isVirtual: false,
      meetingLink: '',
      meetingId: '',
      meetingPassword: ''
    },
    attendees: [],
    reminders: [
      { type: 'in_app', timing: 15 }
    ],
    preparationNotes: '',
    agenda: [],
    documents: [],
    tags: '',
    color: '#3b82f6',
    followUpRequired: false,
    followUpDate: '',
    followUpNotes: ''
  });

  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      if (editingEvent) {
        const startDate = new Date(editingEvent.startDate);
        const endDate = new Date(editingEvent.endDate);
        
        setFormData({
          title: editingEvent.title || '',
          description: editingEvent.description || '',
          startDate: startDate.toISOString().split('T')[0],
          startTime: startDate.toTimeString().slice(0, 5),
          endDate: endDate.toISOString().split('T')[0],
          endTime: endDate.toTimeString().slice(0, 5),
          isAllDay: editingEvent.isAllDay || false,
          timezone: editingEvent.timezone || 'UTC',
          type: editingEvent.type || 'interview',
          status: editingEvent.status || 'scheduled',
          priority: editingEvent.priority || 'medium',
          applicationId: editingEvent.applicationId?._id || '',
          jobId: editingEvent.jobId?._id || '',
          reminderId: editingEvent.reminderId?._id || '',
          location: editingEvent.location || {
            address: '',
            isVirtual: false,
            meetingLink: '',
            meetingId: '',
            meetingPassword: ''
          },
          attendees: editingEvent.attendees || [],
          reminders: editingEvent.reminders || [{ type: 'in_app', timing: 15 }],
          preparationNotes: editingEvent.preparationNotes || '',
          agenda: editingEvent.agenda || [],
          documents: editingEvent.documents || [],
          tags: editingEvent.tags?.join(', ') || '',
          color: editingEvent.color || '#3b82f6',
          followUpRequired: editingEvent.followUpRequired || false,
          followUpDate: editingEvent.followUpDate ? new Date(editingEvent.followUpDate).toISOString().split('T')[0] : '',
          followUpNotes: editingEvent.followUpNotes || ''
        });
      } else {
        // Reset form for new event
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        
        setFormData({
          title: '',
          description: '',
          startDate: now.toISOString().split('T')[0],
          startTime: now.toTimeString().slice(0, 5),
          endDate: oneHourLater.toISOString().split('T')[0],
          endTime: oneHourLater.toTimeString().slice(0, 5),
          isAllDay: false,
          timezone: 'UTC',
          type: 'interview',
          status: 'scheduled',
          priority: 'medium',
          applicationId: '',
          jobId: '',
          reminderId: '',
          location: {
            address: '',
            isVirtual: false,
            meetingLink: '',
            meetingId: '',
            meetingPassword: ''
          },
          attendees: [],
          reminders: [{ type: 'in_app', timing: 15 }],
          preparationNotes: '',
          agenda: [],
          documents: [],
          tags: '',
          color: '#3b82f6',
          followUpRequired: false,
          followUpDate: '',
          followUpNotes: ''
        });
      }
    }
  }, [isOpen, editingEvent]);

  const fetchData = async () => {
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

      // Fetch reminders
      const remindersResponse = await fetch('/api/reminders');
      if (remindersResponse.ok) {
        const remindersData = await remindersResponse.json();
        setReminders(remindersData.reminders || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      const payload = {
        ...formData,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : null,
        applicationId: formData.applicationId || null,
        jobId: formData.jobId || null,
        reminderId: formData.reminderId || null
      };

      const url = editingEvent ? `/api/calendar/events/${editingEvent._id}` : '/api/calendar/events';
      const method = editingEvent ? 'PUT' : 'POST';

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
        console.error('Error saving event:', error);
      }
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAttendee = () => {
    setFormData({
      ...formData,
      attendees: [...formData.attendees, { name: '', email: '', role: 'interviewer', company: '', phone: '' }]
    });
  };

  const removeAttendee = (index: number) => {
    const newAttendees = formData.attendees.filter((_, i) => i !== index);
    setFormData({ ...formData, attendees: newAttendees });
  };

  const updateAttendee = (index: number, field: string, value: string) => {
    const newAttendees = [...formData.attendees];
    newAttendees[index] = { ...newAttendees[index], [field]: value };
    setFormData({ ...formData, attendees: newAttendees });
  };

  const addAgendaItem = () => {
    setFormData({
      ...formData,
      agenda: [...formData.agenda, '']
    });
  };

  const removeAgendaItem = (index: number) => {
    const newAgenda = formData.agenda.filter((_, i) => i !== index);
    setFormData({ ...formData, agenda: newAgenda });
  };

  const updateAgendaItem = (index: number, value: string) => {
    const newAgenda = [...formData.agenda];
    newAgenda[index] = value;
    setFormData({ ...formData, agenda: newAgenda });
  };

  const eventTypes = [
    { value: 'interview', label: 'Interview' },
    { value: 'phone_screening', label: 'Phone Screening' },
    { value: 'technical_interview', label: 'Technical Interview' },
    { value: 'final_interview', label: 'Final Interview' },
    { value: 'networking_event', label: 'Networking Event' },
    { value: 'job_fair', label: 'Job Fair' },
    { value: 'follow_up_call', label: 'Follow-up Call' },
    { value: 'deadline', label: 'Deadline' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'other', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' },
    { value: 'rescheduled', label: 'Rescheduled' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const attendeeRoles = [
    { value: 'interviewer', label: 'Interviewer' },
    { value: 'hr', label: 'HR' },
    { value: 'recruiter', label: 'Recruiter' },
    { value: 'hiring_manager', label: 'Hiring Manager' },
    { value: 'team_member', label: 'Team Member' },
    { value: 'other', label: 'Other' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card rounded-xl border border-border w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-success" />
            {editingEvent ? 'Edit Event' : 'Create New Event'}
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
              placeholder="Enter event title"
              required
            />

            <FormTextarea
              label="Description"
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Enter event description (optional)"
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormSelect
                label="Type"
                value={formData.type}
                onChange={(value) => setFormData({ ...formData, type: value })}
                options={eventTypes}
                required
              />

              <FormSelect
                label="Status"
                value={formData.status}
                onChange={(value) => setFormData({ ...formData, status: value })}
                options={statusOptions}
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

          {/* Date & Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Date & Time</h3>
            
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="isAllDay"
                checked={formData.isAllDay}
                onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
                className="w-4 h-4 text-primary"
              />
              <label htmlFor="isAllDay" className="text-sm font-medium text-white">
                All Day Event
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-muted">Start</label>
                <div className="grid grid-cols-2 gap-2">
                  <FormDateInput
                    value={formData.startDate}
                    onChange={(value) => setFormData({ ...formData, startDate: value })}
                    required
                  />
                  {!formData.isAllDay && (
                    <FormInput
                      type="time"
                      value={formData.startTime}
                      onChange={(value) => setFormData({ ...formData, startTime: value })}
                      required
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-muted">End</label>
                <div className="grid grid-cols-2 gap-2">
                  <FormDateInput
                    value={formData.endDate}
                    onChange={(value) => setFormData({ ...formData, endDate: value })}
                    required
                  />
                  {!formData.isAllDay && (
                    <FormInput
                      type="time"
                      value={formData.endTime}
                      onChange={(value) => setFormData({ ...formData, endTime: value })}
                      required
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location
            </h3>
            
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="isVirtual"
                checked={formData.location.isVirtual}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { ...formData.location, isVirtual: e.target.checked }
                })}
                className="w-4 h-4 text-primary"
              />
              <label htmlFor="isVirtual" className="text-sm font-medium text-white">
                Virtual Meeting
              </label>
            </div>

            {formData.location.isVirtual ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput
                  label="Meeting Link"
                  value={formData.location.meetingLink}
                  onChange={(value) => setFormData({
                    ...formData,
                    location: { ...formData.location, meetingLink: value }
                  })}
                  placeholder="https://zoom.us/j/..."
                />

                <FormInput
                  label="Meeting ID"
                  value={formData.location.meetingId}
                  onChange={(value) => setFormData({
                    ...formData,
                    location: { ...formData.location, meetingId: value }
                  })}
                  placeholder="123-456-789"
                />

                <FormInput
                  label="Meeting Password"
                  value={formData.location.meetingPassword}
                  onChange={(value) => setFormData({
                    ...formData,
                    location: { ...formData.location, meetingPassword: value }
                  })}
                  placeholder="Optional"
                />
              </div>
            ) : (
              <FormInput
                label="Address"
                value={formData.location.address}
                onChange={(value) => setFormData({
                  ...formData,
                  location: { ...formData.location, address: value }
                })}
                placeholder="Enter physical address"
              />
            )}
          </div>

          {/* Attendees */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Attendees
              </h3>
              <button
                type="button"
                onClick={addAttendee}
                className="px-3 py-1 bg-primary hover:bg-primary/80 text-white rounded text-sm transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Attendee
              </button>
            </div>

            {formData.attendees.map((attendee, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-bg-light rounded-lg">
                <FormInput
                  label="Name"
                  value={attendee.name}
                  onChange={(value) => updateAttendee(index, 'name', value)}
                  placeholder="Full name"
                />

                <FormInput
                  label="Email"
                  type="email"
                  value={attendee.email}
                  onChange={(value) => updateAttendee(index, 'email', value)}
                  placeholder="email@company.com"
                />

                <FormSelect
                  label="Role"
                  value={attendee.role}
                  onChange={(value) => updateAttendee(index, 'role', value)}
                  options={attendeeRoles}
                />

                <FormInput
                  label="Company"
                  value={attendee.company}
                  onChange={(value) => updateAttendee(index, 'company', value)}
                  placeholder="Company name"
                />

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeAttendee(index)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Agenda */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Agenda
              </h3>
              <button
                type="button"
                onClick={addAgendaItem}
                className="px-3 py-1 bg-primary hover:bg-primary/80 text-white rounded text-sm transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {formData.agenda.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <FormInput
                  value={item}
                  onChange={(value) => updateAgendaItem(index, value)}
                  placeholder="Agenda item"
                />
                <button
                  type="button"
                  onClick={() => removeAgendaItem(index)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Associations */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Associations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <FormSelect
                label="Related Reminder"
                value={formData.reminderId}
                onChange={(value) => setFormData({ ...formData, reminderId: value })}
                options={[
                  { value: '', label: 'None' },
                  ...reminders.map((reminder: any) => ({
                    value: reminder._id,
                    label: reminder.title
                  }))
                ]}
              />
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
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-16 h-10 rounded border border-border bg-bg-light"
              />
            </div>
          </div>

          {/* Preparation Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Preparation</h3>
            
            <FormTextarea
              label="Preparation Notes"
              value={formData.preparationNotes}
              onChange={(value) => setFormData({ ...formData, preparationNotes: value })}
              placeholder="Notes for preparation..."
              rows={4}
            />
          </div>

          {/* Follow-up */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="followUpRequired"
                checked={formData.followUpRequired}
                onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                className="w-4 h-4 text-primary"
              />
              <label htmlFor="followUpRequired" className="text-sm font-medium text-white">
                Follow-up required
              </label>
            </div>

            {formData.followUpRequired && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <FormDateInput
                  label="Follow-up Date"
                  value={formData.followUpDate}
                  onChange={(value) => setFormData({ ...formData, followUpDate: value })}
                />

                <FormTextarea
                  label="Follow-up Notes"
                  value={formData.followUpNotes}
                  onChange={(value) => setFormData({ ...formData, followUpNotes: value })}
                  placeholder="Follow-up notes..."
                  rows={2}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-dark hover:text-text border border-border hover:border-border-light rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-success hover:bg-success/80 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {editingEvent ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;