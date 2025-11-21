'use client';

import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';

interface CustomCalendarPickerProps {
  value?: dayjs.Dayjs;
  onChange?: (date: dayjs.Dayjs) => void;
  className?: string;
}

const CustomCalendarPicker: React.FC<CustomCalendarPickerProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(value || null);

  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setCurrentMonth(value);
    }
  }, [value]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => prev.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => prev.add(1, 'month'));
  };

  const handleDateClick = (date: dayjs.Dayjs) => {
    setSelectedDate(date);
    onChange?.(date);
  };

  const renderCalendar = () => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDate = startOfMonth.startOf('week');
    const endDate = endOfMonth.endOf('week');

    const days = [];
    let day = startDate;

    while (day.isBefore(endDate) || day.isSame(endDate, 'day')) {
      const isCurrentMonth = day.month() === currentMonth.month();
      const isSelected = selectedDate && day.isSame(selectedDate, 'day');
      const isToday = day.isSame(dayjs(), 'day');

      days.push(
        <div
          key={day.toString()}
          className={`picker-day ${isSelected ? 'selected' : ''} ${isToday ? 'ring-2 ring-primary' : ''} ${!isCurrentMonth ? 'text-text-secondary' : ''}`}
          onClick={() => handleDateClick(day)}
          role="button"
          tabIndex={0}
          aria-selected={isSelected || undefined}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleDateClick(day);
            }
          }}
        >
          {day.date()}
        </div>
      );
      day = day.add(1, 'day');
    }

    return days;
  };

  return (
    <div className={`bg-surface p-6 rounded-lg shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <button
          className="text-primary hover:text-primary-hover"
          onClick={handlePrevMonth}
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <span className="text-lg font-medium">{currentMonth.format('MMMM YYYY')}</span>
        <button
          className="text-primary hover:text-primary-hover"
          onClick={handleNextMonth}
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>
      <div className="picker-grid">
        <div className="text-text-secondary text-sm font-medium">Su</div>
        <div className="text-text-secondary text-sm font-medium">Mo</div>
        <div className="text-text-secondary text-sm font-medium">Tu</div>
        <div className="text-text-secondary text-sm font-medium">We</div>
        <div className="text-text-secondary text-sm font-medium">Th</div>
        <div className="text-text-secondary text-sm font-medium">Fr</div>
        <div className="text-text-secondary text-sm font-medium">Sa</div>
        {renderCalendar()}
      </div>
    </div>
  );
};

export default CustomCalendarPicker;