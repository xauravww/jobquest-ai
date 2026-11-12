'use client';

import React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import Button from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Bell, MapPin, Plus } from 'lucide-react';

export interface GanttItem {
  id?: string;
  title: string;
  date: Dayjs;
  type: 'reminder' | 'event';
  color?: string;
  time?: string;
  location?: string;
  priority?: string;
  status?: string;
  description?: string;
  jobCompany?: string;
}

interface WeekGanttProps {
  items: GanttItem[];
  weekStart: Dayjs;
  onNavigate: (weeks: number) => void;
  onOpenDay: (items: GanttItem[], date: Dayjs) => void;
  onToday: () => void;
}

const WeekGantt: React.FC<WeekGanttProps> = ({
  items,
  weekStart,
  onNavigate,
  onOpenDay,
  onToday,
}) => {
  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));
  const today = dayjs().startOf('day');
  const isCurrentWeek = days.some((d) => d.isSame(today, 'day'));

  const label = `${weekStart.format('MMM D')} – ${weekStart.add(6, 'day').format('MMM D, YYYY')}`;

  // Group items for this week by day key (YYYY-MM-DD)
  const itemsByDay = React.useMemo(() => {
    const map: Record<string, GanttItem[]> = {};
    for (const d of days) {
      map[d.format('YYYY-MM-DD')] = [];
    }
    for (const item of items) {
      const key = item.date.format('YYYY-MM-DD');
      if (map[key]) {
        map[key].push(item);
      }
    }
    return map;
  }, [items, days]);

  const openDay = (date: Dayjs) => {
    const key = date.format('YYYY-MM-DD');
    const dayItems = itemsByDay[key] || [];
    onOpenDay(dayItems, date);
  };

  const totalWeekItems = React.useMemo(() => {
    return Object.values(itemsByDay).reduce((sum, list) => sum + list.length, 0);
  }, [itemsByDay]);

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-xl">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-deep)]/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[var(--border)] text-[var(--text-main)]">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-semibold text-[var(--text-main)] flex items-center gap-2">
              <span>{label}</span>
              {isCurrentWeek && (
                <span className="text-[10px] tracking-wider uppercase font-mono px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.12)] text-[var(--live)] border border-[rgba(34,197,94,0.3)]">
                  Current Week
                </span>
              )}
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              {totalWeekItems} {totalWeekItems === 1 ? 'task scheduled' : 'tasks scheduled'} this week
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToday}
            className="h-8 px-3 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            Today
          </Button>
          <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--bg-deep)] p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onNavigate(-1)}
              aria-label="Previous week"
              className="h-7 w-7 p-0 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onNavigate(1)}
              aria-label="Next week"
              className="h-7 w-7 p-0 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-md"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 7-Day Columns (Linear / modern calendar timeline view) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border)] min-h-[460px]">
        {days.map((d) => {
          const dateKey = d.format('YYYY-MM-DD');
          const dayItems = itemsByDay[dateKey] || [];
          const isToday = d.isSame(today, 'day');
          const isPast = d.isBefore(today, 'day');

          return (
            <div
              key={dateKey}
              onClick={() => openDay(d)}
              className={`group flex flex-col cursor-pointer transition-colors duration-150 p-3 ${
                isToday
                  ? 'bg-[rgba(255,255,255,0.03)]'
                  : 'hover:bg-[rgba(255,255,255,0.015)]'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-dim)]">
                    {d.format('ddd')}
                  </div>
                  <div
                    className={`text-lg font-semibold tracking-tight ${
                      isToday
                        ? 'text-white'
                        : isPast
                        ? 'text-[var(--text-muted)]'
                        : 'text-[var(--text-main)]'
                    }`}
                  >
                    {d.format('D')}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {dayItems.length > 0 && (
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-full bg-[rgba(255,255,255,0.06)] text-[var(--text-muted)] border border-[var(--border)]">
                      {dayItems.length}
                    </span>
                  )}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--bg-raised)] text-[var(--text-muted)]">
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Items Card Stack */}
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[380px] pr-0.5 custom-scrollbar">
                {dayItems.length === 0 ? (
                  <div className="h-28 flex flex-col items-center justify-center text-center text-[var(--text-dim)] text-xs rounded-lg border border-dashed border-transparent group-hover:border-[var(--border)] transition-colors">
                    <span className="opacity-0 group-hover:opacity-60 transition-opacity text-[11px]">
                      + Click to open
                    </span>
                  </div>
                ) : (
                  dayItems.map((item) => {
                    const isReminder = item.type === 'reminder';
                    return (
                      <div
                        key={item.id || item.title}
                        onClick={(e) => {
                          e.stopPropagation();
                          openDay(d);
                        }}
                        className="group/item text-left p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] hover:bg-[var(--bg-raised)] hover:border-[var(--border-strong)] transition-all duration-150 shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor: item.color || (isReminder ? '#f0f2f5' : '#8b929e'),
                            }}
                          />
                          <span className="text-[10px] font-mono tracking-wider uppercase text-[var(--text-dim)]">
                            {item.type}
                          </span>
                        </div>

                        <div className="text-xs font-medium text-[var(--text-main)] line-clamp-2 mb-1 group-hover/item:text-white leading-snug">
                          {item.title}
                        </div>

                        {item.time && (
                          <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                            <Clock className="w-3 h-3 text-[var(--text-dim)]" />
                            <span className="truncate">{item.time}</span>
                          </div>
                        )}

                        {item.jobCompany && (
                          <div className="text-[10px] text-[var(--text-dim)] truncate mt-1">
                            {item.jobCompany}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekGantt;
