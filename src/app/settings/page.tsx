'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Sliders,
  Chrome,
  Key,
  Download,
  Copy,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { notificationService, NotificationPreferences } from '@/services/NotificationService';
import { telegramService } from '@/services/TelegramService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import Toggle from '@/components/ui/Toggle';

const SettingsPage = () => {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('agent');

  // Extension Settings State
  const [extensionConnected, setExtensionConnected] = useState(false);
  const [loggerEnabled, setLoggerEnabled] = useState(false);
  const [naukriStatus, setNaukriStatus] = useState<{
    isLoggedIn: boolean;
    cookieCount: number;
    userEmail?: string | null;
    lastChecked?: string;
  }>({ isLoggedIn: false, cookieCount: 0 });
  const [checkingNaukri, setCheckingNaukri] = useState(false);
  const [capturedLogs, setCapturedLogs] = useState<Array<{
    id: string;
    timestamp: string;
    method: string;
    url: string;
    hostname: string;
    pathname: string;
    curl: string;
    responseStatus?: number;
    responseBody?: string;
  }>>([]);
  const [extensionToken, setExtensionToken] = useState('jq_ext_' + Math.random().toString(36).substring(2, 12));

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
    const tabParam = searchParams.get('tab');
    if (tabParam && ['agent', 'notifications', 'telegram', 'extension'].includes(tabParam)) {
      setActiveTab(tabParam);
    }

    // Check stored extension status
    const storedStatus = localStorage.getItem('jobquest_extension_connected') === 'true';
    setExtensionConnected(storedStatus);

    const storedLogger = localStorage.getItem('jobquest_extension_logger') === 'true';
    setLoggerEnabled(storedLogger);

    // Request fresh logs and sync state from extension & local disk files
    fetch('/api/agent-logs?limit=50')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.logs) {
          setCapturedLogs(data.logs);
        }
      })
      .catch(() => {});

    const handleLogsResult = (event: MessageEvent) => {
      if (event.data?.type === 'JOBQUEST_EXTENSION_PONG') {
        if (event.data.payload?.connected !== undefined) {
          setExtensionConnected(event.data.payload.connected);
          localStorage.setItem('jobquest_extension_connected', String(event.data.payload.connected));
        }
        if (event.data.payload?.loggerEnabled !== undefined) {
          setLoggerEnabled(event.data.payload.loggerEnabled);
          localStorage.setItem('jobquest_extension_logger', String(event.data.payload.loggerEnabled));
        }
        if (event.data.payload?.naukri) {
          setNaukriStatus(event.data.payload.naukri);
        }
        setCheckingNaukri(false);
      }
      if (event.data?.type === 'JOBQUEST_NAUKRI_STATUS_RESULT') {
        if (event.data.payload) {
          setNaukriStatus(event.data.payload);
        }
        setCheckingNaukri(false);
      }
      if (event.data?.type === 'JOBQUEST_LOGGER_STATE_CHANGED') {
        setLoggerEnabled(event.data.payload?.loggerEnabled);
        localStorage.setItem('jobquest_extension_logger', String(event.data.payload?.loggerEnabled));
      }
      if (event.data?.type === 'JOBQUEST_CONNECTION_STATE_CHANGED') {
        setExtensionConnected(event.data.payload?.connected);
        localStorage.setItem('jobquest_extension_connected', String(event.data.payload?.connected));
      }
      if (event.data?.type === 'JOBQUEST_NEW_CURL_ENTRY') {
        setCapturedLogs((prev) => [event.data.payload, ...prev].slice(0, 50));
      }
    };
    window.addEventListener('message', handleLogsResult);
    window.postMessage({ type: 'JOBQUEST_EXTENSION_PING' }, '*');

    const storedToken = localStorage.getItem('jobquest_extension_token');
    if (storedToken) {
      setExtensionToken(storedToken);
    } else {
      const newToken = 'jq_ext_' + Math.random().toString(36).substring(2, 12);
      setExtensionToken(newToken);
      localStorage.setItem('jobquest_extension_token', newToken);
    }

    return () => {
      window.removeEventListener('message', handleLogsResult);
    };
  }, [searchParams]);

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

  const handleToggleExtensionConnection = (connected: boolean) => {
    setExtensionConnected(connected);
    localStorage.setItem('jobquest_extension_connected', String(connected));

    window.postMessage({
      type: 'JOBQUEST_CONNECT_EXTENSION',
      payload: {
        connected,
        apiKey: extensionToken,
        serverUrl: window.location.origin
      }
    }, '*');

    if (connected) {
      toast.success('Job Agent extension connected');
    } else {
      toast.success('Job Agent extension disconnected');
    }
  };

  const handleToggleLogger = (enabled: boolean) => {
    setLoggerEnabled(enabled);
    localStorage.setItem('jobquest_extension_logger', String(enabled));

    window.postMessage({
      type: 'JOBQUEST_SET_LOGGER',
      payload: { enabled }
    }, '*');

    if (enabled) {
      toast.success('cURL Logger enabled: capturing browser requests');
    } else {
      toast.success('cURL Logger disabled');
    }
  };

  const handleClearLogs = async () => {
    try {
      await fetch('/api/agent-logs', { method: 'DELETE' });
      setCapturedLogs([]);
      toast.success('Local disk files & database cleared');
    } catch {
      toast.error('Failed to clear logs');
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
                { id: 'extension', label: 'Chrome Extension', icon: Chrome },
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
                            <Toggle
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
                            {['1h', '6h', '12h', '24h'].map((freq) => {
                              const isSelected = agentSettings.scanFrequency === freq;
                              return (
                                <label
                                  key={freq}
                                  onClick={() => setAgentSettings(prev => ({ ...prev, scanFrequency: freq }))}
                                  className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-[rgba(34,197,94,0.06)] border-[rgba(34,197,94,0.35)] shadow-sm'
                                      : 'bg-[var(--bg-surface)] border-[var(--border)] hover:border-[var(--border-strong)]'
                                  }`}
                                >
                                  <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-[var(--text-muted)]'}`}>
                                    Every {freq}
                                  </span>
                                  <div
                                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                                      isSelected
                                        ? 'border-2 border-[var(--live)] bg-[var(--live)]/20'
                                        : 'border border-[var(--border-strong)] bg-transparent'
                                    }`}
                                  >
                                    {isSelected && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--live)] animate-in zoom-in-50 duration-150" />
                                    )}
                                  </div>
                                </label>
                              );
                            })}
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
                            <Toggle
                              checked={agentSettings.autoApply}
                              onChange={(checked) => setAgentSettings(prev => ({ ...prev, autoApply: checked }))}
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 bg-[var(--bg-deep)]/30 rounded-xl">
                            <div>
                              <p className="font-medium text-white">Auto Follow-up</p>
                              <p className="text-sm text-[var(--text-muted)]">Draft follow-up emails for applied jobs</p>
                            </div>
                            <Toggle
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
                              <Toggle
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
                              <Toggle
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
                              <Toggle
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
                              <Toggle
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
                            <Toggle
                              checked={notificationPrefs.interviewReminders}
                              onChange={(checked) => setNotificationPrefs(prev => ({ ...prev, interviewReminders: checked }))}
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 bg-[var(--bg-deep)]/30 rounded-xl border border-[var(--border-glass)]">
                            <span className="text-white font-medium">Follow-up Reminders</span>
                            <Toggle
                              checked={notificationPrefs.followUpReminders}
                              onChange={(checked) => setNotificationPrefs(prev => ({ ...prev, followUpReminders: checked }))}
                            />
                          </div>
                          <div className="flex items-center justify-between p-3 bg-[var(--bg-deep)]/30 rounded-xl border border-[var(--border-glass)]">
                            <span className="text-white font-medium">Application Deadlines</span>
                            <Toggle
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



                  {/* Chrome Extension Settings */}
                  {activeTab === 'extension' && (
                    <div className="space-y-8">
                      <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-6">
                        <div>
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Chrome className="w-5 h-5 text-[var(--primary)]" />
                            Job Agent Extension
                          </h2>
                          <p className="text-sm text-[var(--text-muted)] mt-1">
                            Connect your browser extension to autofill forms and import jobs directly.
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider border ${
                              extensionConnected
                                ? 'bg-[rgba(34,197,94,0.12)] text-[var(--live)] border-[rgba(34,197,94,0.3)]'
                                : 'bg-[rgba(239,68,68,0.1)] text-[var(--danger)] border-[rgba(239,68,68,0.3)]'
                            }`}
                          >
                            {extensionConnected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                      </div>

                      {/* Connection Toggle & Card */}
                      <div className="p-6 bg-[var(--bg-deep)]/60 border border-[var(--border)] rounded-2xl space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-[var(--live)]" />
                              Extension Pairing Status
                            </h3>
                            <p className="text-sm text-[var(--text-muted)]">
                              Enable to allow the extension to pull your resume profiles and application notes.
                            </p>
                          </div>
                          <Toggle
                            checked={extensionConnected}
                            onChange={handleToggleExtensionConnection}
                            label="Toggle extension connection"
                          />
                        </div>

                        {/* Pairing Token */}
                        <div className="pt-4 border-t border-[var(--border)] space-y-2">
                          <label className="block text-xs font-mono uppercase text-[var(--text-dim)] tracking-wider">
                            Pairing Token (API Key)
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 font-mono text-sm px-3.5 py-2.5 bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg text-[var(--text-main)] truncate">
                              {extensionToken}
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(extensionToken);
                                toast.success('Pairing token copied to clipboard');
                              }}
                              leftIcon={<Copy className="w-3.5 h-3.5" />}
                              className="h-10 px-3.5 shrink-0"
                            >
                              Copy
                            </Button>
                          </div>
                          <p className="text-xs text-[var(--text-muted)]">
                            This token authenticates your browser extension with your local session.
                          </p>
                        </div>
                      </div>

                      {/* Naukri.com Cookie / Login Status Card */}
                      <div className="p-6 bg-[var(--bg-deep)]/60 border border-[var(--border)] rounded-2xl space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5">
                              <h3 className="font-semibold text-white">Naukri.com Session &amp; Cookies</h3>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider border ${
                                  naukriStatus.isLoggedIn
                                    ? 'bg-[rgba(34,197,94,0.12)] text-[var(--live)] border-[rgba(34,197,94,0.3)]'
                                    : 'bg-[rgba(239,68,68,0.1)] text-[var(--danger)] border-[rgba(239,68,68,0.3)]'
                                }`}
                              >
                                {naukriStatus.isLoggedIn ? 'Active Session' : 'Not Logged In'}
                              </span>
                            </div>
                            <p className="text-sm text-[var(--text-muted)]">
                              Monitors whether active authentication cookies (`nauk_at`, `NKAUTH`) are detected in your browser.
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setCheckingNaukri(true);
                                window.postMessage({ type: 'JOBQUEST_CHECK_NAUKRI' }, '*');
                                setTimeout(() => setCheckingNaukri(false), 600);
                              }}
                              disabled={checkingNaukri}
                              className="h-8 px-3 text-xs"
                            >
                              {checkingNaukri ? 'Checking...' : 'Check Status'}
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[var(--border)]">
                          <div className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)]">
                            <div className="text-[11px] font-mono uppercase text-[var(--text-dim)]">Status</div>
                            <div className="text-sm font-semibold text-[var(--text-main)] mt-0.5 flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${naukriStatus.isLoggedIn ? 'bg-[var(--live)]' : 'bg-[var(--danger)]'}`} />
                              {naukriStatus.isLoggedIn ? 'Connected' : 'Disconnected'}
                            </div>
                          </div>

                          <div className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)]">
                            <div className="text-[11px] font-mono uppercase text-[var(--text-dim)]">Detected User</div>
                            <div className="text-sm font-semibold text-[var(--text-main)] mt-0.5 truncate">
                              {naukriStatus.userEmail || (naukriStatus.isLoggedIn ? 'Logged In' : 'None')}
                            </div>
                          </div>

                          <div className="p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)]">
                            <div className="text-[11px] font-mono uppercase text-[var(--text-dim)]">Cookie Count</div>
                            <div className="text-sm font-semibold text-[var(--text-main)] mt-0.5">
                              {naukriStatus.cookieCount} cookies detected
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* cURL Request Logger Mode Panel */}
                      <div className="p-6 bg-[var(--bg-deep)]/60 border border-[var(--border)] rounded-2xl space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-white">Browser cURL Logger Mode</h3>
                              <span className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase ${
                                loggerEnabled
                                  ? 'bg-[rgba(34,197,94,0.15)] text-[var(--live)] border border-[rgba(34,197,94,0.3)]'
                                  : 'bg-[var(--bg-raised)] text-[var(--text-dim)]'
                              }`}>
                                {loggerEnabled ? 'Recording' : 'Idle'}
                              </span>
                            </div>
                            <p className="text-sm text-[var(--text-muted)]">
                              Record real HTTP requests, headers, and payloads sent by your browser to reproduce exact cURLs for agent automation.
                            </p>
                          </div>
                          <Toggle
                            checked={loggerEnabled}
                            onChange={handleToggleLogger}
                            label="Toggle cURL Logger"
                          />
                        </div>

                        {/* Logs Console */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono uppercase text-[var(--text-muted)] tracking-wider">
                                Captured cURL Requests ({capturedLogs.length})
                              </span>
                              <span className="text-[11px] text-[var(--text-dim)]">
                                (Persisted in MongoDB &amp; data/agent-curl-logs/)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/agent-logs', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ logs: capturedLogs })
                                    });
                                    if (res.ok) {
                                      toast.success('All logs synced to database & disk');
                                    }
                                  } catch {
                                    toast.error('Sync failed');
                                  }
                                }}
                                className="h-7 px-2.5 text-xs"
                              >
                                Sync to Disk
                              </Button>
                              {capturedLogs.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleClearLogs}
                                  className="h-7 px-2 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10"
                                >
                                  Clear All
                                </Button>
                              )}
                            </div>
                          </div>

                          {capturedLogs.length === 0 ? (
                            <div className="p-8 text-center border border-dashed border-[var(--border)] rounded-xl bg-[var(--bg-deep)]/30 text-xs text-[var(--text-dim)]">
                              {loggerEnabled
                                ? 'Logger active. Perform actions in any tab to record exact cURL commands.'
                                : 'Logger is turned off. Toggle above to begin capturing browser requests.'}
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                              {capturedLogs.map((log) => (
                                <div
                                  key={log.id}
                                  className="p-3 bg-[var(--bg-deep)] border border-[var(--border)] rounded-xl hover:border-[var(--border-strong)] transition-colors flex flex-col gap-2"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--bg-raised)] text-[var(--text-main)]">
                                        {log.method}
                                      </span>
                                      {log.responseStatus && (
                                        <span className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                                          log.responseStatus >= 200 && log.responseStatus < 300
                                            ? 'bg-[rgba(34,197,94,0.15)] text-[var(--live)]'
                                            : 'bg-[rgba(239,68,68,0.15)] text-[var(--danger)]'
                                        }`}>
                                          {log.responseStatus}
                                        </span>
                                      )}
                                      <span className="text-xs text-[var(--text-muted)] font-mono truncate">
                                        {log.hostname}{log.pathname}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-[11px] text-[var(--text-dim)] font-mono">
                                        {log.timestamp}
                                      </span>
                                      {log.responseBody && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            navigator.clipboard.writeText(log.responseBody || '');
                                            toast.success('Response JSON copied');
                                          }}
                                          leftIcon={<Copy className="w-3 h-3" />}
                                          className="h-7 px-2 text-xs text-[var(--text-muted)] hover:text-white"
                                        >
                                          Response
                                        </Button>
                                      )}
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                          navigator.clipboard.writeText(log.curl);
                                          toast.success('Exact cURL command copied');
                                        }}
                                        leftIcon={<Copy className="w-3 h-3" />}
                                        className="h-7 px-2 text-xs"
                                      >
                                        Copy cURL
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Installation instructions */}
                      <div className="p-6 bg-[var(--bg-deep)]/40 border border-[var(--border)] rounded-2xl space-y-4">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          <Download className="w-4 h-4 text-[var(--text-muted)]" />
                          How to Load Extension in Chrome
                        </h3>
                        <ol className="list-decimal list-inside space-y-2.5 text-sm text-[var(--text-muted)] leading-relaxed">
                          <li>
                            Open <code className="text-white bg-[var(--bg-surface)] px-2 py-0.5 rounded border border-[var(--border)]">chrome://extensions</code> in your Chrome browser.
                          </li>
                          <li>
                            Turn on <strong className="text-white">Developer mode</strong> using the switch at the top-right.
                          </li>
                          <li>
                            Click <strong className="text-white">Load unpacked</strong> and select the directory:
                            <div className="mt-1.5 p-2 bg-[var(--bg-deep)] border border-[var(--border)] rounded font-mono text-xs text-[var(--text-main)] break-all">
                              public/extension
                            </div>
                          </li>
                          <li>
                            Pin the <strong className="text-white">JobQuest Agent</strong> extension in your toolbar, then toggle connection above.
                          </li>
                        </ol>
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