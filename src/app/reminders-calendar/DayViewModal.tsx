'use client';

import React from 'react';
import { Modal, Button } from 'antd';
import { Calendar, Edit, Trash2, Clock, MapPin, Users } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import { RiDeleteBin6Line } from 'react-icons/ri';

interface CalendarItem {
  id: string;
  title: string;
  date: Dayjs;
  type: 'event' | 'reminder';
  status?: string;
  time?: string;
  color?: string;
  priority?: string;
  description?: string;
  location?: string;
  attendeesCount?: number;
  jobTitle?: string;
  jobCompany?: string;
}

interface DayViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Dayjs;
  items: CalendarItem[];
  onEditItem: (item: CalendarItem) => void;
  onRefresh: () => void;
}

const DayViewModal: React.FC<DayViewModalProps> = ({
  isOpen,
  onClose,
  date,
  items,
  onEditItem,
  onRefresh
}) => {
  const handleDeleteItem = async (item: CalendarItem) => {
    if (!confirm(`Are you sure you want to delete this ${item.type}?`)) return;

    try {
      const endpoint = item.type === 'reminder' ? `/api/reminders/${item.id}` : `/api/calendar/events/${item.id}`;
      const response = await fetch(endpoint, { method: 'DELETE' });

      if (response.ok) {
        onRefresh();
        onClose();
      } else {
        console.error('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    if (a.time && b.time) {
      return a.time.localeCompare(b.time);
    }
    return a.title.localeCompare(b.title);
  });

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-white">
          <Calendar className="w-5 h-5 text-primary" />
          {date.format('dddd, MMMM D, YYYY')}
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      width={600}
      className="custom-dark-modal"
      maskStyle={{
        backdropFilter: 'blur(3px)',
        backgroundColor: 'rgba(10, 15, 28, 0.7)'
      }}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <div className="max-h-[60vh] overflow-y-auto">
        {sortedItems.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No items scheduled for this day</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedItems.map(item => (
              <div
                key={item.id}
                className="p-4 bg-bg-card border border-border rounded-lg hover:bg-bg-light transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color || (item.type === 'event' ? '#3b82f6' : '#f59e0b') }}
                      />
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.type === 'event'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-orange-500/20 text-orange-300'
                      }`}>
                        {item.type}
                      </span>
                    </div>

                    {item.time && (
                      <div className="flex items-center gap-1 text-sm text-text-muted mb-2">
                        <Clock className="w-4 h-4" />
                        {item.time}
                      </div>
                    )}

                    {item.location && (
                      <div className="flex items-center gap-1 text-sm text-text-muted mb-2">
                        <MapPin className="w-4 h-4" />
                        {item.location}
                      </div>
                    )}

                    {item.attendeesCount && item.attendeesCount > 0 && (
                      <div className="flex items-center gap-1 text-sm text-text-muted mb-2">
                        <Users className="w-4 h-4" />
                        {item.attendeesCount} attendee{item.attendeesCount !== 1 ? 's' : ''}
                      </div>
                    )}

                    {item.description && (
                      <p className="text-sm text-text-muted mb-2 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {(item.jobTitle || item.jobCompany) && (
                      <div className="text-xs text-text-secondary">
                        {item.jobTitle && item.jobCompany
                          ? `${item.jobTitle} at ${item.jobCompany}`
                          : item.jobTitle || item.jobCompany
                        }
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="small"
                      icon={<Edit className="w-4 h-4" />}
                      onClick={() => onEditItem(item)}
                      className="text-primary border-primary hover:bg-primary hover:text-white"
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      danger
                      icon={<RiDeleteBin6Line className="w-4 h-4" />}
                      onClick={() => handleDeleteItem(item)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DayViewModal;
