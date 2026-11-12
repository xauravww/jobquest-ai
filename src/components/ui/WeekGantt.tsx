'use client';

import React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import Button from '@/components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface GanttItem {
  id?: string;
  title: string;
  date: Dayjs;
  type: 'reminder' | 'event';
  color?: string;
}

interface WeekGanttProps {
  items: GanttItem[];
  weekStart: Dayjs;
  onNavigate: (weeks: number) => void;
  onOpenDay: (items: GanttItem[], date: Dayjs) => void;
}

const GRID = '150px repeat(7, minmax(0, 1fr))';

const WeekGantt: React.FC<WeekGanttProps> = ({ items, weekStart, onNavigate, onOpenDay }) => {
  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));
  const label = `${weekStart.format('MMM D')} – ${weekStart.add(6, 'day').format('MMM D, YYYY')}`;

  const weekItems = items.filter((item) => {
    const diff = item.date.startOf('day').diff(weekStart.startOf('day'), 'day');
    return diff >= 0 && diff <= 6;
  });

  const openDay = (date: Dayjs) => {
    const key = date.format('YYYY-MM-DD');
    const dayItems = items.filter((i) => i.date.format('YYYY-MM-DD') === key);
    onOpenDay(dayItems, date);
  };

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-4">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onNavigate(-1)}
          aria-label="Previous week"
          className="px-3 py-1.5 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </Button>
        <div className="text-sm font-semibold text-[var(--text-main)]">{label}</div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onNavigate(1)}
          aria-label="Next week"
          className="px-3 py-1.5 flex items-center gap-1"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Day header */}
      <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: GRID }}>
        <div />
        {days.map((d) => {
          const today = d.isSame(weekStart, 'day') && d.isSame(dayjs(), 'day');
          return (
            <Button
              key={d.format('YYYY-MM-DD')}
              type="button"
              variant={today ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => openDay(d)}
              className="flex-col gap-0 px-2 py-1.5 rounded-lg text-xs w-full"
            >
              <span>{d.format('ddd')}</span>
              <span className="text-[11px] opacity-80">{d.format('D')}</span>
            </Button>
          );
        })}
      </div>

      {/* Item lanes */}
      {weekItems.length === 0 ? (
        <div className="py-10 text-center text-sm text-[var(--text-muted)]">
          Nothing scheduled for this week.
        </div>
      ) : (
        <div className="space-y-1.5">
          {weekItems.map((item) => {
            const diff = item.date.startOf('day').diff(weekStart.startOf('day'), 'day');
            return (
              <div key={item.id || item.title} className="grid gap-1 items-center" style={{ gridTemplateColumns: GRID }}>
                <div className="truncate pr-2 text-sm text-[var(--text-main)]">{item.title}</div>
                {days.map((d, idx) => (
                  <div key={d.format('YYYY-MM-DD')} className="h-8">
                    {idx === diff && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openDay(d)}
                        className={`w-full h-8 flex items-center gap-1.5 px-2 rounded-lg text-xs justify-start truncate ${
                          item.type === 'reminder'
                            ? 'bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent-soft)]/70'
                            : 'bg-[var(--bg-raised)] text-[var(--text-main)] border border-[var(--border-strong)] hover:bg-[var(--bg-glass)]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.type === 'reminder' ? 'bg-[var(--accent)]' : 'bg-[var(--primary)]'}`} />
                        <span className="truncate">{item.title}</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WeekGantt;
