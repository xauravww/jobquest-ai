import toast from 'react-hot-toast';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'interview' | 'follow_up';
    timestamp: Date;
    read: boolean;
    actionUrl?: string;
    actionLabel?: string;
    metadata?: {
        activityId?: string;
        jobId?: string;
        applicationId?: string;
    };
    data?: {
        id?: string;
        company?: string;
        location?: string;
        contact?: string;
        [key: string]: any;
    };
}

export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    telegram: boolean;
    inApp: boolean;
    remindersBefore: number; // minutes
    interviewReminders: boolean;
    followUpReminders: boolean;
    applicationDeadlines: boolean;
}

class NotificationService {
    private notifications: Notification[] = [];
    private preferences: NotificationPreferences = {
        email: true,
        push: true,
        telegram: false,
        inApp: true,
        remindersBefore: 15,
        interviewReminders: true,
        followUpReminders: true,
        applicationDeadlines: true
    };

    private listeners: Array<(notifications: Notification[]) => void> = [];
    private telegramBot: any = null;

    constructor() {
        this.loadNotifications();
        this.loadPreferences();
        this.initializeTelegramBot();

        // Only start scheduler if we're in a browser environment and have proper setup
        if (typeof window !== 'undefined') {
            // Delay the scheduler start to avoid immediate errors
            setTimeout(() => {
                this.startNotificationScheduler();
            }, 5000);
        }
    }

    // Initialize Telegram bot
    private async initializeTelegramBot() {
        try {
            // This will be implemented with gramjs
            console.log('Initializing Telegram bot...');
            // TODO: Implement gramjs integration
        } catch (error) {
            console.error('Failed to initialize Telegram bot:', error);
        }
    }

    // Load notifications from localStorage
    private loadNotifications() {
        if (typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem('notifications');
            if (stored) {
                this.notifications = JSON.parse(stored).map((n: any) => ({
                    ...n,
                    timestamp: new Date(n.timestamp)
                }));
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }

    // Save notifications to localStorage
    private saveNotifications() {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem('notifications', JSON.stringify(this.notifications));
        } catch (error) {
            console.error('Failed to save notifications:', error);
        }
    }

    // Load preferences from localStorage
    private loadPreferences() {
        if (typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem('notificationPreferences');
            if (stored) {
                this.preferences = { ...this.preferences, ...JSON.parse(stored) };
            }
        } catch (error) {
            console.error('Failed to load notification preferences:', error);
        }
    }

    // Save preferences to localStorage
    private savePreferences() {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));
        } catch (error) {
            console.error('Failed to save notification preferences:', error);
        }
    }

    // Add notification listener
    subscribe(listener: (notifications: Notification[]) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // Notify all listeners
    private notifyListeners() {
        this.listeners.forEach(listener => listener([...this.notifications]));
    }

    // Create a new notification
    async createNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
        const newNotification: Notification = {
            ...notification,
            id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
            timestamp: new Date(),
            read: false
        };

        this.notifications.unshift(newNotification);
        this.saveNotifications();
        this.notifyListeners();

        // Send notifications based on preferences
        if (this.preferences.inApp) {
            this.showInAppNotification(newNotification);
        }

        if (this.preferences.push && 'Notification' in window) {
            this.showPushNotification(newNotification);
        }

        if (this.preferences.telegram) {
            console.log('🔵 [NOTIFICATION] Telegram notifications enabled in preferences');
            this.sendTelegramNotification(newNotification);
        } else {
            console.log('🟡 [NOTIFICATION] Telegram notifications disabled in preferences');
        }

        if (this.preferences.email) {
            this.sendEmailNotification(newNotification);
        }

        return newNotification;
    }

    // Show in-app notification using react-hot-toast
    private showInAppNotification(notification: Notification) {
        const getIcon = (type: string) => {
            switch (type) {
                case 'success': return '✅';
                case 'error': return '❌';
                case 'warning': return '⚠️';
                case 'reminder': return '🔔';
                case 'interview': return '🎯';
                case 'follow_up': return '📞';
                default: return 'ℹ️';
            }
        };

        const toastOptions = {
            duration: 5000,
            position: 'top-right' as const,
            style: {
                background: '#1f2937',
                color: '#f9fafb',
                border: '1px solid #374151',
                borderRadius: '8px',
            },
        };

        switch (notification.type) {
            case 'success':
                toast.success(`${getIcon(notification.type)} ${notification.title}\n${notification.message}`, toastOptions);
                break;
            case 'error':
                toast.error(`${getIcon(notification.type)} ${notification.title}\n${notification.message}`, toastOptions);
                break;
            case 'warning':
                toast(`${getIcon(notification.type)} ${notification.title}\n${notification.message}`, toastOptions);
                break;
            default:
                toast(`${getIcon(notification.type)} ${notification.title}\n${notification.message}`, toastOptions);
        }
    }

    // Show browser push notification
    private async showPushNotification(notification: Notification) {
        if (typeof window === 'undefined' || !('Notification' in window)) return;

        try {
            if (window.Notification.permission === 'granted') {
                new window.Notification(notification.title, {
                    body: notification.message,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    tag: notification.id,
                    requireInteraction: notification.type === 'interview' || notification.type === 'reminder'
                });
            } else if (window.Notification.permission !== 'denied') {
                const permission = await window.Notification.requestPermission();
                if (permission === 'granted') {
                    this.showPushNotification(notification);
                }
            }
        } catch (error) {
            console.error('Failed to show push notification:', error);
        }
    }

    // Send Telegram notification
    private async sendTelegramNotification(notification: Notification) {
        console.log('🔵 [TELEGRAM] Starting Telegram notification process...');
        console.log('🔵 [TELEGRAM] Notification data:', {
            title: notification.title,
            message: notification.message,
            type: notification.type,
            timestamp: notification.timestamp
        });

        try {
            // Check if we're in browser environment
            if (typeof window === 'undefined') {
                console.log('🟡 [TELEGRAM] Not in browser environment, skipping Telegram notification');
                return;
            }

            console.log('🔵 [TELEGRAM] Browser environment detected, importing TelegramService...');

            // Try to import TelegramService
            const { telegramService } = await import('@/services/TelegramService');
            console.log('🟢 [TELEGRAM] TelegramService imported successfully');

            // Check service status
            const configStatus = telegramService.getConfigStatus();
            console.log('🔵 [TELEGRAM] Service configuration status:', configStatus);

            // Send interactive message based on notification type
            console.log('🔵 [TELEGRAM] Determining message type for interactive features...');
            let success = false;

            // Check if this is an actionable notification that should have buttons
            if (notification.type === 'reminder' && notification.data?.id) {
                console.log('🔵 [TELEGRAM] Sending interactive reminder notification...');
                success = await telegramService.sendInteractiveReminder({
                    id: notification.data.id,
                    title: notification.title,
                    company: notification.data.company || 'Unknown Company',
                    dueDate: new Date().toLocaleDateString(),
                    type: notification.type
                });
            } else if (notification.type === 'interview' && notification.data?.id) {
                console.log('🔵 [TELEGRAM] Sending interactive interview notification...');
                success = await telegramService.sendInteractiveInterview({
                    id: notification.data.id,
                    title: notification.title,
                    company: notification.data.company || 'Unknown Company',
                    startDate: new Date().toLocaleString(),
                    location: notification.data.location || 'TBD'
                });
            } else if (notification.type === 'follow_up' && notification.data?.id) {
                console.log('🔵 [TELEGRAM] Sending interactive follow-up notification...');
                success = await telegramService.sendInteractiveFollowUp({
                    id: notification.data.id,
                    subject: notification.title,
                    company: notification.data.company || 'Unknown Company',
                    contact: notification.data.contact || 'Unknown Contact',
                    scheduledDate: new Date().toLocaleDateString()
                });
            } else {
                // Send regular message for non-actionable notifications
                console.log('🔵 [TELEGRAM] Sending regular notification message...');
                const emoji = this.getEmojiForType(notification.type);
                const message = `${emoji} *${notification.title}*\n\n${notification.message}`;
                success = await telegramService.sendMessage(message);
            }

            if (success) {
                console.log('🟢 [TELEGRAM] ✅ Telegram notification sent successfully!');
                toast.success('🎉 Telegram notification sent successfully!', {
                    duration: 4000,
                    style: {
                        background: '#10b981',
                        color: '#ffffff',
                    },
                });
            } else {
                console.log('🟡 [TELEGRAM] ⚠️ Telegram notification failed (returned false)');
                toast.error('❌ Telegram notification failed - check console for details', {
                    duration: 6000,
                    style: {
                        background: '#ef4444',
                        color: '#ffffff',
                    },
                });
            }

            return success;
        } catch (error: any) {
            console.error('🔴 [TELEGRAM] ❌ Error in Telegram notification process:');
            console.error('🔴 [TELEGRAM] Error type:', error.constructor.name);
            console.error('🔴 [TELEGRAM] Error message:', error.message);
            console.error('🔴 [TELEGRAM] Error stack:', error.stack);

            // Show user-friendly error
            toast.error(`Telegram error: ${error.message}`);

            return false;
        }
    }

    // Get emoji for notification type
    private getEmojiForType(type: string): string {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'reminder': return '🔔';
            case 'interview': return '🎯';
            case 'follow_up': return '📞';
            case 'info': return 'ℹ️';
            default: return '📢';
        }
    }

    // Send email notification
    private async sendEmailNotification(notification: Notification) {
        if (typeof window === 'undefined') return;

        try {
            const baseUrl = window.location.origin;
            const url = `${baseUrl}/api/notifications/email`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notification)
            });

            if (!response.ok && response.status !== 404) {
                console.warn('Failed to send email notification:', response.status, response.statusText);
            }
        } catch (error) {
            if (!(error instanceof TypeError && error.message.includes('Failed to parse URL'))) {
                console.error('Failed to send email notification:', error);
            }
        }
    }

    // Mark notification as read
    markAsRead(notificationId: string) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
            this.notifyListeners();
        }
    }

    // Mark all notifications as read
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.saveNotifications();
        this.notifyListeners();
    }

    // Delete notification
    deleteNotification(notificationId: string) {
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.saveNotifications();
        this.notifyListeners();
    }

    // Clear all notifications
    clearAll() {
        this.notifications = [];
        this.saveNotifications();
        this.notifyListeners();
    }

    // Get all notifications
    getNotifications(): Notification[] {
        return [...this.notifications];
    }

    // Get unread notifications
    getUnreadNotifications(): Notification[] {
        return this.notifications.filter(n => !n.read);
    }

    // Get unread count
    getUnreadCount(): number {
        return this.notifications.filter(n => !n.read).length;
    }

    // Update preferences
    updatePreferences(newPreferences: Partial<NotificationPreferences>) {
        this.preferences = { ...this.preferences, ...newPreferences };
        this.savePreferences();
    }

    // Get preferences
    getPreferences(): NotificationPreferences {
        return { ...this.preferences };
    }

    // Enable Telegram notifications
    enableTelegramNotifications() {
        console.log('🔵 [NOTIFICATION] Enabling Telegram notifications...');
        this.preferences.telegram = true;
        this.savePreferences();
        console.log('🟢 [NOTIFICATION] ✅ Telegram notifications enabled!');
    }

    // Disable Telegram notifications
    disableTelegramNotifications() {
        console.log('🔵 [NOTIFICATION] Disabling Telegram notifications...');
        this.preferences.telegram = false;
        this.savePreferences();
        console.log('🟡 [NOTIFICATION] Telegram notifications disabled');
    }

    // Test Telegram integration
    async testTelegramIntegration() {
        console.log('🔵 [NOTIFICATION] Testing Telegram integration...');

        // Enable Telegram notifications temporarily
        const originalSetting = this.preferences.telegram;
        this.preferences.telegram = true;

        // Create a test notification
        const testNotification = await this.createNotification({
            title: 'Telegram Test',
            message: 'This is a test notification to verify Telegram integration is working!',
            type: 'info'
        });

        // Restore original setting
        this.preferences.telegram = originalSetting;

        return testNotification;
    }

    // Start notification scheduler for reminders
    private startNotificationScheduler() {
        // Check every 5 minutes instead of every minute to reduce errors
        setInterval(() => {
            this.checkScheduledNotifications();
        }, 300000); // Check every 5 minutes
    }

    // Check for scheduled notifications
    private async checkScheduledNotifications() {
        // Skip if we're not in a browser environment
        if (typeof window === 'undefined') return;

        try {
            // Build full URL to avoid relative URL issues
            const baseUrl = window.location.origin;
            const url = `${baseUrl}/api/notifications/scheduled`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const scheduledNotifications = await response.json();

                // Only process if we have valid data
                if (Array.isArray(scheduledNotifications)) {
                    for (const scheduled of scheduledNotifications) {
                        if (scheduled && scheduled.title && scheduled.message) {
                            await this.createNotification({
                                title: scheduled.title,
                                message: scheduled.message,
                                type: scheduled.type || 'info',
                                actionUrl: scheduled.actionUrl,
                                actionLabel: scheduled.actionLabel,
                                metadata: scheduled.metadata
                            });
                        }
                    }
                }
            } else if (response.status === 404) {
                // API endpoint doesn't exist yet, silently ignore
                console.log('Scheduled notifications API not implemented yet');
            } else {
                console.warn('Failed to fetch scheduled notifications:', response.status, response.statusText);
            }
        } catch (error) {
            // Only log error if it's not a network/URL issue
            if (error instanceof TypeError && error.message.includes('Failed to parse URL')) {
                console.log('Scheduled notifications API not available in current environment');
            } else {
                console.error('Failed to check scheduled notifications:', error);
            }
        }
    }

    // Schedule a notification for a specific time
    async scheduleNotification(
        notification: Omit<Notification, 'id' | 'timestamp' | 'read'>,
        scheduledTime: Date
    ) {
        if (typeof window === 'undefined') return;

        try {
            const baseUrl = window.location.origin;
            const url = `${baseUrl}/api/notifications/schedule`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notification,
                    scheduledTime: scheduledTime.toISOString()
                })
            });

            if (!response.ok && response.status !== 404) {
                console.warn('Failed to schedule notification:', response.status, response.statusText);
            }
        } catch (error) {
            if (!(error instanceof TypeError && error.message.includes('Failed to parse URL'))) {
                console.error('Failed to schedule notification:', error);
            }
        }
    }

    // Quick notification methods for common use cases
    async notifyReminderDue(reminder: any) {
        return this.createNotification({
            title: 'Reminder Due',
            message: `${reminder.title} is due now`,
            type: 'reminder',
            actionUrl: `/reminders/${reminder.id}`,
            actionLabel: 'View Reminder',
            metadata: { activityId: reminder.id }
        });
    }

    async notifyInterviewSoon(interview: any) {
        return this.createNotification({
            title: 'Interview Starting Soon',
            message: `Your interview with ${interview.company} starts in 15 minutes`,
            type: 'interview',
            actionUrl: `/interviews/${interview.id}`,
            actionLabel: 'View Details',
            metadata: { activityId: interview.id }
        });
    }

    async notifyFollowUpDue(followUp: any) {
        return this.createNotification({
            title: 'Follow-up Due',
            message: `Time to follow up with ${followUp.company} about ${followUp.position}`,
            type: 'follow_up',
            actionUrl: `/follow-ups/${followUp.id}`,
            actionLabel: 'Create Follow-up',
            metadata: { activityId: followUp.id }
        });
    }

    async notifyApplicationDeadline(application: any) {
        return this.createNotification({
            title: 'Application Deadline Approaching',
            message: `Application for ${application.title} at ${application.company} is due soon`,
            type: 'warning',
            actionUrl: `/applications/${application.id}`,
            actionLabel: 'Complete Application',
            metadata: { applicationId: application.id }
        });
    }
}

// Create singleton instance
export const notificationService = new NotificationService();
export default notificationService;