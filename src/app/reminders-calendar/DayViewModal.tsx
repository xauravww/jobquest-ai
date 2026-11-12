'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Calendar, Clock, MapPin, Users, Edit3, Trash2, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import dayjs, { Dayjs } from 'dayjs';
import { confirmAction } from '@/lib/confirm';

export interface CalendarItem {
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
  onAddNew?: (type: 'reminder' | 'event') => void;
  onRefresh: () => void;
}

const DayViewModal: React.FC<DayViewModalProps> = ({
  isOpen,
  onClose,
  date,
  items,
  onEditItem,
  onAddNew,
  onRefresh
}) => {
  const handleDeleteItem = (item: CalendarItem) => {
    confirmAction({
      title: `Delete ${item.type === 'reminder' ? 'Reminder' : 'Event'}`,
      content: `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
      okText: 'Delete',
      onOk: async () => {
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
      },
    });
  };

  const sortedItems = [...items].sort((a, b) => {
    if (a.time && b.time) {
      return a.time.localeCompare(b.time);
    }
    return a.title.localeCompare(b.title);
  });

  const reminders = sortedItems.filter(i => i.type === 'reminder');
  const events = sortedItems.filter(i => i.type === 'event');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${date.format('dddd, MMMM D, YYYY')}`}
      width="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Header bar with summary & quick add */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[var(--bg-deep)] rounded-xl border border-[var(--border)]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[rgba(255,255,255,0.06)] text-[var(--text-main)] border border-[var(--border)]">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              {reminders.length} reminder{reminders.length === 1 ? '' : 's'} · {events.length} event{events.length === 1 ? '' : 's'}
            </span>
          </div>
          {onAddNew && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddNew('reminder')}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="h-7 px-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                Reminder
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddNew('event')}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="h-7 px-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                Event
              </Button>
            </div>
          )}
        </div>

        {/* Content list */}
        {sortedItems.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-deep)]/40">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-[var(--text-dim)]" />
            <h4 className="text-sm font-medium text-[var(--text-main)] mb-1">Nothing scheduled</h4>
            <p className="text-xs text-[var(--text-muted)] mb-5">
              No reminders or events on this day.
            </p>
            {onAddNew && (
              <div className="inline-flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onAddNew('reminder')}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Reminder
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onAddNew('event')}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Event
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedItems.map((item) => {
              const isReminder = item.type === 'reminder';
              const isCompleted = item.status === 'completed';

              return (
                <div
                  key={item.id}
                  className="group relative p-4 bg-[var(--bg-deep)] hover:bg-[var(--bg-raised)] border border-[var(--border)] hover:border-[var(--border-strong)] rounded-xl transition-all duration-150"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Status indicator dot */}
                      <div className="mt-1 flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-[var(--live)]" />
                        ) : (
                          <span
                            className="block w-2.5 h-2.5 rounded-full ring-2 ring-black/40"
                            style={{
                              backgroundColor: item.color || (isReminder ? '#f0f2f5' : '#8b929e')
                            }}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-[var(--text-main)] truncate">
                            {item.title}
                          </h4>
                          <span
                            className={`text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border ${
                              isReminder
                                ? 'bg-[rgba(255,255,255,0.06)] text-[var(--text-main)] border-[var(--border)]'
                                : 'bg-[rgba(139,146,158,0.12)] text-[var(--text-muted)] border-[var(--border)]'
                            }`}
                          >
                            {item.type}
                          </span>
                          {item.priority && (
                            <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.03)] text-[var(--text-dim)] border border-[var(--border)]">
                              {item.priority}
                            </span>
                          )}
                        </div>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)] mt-1.5">
                          {item.time && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                              <span>{item.time}</span>
                            </div>
                          )}

                          {item.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                              <span className="truncate max-w-[200px]">{item.location}</span>
                            </div>
                          )}

                          {item.attendeesCount !== undefined && item.attendeesCount > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                              <span>{item.attendeesCount} attendee{item.attendeesCount !== 1 ? 's' : ''}</span>
                            </div>
                          )}

                          {(item.jobTitle || item.jobCompany) && (
                            <span className="text-[var(--text-dim)]">
                              {item.jobTitle && item.jobCompany
                                ? `${item.jobTitle} @ ${item.jobCompany}`
                                : item.jobTitle || item.jobCompany}
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditItem(item)}
                        aria-label="Edit"
                        className="h-8 w-8 p-0 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item)}
                        aria-label="Delete"
                        className="h-8 w-8 p-0 text-[var(--text-dim)] hover:text-[var(--danger)]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal footer */}
        <div className="flex justify-end pt-3 border-t border-[var(--border)]">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DayViewModal;
