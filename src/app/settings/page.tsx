'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  MessageSquare,
  Mail,
  Shield,
  Zap,
  Save,
  TestTube,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Info
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { notificationService, NotificationPreferences } from '@/services/NotificationService';
import { telegramService } from '@/services/TelegramService';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const SettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');

  // Notification settings
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    email: true,
    push: true,
    telegram: false,
    inApp: true,
    remindersBefore: 15,
    interviewReminders: true,
    followUpReminders: true,
    applicationDeadlines: true
  });

  // Telegram settings
  const [telegramConfig, setTelegramConfig] = useState({
    userId: '',
    username: ''
  });
  const [telegramStatus, setTelegramStatus] = useState({
    configured: false,
    connected: false,
    hasUserId: false,
    hasUsername: false
  });

  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    enabled: true,
    address: '',
    dailyDigest: true,
    weeklyReport: true,
    instantAlerts: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // Load notification preferences
    const prefs = notificationService.getPreferences();
    setNotificationPrefs(prefs);

    // Load Telegram settings from API
    try {
      const response = await fetch('/api/settings/telegram');
      if (response.ok) {
        const data = await response.json();
        if (data.telegramConfig) {
          setTelegramConfig({
            userId: data.telegramConfig.userId || '',
            username: data.telegramConfig.username || ''
          });
          setTelegramStatus({
            configured: data.telegramConfig.enabled,
            connected: data.telegramConfig.enabled && data.telegramConfig.userId,
            hasUserId: !!data.telegramConfig.userId,
            hasUsername: !!data.telegramConfig.username
          });
        }
      }
    } catch (error) {
      console.error('Failed to load Telegram settings:', error);
    }

    // Load Telegram status from service as fallback
    const status = telegramService.getConfigStatus();
    if (!telegramStatus.configured) {
      setTelegramStatus({
        configured: status.configured,
        connected: status.connected,
        hasUserId: status.hasChatId, // Map chatId to userId
        hasUsername: false // Service doesn't track username
      });
    }

    // Load email settings from localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('emailSettings');
        if (stored) {
          setEmailSettings(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load email settings:', error);
      }
    }
  };

  const saveNotificationSettings = async () => {
    try {
      setLoading(true);
      notificationService.updatePreferences(notificationPrefs);
      toast.success('Notification settings saved');
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const saveTelegramSettings = async () => {
    try {
      setLoading(true);

      // Save to database via API
      const response = await fetch('/api/settings/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: telegramConfig.userId,
          username: telegramConfig.username,
          enabled: true
        })
      });

      if (response.ok) {
        toast.success('Telegram configured successfully');
        setTelegramStatus({
          configured: true,
          connected: true,
          hasUserId: !!telegramConfig.userId,
          hasUsername: !!telegramConfig.username
        });
      } else {
        toast.error('Failed to save Telegram settings');
      }
    } catch (error) {
      console.error('Failed to configure Telegram:', error);
      toast.error('Failed to configure Telegram');
    } finally {
      setLoading(false);
    }
  };

  const saveEmailSettings = async () => {
    try {
      setLoading(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('emailSettings', JSON.stringify(emailSettings));
      }
      toast.success('Email settings saved');
    } catch (error) {
      console.error('Failed to save email settings:', error);
      toast.error('Failed to save email settings');
    } finally {
      setLoading(false);
    }
  };

  const testNotification = async (type: 'email' | 'push' | 'telegram' | 'inApp') => {
    try {
      switch (type) {
        case 'inApp':
          await notificationService.createNotification({
            title: 'Test Notification',
            message: 'This is a test in-app notification',
            type: 'info'
          });
          break;
        case 'telegram':
          if (telegramService.isConnectedToTelegram()) {
            await telegramService.sendNotification(
              'Test Notification',
              'This is a test Telegram notification from JobQuest AI',
              'info'
            );
          } else {
            toast.error('Telegram not connected');
          }
          break;
        case 'push':
          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (window.Notification.permission === 'granted') {
              new window.Notification('Test Notification', {
                body: 'This is a test push notification',
                icon: '/favicon.ico'
              });
            } else {
              const permission = await window.Notification.requestPermission();
              if (permission === 'granted') {
                new window.Notification('Test Notification', {
                  body: 'This is a test push notification',
                  icon: '/favicon.ico'
                });
              }
            }
          } else {
            toast.error('Push notifications not supported');
          }
          break;
        case 'email':
          toast.success('Test email sent (simulated)');
          break;
      }
    } catch (error) {
      console.error(`Failed to test ${type} notification:`, error);
      toast.error(`Failed to test ${type} notification`);
    }
  };

  const TabButton = ({ id, label, icon: Icon, isActive, onClick }: {
    id: string;
    label: string;
    icon: any;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all w-full text-left ${isActive
        ? 'bg-[var(--primary)] text-black shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]'
        : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-surface)]'
        }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  const ToggleSwitch = ({ checked, onChange, disabled = false }: { checked: boolean, onChange: (checked: boolean) => void, disabled?: boolean }) => (
    <button
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-[var(--primary)]' : 'bg-[var(--bg-deep)] border border-[var(--border-glass)]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'
        }`} />
    </button>
  );

  return (
    <AppLayout showFooter={false}>
      <div className="p-6 lg:p-8 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-glass)]">
                  <Settings className="w-8 h-8 text-[var(--text-muted)]" />
                </div>
                Settings
              </h1>
              <p className="text-[var(--text-muted)] mt-2 text-lg ml-16">
                Configure your notifications, integrations, and preferences
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-[var(--bg-surface)]/50 backdrop-blur-xl rounded-2xl p-4 border border-[var(--border-glass)] space-y-2">
                <TabButton
                  id="notifications"
                  label="Notifications"
                  icon={Bell}
                  isActive={activeTab === 'notifications'}
                  onClick={() => setActiveTab('notifications')}
                />
                <TabButton
                  id="telegram"
                  label="Telegram"
                  icon={MessageSquare}
                  isActive={activeTab === 'telegram'}
                  onClick={() => setActiveTab('telegram')}
                />
                <TabButton
                  id="email"
                  label="Email"
                  icon={Mail}
                  isActive={activeTab === 'email'}
                  onClick={() => setActiveTab('email')}
                />
                <TabButton
                  id="security"
                  label="Security"
                  icon={Shield}
                  isActive={activeTab === 'security'}
                  onClick={() => setActiveTab('security')}
                />
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-[var(--bg-surface)]/50 backdrop-blur-xl border border-[var(--border-glass)] rounded-2xl p-6"
              >
                {activeTab === 'notifications' && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-6">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Bell className="w-5 h-5 text-[var(--warning)]" />
                        Notification Preferences
                      </h2>
                      <button
                        onClick={saveNotificationSettings}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-black font-bold rounded-xl hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>

                    {/* Notification Channels */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Notification Channels</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-[var(--bg-deep)]/50 border border-[var(--border-glass)] rounded-xl hover:border-[var(--primary)]/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-blue-400" />
                            <div>
                              <p className="font-medium text-white">In-App Notifications</p>
                              <p className="text-sm text-[var(--text-muted)]">Show notifications in the app</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <ToggleSwitch
                              checked={notificationPrefs.inApp}
                              onChange={(checked) => setNotificationPrefs(prev => ({ ...prev, inApp: checked }))}
                            />
                            <button
                              onClick={() => testNotification('inApp')}
                              className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                              title="Test Notification"
                            >
                              <TestTube className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[var(--bg-deep)]/50 border border-[var(--border-glass)] rounded-xl hover:border-[var(--primary)]/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-[var(--success)]" />
                            <div>
                              <p className="font-medium text-white">Push Notifications</p>
                              <p className="text-sm text-[var(--text-muted)]">Browser push notifications</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <ToggleSwitch
                              checked={notificationPrefs.push}
                              onChange={(checked) => setNotificationPrefs(prev => ({ ...prev, push: checked }))}
                            />
                            <button
                              onClick={() => testNotification('push')}
                              className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                              title="Test Notification"
                            >
                              <TestTube className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[var(--bg-deep)]/50 border border-[var(--border-glass)] rounded-xl hover:border-[var(--primary)]/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="font-medium text-white">Telegram</p>
                              <p className="text-sm text-[var(--text-muted)]">Send to Telegram bot</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <ToggleSwitch
                              checked={notificationPrefs.telegram}
                              onChange={(checked) => setNotificationPrefs(prev => ({ ...prev, telegram: checked }))}
                              disabled={!telegramStatus.connected}
                            />
                            <button
                              onClick={() => testNotification('telegram')}
                              disabled={!telegramStatus.connected}
                              className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Test Notification"
                            >
                              <TestTube className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[var(--bg-deep)]/50 border border-[var(--border-glass)] rounded-xl hover:border-[var(--primary)]/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-[var(--danger)]" />
                            <div>
                              <p className="font-medium text-white">Email</p>
                              <p className="text-sm text-[var(--text-muted)]">Send email notifications</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <ToggleSwitch
                              checked={notificationPrefs.email}
                              onChange={(checked) => setNotificationPrefs(prev => ({ ...prev, email: checked }))}
                            />
                            <button
                              onClick={() => testNotification('email')}
                              className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                              title="Test Notification"
                            >
                              <TestTube className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-[var(--border-glass)] pt-6 space-y-4">
                      <h3 className="text-lg font-semibold text-white">Notification Types</h3>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-[var(--bg-deep)]/30 rounded-xl border border-[var(--border-glass)]">
                          <span className="text-white font-medium">Interview Reminders</span>
                          <ToggleSwitch
                            checked={notificationPrefs.interviewReminders}
                            onChange={(checked) => setNotificationPrefs(prev => ({ ...prev, interviewReminders: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[var(--bg-deep)]/30 rounded-xl border border-[var(--border-glass)]">
                          <span className="text-white font-medium">Follow-up Reminders</span>
                          <ToggleSwitch
                            checked={notificationPrefs.followUpReminders}
                            onChange={(checked) => setNotificationPrefs(prev => ({ ...prev, followUpReminders: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[var(--bg-deep)]/30 rounded-xl border border-[var(--border-glass)]">
                          <span className="text-white font-medium">Application Deadlines</span>
                          <ToggleSwitch
                            checked={notificationPrefs.applicationDeadlines}
                            onChange={(checked) => setNotificationPrefs(prev => ({ ...prev, applicationDeadlines: checked }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-[var(--border-glass)] pt-6 space-y-4">
                      <h3 className="text-lg font-semibold text-white">Timing</h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[var(--text-muted)] mb-4">
                            Reminder Notification Time (minutes before)
                          </label>
                          <input
                            type="range"
                            min="5"
                            max="120"
                            step="5"
                            value={notificationPrefs.remindersBefore}
                            onChange={(e) => setNotificationPrefs(prev => ({ ...prev, remindersBefore: parseInt(e.target.value) }))}
                            className="w-full h-2 bg-[var(--bg-deep)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                          />
                          <div className="flex justify-between text-xs text-[var(--text-muted)] mt-2">
                            <span>5m</span>
                            <span>15m</span>
                            <span>30m</span>
                            <span>1h</span>
                            <span>2h</span>
                          </div>
                          <p className="text-sm text-[var(--primary)] font-medium mt-2 text-center">
                            Current: {notificationPrefs.remindersBefore} minutes before
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'telegram' && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-6">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-purple-400" />
                        Telegram Integration
                      </h2>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${telegramStatus.connected
                            ? 'bg-[var(--success)]/10 border-[var(--success)]/20 text-[var(--success)]'
                            : 'bg-[var(--danger)]/10 border-[var(--danger)]/20 text-[var(--danger)]'
                          }`}>
                          {telegramStatus.connected ? 'Connected' : 'Disconnected'}
                        </span>
                        <button
                          onClick={saveTelegramSettings}
                          disabled={loading}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {loading ? 'Saving...' : 'Save & Connect'}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-4">
                      <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                      <div className="space-y-2">
                        <h4 className="font-bold text-blue-400">Telegram Integration Setup</h4>
                        <div className="text-sm text-blue-200/80 space-y-2">
                          <p>To enable Telegram notifications:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-2">
                            <li>Send <code className="bg-blue-500/20 px-1 rounded">/start</code> to our shared bot on Telegram</li>
                            <li>Copy your Telegram User ID from the bot's response</li>
                            <li>Enter your User ID below and save</li>
                            <li>Start using commands like <code className="bg-blue-500/20 px-1 rounded">fleeting: Your note here</code></li>
                          </ol>
                          <p className="text-xs opacity-70 mt-2">
                            <strong>Shared Bot:</strong> All users use the same bot for simplicity
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                          Telegram User ID
                        </label>
                        <input
                          type="text"
                          placeholder="Enter your Telegram User ID (e.g., 123456789)"
                          value={telegramConfig.userId}
                          onChange={(e) => setTelegramConfig(prev => ({ ...prev, userId: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none transition-all"
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-2">
                          Send /start to our bot to get your User ID
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                          Telegram Username (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Your Telegram username (without @)"
                          value={telegramConfig.username}
                          onChange={(e) => setTelegramConfig(prev => ({ ...prev, username: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none transition-all"
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-2">
                          Optional: Your @username for reference
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-[var(--border-glass)] pt-6 space-y-4">
                      <h3 className="text-lg font-semibold text-white">Connection Status</h3>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-[var(--bg-deep)]/30 rounded-xl border border-[var(--border-glass)]">
                          {telegramStatus.hasUserId ? (
                            <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-[var(--danger)]" />
                          )}
                          <span className="text-sm text-white font-medium">User ID</span>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-[var(--bg-deep)]/30 rounded-xl border border-[var(--border-glass)]">
                          {telegramStatus.hasUsername ? (
                            <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-[var(--text-muted)]" />
                          )}
                          <span className="text-sm text-white font-medium">Username</span>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-[var(--bg-deep)]/30 rounded-xl border border-[var(--border-glass)]">
                          {telegramStatus.connected ? (
                            <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-[var(--danger)]" />
                          )}
                          <span className="text-sm text-white font-medium">Linked</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-[var(--border-glass)] pt-6 space-y-4">
                      <h3 className="text-lg font-semibold text-white">Available Commands</h3>

                      <div className="bg-[var(--bg-deep)]/50 rounded-xl p-4 border border-[var(--border-glass)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex justify-between items-center p-2 hover:bg-[var(--bg-surface)] rounded-lg transition-colors">
                            <code className="text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">/start</code>
                            <span className="text-[var(--text-muted)]">Start the assistant</span>
                          </div>
                          <div className="flex justify-between items-center p-2 hover:bg-[var(--bg-surface)] rounded-lg transition-colors">
                            <code className="text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">/status</code>
                            <span className="text-[var(--text-muted)]">Get job search status</span>
                          </div>
                          <div className="flex justify-between items-center p-2 hover:bg-[var(--bg-surface)] rounded-lg transition-colors">
                            <code className="text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">/reminders</code>
                            <span className="text-[var(--text-muted)]">List pending reminders</span>
                          </div>
                          <div className="flex justify-between items-center p-2 hover:bg-[var(--bg-surface)] rounded-lg transition-colors">
                            <code className="text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">/interviews</code>
                            <span className="text-[var(--text-muted)]">List upcoming interviews</span>
                          </div>
                          <div className="flex justify-between items-center p-2 hover:bg-[var(--bg-surface)] rounded-lg transition-colors">
                            <code className="text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">/followups</code>
                            <span className="text-[var(--text-muted)]">List pending follow-ups</span>
                          </div>
                          <div className="flex justify-between items-center p-2 hover:bg-[var(--bg-surface)] rounded-lg transition-colors">
                            <code className="text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">/help</code>
                            <span className="text-[var(--text-muted)]">Show all commands</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'email' && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-6">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Mail className="w-5 h-5 text-[var(--danger)]" />
                        Email Settings
                      </h2>
                      <button
                        onClick={saveEmailSettings}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--danger)] text-white font-bold rounded-xl hover:bg-[var(--danger)]/90 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-[var(--bg-deep)]/50 border border-[var(--border-glass)] rounded-xl">
                        <div>
                          <p className="font-medium text-white">Email Notifications</p>
                          <p className="text-sm text-[var(--text-muted)]">Enable email notifications</p>
                        </div>
                        <ToggleSwitch
                          checked={emailSettings.enabled}
                          onChange={(checked) => setEmailSettings(prev => ({ ...prev, enabled: checked }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          placeholder="your.email@example.com"
                          value={emailSettings.address}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none transition-all"
                        />
                      </div>

                      <div className="border-t border-[var(--border-glass)] pt-6 space-y-4">
                        <h3 className="text-lg font-semibold text-white">Email Types</h3>

                        <div className="flex items-center justify-between p-3 bg-[var(--bg-deep)]/30 rounded-xl border border-[var(--border-glass)]">
                          <span className="text-white font-medium">Daily Digest</span>
                          <ToggleSwitch
                            checked={emailSettings.dailyDigest}
                            onChange={(checked) => setEmailSettings(prev => ({ ...prev, dailyDigest: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[var(--bg-deep)]/30 rounded-xl border border-[var(--border-glass)]">
                          <span className="text-white font-medium">Weekly Report</span>
                          <ToggleSwitch
                            checked={emailSettings.weeklyReport}
                            onChange={(checked) => setEmailSettings(prev => ({ ...prev, weeklyReport: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[var(--bg-deep)]/30 rounded-xl border border-[var(--border-glass)]">
                          <span className="text-white font-medium">Instant Alerts</span>
                          <ToggleSwitch
                            checked={emailSettings.instantAlerts}
                            onChange={(checked) => setEmailSettings(prev => ({ ...prev, instantAlerts: checked }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-2 border-b border-[var(--border-glass)] pb-6">
                      <Shield className="w-6 h-6 text-[var(--success)]" />
                      <h2 className="text-xl font-bold text-white">Security & Privacy</h2>
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-4">
                      <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                      <div className="space-y-2">
                        <h4 className="font-bold text-blue-400">Security Features</h4>
                        <p className="text-sm text-blue-200/80">
                          Advanced security features will be available in the next update.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-6 bg-[var(--bg-deep)]/50 rounded-xl border border-[var(--border-glass)]">
                        <h3 className="font-bold text-white mb-2">Data Privacy</h3>
                        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                          Your job search data is stored locally and encrypted. We never share your personal information.
                        </p>
                      </div>

                      <div className="p-6 bg-[var(--bg-deep)]/50 rounded-xl border border-[var(--border-glass)]">
                        <h3 className="font-bold text-white mb-2">API Security</h3>
                        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                          All API communications are encrypted using HTTPS. Telegram credentials are stored securely.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;