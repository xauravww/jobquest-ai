'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input, Select, Button, Tag, Modal, DatePicker, TimePicker, Pagination, Form, Tabs } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import {
    Phone,
    Mail,
    MessageSquare,
    Calendar,
    User,
    Building,
    Clock,
    Plus,
    Search,
    Filter,
    TrendingUp,
    CheckCircle,
    AlertCircle,
    Eye,
    Edit,
    Trash2,
    ExternalLink,
    History,
    X,
    Send,
    UserPlus,
    Target,
    Zap
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ActivitySkeleton from '@/components/ui/ActivitySkeleton';
import toast from 'react-hot-toast';

const { Search: AntSearch } = Input;
const { Option } = Select;
const { TextArea } = Input;

interface Contact {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    company: string;
    linkedIn?: string;
    notes?: string;
    lastContactDate?: string;
    nextFollowUpDate?: string;
    tags: string[];
    status: 'active' | 'inactive' | 'responded' | 'no_response';
}

interface FollowUp {
    id: string;
    contactId: string;
    contact?: Contact;
    type: 'email' | 'phone' | 'linkedin' | 'in_person' | 'other';
    subject: string;
    message: string;
    scheduledDate: string;
    completedDate?: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'overdue';
    response?: string;
    nextAction?: string;
    jobId?: string;
    applicationId?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    tags: string[];
    attachments?: Array<{
        name: string;
        url: string;
        type: string;
    }>;
}

interface FollowUpHistory {
    id: string;
    contactId: string;
    date: string;
    type: string;
    subject: string;
    outcome: 'positive' | 'neutral' | 'negative' | 'no_response';
    notes: string;
    nextSteps?: string;
}

interface FollowUpTrackerProps {
    className?: string;
}

const FollowUpTracker: React.FC<FollowUpTrackerProps> = ({ className = '' }) => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [history, setHistory] = useState<FollowUpHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'contacts' | 'followups' | 'history'>('followups');
    const [isCreatingContact, setIsCreatingContact] = useState(false);
    const [isCreatingFollowUp, setIsCreatingFollowUp] = useState(false);

    // Filters and pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [sortBy, setSortBy] = useState('scheduledDate');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    // Modals
    const [showContactModal, setShowContactModal] = useState(false);
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);

    // Form states
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        company: '',
        linkedIn: '',
        notes: '',
        tags: [] as string[]
    });

    const [followUpForm, setFollowUpForm] = useState({
        contactId: '',
        type: 'email' as const,
        subject: '',
        message: '',
        scheduledDate: dayjs().add(1, 'day'),
        scheduledTime: dayjs().hour(9).minute(0),
        priority: 'medium' as const,
        tags: [] as string[]
    });

    // Form validation errors
    const [contactFormErrors, setContactFormErrors] = useState<Record<string, string>>({});
    const [followUpFormErrors, setFollowUpFormErrors] = useState<Record<string, string>>({});

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch real data from API endpoints
            try {
                // Fetch contacts
                const contactsResponse = await fetch('/api/contacts');
                if (contactsResponse.ok) {
                    const contactsData = await contactsResponse.json();
                    setContacts(contactsData.contacts || []);
                } else {
                    console.warn('Failed to fetch contacts:', contactsResponse.status);
                    setContacts([]);
                }

                // Fetch follow-ups
                const followUpsResponse = await fetch('/api/follow-ups');
                if (followUpsResponse.ok) {
                    const followUpsData = await followUpsResponse.json();
                    setFollowUps(followUpsData.followUps || []);
                } else {
                    console.warn('Failed to fetch follow-ups:', followUpsResponse.status);
                    setFollowUps([]);
                }

                // Fetch history
                const historyResponse = await fetch('/api/follow-up-history');
                if (historyResponse.ok) {
                    const historyData = await historyResponse.json();
                    setHistory(historyData.history || []);
                } else {
                    console.warn('Failed to fetch follow-up history:', historyResponse.status);
                    setHistory([]);
                }
            } catch (error) {
                console.error('Error fetching follow-up data:', error);
                setContacts([]);
                setFollowUps([]);
                setHistory([]);
            }
        } catch (error) {
            console.error('Error fetching follow-up data:', error);
            toast.error('Failed to load follow-up data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter and sort functions
    const getFilteredFollowUps = () => {
        let filtered = followUps;

        if (searchQuery) {
            filtered = filtered.filter(f =>
                f.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contacts.find(c => c.id === f.contactId)?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contacts.find(c => c.id === f.contactId)?.company.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(f => f.status === statusFilter);
        }

        if (typeFilter !== 'all') {
            filtered = filtered.filter(f => f.type === typeFilter);
        }

        if (priorityFilter !== 'all') {
            filtered = filtered.filter(f => f.priority === priorityFilter);
        }

        // Sort the results
        filtered.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'scheduledDate':
                    aValue = dayjs(a.scheduledDate).valueOf();
                    bValue = dayjs(b.scheduledDate).valueOf();
                    break;
                case 'priority':
                    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
                    aValue = priorityOrder[a.priority];
                    bValue = priorityOrder[b.priority];
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                case 'type':
                    aValue = a.type;
                    bValue = b.type;
                    break;
                default:
                    aValue = a.subject.toLowerCase();
                    bValue = b.subject.toLowerCase();
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    };

    const getFilteredContacts = () => {
        let filtered = contacts;

        if (searchQuery) {
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.role.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Sort contacts
        filtered.sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.name.localeCompare(b.name);
            } else {
                return b.name.localeCompare(a.name);
            }
        });

        return filtered;
    };

    // Pagination helpers
    const getPaginatedData = (data: any[]) => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return data.slice(startIndex, endIndex);
    };

    // Form validation
    const validateContactForm = () => {
        const errors: Record<string, string> = {};

        if (!contactForm.name.trim()) {
            errors.name = 'Name is required';
        } else if (contactForm.name.trim().length < 2) {
            errors.name = 'Name must be at least 2 characters';
        }

        if (!contactForm.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!contactForm.role.trim()) {
            errors.role = 'Role is required';
        }

        if (!contactForm.company.trim()) {
            errors.company = 'Company is required';
        }

        if (contactForm.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(contactForm.phone.replace(/[\s\-\(\)]/g, ''))) {
            errors.phone = 'Please enter a valid phone number';
        }

        setContactFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateFollowUpForm = () => {
        const errors: Record<string, string> = {};

        if (!followUpForm.contactId) {
            errors.contactId = 'Please select a contact';
        }

        if (!followUpForm.subject.trim()) {
            errors.subject = 'Subject is required';
        } else if (followUpForm.subject.trim().length < 5) {
            errors.subject = 'Subject must be at least 5 characters';
        }

        if (!followUpForm.message.trim()) {
            errors.message = 'Message is required';
        } else if (followUpForm.message.trim().length < 10) {
            errors.message = 'Message must be at least 10 characters';
        }

        if (!followUpForm.scheduledDate) {
            errors.scheduledDate = 'Please select a date';
        } else if (followUpForm.scheduledDate.isBefore(dayjs(), 'day')) {
            errors.scheduledDate = 'Date cannot be in the past';
        }

        setFollowUpFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle form submissions
    const handleCreateContact = async () => {
        if (!validateContactForm()) {
            toast.error('Please fix the form errors');
            return;
        }

        try {
            setIsCreatingContact(true);

            const response = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactForm)
            });

            if (response.ok) {
                const data = await response.json();
                setContacts(prev => [...prev, data.contact]);
                setShowContactModal(false);
                setContactForm({
                    name: '',
                    email: '',
                    phone: '',
                    role: '',
                    company: '',
                    linkedIn: '',
                    notes: '',
                    tags: []
                });
                setContactFormErrors({});
                toast.success('Contact created successfully');
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to create contact');
            }
        } catch (error) {
            console.error('Error creating contact:', error);
            toast.error('Failed to create contact');
        } finally {
            setIsCreatingContact(false);
        }
    };

    const handleCreateFollowUp = async () => {
        if (!validateFollowUpForm()) {
            toast.error('Please fix the form errors');
            return;
        }

        try {
            setIsCreatingFollowUp(true);

            const scheduledDateTime = followUpForm.scheduledDate
                .hour(followUpForm.scheduledTime.hour())
                .minute(followUpForm.scheduledTime.minute());

            const payload = {
                contactId: followUpForm.contactId,
                type: followUpForm.type,
                subject: followUpForm.subject,
                message: followUpForm.message,
                scheduledDate: scheduledDateTime.toISOString(),
                priority: followUpForm.priority,
                tags: followUpForm.tags
            };

            const response = await fetch('/api/follow-ups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                setFollowUps(prev => [...prev, data.followUp]);
                setShowFollowUpModal(false);
                setFollowUpForm({
                    contactId: '',
                    type: 'email',
                    subject: '',
                    message: '',
                    scheduledDate: dayjs().add(1, 'day'),
                    scheduledTime: dayjs().hour(9).minute(0),
                    priority: 'medium',
                    tags: []
                });
                setFollowUpFormErrors({});
                toast.success('Follow-up scheduled successfully');
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Failed to schedule follow-up');
            }
        } catch (error) {
            console.error('Error creating follow-up:', error);
            toast.error('Failed to schedule follow-up');
        } finally {
            setIsCreatingFollowUp(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'green';
            case 'scheduled': return 'blue';
            case 'overdue': return 'red';
            case 'cancelled': return 'gray';
            default: return 'default';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'red';
            case 'high': return 'orange';
            case 'medium': return 'blue';
            case 'low': return 'gray';
            default: return 'default';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'email': return <Mail className="w-4 h-4" />;
            case 'phone': return <Phone className="w-4 h-4" />;
            case 'linkedin': return <ExternalLink className="w-4 h-4" />;
            case 'in_person': return <User className="w-4 h-4" />;
            default: return <MessageSquare className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className={`space-y-6 ${className}`}>
                {/* Header skeleton */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-8 bg-gray-700 rounded loading-skeleton w-48"></div>
                        <div className="h-4 bg-gray-700 rounded loading-skeleton w-64"></div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-10 bg-gray-700 rounded loading-skeleton w-32"></div>
                        <div className="h-10 bg-gray-700 rounded loading-skeleton w-40"></div>
                    </div>
                </div>

                {/* Tabs skeleton */}
                <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1 border border-gray-700">
                    {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className="h-10 bg-gray-700 rounded loading-skeleton flex-1"></div>
                    ))}
                </div>

                {/* Filters skeleton */}
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <div className="space-y-4">
                        <div className="h-5 bg-gray-700 rounded loading-skeleton w-32"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 4 }, (_, i) => (
                                <div key={i} className="h-10 bg-gray-700 rounded loading-skeleton"></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content skeleton */}
                <ActivitySkeleton count={5} />
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-green-500/20 to-green-500/10 rounded-lg border border-green-500/30">
                            <TrendingUp className="w-6 h-6 text-green-500" />
                        </div>
                        Follow-up Tracker
                    </h2>
                    <p className="text-gray-400 mt-1">
                        Manage your networking and follow-up communications
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => setShowContactModal(true)}
                        className="btn-secondary"
                    >
                        Add Contact
                    </Button>
                    <Button
                        type="primary"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => setShowFollowUpModal(true)}
                        className="btn-primary"
                    >
                        Schedule Follow-up
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs
                activeKey={activeTab}
                onChange={(key) => {
                    setActiveTab(key as any);
                    setCurrentPage(1); // Reset pagination when switching tabs
                    setSearchQuery(''); // Clear search when switching tabs
                }}
                className="custom-dark-tabs"
                items={[
                    {
                        key: 'followups',
                        label: (
                            <span className="flex items-center gap-2">
                                Follow-ups
                                {followUps.length > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                                        {followUps.length}
                                    </span>
                                )}
                            </span>
                        ),
                    },
                    {
                        key: 'contacts',
                        label: (
                            <span className="flex items-center gap-2">
                                Contacts
                                {contacts.length > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                        {contacts.length}
                                    </span>
                                )}
                            </span>
                        ),
                    },
                    {
                        key: 'history',
                        label: (
                            <span className="flex items-center gap-2">
                                History
                                {history.length > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                        {history.length}
                                    </span>
                                )}
                            </span>
                        ),
                    },
                ]}
            />

            {/* Filters */}
            <div className="filter-panel rounded-xl p-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-300">Filters & Search</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <AntSearch
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full"
                            allowClear
                        />

                        {activeTab === 'followups' && (
                            <>
                                <Select
                                    value={statusFilter}
                                    onChange={(value) => {
                                        setStatusFilter(value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full"
                                    placeholder="Filter by status"
                                >
                                    <Option value="all">All Status</Option>
                                    <Option value="scheduled">Scheduled</Option>
                                    <Option value="completed">Completed</Option>
                                    <Option value="overdue">Overdue</Option>
                                    <Option value="cancelled">Cancelled</Option>
                                </Select>

                                <Select
                                    value={typeFilter}
                                    onChange={(value) => {
                                        setTypeFilter(value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full"
                                    placeholder="Filter by type"
                                >
                                    <Option value="all">All Types</Option>
                                    <Option value="email">Email</Option>
                                    <Option value="phone">Phone</Option>
                                    <Option value="linkedin">LinkedIn</Option>
                                    <Option value="in_person">In Person</Option>
                                </Select>

                                <Select
                                    value={priorityFilter}
                                    onChange={(value) => {
                                        setPriorityFilter(value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full"
                                    placeholder="Filter by priority"
                                >
                                    <Option value="all">All Priority</Option>
                                    <Option value="urgent">Urgent</Option>
                                    <Option value="high">High</Option>
                                    <Option value="medium">Medium</Option>
                                    <Option value="low">Low</Option>
                                </Select>
                            </>
                        )}

                        {activeTab === 'contacts' && (
                            <>
                                <div className="col-span-2"></div>
                                <div className="flex items-center justify-between stats-card px-3 py-2">
                                    <span className="text-sm text-gray-400">Total:</span>
                                    <span className="text-sm font-medium text-white">{getFilteredContacts().length} contacts</span>
                                </div>
                            </>
                        )}

                        {activeTab === 'history' && (
                            <>
                                <div className="col-span-2"></div>
                                <div className="flex items-center justify-between stats-card px-3 py-2">
                                    <span className="text-sm text-gray-400">Total:</span>
                                    <span className="text-sm font-medium text-white">{history.length} items</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Quick filter buttons for follow-ups */}
                    {activeTab === 'followups' && (
                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="small"
                                type={statusFilter === 'scheduled' ? 'primary' : 'default'}
                                onClick={() => {
                                    setStatusFilter(statusFilter === 'scheduled' ? 'all' : 'scheduled');
                                    setCurrentPage(1);
                                }}
                                className={statusFilter === 'scheduled' ? 'btn-primary' : 'btn-secondary'}
                            >
                                Scheduled ({followUps.filter(f => f.status === 'scheduled').length})
                            </Button>
                            <Button
                                size="small"
                                type={statusFilter === 'overdue' ? 'primary' : 'default'}
                                onClick={() => {
                                    setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue');
                                    setCurrentPage(1);
                                }}
                                className={statusFilter === 'overdue' ? 'tag-status-overdue' : 'btn-secondary'}
                            >
                                Overdue ({followUps.filter(f => dayjs(f.scheduledDate).isBefore(dayjs()) && f.status === 'scheduled').length})
                            </Button>
                            <Button
                                size="small"
                                type={priorityFilter === 'urgent' ? 'primary' : 'default'}
                                onClick={() => {
                                    setPriorityFilter(priorityFilter === 'urgent' ? 'all' : 'urgent');
                                    setCurrentPage(1);
                                }}
                                className={priorityFilter === 'urgent' ? 'bg-red-600' : ''}
                            >
                                Urgent ({followUps.filter(f => f.priority === 'urgent').length})
                            </Button>
                            {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all') && (
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setStatusFilter('all');
                                        setTypeFilter('all');
                                        setPriorityFilter('all');
                                        setCurrentPage(1);
                                    }}
                                    className="text-gray-400 hover:text-white"
                                >
                                    Clear All
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Sort and pagination controls */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">Sort by:</span>
                                <Select
                                    value={sortBy}
                                    onChange={setSortBy}
                                    className="w-32"
                                    size="small"
                                >
                                    <Option value="scheduledDate">Date</Option>
                                    <Option value="priority">Priority</Option>
                                    <Option value="status">Status</Option>
                                    <Option value="type">Type</Option>
                                    <Option value="subject">Subject</Option>
                                </Select>
                                <Button
                                    size="small"
                                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                    className="text-gray-400 hover:text-white"
                                    title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                                >
                                    {sortOrder === 'asc' ? '↑' : '↓'}
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">Show:</span>
                                <Select
                                    value={pageSize}
                                    onChange={(value) => {
                                        setPageSize(value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-16"
                                    size="small"
                                >
                                    <Option value={6}>6</Option>
                                    <Option value={12}>12</Option>
                                    <Option value={24}>24</Option>
                                    <Option value={48}>48</Option>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'followups' && (
                <div className="space-y-4">
                    {getFilteredFollowUps().length === 0 ? (
                        <div className="empty-state">
                            <div className="mb-6">
                                <MessageSquare className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-300 mb-2">No follow-ups found</h3>
                                <p className="text-gray-500 mb-4">
                                    {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all'
                                        ? 'Try adjusting your filters to see more follow-ups'
                                        : 'Schedule your first follow-up to start tracking your networking efforts'
                                    }
                                </p>
                            </div>

                            {(!searchQuery && statusFilter === 'all' && typeFilter === 'all' && priorityFilter === 'all') && (
                                <div className="space-y-3">
                                    <Button
                                        type="primary"
                                        icon={<Plus className="w-4 h-4" />}
                                        onClick={() => setShowFollowUpModal(true)}
                                        className="btn-primary"
                                        size="large"
                                    >
                                        Schedule Your First Follow-up
                                    </Button>
                                    <div className="text-sm text-gray-400">
                                        Stay connected with your network and track your outreach
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-4">
                                {getPaginatedData(getFilteredFollowUps()).map(followUp => {
                                    const contact = contacts.find(c => c.id === followUp.contactId);
                                    const isOverdue = dayjs(followUp.scheduledDate).isBefore(dayjs()) && followUp.status === 'scheduled';
                                    const isToday = dayjs(followUp.scheduledDate).isSame(dayjs(), 'day');
                                    const isTomorrow = dayjs(followUp.scheduledDate).isSame(dayjs().add(1, 'day'), 'day');

                                    return (
                                        <div
                                            key={followUp.id}
                                            className={`relative bg-gray-800/50 rounded-lg p-4 border transition-all hover:border-green-500/50 hover-lift ${isOverdue ? 'border-red-500/50 bg-red-500/5' :
                                                isToday ? 'border-yellow-500/50 bg-yellow-500/5' :
                                                    'border-gray-700'
                                                }`}
                                        >
                                            {/* Priority bar */}
                                            <div className={`priority-bar ${followUp.priority}`}></div>

                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <div className={`p-2.5 rounded-lg ${followUp.type === 'email' ? 'bg-blue-500/20 text-blue-400' :
                                                        followUp.type === 'phone' ? 'bg-green-500/20 text-green-400' :
                                                            followUp.type === 'linkedin' ? 'bg-purple-500/20 text-purple-400' :
                                                                'bg-gray-500/20 text-gray-400'
                                                        }`}>
                                                        {getTypeIcon(followUp.type)}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                            <h4 className="font-semibold text-white text-lg">{followUp.subject}</h4>
                                                            <div className="flex items-center gap-1">
                                                                <div className={`status-dot ${followUp.status}`}></div>
                                                                <Tag color={getStatusColor(followUp.status)} className="capitalize">
                                                                    {followUp.status}
                                                                </Tag>
                                                            </div>
                                                            <Tag color={getPriorityColor(followUp.priority)} className="capitalize">
                                                                {followUp.priority}
                                                            </Tag>
                                                            {isOverdue && (
                                                                <Tag color="red" icon={<AlertCircle className="w-3 h-3" />}>
                                                                    Overdue
                                                                </Tag>
                                                            )}
                                                            {isToday && (
                                                                <Tag color="gold" icon={<Zap className="w-3 h-3" />}>
                                                                    Today
                                                                </Tag>
                                                            )}
                                                            {isTomorrow && (
                                                                <Tag color="blue" icon={<Clock className="w-3 h-3" />}>
                                                                    Tomorrow
                                                                </Tag>
                                                            )}
                                                        </div>

                                                        <div className="text-sm text-gray-400 mb-3">
                                                            <div className="flex items-center gap-4 flex-wrap">
                                                                <span className="flex items-center gap-1">
                                                                    <User className="w-3 h-3" />
                                                                    <span className="font-medium text-gray-300">{contact?.name}</span> at {contact?.company}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {dayjs(followUp.scheduledDate).format('MMM DD, YYYY [at] HH:mm')}
                                                                </span>
                                                                {contact?.email && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Mail className="w-3 h-3" />
                                                                        {contact.email}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="follow-up-item p-3 mb-3">
                                                            <p className="text-sm text-gray-300 leading-relaxed">
                                                                {followUp.message}
                                                            </p>
                                                        </div>

                                                        {followUp.response && (
                                                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mt-3">
                                                                <div className="flex items-start gap-2">
                                                                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                                                    <div>
                                                                        <p className="text-sm font-medium text-green-400 mb-1">Response Received:</p>
                                                                        <p className="text-sm text-green-300">{followUp.response}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {followUp.tags && followUp.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-3">
                                                                {followUp.tags.map((tag: string) => (
                                                                    <Tag key={tag} className="text-xs bg-gray-600/30 border-gray-600">
                                                                        {tag}
                                                                    </Tag>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 ml-4">
                                                    {followUp.status === 'scheduled' && (
                                                        <Button
                                                            size="small"
                                                            icon={<CheckCircle className="w-4 h-4" />}
                                                            className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                                            onClick={() => {
                                                                setFollowUps(prev => prev.map(f =>
                                                                    f.id === followUp.id
                                                                        ? { ...f, status: 'completed' as const, completedDate: dayjs().toISOString() }
                                                                        : f
                                                                ));
                                                                toast.success('Follow-up marked as completed');
                                                            }}
                                                            title="Mark as completed"
                                                        >
                                                            Complete
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="small"
                                                        icon={<Edit className="w-4 h-4" />}
                                                        className="text-gray-400 hover:text-white hover:bg-gray-600/20"
                                                        onClick={() => {
                                                            setSelectedFollowUp(followUp);
                                                            setFollowUpForm({
                                                                ...followUp,
                                                                scheduledDate: dayjs(followUp.scheduledDate),
                                                                scheduledTime: dayjs(followUp.scheduledDate)
                                                            });
                                                            setShowFollowUpModal(true);
                                                        }}
                                                        title="Edit follow-up"
                                                    />
                                                    <Button
                                                        size="small"
                                                        icon={<Trash2 className="w-4 h-4" />}
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                        onClick={() => {
                                                            setFollowUps(prev => prev.filter(f => f.id !== followUp.id));
                                                            toast.success('Follow-up deleted');
                                                        }}
                                                        title="Delete follow-up"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Enhanced Pagination */}
                            {getFilteredFollowUps().length > pageSize && (
                                <div className="flex justify-center mt-8">
                                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                        <div className="flex items-center justify-between gap-4 mb-4">
                                            <div className="text-sm text-gray-400">
                                                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, getFilteredFollowUps().length)} of {getFilteredFollowUps().length} follow-ups
                                            </div>
                                            <Select
                                                value={pageSize}
                                                onChange={(value) => {
                                                    setPageSize(value);
                                                    setCurrentPage(1);
                                                }}
                                                className="w-20"
                                                size="small"
                                            >
                                                <Option value={6}>6</Option>
                                                <Option value={12}>12</Option>
                                                <Option value={24}>24</Option>
                                                <Option value={48}>48</Option>
                                            </Select>
                                        </div>
                                        <Pagination
                                            current={currentPage}
                                            total={getFilteredFollowUps().length}
                                            pageSize={pageSize}
                                            onChange={(page, size) => {
                                                setCurrentPage(page);
                                                if (size) setPageSize(size);
                                            }}
                                            onShowSizeChange={(current, size) => {
                                                setCurrentPage(1);
                                                setPageSize(size);
                                            }}
                                            showSizeChanger
                                            showQuickJumper
                                            showTotal={(total, range) =>
                                                `${range[0]}-${range[1]} of ${total} follow-ups`
                                            }
                                            className="custom-dark-pagination"
                                            pageSizeOptions={['10', '20', '50', '100']}
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {activeTab === 'contacts' && (
                <div className="space-y-6">
                    {getFilteredContacts().length === 0 ? (
                        <div className="empty-state">
                            <div className="mb-6">
                                <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-300 mb-2">No contacts found</h3>
                                <p className="text-gray-500 mb-4">
                                    {searchQuery
                                        ? 'Try adjusting your search terms to find contacts'
                                        : 'Build your professional network by adding contacts from your job search'
                                    }
                                </p>
                            </div>

                            {!searchQuery && (
                                <div className="space-y-3">
                                    <Button
                                        type="primary"
                                        icon={<UserPlus className="w-4 h-4" />}
                                        onClick={() => setShowContactModal(true)}
                                        className="btn-primary"
                                        size="large"
                                    >
                                        Add Your First Contact
                                    </Button>
                                    <div className="text-sm text-gray-400">
                                        Keep track of recruiters, hiring managers, and networking connections
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {getPaginatedData(getFilteredContacts()).map(contact => {
                                    const followUpCount = followUps.filter(f => f.contactId === contact.id).length;
                                    const lastFollowUp = followUps
                                        .filter(f => f.contactId === contact.id)
                                        .sort((a, b) => dayjs(b.scheduledDate).valueOf() - dayjs(a.scheduledDate).valueOf())[0];

                                    return (
                                        <div
                                            key={contact.id}
                                            className="bg-gray-800/50 rounded-lg p-5 border border-gray-700 hover:border-green-500/50 transition-all hover-lift"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full flex items-center justify-center border border-green-500/30">
                                                        <User className="w-6 h-6 text-green-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-white text-lg">{contact.name}</h4>
                                                        <p className="text-sm text-gray-400 font-medium">{contact.role}</p>
                                                        <p className="text-sm text-gray-500">{contact.company}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className={`status-dot ${contact.status}`}></div>
                                                    <Tag color={contact.status === 'active' ? 'green' : 'gray'} className="capitalize">
                                                        {contact.status}
                                                    </Tag>
                                                </div>
                                            </div>

                                            <div className="space-y-3 text-sm mb-4">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <Mail className="w-4 h-4 text-blue-400" />
                                                    <span className="truncate">{contact.email}</span>
                                                </div>
                                                {contact.phone && (
                                                    <div className="flex items-center gap-2 text-gray-400">
                                                        <Phone className="w-4 h-4 text-green-400" />
                                                        <span>{contact.phone}</span>
                                                    </div>
                                                )}
                                                {contact.linkedIn && (
                                                    <div className="flex items-center gap-2 text-gray-400">
                                                        <ExternalLink className="w-4 h-4 text-purple-400" />
                                                        <span className="truncate">LinkedIn Profile</span>
                                                    </div>
                                                )}
                                                {contact.lastContactDate && (
                                                    <div className="flex items-center gap-2 text-gray-400">
                                                        <Clock className="w-4 h-4 text-yellow-400" />
                                                        <span>Last contact: {dayjs(contact.lastContactDate).format('MMM DD, YYYY')}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {contact.notes && (
                                                <div className="contact-card p-3 mb-4">
                                                    <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">
                                                        {contact.notes}
                                                    </p>
                                                </div>
                                            )}

                                            {contact.tags && contact.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-4">
                                                    {contact.tags.map((tag: string) => (
                                                        <Tag key={tag} className="text-xs bg-gray-600/30 border-gray-600">
                                                            {tag}
                                                        </Tag>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Contact stats */}
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-4 p-2 bg-gray-700/20 rounded">
                                                <span>{followUpCount} follow-ups</span>
                                                {lastFollowUp && (
                                                    <span>Last: {dayjs(lastFollowUp.scheduledDate).format('MMM DD')}</span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="small"
                                                    icon={<Send className="w-3 h-3" />}
                                                    onClick={() => {
                                                        setFollowUpForm(prev => ({
                                                            ...prev,
                                                            contactId: contact.id,
                                                            subject: `Follow-up with ${contact.name}`,
                                                            message: `Hi ${contact.name.split(' ')[0]},\n\nI hope this message finds you well. I wanted to follow up on our previous conversation...`
                                                        }));
                                                        setShowFollowUpModal(true);
                                                    }}
                                                    className="flex-1 btn-primary"
                                                >
                                                    Follow-up
                                                </Button>
                                                <Button
                                                    size="small"
                                                    icon={<Edit className="w-3 h-3" />}
                                                    onClick={() => {
                                                        setSelectedContact(contact);
                                                        setContactForm(contact);
                                                        setShowContactModal(true);
                                                    }}
                                                    className="text-gray-400 hover:text-white hover:bg-gray-600/20"
                                                    title="Edit contact"
                                                />
                                                <Button
                                                    size="small"
                                                    icon={<Trash2 className="w-3 h-3" />}
                                                    onClick={() => {
                                                        setContacts(prev => prev.filter(c => c.id !== contact.id));
                                                        toast.success('Contact deleted');
                                                    }}
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                    title="Delete contact"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Enhanced Pagination for contacts */}
                            {getFilteredContacts().length > pageSize && (
                                <div className="flex justify-center">
                                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                        <div className="flex items-center justify-between gap-4 mb-4">
                                            <div className="text-sm text-gray-400">
                                                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, getFilteredContacts().length)} of {getFilteredContacts().length} contacts
                                            </div>
                                            <Select
                                                value={pageSize}
                                                onChange={(value) => {
                                                    setPageSize(value);
                                                    setCurrentPage(1);
                                                }}
                                                className="w-20"
                                                size="small"
                                            >
                                                <Option value={6}>6</Option>
                                                <Option value={12}>12</Option>
                                                <Option value={24}>24</Option>
                                                <Option value={48}>48</Option>
                                            </Select>
                                        </div>
                                        <Pagination
                                            current={currentPage}
                                            total={getFilteredContacts().length}
                                            pageSize={pageSize}
                                            onChange={(page, size) => {
                                                setCurrentPage(page);
                                                if (size) setPageSize(size);
                                            }}
                                            onShowSizeChange={(current, size) => {
                                                setCurrentPage(1);
                                                setPageSize(size);
                                            }}
                                            showSizeChanger
                                            showQuickJumper
                                            showTotal={(total, range) =>
                                                `${range[0]}-${range[1]} of ${total} contacts`
                                            }
                                            className="custom-dark-pagination"
                                            pageSizeOptions={['10', '20', '50', '100']}
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-4">
                    {history.length === 0 ? (
                        <div className="empty-state">
                            <div className="mb-6">
                                <History className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-300 mb-2">No history yet</h3>
                                <p className="text-gray-500 mb-4">
                                    Your follow-up history will appear here as you complete communications with your contacts
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    type="primary"
                                    icon={<Plus className="w-4 h-4" />}
                                    onClick={() => setShowFollowUpModal(true)}
                                    className="btn-primary"
                                    size="large"
                                >
                                    Schedule a Follow-up
                                </Button>
                                <div className="text-sm text-gray-400">
                                    Start building your communication history
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {getPaginatedData(history).map(item => {
                                    const contact = contacts.find(c => c.id === item.contactId);

                                    return (
                                        <div
                                            key={item.id}
                                            className="bg-gray-800/50 rounded-lg p-5 border border-gray-700 hover:border-blue-500/50 transition-all hover-lift"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`p-3 rounded-lg ${item.outcome === 'positive' ? 'bg-green-500/20 text-green-400' :
                                                    item.outcome === 'negative' ? 'bg-red-500/20 text-red-400' :
                                                        item.outcome === 'no_response' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    <History className="w-5 h-5" />
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        <h4 className="font-semibold text-white text-lg">{item.subject}</h4>
                                                        <Tag color={
                                                            item.outcome === 'positive' ? 'green' :
                                                                item.outcome === 'negative' ? 'red' :
                                                                    item.outcome === 'no_response' ? 'orange' : 'blue'
                                                        } className="capitalize">
                                                            {item.outcome.replace('_', ' ')}
                                                        </Tag>
                                                    </div>

                                                    <div className="text-sm text-gray-400 mb-3">
                                                        <div className="flex items-center gap-4 flex-wrap">
                                                            {contact && (
                                                                <span className="flex items-center gap-1">
                                                                    <User className="w-3 h-3" />
                                                                    <span className="font-medium text-gray-300">{contact.name}</span> at {contact.company}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {dayjs(item.date).format('MMM DD, YYYY [at] HH:mm')}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <MessageSquare className="w-3 h-3" />
                                                                {item.type}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="follow-up-item p-3 mb-3">
                                                        <p className="text-sm text-gray-300 leading-relaxed">
                                                            {item.notes}
                                                        </p>
                                                    </div>

                                                    {item.nextSteps && (
                                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                                            <div className="flex items-start gap-2">
                                                                <Target className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                                                <div>
                                                                    <p className="text-sm font-medium text-blue-400 mb-1">Next Steps:</p>
                                                                    <p className="text-sm text-blue-300">{item.nextSteps}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Enhanced Pagination for history */}
                            {history.length > pageSize && (
                                <div className="flex justify-center mt-8">
                                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                        <div className="flex items-center justify-between gap-4 mb-4">
                                            <div className="text-sm text-gray-400">
                                                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, history.length)} of {history.length} history items
                                            </div>
                                            <Select
                                                value={pageSize}
                                                onChange={(value) => {
                                                    setPageSize(value);
                                                    setCurrentPage(1);
                                                }}
                                                className="w-20"
                                                size="small"
                                            >
                                                <Option value={6}>6</Option>
                                                <Option value={12}>12</Option>
                                                <Option value={24}>24</Option>
                                                <Option value={48}>48</Option>
                                            </Select>
                                        </div>
                                        <Pagination
                                            current={currentPage}
                                            total={history.length}
                                            pageSize={pageSize}
                                            onChange={(page, size) => {
                                                setCurrentPage(page);
                                                if (size) setPageSize(size);
                                            }}
                                            onShowSizeChange={(current, size) => {
                                                setCurrentPage(1);
                                                setPageSize(size);
                                            }}
                                            showSizeChanger
                                            showQuickJumper
                                            showTotal={(total, range) =>
                                                `${range[0]}-${range[1]} of ${total} history items`
                                            }
                                            className="custom-dark-pagination"
                                            pageSizeOptions={['10', '20', '50', '100']}
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Enhanced Contact Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-3">
                        <div className="p-2 stats-icon">
                            <UserPlus className="w-5 h-5 text-green-400" />
                        </div>
                        <span>{selectedContact ? 'Edit Contact' : 'Add New Contact'}</span>
                    </div>
                }
                open={showContactModal}
                onOk={handleCreateContact}
                onCancel={() => {
                    setShowContactModal(false);
                    setSelectedContact(null);
                    setContactForm({
                        name: '',
                        email: '',
                        phone: '',
                        role: '',
                        company: '',
                        linkedIn: '',
                        notes: '',
                        tags: []
                    });
                    setContactFormErrors({});
                }}
                footer={[
                    <Button
                        key="cancel"
                        onClick={() => {
                            setShowContactModal(false);
                            setSelectedContact(null);
                            setContactForm({
                                name: '',
                                email: '',
                                phone: '',
                                role: '',
                                company: '',
                                linkedIn: '',
                                notes: '',
                                tags: []
                            });
                            setContactFormErrors({});
                        }}
                        disabled={isCreatingContact}
                    >
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        className="btn-primary"
                        onClick={handleCreateContact}
                        loading={isCreatingContact}
                        disabled={!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.role.trim() || !contactForm.company.trim()}
                    >
                        {isCreatingContact ? 'Creating...' : selectedContact ? 'Update Contact' : 'Create Contact'}
                    </Button>
                ]}
                className="custom-dark-modal"
                width={600}
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Name *
                            </label>
                            <Input
                                placeholder="Enter full name"
                                value={contactForm.name}
                                onChange={(e) => {
                                    setContactForm(prev => ({ ...prev, name: e.target.value }));
                                    if (contactFormErrors.name) {
                                        setContactFormErrors(prev => ({ ...prev, name: '' }));
                                    }
                                }}
                                className="bg-gray-700 border-gray-600"
                                status={contactFormErrors.name ? 'error' : ''}
                                maxLength={100}
                            />
                            {contactFormErrors.name && (
                                <div className="text-red-400 text-xs mt-1">{contactFormErrors.name}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email *
                            </label>
                            <Input
                                type="email"
                                placeholder="Enter email address"
                                value={contactForm.email}
                                onChange={(e) => {
                                    setContactForm(prev => ({ ...prev, email: e.target.value }));
                                    if (contactFormErrors.email) {
                                        setContactFormErrors(prev => ({ ...prev, email: '' }));
                                    }
                                }}
                                className="bg-gray-700 border-gray-600"
                                status={contactFormErrors.email ? 'error' : ''}
                                maxLength={100}
                            />
                            {contactFormErrors.email && (
                                <div className="text-red-400 text-xs mt-1">{contactFormErrors.email}</div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Role *
                            </label>
                            <Input
                                placeholder="e.g. Senior Software Engineer"
                                value={contactForm.role}
                                onChange={(e) => {
                                    setContactForm(prev => ({ ...prev, role: e.target.value }));
                                    if (contactFormErrors.role) {
                                        setContactFormErrors(prev => ({ ...prev, role: '' }));
                                    }
                                }}
                                className="bg-gray-700 border-gray-600"
                                status={contactFormErrors.role ? 'error' : ''}
                                maxLength={100}
                            />
                            {contactFormErrors.role && (
                                <div className="text-red-400 text-xs mt-1">{contactFormErrors.role}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Company *
                            </label>
                            <Input
                                placeholder="Enter company name"
                                value={contactForm.company}
                                onChange={(e) => {
                                    setContactForm(prev => ({ ...prev, company: e.target.value }));
                                    if (contactFormErrors.company) {
                                        setContactFormErrors(prev => ({ ...prev, company: '' }));
                                    }
                                }}
                                className="bg-gray-700 border-gray-600"
                                status={contactFormErrors.company ? 'error' : ''}
                                maxLength={100}
                            />
                            {contactFormErrors.company && (
                                <div className="text-red-400 text-xs mt-1">{contactFormErrors.company}</div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Phone
                            </label>
                            <Input
                                placeholder="Enter phone number"
                                value={contactForm.phone}
                                onChange={(e) => {
                                    setContactForm(prev => ({ ...prev, phone: e.target.value }));
                                    if (contactFormErrors.phone) {
                                        setContactFormErrors(prev => ({ ...prev, phone: '' }));
                                    }
                                }}
                                className="bg-gray-700 border-gray-600"
                                status={contactFormErrors.phone ? 'error' : ''}
                                maxLength={20}
                            />
                            {contactFormErrors.phone && (
                                <div className="text-red-400 text-xs mt-1">{contactFormErrors.phone}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                LinkedIn Profile
                            </label>
                            <Input
                                placeholder="https://linkedin.com/in/username"
                                value={contactForm.linkedIn}
                                onChange={(e) => setContactForm(prev => ({ ...prev, linkedIn: e.target.value }))}
                                className="bg-gray-700 border-gray-600"
                                maxLength={200}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Notes
                        </label>
                        <TextArea
                            placeholder="Add any notes about this contact (how you met, interests, etc.)"
                            value={contactForm.notes}
                            onChange={(e) => setContactForm(prev => ({ ...prev, notes: e.target.value }))}
                            rows={3}
                            className="bg-gray-700 border-gray-600"
                            maxLength={500}
                            showCount
                        />
                    </div>

                    <div className="stats-card p-4">
                        <div className="text-sm text-gray-400 mb-2">
                            <strong>Tips for better contact management:</strong>
                        </div>
                        <ul className="text-xs text-gray-500 space-y-1">
                            <li>• Include how and where you met this person</li>
                            <li>• Note their interests or topics you discussed</li>
                            <li>• Add relevant skills or expertise they mentioned</li>
                            <li>• Include any mutual connections</li>
                        </ul>
                    </div>
                </div>
            </Modal>

            {/* Enhanced Follow-up Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-3">
                        <div className="p-2 stats-icon">
                            <Send className="w-5 h-5 text-green-400" />
                        </div>
                        <span>{selectedFollowUp ? 'Edit Follow-up' : 'Schedule Follow-up'}</span>
                    </div>
                }
                open={showFollowUpModal}
                onOk={handleCreateFollowUp}
                onCancel={() => {
                    setShowFollowUpModal(false);
                    setSelectedFollowUp(null);
                    setFollowUpForm({
                        contactId: '',
                        type: 'email',
                        subject: '',
                        message: '',
                        scheduledDate: dayjs().add(1, 'day'),
                        scheduledTime: dayjs().hour(9).minute(0),
                        priority: 'medium',
                        tags: []
                    });
                    setFollowUpFormErrors({});
                }}
                footer={[
                    <Button
                        key="cancel"
                        onClick={() => {
                            setShowFollowUpModal(false);
                            setSelectedFollowUp(null);
                            setFollowUpForm({
                                contactId: '',
                                type: 'email',
                                subject: '',
                                message: '',
                                scheduledDate: dayjs().add(1, 'day'),
                                scheduledTime: dayjs().hour(9).minute(0),
                                priority: 'medium',
                                tags: []
                            });
                            setFollowUpFormErrors({});
                        }}
                        disabled={isCreatingFollowUp}
                    >
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        className="btn-primary"
                        onClick={handleCreateFollowUp}
                        loading={isCreatingFollowUp}
                        disabled={!followUpForm.contactId || !followUpForm.subject.trim() || !followUpForm.message.trim()}
                    >
                        {isCreatingFollowUp ? 'Scheduling...' : selectedFollowUp ? 'Update Follow-up' : 'Schedule Follow-up'}
                    </Button>
                ]}
                className="custom-dark-modal"
                width={700}
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Contact *
                            </label>
                            <Select
                                placeholder="Select a contact"
                                value={followUpForm.contactId}
                                onChange={(value) => {
                                    setFollowUpForm(prev => ({ ...prev, contactId: value }));
                                    if (followUpFormErrors.contactId) {
                                        setFollowUpFormErrors(prev => ({ ...prev, contactId: '' }));
                                    }
                                }}
                                className="w-full"
                                status={followUpFormErrors.contactId ? 'error' : ''}
                                showSearch
                                filterOption={(input, option) =>
                                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                                }
                            >
                                {contacts.map(contact => (
                                    <Option key={contact.id} value={contact.id}>
                                        <div className="flex items-center gap-2">
                                            <User className="w-3 h-3" />
                                            <span>{contact.name} - {contact.company}</span>
                                        </div>
                                    </Option>
                                ))}
                            </Select>
                            {followUpFormErrors.contactId && (
                                <div className="text-red-400 text-xs mt-1">{followUpFormErrors.contactId}</div>
                            )}
                            {contacts.length === 0 && (
                                <div className="text-yellow-400 text-xs mt-1">
                                    No contacts available. Add a contact first.
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Type
                            </label>
                            <Select
                                value={followUpForm.type}
                                onChange={(value) => setFollowUpForm(prev => ({ ...prev, type: value }))}
                                className="w-full"
                            >
                                <Option value="email">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-3 h-3" />
                                        Email
                                    </div>
                                </Option>
                                <Option value="phone">
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-3 h-3" />
                                        Phone Call
                                    </div>
                                </Option>
                                <Option value="linkedin">
                                    <div className="flex items-center gap-2">
                                        <ExternalLink className="w-3 h-3" />
                                        LinkedIn Message
                                    </div>
                                </Option>
                                <Option value="in_person">
                                    <div className="flex items-center gap-2">
                                        <User className="w-3 h-3" />
                                        In Person
                                    </div>
                                </Option>
                                <Option value="other">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="w-3 h-3" />
                                        Other
                                    </div>
                                </Option>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Subject *
                        </label>
                        <Input
                            placeholder="Enter follow-up subject (5-100 characters)"
                            value={followUpForm.subject}
                            onChange={(e) => {
                                setFollowUpForm(prev => ({ ...prev, subject: e.target.value }));
                                if (followUpFormErrors.subject) {
                                    setFollowUpFormErrors(prev => ({ ...prev, subject: '' }));
                                }
                            }}
                            className="bg-gray-700 border-gray-600"
                            status={followUpFormErrors.subject ? 'error' : ''}
                            maxLength={100}
                            showCount
                        />
                        {followUpFormErrors.subject && (
                            <div className="text-red-400 text-xs mt-1">{followUpFormErrors.subject}</div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Message *
                        </label>
                        <TextArea
                            placeholder="Enter your follow-up message (minimum 10 characters)"
                            value={followUpForm.message}
                            onChange={(e) => {
                                setFollowUpForm(prev => ({ ...prev, message: e.target.value }));
                                if (followUpFormErrors.message) {
                                    setFollowUpFormErrors(prev => ({ ...prev, message: '' }));
                                }
                            }}
                            rows={4}
                            className="bg-gray-700 border-gray-600"
                            status={followUpFormErrors.message ? 'error' : ''}
                            maxLength={1000}
                            showCount
                        />
                        {followUpFormErrors.message && (
                            <div className="text-red-400 text-xs mt-1">{followUpFormErrors.message}</div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Date *
                            </label>
                            <DatePicker
                                value={followUpForm.scheduledDate}
                                onChange={(date) => {
                                    setFollowUpForm(prev => ({ ...prev, scheduledDate: date || dayjs().add(1, 'day') }));
                                    if (followUpFormErrors.scheduledDate) {
                                        setFollowUpFormErrors(prev => ({ ...prev, scheduledDate: '' }));
                                    }
                                }}
                                className="w-full bg-gray-700 border-gray-600"
                                placeholder="Select date"
                                disabledDate={(current) => current && current < dayjs().startOf('day')}
                                status={followUpFormErrors.scheduledDate ? 'error' : ''}
                            />
                            {followUpFormErrors.scheduledDate && (
                                <div className="text-red-400 text-xs mt-1">{followUpFormErrors.scheduledDate}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Time
                            </label>
                            <TimePicker
                                value={followUpForm.scheduledTime}
                                onChange={(time) => setFollowUpForm(prev => ({ ...prev, scheduledTime: time || dayjs().hour(9).minute(0) }))}
                                className="w-full bg-gray-700 border-gray-600"
                                placeholder="Select time"
                                format="HH:mm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Priority
                            </label>
                            <Select
                                value={followUpForm.priority}
                                onChange={(value) => setFollowUpForm(prev => ({ ...prev, priority: value }))}
                                className="w-full"
                            >
                                <Option value="low">
                                    <Tag color="gray">Low</Tag>
                                </Option>
                                <Option value="medium">
                                    <Tag color="blue">Medium</Tag>
                                </Option>
                                <Option value="high">
                                    <Tag color="orange">High</Tag>
                                </Option>
                                <Option value="urgent">
                                    <Tag color="red" >Urgent</Tag>
                                </Option>
                            </Select>
                        </div>
                    </div>

                    <div className="stats-card p-4">
                        <div className="text-sm text-gray-400 mb-2">
                            <strong>Follow-up best practices:</strong>
                        </div>
                        <ul className="text-xs text-gray-500 space-y-1">
                            <li>• Reference your previous conversation or meeting</li>
                            <li>• Be specific about what you're following up on</li>
                            <li>• Include a clear call-to-action</li>
                            <li>• Keep it concise and professional</li>
                            <li>• Provide value or additional information when possible</li>
                        </ul>
                    </div>
                </div>
            </Modal>

            {/* Add Contact Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-green-500" />
                        Add New Contact
                    </div>
                }
                open={showContactModal}
                onCancel={() => {
                    setShowContactModal(false);
                    setContactForm({
                        name: '',
                        email: '',
                        phone: '',
                        role: '',
                        company: '',
                        linkedIn: '',
                        notes: '',
                        tags: []
                    });
                    setContactFormErrors({});
                }}
                footer={[
                    <Button key="cancel" onClick={() => setShowContactModal(false)}>
                        Cancel
                    </Button>,
                    <Button
                        key="create"
                        type="primary"
                        loading={isCreatingContact}
                        onClick={handleCreateContact}
                        className="btn-primary"
                    >
                        Create Contact
                    </Button>
                ]}
                className="custom-dark-modal"
                width={600}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Name *
                            </label>
                            <Input
                                value={contactForm.name}
                                onChange={(e) => {
                                    setContactForm(prev => ({ ...prev, name: e.target.value }));
                                    if (contactFormErrors.name) {
                                        setContactFormErrors(prev => ({ ...prev, name: '' }));
                                    }
                                }}
                                placeholder="Enter full name"
                                className="w-full"
                                status={contactFormErrors.name ? 'error' : ''}
                            />
                            {contactFormErrors.name && (
                                <div className="text-red-400 text-xs mt-1">{contactFormErrors.name}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email *
                            </label>
                            <Input
                                type="email"
                                value={contactForm.email}
                                onChange={(e) => {
                                    setContactForm(prev => ({ ...prev, email: e.target.value }));
                                    if (contactFormErrors.email) {
                                        setContactFormErrors(prev => ({ ...prev, email: '' }));
                                    }
                                }}
                                placeholder="Enter email address"
                                className="w-full"
                                status={contactFormErrors.email ? 'error' : ''}
                            />
                            {contactFormErrors.email && (
                                <div className="text-red-400 text-xs mt-1">{contactFormErrors.email}</div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Role *
                            </label>
                            <Input
                                value={contactForm.role}
                                onChange={(e) => {
                                    setContactForm(prev => ({ ...prev, role: e.target.value }));
                                    if (contactFormErrors.role) {
                                        setContactFormErrors(prev => ({ ...prev, role: '' }));
                                    }
                                }}
                                placeholder="e.g. Senior Software Engineer"
                                className="w-full"
                                status={contactFormErrors.role ? 'error' : ''}
                            />
                            {contactFormErrors.role && (
                                <div className="text-red-400 text-xs mt-1">{contactFormErrors.role}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Company *
                            </label>
                            <Input
                                value={contactForm.company}
                                onChange={(e) => {
                                    setContactForm(prev => ({ ...prev, company: e.target.value }));
                                    if (contactFormErrors.company) {
                                        setContactFormErrors(prev => ({ ...prev, company: '' }));
                                    }
                                }}
                                placeholder="Enter company name"
                                className="w-full"
                                status={contactFormErrors.company ? 'error' : ''}
                            />
                            {contactFormErrors.company && (
                                <div className="text-red-400 text-xs mt-1">{contactFormErrors.company}</div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Phone
                            </label>
                            <Input
                                value={contactForm.phone}
                                onChange={(e) => {
                                    setContactForm(prev => ({ ...prev, phone: e.target.value }));
                                    if (contactFormErrors.phone) {
                                        setContactFormErrors(prev => ({ ...prev, phone: '' }));
                                    }
                                }}
                                placeholder="Enter phone number"
                                className="w-full"
                                status={contactFormErrors.phone ? 'error' : ''}
                            />
                            {contactFormErrors.phone && (
                                <div className="text-red-400 text-xs mt-1">{contactFormErrors.phone}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                LinkedIn Profile
                            </label>
                            <Input
                                value={contactForm.linkedIn}
                                onChange={(e) => setContactForm(prev => ({ ...prev, linkedIn: e.target.value }))}
                                placeholder="LinkedIn profile URL"
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Notes
                        </label>
                        <Input.TextArea
                            value={contactForm.notes}
                            onChange={(e) => setContactForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Add any notes about this contact (how you met, interests, etc.)"
                            rows={3}
                            className="w-full"
                        />
                    </div>

                    <div className="stats-card p-4">
                        <div className="text-sm text-gray-400 mb-2">
                            <strong>Tips for better contact management:</strong>
                        </div>
                        <ul className="text-xs text-gray-500 space-y-1">
                            <li>• Include how and where you met the person</li>
                            <li>• Note their interests or topics you discussed</li>
                            <li>• Add relevant skills or expertise they mentioned</li>
                            <li>• Include any mutual connections</li>
                        </ul>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FollowUpTracker;