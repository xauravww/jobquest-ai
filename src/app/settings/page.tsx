'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  MessageSquare,
  Mail,
  Zap,
  Save,
  TestTube,
  CheckCircle,
  AlertCircle,
  Info,
  Bot,
  Clock,
  Play,
  Pause,
  Sliders
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { notificationService, NotificationPreferences } from '@/services/NotificationService';
import { telegramService } from '@/services/TelegramService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';

const SettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('agent');

  // Agent Settings
  const [agentSettings, setAgentSettings] = useState({
    enabled: true,
    scanFrequency: '6h', // 1h, 6h, 12h, 24h
    autoApply: false,
    minMatchScore: 85,
    autoFollowUp: true,
    maxApplicationsPerDay: 10
  });

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

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // Load notification preferences
    const prefs = notificationService.getPreferences();
    setNotificationPrefs(prefs);

    // Load Agent settings (Mock for now)
    const storedAgent = localStorage.getItem('agentSettings');
    if (storedAgent) {
      setAgentSettings(JSON.parse(storedAgent));
    }

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

  };

  const saveAgentSettings = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      localStorage.setItem('agentSettings', JSON.stringify(agentSettings));
      toast.success('Agent configuration saved');
    } catch (error) {
      toast.error('Failed to save agent settings');
    } finally {
      setLoading(false);
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

  const ToggleSwitch = ({ checked, onChange, disabled = false }: { checked: boolean, onChange: (checked: boolean) => void, disabled?: boolean }) => (
    <Button
      variant="ghost"
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none ${checked
        ? 'bg-[var(--primary)] border border-[var(--primary-dim)]'
        : 'bg-[var(--bg-deep)] border border-[var(--border-strong)]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      aria-label={checked ? 'Turn off' : 'Turn on'}
    >
      <div className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white border border-[var(--border-glass)] shadow-[0_1px_3px_rgba(0,0,0,0.45)] transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'
        }`} />
    </Button>
  );

  return (
    <AppLayout showFooter={false}>
      <div className="p-6 lg:p-8 min-h-screen bg-[var(--bg-deep)]">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-3 bg-[var(--bg-surface)] rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                  <Settings className="w-8 h-8 text-[var(--primary)]" />
                </div>
                Settings
              </h1>
              <p className="text-[var(--text-muted)] mt-2 text-lg ml-16">
                Configure your automation, notifications, and preferences
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Pill tab bar (profile style) */}
            <div className="flex flex-wrap gap-1.5 bg-[var(--bg-surface)]/50 backdrop-blur-xl rounded-2xl p-2">
              {[
                { id: 'agent', label: 'Agent Config', icon: Bot },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'telegram', label: 'Telegram', icon: MessageSquare },
              ].map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <Button
                    key={id}
                    variant="ghost"
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${isActive
                      ? 'bg-[var(--primary)] text-black'
                      : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-glass)]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Button>
                );
              })}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-[var(--bg-surface)]/50 backdrop-blur-xl rounded-2xl p-6 min-h-[600px]"
              >
                  {activeTab === 'agent' && (
                    <div className="space-y-8">
                      <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <Bot className="w-5 h-5 text-[var(--primary)]" />
                          Agent Configuration
                        </h2>
                        <Button
                          variant="primary"
                          onClick={saveAgentSettings}
                          disabled={loading}
                          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-black font-bold rounded-xl hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Agent Status */}
                        <div className="p-6 bg-[var(--bg-deep)]/50 rounded-xl hover:bg-[var(--bg-deep)]/70 transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2">
                              <Zap className="w-4 h-4 text-[var(--primary)]" />
                              Agent Status
                            </h3>
                            <ToggleSwitch
                              checked={agentSettings.enabled}
                              onChange={(checked) => setAgentSettings(prev => ({ ...prev, enabled: checked }))}
                            />
                          </div>
                          <p className="text-sm text-[var(--text-muted)] mb-4">
                            Master switch to pause or resume all automated activities.
                          </p>
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${agentSettings.enabled ? 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20' : 'bg-[var(--text-muted)]/10 text-[var(--text-muted)] border border-[var(--border-glass)]'}`}>
                            {agentSettings.enabled ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                            {agentSettings.enabled ? 'Active' : 'Paused'}
                          </div>
                        </div>

                        {/* Scan Frequency */}
                        <div className="p-6 bg-[var(--bg-deep)]/50 rounded-xl hover:bg-[var(--bg-deep)]/70 transition-all">
                          <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4 text-blue-400" />
                            Scan Frequency
                          </h3>
                          <div className="space-y-3">
                            {['1h', '6h', '12h', '24h'].map((freq) => (
                              <label key={freq} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface)] cursor-pointer hover:bg-[var(--bg-surface)]/80 transition-colors">
                                <span className="text-sm text-white">Every {freq}</span>
                                <input
                                  type="radio"
                                  name="scanFrequency"
                                  value={freq}
                                  checked={agentSettings.scanFrequency === freq}
                                  onChange={(e) => setAgentSettings(prev => ({ ...prev, scanFrequency: e.target.value }))}
                                  className="accent-[var(--primary)]"
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[var(--border-glass)] pt-6 space-y-6">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Sliders className="w-5 h-5 text-purple-400" />
                          Automation Rules
                        </h3>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-[var(--bg-deep)]/30 rounded-xl">
                            <div>
                              <p className="font-medium text-white">Auto-Apply (Experimental)</p>
                              <p className="text-sm text-[var(--text-muted)]">Automatically apply to jobs with 95%+ match score</p>
                            </div>
                            <ToggleSwitch
                              checked={agentSettings.autoApply}
                              onChange={(checked) => setAgentSettings(prev => ({ ...prev, autoApply: checked }))}
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 bg-[var(--bg-deep)]/30 rounded-xl">
                            <div>
                              <p className="font-medium text-white">Auto Follow-up</p>
                              <p className="text-sm text-[var(--text-muted)]">Draft follow-up emails for applied jobs</p>
                            </div>
                            <ToggleSwitch
                              checked={agentSettings.autoFollowUp}
                              onChange={(checked) => setAgentSettings(prev => ({ ...prev, autoFollowUp: checked }))}
                            />
                          </div>

                          <div className="p-4 bg-[var(--bg-deep)]/30 rounded-xl">
                            <div className="flex justify-between mb-2">
                              <label className="font-medium text-white">Minimum Match Score</label>
                              <span className="text-[var(--primary)] font-bold">{agentSettings.minMatchScore}%</span>
                            </div>
                            <input
                              type="range"
                              min="50"
                              max="100"
                              value={agentSettings.minMatchScore}
                              onChange={(e) => setAgentSettings(prev => ({ ...prev, minMatchScore: parseInt(e.target.value) }))}
                              className="w-full h-2 bg-[var(--bg-deep)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                            />
                            <p className="text-xs text-[var(--text-muted)] mt-2">Only show opportunities above this score</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'notifications' && (
                    <div className="space-y-8">
                      <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <Bell className="w-5 h-5 text-[var(--warning)]" />
                          Notification Preferences
                        </h2>
                        <Button
                          variant="primary"
                          onClick={saveNotificationSettings}
                          disabled={loading}
                          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-black font-bold rounded-xl hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
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
                              <Button
                                variant="ghost"
                                onClick={() => testNotification('inApp')}
                                className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                                title="Test Notification"
                                aria-label="Test in-app notification"
                              >
                                <TestTube className="w-4 h-4" />
                              </Button>
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
                              <Button
                                variant="ghost"
                                onClick={() => testNotification('push')}
                                className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                                title="Test Notification"
                                aria-label="Test push notification"
                              >
                                <TestTube className="w-4 h-4" />
                              </Button>
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
                              <Button
                                variant="ghost"
                                onClick={() => testNotification('telegram')}
                                disabled={!telegramStatus.connected}
                                className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors disabled:opacity-50"
                                title="Test Notification"
                                aria-label="Test telegram notification"
                              >
                                <TestTube className="w-4 h-4" />
                              </Button>
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
                              <Button
                                variant="ghost"
                                onClick={() => testNotification('email')}
                                className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                                title="Test Notification"
                                aria-label="Test email notification"
                              >
                                <TestTube className="w-4 h-4" />
                              </Button>
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
                          <Button
                            variant="primary"
                            onClick={saveTelegramSettings}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-colors disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            {loading ? 'Saving...' : 'Save & Connect'}
                          </Button>
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
                              <li>Copy your Telegram User ID from the bot&apos;s response</li>
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



                </motion.div>
              </AnimatePresence>
        </div>
      </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;