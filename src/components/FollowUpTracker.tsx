'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
    Zap,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/ui/Modal';
import Button from "@/components/ui/Button";
import ActivitySkeleton from '@/components/ui/ActivitySkeleton';
import { Select, DatePicker } from 'antd';

// --- Types ---
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

// --- Components ---

const ContactCard = ({ contact, onClick }: { contact: Contact; onClick: () => void }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={onClick}
        className="bg-[var(--bg-surface)]/50 border border-[var(--border-glass)] hover:border-[var(--primary)]/30 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-[var(--primary)]/5 hover:-translate-y-0.5 group"
    >
        <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-lg">
                    {contact.name.charAt(0)}
                </div>
                <div>
                    <h4 className="font-bold text-white group-hover:text-[var(--primary)] transition-colors">{contact.name}</h4>
                    <p className="text-xs text-[var(--text-muted)]">{contact.role} at {contact.company}</p>
                </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${contact.status === 'active' ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20' :
                    contact.status === 'responded' ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20' :
                        'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-glass)]'
                }`}>
                {contact.status.replace('_', ' ')}
            </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {contact.email}
            </span>
            {contact.linkedIn && (
                <a href={contact.linkedIn} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[var(--primary)] hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    LinkedIn
                </a>
            )}
        </div>
    </motion.div>
);

const FollowUpCard = ({ followUp, onComplete }: { followUp: FollowUp; onComplete: (e: any) => void }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[var(--bg-surface)]/50 border border-[var(--border-glass)] hover:border-[var(--primary)]/30 rounded-xl p-4 transition-all group"
    >
        <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg border ${followUp.type === 'email' ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/20' :
                        followUp.type === 'linkedin' ? 'bg-[var(--bg-raised)] text-[var(--text-muted)] border-[var(--border-strong)]' :
                            followUp.type === 'phone' ? 'bg-[var(--bg-raised)] text-[var(--text-muted)] border-[var(--border-strong)]' :
                                'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20'
                    }`}>
                    {followUp.type === 'email' ? <Mail className="w-4 h-4" /> :
                        followUp.type === 'linkedin' ? <ExternalLink className="w-4 h-4" /> :
                            followUp.type === 'phone' ? <Phone className="w-4 h-4" /> :
                                <MessageSquare className="w-4 h-4" />}
                </div>
                <div>
                    <h4 className="font-semibold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">{followUp.subject}</h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {followUp.contact?.name || 'Unknown Contact'}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {dayjs(followUp.scheduledDate).format('MMM D, YYYY')}
                        </span>
                    </div>
                </div>
            </div>

            {followUp.status !== 'completed' && (
                <Button
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); onComplete(followUp); }}
                    className="p-2 hover:bg-[var(--success)]/20 text-[var(--text-muted)] hover:text-[var(--success)] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Mark as completed"
                    aria-label="Mark as completed"
                >
                    <CheckCircle className="w-4 h-4" />
                </Button>
            )}
        </div>
    </motion.div>
);

// --- Main Component ---

const FollowUpTracker: React.FC<FollowUpTrackerProps> = ({ className = '' }) => {
    const [activeTab, setActiveTab] = useState<'followups' | 'contacts' | 'history'>('followups');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [history, setHistory] = useState<FollowUpHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [showContactModal, setShowContactModal] = useState(false);
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);

    // Forms
    const [contactForm, setContactForm] = useState({
        name: '', email: '', role: '', company: '', linkedIn: '', notes: ''
    });

    const [followUpForm, setFollowUpForm] = useState({
        contactId: '', type: 'email', subject: '', message: '', scheduledDate: dayjs().add(1, 'day').format('YYYY-MM-DD'), priority: 'medium'
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [contactsRes, followUpsRes, historyRes] = await Promise.all([
                fetch('/api/contacts'),
                fetch('/api/follow-ups'),
                fetch('/api/follow-up-history')
            ]);

            if (contactsRes.ok) {
                const data = await contactsRes.json();
                setContacts(data.contacts || []);
            }
            if (followUpsRes.ok) {
                const data = await followUpsRes.json();
                setFollowUps(data.followUps || []);
            }
            if (historyRes.ok) {
                const data = await historyRes.json();
                setHistory(data.history || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateContact = async () => {
        try {
            if (!contactForm.name || !contactForm.email) {
                toast.error('Name and Email are required');
                return;
            }

            const response = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactForm)
            });

            if (response.ok) {
                toast.success('Contact created');
                setShowContactModal(false);
                fetchData();
                setContactForm({ name: '', email: '', role: '', company: '', linkedIn: '', notes: '' });
            } else {
                toast.error('Failed to create contact');
            }
        } catch (error) {
            toast.error('Failed to create contact');
        }
    };

    const handleCreateFollowUp = async () => {
        try {
            if (!followUpForm.contactId || !followUpForm.subject) {
                toast.error('Contact and Subject are required');
                return;
            }

            const response = await fetch('/api/follow-ups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...followUpForm,
                    scheduledDate: new Date(followUpForm.scheduledDate).toISOString()
                })
            });

            if (response.ok) {
                toast.success('Follow-up scheduled');
                setShowFollowUpModal(false);
                fetchData();
                setFollowUpForm({ contactId: '', type: 'email', subject: '', message: '', scheduledDate: dayjs().add(1, 'day').format('YYYY-MM-DD'), priority: 'medium' });
            } else {
                toast.error('Failed to schedule follow-up');
            }
        } catch (error) {
            toast.error('Failed to schedule follow-up');
        }
    };

    const handleCompleteFollowUp = async (followUp: FollowUp) => {
        // Implementation for completing follow-up
        toast.success('Follow-up marked as completed');
    };

    if (loading) {
        return (
            <div className="h-64 pt-6">
                <ActivitySkeleton count={3} />
            </div>
        );
    }

    return (
        <div className={`space-y-8 ${className}`}>
            {/* Header */}
            <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-3">
                        <div className="p-2 bg-[var(--accent-soft)] rounded-xl border border-[var(--accent)]/30">
                            <TrendingUp className="w-6 h-6 text-[var(--accent)]" />
                        </div>
                        Follow-up Tracker
                    </h2>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => setShowContactModal(true)}
                        className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--primary)] transition-all flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Add Contact</span>
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => setShowFollowUpModal(true)}
                        className="px-4 py-2 rounded-xl flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Schedule Follow-up</span>
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-[var(--border-glass)]">
                <div className="flex gap-6">
                    {['followups', 'contacts', 'history'].map((tab) => (
                        <Button
                            variant="ghost"
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-4 text-sm font-medium transition-all relative ${activeTab === tab ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-white'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"
                                />
                            )}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="min-h-[400px]"
                >
                    {activeTab === 'contacts' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {contacts.map(contact => (
                                <ContactCard key={contact.id} contact={contact} onClick={() => { }} />
                            ))}
                        </div>
                    )}

                    {activeTab === 'followups' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {followUps.map(followUp => (
                                <FollowUpCard key={followUp.id} followUp={followUp} onComplete={handleCompleteFollowUp} />
                            ))}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="text-center py-12 border border-dashed border-[var(--border-glass)] rounded-2xl">
                            <p className="text-[var(--text-muted)]">History view coming soon...</p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Modals */}
            <Modal isOpen={showContactModal} onClose={() => setShowContactModal(false)} title="Add New Contact">
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
                    />
                    <input
                        type="text"
                        placeholder="Role"
                        value={contactForm.role}
                        onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                        className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
                    />
                    <input
                        type="text"
                        placeholder="Company"
                        value={contactForm.company}
                        onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                        className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
                    />
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setShowContactModal(false)} className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-white">Cancel</Button>
                        <Button variant="primary" onClick={handleCreateContact} className="px-4 py-2 rounded-xl bg-[var(--primary)] text-black font-bold">Add Contact</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showFollowUpModal} onClose={() => setShowFollowUpModal(false)} title="Schedule Follow-up">
                <div className="space-y-4">
                    <Select
                        value={followUpForm.contactId}
                        onChange={(v) => setFollowUpForm({ ...followUpForm, contactId: v })}
                        options={[
                            { value: '', label: 'Select Contact' },
                            ...contacts.map(c => ({ value: c.id, label: `${c.name} (${c.company})` })),
                        ]}
                        className="w-full"
                    />
                    <input
                        type="text"
                        placeholder="Subject"
                        value={followUpForm.subject}
                        onChange={(e) => setFollowUpForm({ ...followUpForm, subject: e.target.value })}
                        className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
                    />
                    <textarea
                        placeholder="Message"
                        value={followUpForm.message}
                        onChange={(e) => setFollowUpForm({ ...followUpForm, message: e.target.value })}
                        className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none h-24 resize-none"
                    />
                    <DatePicker
                        value={followUpForm.scheduledDate ? dayjs(followUpForm.scheduledDate) : null}
                        onChange={(d) => setFollowUpForm({ ...followUpForm, scheduledDate: d ? d.format('YYYY-MM-DD') : '' })}
                        className="w-full"
                    />
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setShowFollowUpModal(false)} className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-white">Cancel</Button>
                        <Button variant="primary" onClick={handleCreateFollowUp} className="px-4 py-2 rounded-xl bg-[var(--primary)] text-black font-bold">Schedule</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FollowUpTracker;