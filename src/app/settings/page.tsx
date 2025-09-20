'use client';

import React, { useState, useEffect } from 'react';
import { Card, Switch, Input, Button, Select, Slider, Divider, Tag, Alert } from 'antd';
import {
  Settings,
  Bell,
  MessageSquare,
  Mail,
  Phone,
  Shield,
  Zap,
  Save,
  TestTube,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { notificationService, NotificationPreferences } from '@/services/NotificationService';
import { telegramService } from '@/services/TelegramService';
import toast from 'react-hot-toast';

const { Option } = Select;
const { TextArea } = Input;

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
    botToken: '',
    chatId: ''
  });
  const [telegramStatus, setTelegramStatus] = useState({
    configured: false,
    connected: false,
    hasBotToken: false,
    hasChatId: false
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

  const loadSettings = () => {
    // Load notification preferences
    const prefs = notificationService.getPreferences();
    setNotificationPrefs(prefs);

    // Load Telegram status
    const status = telegramService.getConfigStatus();
    setTelegramStatus(status);

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
      const success = await telegramService.configure({
        botToken: telegramConfig.botToken,
        chatId: telegramConfig.chatId
      });

      if (success) {
        toast.success('Telegram configured successfully');
        setTelegramStatus(telegramService.getConfigStatus());
      } else {
        toast.error('Failed to configure Telegram');
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
      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
        isActive
          ? 'bg-primary text-white shadow-lg'
          : 'text-gray-400 hover:text-white hover:bg-gray-700'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <AppLayout showFooter={false}>
      <div className="p-8 bg-bg min-h-screen">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-gray-500/20 to-gray-500/10 rounded-xl border border-gray-500/30">
                  <Settings className="w-8 h-8 text-gray-400" />
                </div>
                Settings
              </h1>
              <p className="text-gray-400 mt-2 text-lg">
                Configure your notifications, integrations, and preferences
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 space-y-2">
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
              {activeTab === 'notifications' && (
                <Card className="bg-gray-800/50 border-gray-700">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Bell className="w-5 h-5 text-yellow-400" />
                        Notification Preferences
                      </h2>
                      <Button
                        type="primary"
                        icon={<Save className="w-4 h-4" />}
                        onClick={saveNotificationSettings}
                        loading={loading}
                        className="bg-primary hover:bg-primary/80"
                      >
                        Save Changes
                      </Button>
                    </div>

                    <Divider className="border-gray-600" />

                    {/* Notification Channels */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white">Notification Channels</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-blue-400" />
                            <div>
                              <p className="font-medium text-white">In-App Notifications</p>
                              <p className="text-sm text-gray-400">Show notifications in the app</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={notificationPrefs.inApp}
                              onChange={(checked) => setNotificationPrefs(prev => ({ ...prev, inApp: checked }))}
                            />
                            <Button
                              size="small"
                              icon={<TestTube className="w-3 h-3" />}
                              onClick={() => testNotification('inApp')}
                            >
                              Test
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-green-400" />
                            <div>
                              <p className="font-medium text-white">Push Notifications</p>
                              <p className="text-sm text-gray-400">Browser push notifications</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={notificationPrefs.push}
                              onChange={(checked) => setNotificationPrefs(prev => ({ ...prev, push: checked }))}
                            />
                            <Button
                              size="small"
                              icon={<TestTube className="w-3 h-3" />}
                              onClick={() => testNotification('push')}
                            >
                              Test
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="font-medium text-white">Telegram</p>
                              <p className="text-sm text-gray-400">Send to Telegram bot</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={notificationPrefs.telegram}
                              onChange={(checked) => setNotificationPrefs(prev => ({ ...prev, telegram: checked }))}
                              disabled={!telegramStatus.connected}
                            />
                            <Button
                              size="small"
                              icon={<TestTube className="w-3 h-3" />}
                              onClick={() => testNotification('telegram')}
                              disabled={!telegramStatus.connected}
                            >
                              Test
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-red-400" />
                            <div>
                              <p className="font-medium text-white">Email</p>
                              <p className="text-sm text-gray-400">Send email notifications</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={notificationPrefs.email}
                              onChange={(checked) => setNotificationPrefs(prev => ({ ...prev, email: checked }))}
                            />
                            <Button
                              size="small"
                              icon={<TestTube className="w-3 h-3" />}
                              onClick={() => testNotification('email')}
                            >
                              Test
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Divider className="border-gray-600" />

                    {/* Notification Types */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white">Notification Types</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-700/20 rounded-lg">
                          <span className="text-white">Interview Reminders</span>
                          <Switch
                            checked={notificationPrefs.interviewReminders}
                            onChange={(checked) => setNotificationPrefs(prev => ({ ...prev, interviewReminders: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-700/20 rounded-lg">
                          <span className="text-white">Follow-up Reminders</span>
                          <Switch
                            checked={notificationPrefs.followUpReminders}
                            onChange={(checked) => setNotificationPrefs(prev => ({ ...prev, followUpReminders: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-700/20 rounded-lg">
                          <span className="text-white">Application Deadlines</span>
                          <Switch
                            checked={notificationPrefs.applicationDeadlines}
                            onChange={(checked) => setNotificationPrefs(prev => ({ ...prev, applicationDeadlines: checked }))}
                          />
                        </div>
                      </div>
                    </div>

                    <Divider className="border-gray-600" />

                    {/* Timing Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white">Timing</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Reminder Notification Time (minutes before)
                          </label>
                          <Slider
                            min={5}
                            max={120}
                            step={5}
                            value={notificationPrefs.remindersBefore}
                            onChange={(value) => setNotificationPrefs(prev => ({ ...prev, remindersBefore: value }))}
                            marks={{
                              5: { style: { color: '#9ca3af' }, label: '5m' },
                              15: { style: { color: '#9ca3af' }, label: '15m' },
                              30: { style: { color: '#9ca3af' }, label: '30m' },
                              60: { style: { color: '#9ca3af' }, label: '1h' },
                              120: { style: { color: '#9ca3af' }, label: '2h' }
                            }}
                            className="mb-4 custom-dark-slider"
                          />
                          <p className="text-sm text-gray-400">
                            Current: {notificationPrefs.remindersBefore} minutes before
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {activeTab === 'telegram' && (
                <Card className="bg-gray-800/50 border-gray-700">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-purple-400" />
                        Telegram Integration
                      </h2>
                      <div className="flex items-center gap-2">
                        <Tag color={telegramStatus.connected ? 'green' : 'red'}>
                          {telegramStatus.connected ? 'Connected' : 'Disconnected'}
                        </Tag>
                        <Button
                          type="primary"
                          icon={<Save className="w-4 h-4" />}
                          onClick={saveTelegramSettings}
                          loading={loading}
                          className="bg-purple-600 hover:bg-purple-500"
                        >
                          Save & Connect
                        </Button>
                      </div>
                    </div>

                    <Alert
                      message="Telegram Bot Setup"
                      description={
                        <div className="space-y-2">
                          <p>To enable Telegram notifications, you need to:</p>
                          <ol className="list-decimal list-inside space-y-1 text-sm">
                            <li>Create a bot by messaging @BotFather on Telegram</li>
                            <li>Copy the bot token provided by @BotFather</li>
                            <li>Get your chat ID from @userinfobot</li>
                            <li>Enter both values below and save</li>
                          </ol>
                        </div>
                      }
                      type="info"
                      showIcon
                      className="bg-blue-500/10 border-blue-500/30"
                    />

                    <Divider className="border-gray-600" />

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Bot Token
                        </label>
                        <Input.Password
                          placeholder="Enter your Telegram Bot Token from @BotFather"
                          value={telegramConfig.botToken}
                          onChange={(e) => setTelegramConfig(prev => ({ ...prev, botToken: e.target.value }))}
                          className="bg-gray-700 border-gray-600"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Get this from @BotFather when you create a new bot
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Chat ID
                        </label>
                        <Input
                          placeholder="Your Telegram Chat ID"
                          value={telegramConfig.chatId}
                          onChange={(e) => setTelegramConfig(prev => ({ ...prev, chatId: e.target.value }))}
                          className="bg-gray-700 border-gray-600"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Get this from @userinfobot on Telegram
                        </p>
                      </div>
                    </div>

                    <Divider className="border-gray-600" />

                    {/* Status */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white">Connection Status</h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2 p-3 bg-gray-700/20 rounded-lg">
                          {telegramStatus.hasBotToken ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          )}
                          <span className="text-sm text-white">Bot Token</span>
                        </div>
                        
                        <div className="flex items-center gap-2 p-3 bg-gray-700/20 rounded-lg">
                          {telegramStatus.hasChatId ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          )}
                          <span className="text-sm text-white">Chat ID</span>
                        </div>
                        
                        <div className="flex items-center gap-2 p-3 bg-gray-700/20 rounded-lg">
                          {telegramStatus.connected ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          )}
                          <span className="text-sm text-white">Connected</span>
                        </div>
                      </div>
                    </div>

                    {/* Available Commands */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white">Available Commands</h3>
                      
                      <div className="bg-gray-700/20 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <code className="text-blue-400">/start</code>
                            <span className="text-gray-400">Start the assistant</span>
                          </div>
                          <div className="flex justify-between">
                            <code className="text-blue-400">/status</code>
                            <span className="text-gray-400">Get job search status</span>
                          </div>
                          <div className="flex justify-between">
                            <code className="text-blue-400">/reminders</code>
                            <span className="text-gray-400">List pending reminders</span>
                          </div>
                          <div className="flex justify-between">
                            <code className="text-blue-400">/interviews</code>
                            <span className="text-gray-400">List upcoming interviews</span>
                          </div>
                          <div className="flex justify-between">
                            <code className="text-blue-400">/followups</code>
                            <span className="text-gray-400">List pending follow-ups</span>
                          </div>
                          <div className="flex justify-between">
                            <code className="text-blue-400">/help</code>
                            <span className="text-gray-400">Show all commands</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {activeTab === 'email' && (
                <Card className="bg-gray-800/50 border-gray-700">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Mail className="w-5 h-5 text-red-400" />
                        Email Settings
                      </h2>
                      <Button
                        type="primary"
                        icon={<Save className="w-4 h-4" />}
                        onClick={saveEmailSettings}
                        loading={loading}
                        className="bg-red-600 hover:bg-red-500"
                      >
                        Save Changes
                      </Button>
                    </div>

                    <Divider className="border-gray-600" />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                        <div>
                          <p className="font-medium text-white">Email Notifications</p>
                          <p className="text-sm text-gray-400">Enable email notifications</p>
                        </div>
                        <Switch
                          checked={emailSettings.enabled}
                          onChange={(checked) => setEmailSettings(prev => ({ ...prev, enabled: checked }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email Address
                        </label>
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          value={emailSettings.address}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, address: e.target.value }))}
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-lg font-medium text-white">Email Types</h3>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-700/20 rounded-lg">
                          <span className="text-white">Daily Digest</span>
                          <Switch
                            checked={emailSettings.dailyDigest}
                            onChange={(checked) => setEmailSettings(prev => ({ ...prev, dailyDigest: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-700/20 rounded-lg">
                          <span className="text-white">Weekly Report</span>
                          <Switch
                            checked={emailSettings.weeklyReport}
                            onChange={(checked) => setEmailSettings(prev => ({ ...prev, weeklyReport: checked }))}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-700/20 rounded-lg">
                          <span className="text-white">Instant Alerts</span>
                          <Switch
                            checked={emailSettings.instantAlerts}
                            onChange={(checked) => setEmailSettings(prev => ({ ...prev, instantAlerts: checked }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {activeTab === 'security' && (
                <Card className="bg-gray-800/50 border-gray-700">
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-400" />
                      Security & Privacy
                    </h2>

                    <Alert
                      message="Security Features"
                      description="Advanced security features will be available in the next update."
                      type="info"
                      showIcon
                      className="bg-blue-500/10 border-blue-500/30"
                    />

                    <div className="space-y-4">
                      <div className="p-4 bg-gray-700/20 rounded-lg">
                        <h3 className="font-medium text-white mb-2">Data Privacy</h3>
                        <p className="text-sm text-gray-400">
                          Your job search data is stored locally and encrypted. We never share your personal information.
                        </p>
                      </div>

                      <div className="p-4 bg-gray-700/20 rounded-lg">
                        <h3 className="font-medium text-white mb-2">API Security</h3>
                        <p className="text-sm text-gray-400">
                          All API communications are encrypted using HTTPS. Telegram credentials are stored securely.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;