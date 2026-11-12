'use client';

import React, { useState, useEffect } from 'react';
import { Select, DatePicker, TimePicker } from 'antd';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { MapPin, Users, FileText, Plus, Trash2, Link as LinkIcon, Video, Building, ChevronDown, ChevronUp } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

interface Application {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    company: string;
    location?: string;
  };
  status: string;
}

interface Attendee {
  name: string;
  email: string;
  role: string;
  company: string;
}

interface CalendarEvent {
  _id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  priority: string;
  startDate: string;
  endDate: string;
  location?: {
    isVirtual: boolean;
    address?: string;
    meetingLink?: string;
    meetingId?: string;
  };
  attendees: Attendee[];
  agenda: string[];
  applicationId?: string | {
    _id: string;
    status: string;
    jobId: {
      _id: string;
      title: string;
      company: string;
    };
  };
  tags?: string[];
}

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingEvent?: CalendarEvent | string;
  defaultStartDate?: dayjs.Dayjs;
  defaultEndDate?: dayjs.Dayjs;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingEvent,
  defaultStartDate,
  defaultEndDate
}) => {
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('interview');
  const [status, setStatus] = useState('scheduled');
  const [priority, setPriority] = useState('medium');
  const [isAllDay, setIsAllDay] = useState(false);
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [endTime, setEndTime] = useState('10:00');
  const [isVirtual, setIsVirtual] = useState(false);
  const [address, setAddress] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [agenda, setAgenda] = useState<string[]>([]);
  const [applicationId, setApplicationId] = useState('');
  const [tags, setTags] = useState('');

  const fetchApplications = async () => {
    try {
      const appsResponse = await fetch('/api/applications');
      if (appsResponse.ok) {
        const appsData = await appsResponse.json();
        setApplications(Array.isArray(appsData.applications) ? appsData.applications : []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchApplications();
      setShowAdvanced(false);
      if (editingEvent && typeof editingEvent === 'object') {
        setTitle(editingEvent.title || '');
        setDescription(editingEvent.description || '');
        setType(editingEvent.type || 'interview');
        setStatus(editingEvent.status || 'scheduled');
        setPriority(editingEvent.priority || 'medium');

        const start = dayjs(editingEvent.startDate);
        const end = dayjs(editingEvent.endDate);
        setStartDate(start.format('YYYY-MM-DD'));
        setStartTime(start.format('HH:mm'));
        setEndDate(end.format('YYYY-MM-DD'));
        setEndTime(end.format('HH:mm'));

        setIsVirtual(editingEvent.location?.isVirtual || false);
        setAddress(editingEvent.location?.address || '');
        setMeetingLink(editingEvent.location?.meetingLink || '');
        setMeetingId(editingEvent.location?.meetingId || '');

        setAttendees(editingEvent.attendees || []);
        setAgenda(editingEvent.agenda || []);

        const appId = typeof editingEvent.applicationId === 'object' ? editingEvent.applicationId?._id : editingEvent.applicationId;
        setApplicationId(appId || '');

        setTags(editingEvent.tags?.join(', ') || '');
      } else {
        setTitle('');
        setDescription('');
        setType('interview');
        setStatus('scheduled');
        setPriority('medium');
        setIsAllDay(false);

        const now = defaultStartDate || dayjs();
        const oneHourLater = defaultEndDate || now.add(1, 'hour');
        setStartDate(now.format('YYYY-MM-DD'));
        setStartTime(now.format('HH:mm'));
        setEndDate(oneHourLater.format('YYYY-MM-DD'));
        setEndTime(oneHourLater.format('HH:mm'));

        setIsVirtual(false);
        setAddress('');
        setMeetingLink('');
        setMeetingId('');
        setAttendees([]);
        setAgenda([]);
        setApplicationId('');
        setTags('');
      }
    }
  }, [isOpen, editingEvent, defaultStartDate, defaultEndDate]);

  const handleAddAttendee = () => {
    setAttendees([...attendees, { name: '', email: '', role: 'interviewer', company: '' }]);
  };

  const handleRemoveAttendee = (index: number) => {
    const newAttendees = [...attendees];
    newAttendees.splice(index, 1);
    setAttendees(newAttendees);
  };

  const handleAttendeeChange = (index: number, field: keyof Attendee, value: string) => {
    const newAttendees = [...attendees];
    newAttendees[index] = { ...newAttendees[index], [field]: value };
    setAttendees(newAttendees);
  };

  const handleAddAgendaItem = () => {
    setAgenda([...agenda, '']);
  };

  const handleRemoveAgendaItem = (index: number) => {
    const newAgenda = [...agenda];
    newAgenda.splice(index, 1);
    setAgenda(newAgenda);
  };

  const handleAgendaChange = (index: number, value: string) => {
    const newAgenda = [...agenda];
    newAgenda[index] = value;
    setAgenda(newAgenda);
  };

  const handleSubmit = async () => {
    if (!title) {
      toast.error('Please enter a title');
      return;
    }

    setLoading(true);
    try {
      const startDateTime = dayjs(`${startDate}T${startTime}`);
      const endDateTime = dayjs(`${endDate}T${endTime}`);

      const payload = {
        title,
        description,
        type,
        status,
        priority,
        isAllDay,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        location: {
          isVirtual,
          address: isVirtual ? undefined : address,
          meetingLink: isVirtual ? meetingLink : undefined,
          meetingId: isVirtual ? meetingId : undefined,
        },
        attendees,
        agenda,
        applicationId: applicationId || null,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      };

      const eventId = typeof editingEvent === 'string' ? editingEvent : editingEvent?._id;
      const url = editingEvent ? `/api/calendar/events/${eventId}` : '/api/calendar/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(editingEvent ? 'Event updated successfully' : 'Event created successfully');
        onSuccess();
        onClose();
      } else {
        toast.error('Failed to save event');
      }
    } catch (error) {
      console.error('Error submitting event:', error);
      toast.error('Error saving event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingEvent ? 'Edit Event' : 'Create New Event'}
      width="max-w-2xl"
    >
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
        {/* Essentials */}
        <section className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Title <span className="text-[var(--danger)]">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is this event?"
              className="w-full h-9 px-3 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-lg text-[var(--text-main)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any details (optional)"
              rows={2}
              className="w-full px-3 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-lg text-[var(--text-main)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none resize-none transition-colors"
            />
          </div>

          <label className="flex items-center gap-2 text-[var(--text-main)] cursor-pointer">
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="rounded border-[var(--border-glass)] bg-[var(--bg-deep)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span>All day</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Date</label>
              <DatePicker
                value={startDate ? dayjs(startDate) : null}
                onChange={(d) => {
                  const val = d ? d.format('YYYY-MM-DD') : '';
                  setStartDate(val);
                  setEndDate(val);
                }}
                className="w-full"
              />
            </div>
            {!isAllDay && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Start time</label>
                  <TimePicker
                    value={startTime ? dayjs(startTime, 'HH:mm') : null}
                    onChange={(t) => setStartTime(t ? t.format('HH:mm') : '')}
                    format="HH:mm"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">End time</label>
                  <TimePicker
                    value={endTime ? dayjs(endTime, 'HH:mm') : null}
                    onChange={(t) => setEndTime(t ? t.format('HH:mm') : '')}
                    format="HH:mm"
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {/* Advanced toggle */}
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full py-2 border border-dashed border-[var(--border-glass)] rounded-xl flex items-center justify-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>{showAdvanced ? 'Hide advanced options' : 'Show advanced options'}</span>
        </Button>

        {showAdvanced && (
          <>
            {/* Type / Status / Priority */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Type</label>
                <Select
                  value={type}
                  onChange={(v) => setType(v)}
                  options={[
                    { value: 'interview', label: 'Interview' },
                    { value: 'phone_screening', label: 'Phone Screening' },
                    { value: 'technical_interview', label: 'Technical Interview' },
                    { value: 'final_interview', label: 'Final Interview' },
                    { value: 'other', label: 'Other' },
                  ]}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Status</label>
                <Select
                  value={status}
                  onChange={(v) => setStatus(v)}
                  options={[
                    { value: 'scheduled', label: 'Scheduled' },
                    { value: 'confirmed', label: 'Confirmed' },
                    { value: 'cancelled', label: 'Cancelled' },
                    { value: 'completed', label: 'Completed' },
                  ]}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Priority</label>
                <Select
                  value={priority}
                  onChange={(v) => setPriority(v)}
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                  ]}
                  className="w-full"
                />
              </div>
            </section>

            {/* Location */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-[var(--text-main)] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--text-muted)]" /> Location
              </h3>
              <label className="flex items-center gap-2 text-[var(--text-main)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVirtual}
                  onChange={(e) => setIsVirtual(e.target.checked)}
                  className="rounded border-[var(--border-glass)] bg-[var(--bg-deep)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span>Virtual meeting</span>
              </label>
              {!isVirtual ? (
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Address (optional)"
                    className="w-full h-9 pl-10 pr-3 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-lg text-[var(--text-main)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="Meeting link"
                      className="w-full h-9 pl-10 pr-3 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-lg text-[var(--text-main)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={meetingId}
                      onChange={(e) => setMeetingId(e.target.value)}
                      placeholder="Meeting ID"
                      className="w-full h-9 pl-10 pr-3 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-lg text-[var(--text-main)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Attendees */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-[var(--text-main)] flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--text-muted)]" /> Attendees
              </h3>
              <div className="space-y-2">
                {attendees.map((attendee, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start bg-[var(--bg-deep)] p-3 rounded-xl">
                    <div className="md:col-span-3">
                      <input
                        type="text"
                        value={attendee.name}
                        onChange={(e) => handleAttendeeChange(index, 'name', e.target.value)}
                        placeholder="Name"
                        className="w-full px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-lg text-[var(--text-main)] text-sm focus:border-[var(--primary)] focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <input
                        type="email"
                        value={attendee.email}
                        onChange={(e) => handleAttendeeChange(index, 'email', e.target.value)}
                        placeholder="Email"
                        className="w-full px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-lg text-[var(--text-main)] text-sm focus:border-[var(--primary)] focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Select
                        value={attendee.role}
                        onChange={(v) => handleAttendeeChange(index, 'role', v)}
                        options={[
                          { value: 'interviewer', label: 'Interviewer' },
                          { value: 'hr', label: 'HR' },
                          { value: 'recruiter', label: 'Recruiter' },
                          { value: 'hiring_manager', label: 'Hiring Manager' },
                        ]}
                        className="w-full"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        value={attendee.company}
                        onChange={(e) => handleAttendeeChange(index, 'company', e.target.value)}
                        placeholder="Company"
                        className="w-full px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-lg text-[var(--text-main)] text-sm focus:border-[var(--primary)] focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-1 flex justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleRemoveAttendee(index)}
                        aria-label={`Remove attendee ${index + 1}`}
                        className="p-1.5 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddAttendee}
                  className="w-full py-2 border border-dashed border-[var(--border-glass)] rounded-xl text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add attendee</span>
                </Button>
              </div>
            </section>

            {/* Associations */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-[var(--text-main)] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--text-muted)]" /> Related application
              </h3>
              <Select
                value={applicationId}
                onChange={(v) => setApplicationId(v)}
                showSearch
                placeholder="Search or select an application"
                options={[
                  { value: '', label: 'None' },
                  ...applications.map((app) => ({
                    value: app._id,
                    label: `${app.jobId?.title || 'Untitled'} at ${app.jobId?.company || 'Unknown Company'}`,
                  })),
                ]}
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
                className="w-full"
              />
              {applicationId && (() => {
                const selectedApp = applications.find(app => app._id === applicationId);
                return selectedApp ? (
                  <div className="mt-2 p-3 bg-[var(--success)]/10 rounded-xl">
                    <div className="flex items-center gap-2 text-sm mb-1">
                      <div className="w-2 h-2 bg-[var(--success)] rounded-full"></div>
                      <span className="text-[var(--success)] font-medium">Linked to application</span>
                    </div>
                    <div className="text-xs text-[var(--text-muted)] grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1"><FileText className="w-3 h-3" /> {selectedApp.jobId.title}</div>
                      <div className="flex items-center gap-1"><Building className="w-3 h-3" /> {selectedApp.jobId.company}</div>
                      <div className="flex items-center gap-1 col-span-2"><MapPin className="w-3 h-3" /> {selectedApp.jobId.location || 'Not specified'}</div>
                    </div>
                  </div>
                ) : null;
              })()}
            </section>

            {/* Agenda */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-[var(--text-main)] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--text-muted)]" /> Agenda
              </h3>
              <div className="space-y-2">
                {agenda.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-[var(--text-muted)] text-sm w-6 text-center">{index + 1}.</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleAgendaChange(index, e.target.value)}
                      placeholder={`Agenda item ${index + 1}`}
                      className="flex-1 px-3 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-lg text-[var(--text-main)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRemoveAgendaItem(index)}
                      aria-label={`Remove agenda item ${index + 1}`}
                      className="p-2 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddAgendaItem}
                  className="w-full py-2 border border-dashed border-[var(--border-glass)] rounded-xl text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add agenda item</span>
                </Button>
              </div>
            </section>

            {/* Tags */}
            <section>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. interview, follow-up (comma separated)"
                className="w-full h-9 px-3 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-lg text-[var(--text-main)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
              />
            </section>
          </>
        )}

        <div className="flex justify-end gap-3 pt-6">
          <Button variant="ghost" onClick={onClose} className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={loading}
            className="px-6 py-2 rounded-xl bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-2"
          >
            {editingEvent ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateEventModal;
