'use client';

import React from 'react';
import {
    Clock,
    CheckCircle,
    AlertCircle,
    Calendar,
    MapPin,
    Users,
    FileText,
    Tag,
    PauseCircle,
    Edit,
    Trash2
} from 'lucide-react';

interface ReminderCardProps {
    reminder: {
        _id: string;
        title: string;
        description?: string;
        dueDate: string;
        dueTime: string;
        type: string;
        priority: string;
        status: string;
        applicationId?: {
            _id: string;
            status: string;
            jobId: string;
        };
        jobId?: {
            _id: string;
            title: string;
            company: string;
        };
        tags: string[];
        color: string;
        completedAt?: string;
        snoozedUntil?: string;
        snoozeCount: number;
    };
    onComplete?: (id: string) => void;
    onSnooze?: (id: string, snoozeUntil: Date) => void;
    onEdit?: (reminder: unknown) => void;
    onDelete?: (id: string) => void;
    compact?: boolean;
}

const ReminderCard: React.FC<ReminderCardProps> = ({
    reminder,
    onComplete,
    onSnooze,
    onEdit,
    onDelete,
    compact = false
}) => {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-500 bg-red-50 border-red-200';
            case 'high': return 'text-orange-500 bg-orange-50 border-orange-200';
            case 'medium': return 'text-yellow-500 bg-yellow-50 border-yellow-200';
            case 'low': return 'text-green-500 bg-green-50 border-green-200';
            default: return 'text-gray-500 bg-gray-50 border-gray-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-100';
            case 'pending': return 'text-blue-600 bg-blue-100';
            case 'snoozed': return 'text-yellow-600 bg-yellow-100';
            case 'cancelled': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'follow_up': return <Clock className="w-4 h-4" />;
            case 'interview_prep': return <FileText className="w-4 h-4" />;
            case 'application_deadline': return <AlertCircle className="w-4 h-4" />;
            case 'interview_scheduled': return <Calendar className="w-4 h-4" />;
            case 'networking': return <Users className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const formatDate = (dateString: string, timeString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let dateLabel = '';
        if (date.toDateString() === today.toDateString()) {
            dateLabel = 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            dateLabel = 'Tomorrow';
        } else {
            dateLabel = date.toLocaleDateString();
        }

        return `${dateLabel} at ${timeString}`;
    };

    const isOverdue = () => {
        const dueDateTime = new Date(`${reminder.dueDate}T${reminder.dueTime}`);
        return dueDateTime < new Date() && reminder.status === 'pending';
    };

    if (compact) {
        return (
            <div className={`flex items-center gap-3 p-3 bg-bg-light rounded-lg border border-border hover:border-primary/50 transition-colors ${isOverdue() ? 'border-red-500/50 bg-red-50/5' : ''
                }`}>
                <div className="flex-shrink-0">
                    <div className={`p-2 rounded-lg ${getPriorityColor(reminder.priority)}`}>
                        {getTypeIcon(reminder.type)}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium text-sm ${reminder.status === 'completed' ? 'line-through text-text-muted' : 'text-white'}`}>
                            {reminder.title}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reminder.status)}`}>
                            {reminder.status}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(reminder.dueDate, reminder.dueTime)}
                        </span>

                        {reminder.jobId && (
                            <span className="flex items-center gap-1 truncate">
                                <FileText className="w-3 h-3" />
                                {reminder.jobId.title}
                            </span>
                        )}
                    </div>
                </div>

                {reminder.status === 'pending' && onComplete && (
                    <button
                        onClick={() => onComplete(reminder._id)}
                        className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                        title="Complete"
                    >
                        <CheckCircle className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={`p-4 bg-bg-light rounded-lg border border-border hover:border-primary/50 transition-colors ${isOverdue() ? 'border-red-500/50 bg-red-50/5' : ''
            }`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${getPriorityColor(reminder.priority)}`}>
                        {getTypeIcon(reminder.type)}
                    </div>
                    <div>
                        <h3 className={`font-medium ${reminder.status === 'completed' ? 'line-through text-text-muted' : 'text-white'}`}>
                            {reminder.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(reminder.priority)}`}>
                                {reminder.priority}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reminder.status)}`}>
                                {reminder.status}
                            </span>
                            {isOverdue() && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100">
                                    Overdue
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {reminder.status === 'pending' && (
                        <>
                            {onComplete && (
                                <button
                                    onClick={() => onComplete(reminder._id)}
                                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                    title="Complete"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                </button>
                            )}
                            {onSnooze && (
                                <button
                                    onClick={() => onSnooze(reminder._id, new Date(Date.now() + 24 * 60 * 60 * 1000))}
                                    className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
                                    title="Snooze"
                                >
                                    <PauseCircle className="w-4 h-4" />
                                </button>
                            )}
                        </>
                    )}

                    {onEdit && (
                        <button
                            onClick={() => onEdit(reminder)}
                            className="p-2 text-text-muted hover:text-primary hover:bg-bg rounded-lg transition-colors"
                            title="Edit"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                    )}

                    {onDelete && (
                        <button
                            onClick={() => onDelete(reminder._id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {reminder.description && (
                <p className="text-text-muted text-sm mb-3">{reminder.description}</p>
            )}

            <div className="flex items-center gap-4 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(reminder.dueDate, reminder.dueTime)}
                </span>

                {reminder.jobId && (
                    <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {reminder.jobId.title} at {reminder.jobId.company}
                    </span>
                )}

                {reminder.tags.length > 0 && (
                    <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {reminder.tags.join(', ')}
                    </span>
                )}

                {reminder.snoozedUntil && (
                    <span className="flex items-center gap-1 text-yellow-600">
                        <PauseCircle className="w-3 h-3" />
                        Snoozed until {new Date(reminder.snoozedUntil).toLocaleDateString()}
                    </span>
                )}
            </div>
        </div>
    );
};

export default ReminderCard;