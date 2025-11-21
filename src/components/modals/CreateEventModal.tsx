'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Calendar, MapPin, Users, FileText, Plus, Trash2, Clock, Link as LinkIcon, Video, Building } from 'lucide-react';
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
      if (editingEvent && typeof editingEvent === 'object') {
        // Populate form for editing
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
        // Reset form
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
      width="max-w-4xl"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Basic Info */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium text-white border-b border-[var(--border-glass)] pb-2">Basic Information</h3>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Title <span className="text-[var(--danger)]">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title"
              className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter event description"
              rows={2}
              className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none appearance-none"
              >
                <option value="interview">Interview</option>
                <option value="phone_screening">Phone Screening</option>
                <option value="technical_interview">Technical Interview</option>
                <option value="final_interview">Final Interview</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none appearance-none"
              >
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none appearance-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </section>

        {/* Date & Time */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium text-white border-b border-[var(--border-glass)] pb-2 flex items-center gap-2">
            <Clock className="w-5 h-5" /> Date & Time
          </h3>

          <label className="flex items-center gap-2 text-white cursor-pointer">
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="rounded border-[var(--border-glass)] bg-[var(--bg-deep)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span>All Day Event</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Start <span className="text-[var(--danger)]">*</span></label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
                />
                {!isAllDay && (
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-32 px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">End <span className="text-[var(--danger)]">*</span></label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
                />
                {!isAllDay && (
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-32 px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium text-white border-b border-[var(--border-glass)] pb-2 flex items-center gap-2">
            <MapPin className="w-5 h-5" /> Location
          </h3>

          <label className="flex items-center gap-2 text-white cursor-pointer">
            <input
              type="checkbox"
              checked={isVirtual}
              onChange={(e) => setIsVirtual(e.target.checked)}
              className="rounded border-[var(--border-glass)] bg-[var(--bg-deep)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <span>Virtual Meeting</span>
          </label>

          {!isVirtual ? (
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter physical address"
                  className="w-full pl-10 pr-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Meeting Link</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://zoom.us/j/..."
                    className="w-full pl-10 pr-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Meeting ID</label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value)}
                    placeholder="123-456-789"
                    className="w-full pl-10 pr-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Attendees */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium text-white border-b border-[var(--border-glass)] pb-2 flex items-center gap-2">
            <Users className="w-5 h-5" /> Attendees
          </h3>

          <div className="space-y-3">
            {attendees.map((attendee, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start bg-[var(--bg-deep)] p-3 rounded-xl border border-[var(--border-glass)]">
                <div className="md:col-span-3">
                  <input
                    type="text"
                    value={attendee.name}
                    onChange={(e) => handleAttendeeChange(index, 'name', e.target.value)}
                    placeholder="Name"
                    className="w-full px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-lg text-white text-sm focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
                <div className="md:col-span-3">
                  <input
                    type="email"
                    value={attendee.email}
                    onChange={(e) => handleAttendeeChange(index, 'email', e.target.value)}
                    placeholder="Email"
                    className="w-full px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-lg text-white text-sm focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
                <div className="md:col-span-3">
                  <select
                    value={attendee.role}
                    onChange={(e) => handleAttendeeChange(index, 'role', e.target.value)}
                    className="w-full px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-lg text-white text-sm focus:border-[var(--primary)] focus:outline-none appearance-none"
                  >
                    <option value="interviewer">Interviewer</option>
                    <option value="hr">HR</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="hiring_manager">Hiring Manager</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={attendee.company}
                    onChange={(e) => handleAttendeeChange(index, 'company', e.target.value)}
                    placeholder="Company"
                    className="w-full px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-lg text-white text-sm focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
                <div className="md:col-span-1 flex justify-center">
                  <button
                    onClick={() => handleRemoveAttendee(index)}
                    className="p-1.5 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddAttendee}
              className="w-full py-2 border border-dashed border-[var(--border-glass)] rounded-xl text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Attendee</span>
            </button>
          </div>
        </section>

        {/* Associations */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium text-white border-b border-[var(--border-glass)] pb-2 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Associations
          </h3>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Related Application</label>
            <select
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none appearance-none"
            >
              <option value="">None</option>
              {applications.map((app) => (
                <option key={app._id} value={app._id}>
                  {app.jobId?.title || 'Untitled'} at {app.jobId?.company || 'Unknown Company'}
                </option>
              ))}
            </select>

            {applicationId && (() => {
              const selectedApp = applications.find(app => app._id === applicationId);
              return selectedApp ? (
                <div className="mt-3 p-3 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-xl">
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <div className="w-2 h-2 bg-[var(--success)] rounded-full"></div>
                    <span className="text-[var(--success)] font-medium">Linked to Application</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1"><FileText className="w-3 h-3" /> {selectedApp.jobId.title}</div>
                    <div className="flex items-center gap-1"><Building className="w-3 h-3" /> {selectedApp.jobId.company}</div>
                    <div className="flex items-center gap-1 col-span-2"><MapPin className="w-3 h-3" /> {selectedApp.jobId.location || 'Not specified'}</div>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        </section>

        {/* Agenda */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium text-white border-b border-[var(--border-glass)] pb-2 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Agenda
          </h3>

          <div className="space-y-2">
            {agenda.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-[var(--text-muted)] text-sm w-6 text-center">{index + 1}.</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleAgendaChange(index, e.target.value)}
                  placeholder={`Agenda Item ${index + 1}`}
                  className="flex-1 px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
                />
                <button
                  onClick={() => handleRemoveAgendaItem(index)}
                  className="p-2 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              onClick={handleAddAgendaItem}
              className="w-full py-2 border border-dashed border-[var(--border-glass)] rounded-xl text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Agenda Item</span>
            </button>
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border-glass)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>}
            {editingEvent ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateEventModal;