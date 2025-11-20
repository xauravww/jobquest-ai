'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, FileText, Plus } from 'lucide-react';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { Modal, Button, Form, Input, Select, DatePicker, Checkbox, Space } from 'antd';
import dayjs from 'dayjs';

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

interface FormData {
  title: string;
  description?: string;
  type: string;
  status: string;
  priority: string;
  isAllDay?: boolean;
  startDate: dayjs.Dayjs;
  startTime: string;
  endDate: dayjs.Dayjs;
  endTime: string;
  location?: {
    isVirtual: boolean;
    address?: string;
    meetingLink?: string;
    meetingId?: string;
  };
  attendees: Attendee[];
  agenda: string[];
  applicationId?: string;
  tags?: string;
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
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const isVirtual = Form.useWatch(['location', 'isVirtual'], form);

  const fetchApplications = async () => {
    try {
      const appsResponse = await fetch('/api/applications');
      let applicationsFromApi: Application[] = [];
      if (appsResponse.ok) {
        const appsData = await appsResponse.json();
        applicationsFromApi = Array.isArray(appsData.applications) ? appsData.applications : [];
      }
      setApplications(applicationsFromApi);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchApplications();
      if (editingEvent && typeof editingEvent === 'object') {
        // Populate form for editing
        form.setFieldsValue({
          ...editingEvent,
          startDate: editingEvent.startDate ? dayjs(editingEvent.startDate) : null,
          startTime: editingEvent.startDate ? dayjs(editingEvent.startDate).format('HH:mm') : '09:00',
          endDate: editingEvent.endDate ? dayjs(editingEvent.endDate) : null,
          endTime: editingEvent.endDate ? dayjs(editingEvent.endDate).format('HH:mm') : '10:00',
          tags: editingEvent.tags?.join(', '),
          applicationId: (typeof editingEvent.applicationId === 'object' ? editingEvent.applicationId?._id : editingEvent.applicationId) || '',
        });
      } else {
        // Reset form for creating a new event
        form.resetFields();
        const now = defaultStartDate || dayjs();
        const oneHourLater = defaultEndDate || now.add(1, 'hour');
        form.setFieldsValue({
          status: 'scheduled',
          priority: 'medium',
          type: 'interview',
          attendees: [],
          agenda: [],
          startDate: now,
          startTime: now.format('HH:mm'),
          endDate: oneHourLater,
          endTime: oneHourLater.format('HH:mm'),
          applicationId: '',
        });
      }
    }
  }, [isOpen, editingEvent, form, defaultStartDate, defaultEndDate]);


  const handleSubmit = async (values: FormData) => {
    setLoading(true);
    try {
      const startDateTime = dayjs(values.startDate).hour(parseInt(values.startTime.split(':')[0])).minute(parseInt(values.startTime.split(':')[1]));
      const endDateTime = dayjs(values.endDate).hour(parseInt(values.endTime.split(':')[0])).minute(parseInt(values.endTime.split(':')[1]));

      const payload = {
        ...values,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        tags: values.tags?.split(',').map((tag:string) => tag.trim()).filter(Boolean),
        applicationId: values.applicationId || null,
      };

      const eventId = typeof editingEvent === 'string' ? editingEvent : editingEvent?._id;
      const url = editingEvent ? `/api/calendar/events/${eventId}` : '/api/calendar/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        console.error('Failed to save event');
      }
    } catch (error) {
      console.error('Error submitting event:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const eventTypes = [ { value: 'interview', label: 'Interview' }, { value: 'phone_screening', label: 'Phone Screening' }, { value: 'technical_interview', label: 'Technical Interview' }, { value: 'final_interview', label: 'Final Interview' }, { value: 'other', label: 'Other' }];
  const statusOptions = [ { value: 'scheduled', label: 'Scheduled' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'cancelled', label: 'Cancelled' }, { value: 'completed', label: 'Completed' }];
  const priorityOptions = [ { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }];
  const attendeeRoles = [ { value: 'interviewer', label: 'Interviewer' }, { value: 'hr', label: 'HR' }, { value: 'recruiter', label: 'Recruiter' }, { value: 'hiring_manager', label: 'Hiring Manager' }];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-white">
          <Calendar className="w-5 h-5" />
          {editingEvent ? 'Edit Event' : 'Create New Event'}
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      width={800}
      className="custom-dark-modal glass-modal-mask"
      footer={[
        <Button key="back" onClick={onClose}>Cancel</Button>,
        <Button key="submit" type="primary" loading={loading} onClick={() => form.submit()}>
          {editingEvent ? 'Update Event' : 'Create Event'}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="max-h-[65vh] overflow-y-auto pr-4 -mr-4 space-y-6">
        
        <section>
          <h3 className="text-lg font-medium text-white mb-4">Basic Information</h3>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please enter a title' }]}>
            <Input placeholder="Enter event title" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Enter event description (optional)" rows={2} />
          </Form.Item>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item name="type" label="Type" rules={[{ required: true }]}>
              <Select options={eventTypes} />
            </Form.Item>
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select options={statusOptions} />
            </Form.Item>
            <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
              <Select options={priorityOptions} />
            </Form.Item>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium text-white mb-4">Date & Time</h3>
          <Form.Item name="isAllDay" valuePropName="checked">
            <Checkbox>All Day Event</Checkbox>
          </Form.Item>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
                <label className="ant-form-item-label text-white"><span className="text-red-500 mr-1">*</span>Start</label>
                <Space.Compact className="w-full">
                    <Form.Item name="startDate" noStyle rules={[{ required: true, message: 'Date required' }]}>
                        <DatePicker format="YYYY-MM-DD" style={{ width: '60%' }} />
                    </Form.Item>
                    <Form.Item name="startTime" noStyle rules={[{ required: true, message: 'Time required' }]}>
                        <Input type="time" style={{ width: '40%' }} />
                    </Form.Item>
                </Space.Compact>
            </div>
            <div className="flex flex-col">
                <label className="ant-form-item-label text-white"><span className="text-red-500 mr-1">*</span>End</label>
                <Space.Compact className="w-full">
                    <Form.Item name="endDate" noStyle rules={[{ required: true, message: 'Date required' }]}>
                        <DatePicker format="YYYY-MM-DD" style={{ width: '60%' }} />
                    </Form.Item>
                     <Form.Item name="endTime" noStyle rules={[{ required: true, message: 'Time required' }]}>
                        <Input type="time" style={{ width: '40%' }} />
                    </Form.Item>
                </Space.Compact>
            </div>
        </div>
        </section>

        <section>
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><MapPin className="w-5 h-5" />Location</h3>
            <Form.Item name={['location', 'isVirtual']} valuePropName="checked">
                <Checkbox>Virtual Meeting</Checkbox>
            </Form.Item>
            {!isVirtual ?
                <Form.Item name={['location', 'address']} label="Address">
                    <Input placeholder="Enter physical address" />
                </Form.Item>
                :
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item name={['location', 'meetingLink']} label="Meeting Link">
                        <Input placeholder="https://zoom.us/j/..." />
                    </Form.Item>
                    <Form.Item name={['location', 'meetingId']} label="Meeting ID">
                        <Input placeholder="123-456-789" />
                    </Form.Item>
                </div>
            }
        </section>
        
        <section>
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><Users className="w-5 h-5" />Attendees</h3>
          <Form.List name="attendees">
            {(fields, { add, remove }) => (
              <div className="space-y-4">
                {fields.length > 0 && (
                    <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 w-full text-sm text-white px-1">
                        <label>Name</label>
                        <label>Email</label>
                        <label>Role</label>
                        <label>Company</label>
                    </div>
                )}
{fields.map(({ key, name, ...restField }) => (
  <Space key={key} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-start w-full">
    <Form.Item {...restField} name={[name, 'name']} className="mb-0">
      <Input placeholder="John Doe" className="h-9 leading-none" />
    </Form.Item>
    <Form.Item {...restField} name={[name, 'email']} className="mb-0">
      <Input placeholder="john@test.com" className="h-9 leading-none" />
    </Form.Item>
    <Form.Item {...restField} name={[name, 'role']} className="mb-0">
      <Select options={attendeeRoles} placeholder="Interviewer" className="h-9 leading-none" />
    </Form.Item>
    <Form.Item {...restField} name={[name, 'company']} className="mb-0">
      <Input placeholder="Company name" className="h-9 leading-none" />
    </Form.Item>
    <Form.Item className="mb-0">
      <Button icon={<RiDeleteBin6Line size={16} />} onClick={() => remove(name)} danger />
    </Form.Item>
  </Space>
))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<Plus />}>
                    Add Attendee
                  </Button>
                </Form.Item>
              </div>
            )}
          </Form.List>
        </section>

        <section>
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5" />Associations</h3>
          <div className="space-y-4">
            <div className="space-y-2">
          <Form.Item name="applicationId" label="Related Application">
            <Select
              placeholder="Select an application (optional)"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (String(option?.label) ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={[
                { value: '', label: 'None' },
                ...applications.map((app: Application) => ({
                  value: app._id,
                  label: `${app.jobId?.title || 'Untitled'} at ${app.jobId?.company || 'Unknown Company'}`
                }))
              ]}
            />
          </Form.Item>
              {form.getFieldValue('applicationId') && (() => {
                const selectedApp = applications.find((app: Application) => app._id === form.getFieldValue('applicationId'));
                return selectedApp ? (
                  <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span className="text-success font-medium">Linked to Application</span>
                    </div>
                    <div className="mt-2 text-xs text-text-muted">
                      <div>Title: {selectedApp.jobId.title}</div>
                      <div>Company: {selectedApp.jobId.company}</div>
                      <div>Location: {selectedApp.jobId.location || 'Not specified'}</div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </section>

        <section>
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5" />Agenda</h3>
            <Form.List name="agenda">
            {(fields, { add, remove }) => (
              <div className="space-y-2">
                {fields.map((field, index) => (
                    <Space key={field.key} className="flex items-center w-full gap-2">
                        <Form.Item {...field} className="mb-0 flex-grow">
                            <Input placeholder={`Agenda Item ${index + 1}`} />
                        </Form.Item>
                        <Form.Item className="mb-0">
                            <Button icon={<RiDeleteBin6Line size={16} />} onClick={() => remove(field.name)} danger />
                        </Form.Item>
                    </Space>
                ))}
                <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<Plus />}>
                    Add Item
                    </Button>
                </Form.Item>
              </div>
            )}
            </Form.List>
        </section>

      </Form>
    </Modal>
  );
};

export default CreateEventModal;