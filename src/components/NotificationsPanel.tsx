'use client';

import React, { useState } from 'react';
import { Button, Tag, Select, Pagination, Input } from 'antd';
import {
  Bell,
  Target,
  Phone,
  Mail,
  X,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Eye,
  Settings
} from 'lucide-react';
import { notificationService } from '@/services/NotificationService';
import type { Notification } from '@/services/NotificationService';

const { Search: AntSearch } = Input;
const { Option } = Select;

interface NotificationsPanelProps {
  notifications: Notification[];
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter notifications
  const getFilteredNotifications = () => {
    let filtered = notifications;

    if (searchQuery) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'unread') {
        filtered = filtered.filter(n => !n.read);
      } else if (statusFilter === 'read') {
        filtered = filtered.filter(n => n.read);
      }
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const filteredNotifications = getFilteredNotifications();

  // Pagination
  const getPaginatedNotifications = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredNotifications.slice(startIndex, endIndex);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'interview': return <Target className="w-4 h-4" />;
      case 'reminder': return <Bell className="w-4 h-4" />;
      case 'follow_up': return <Phone className="w-4 h-4" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'error': return <X className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'interview': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'reminder': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'follow_up': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'success': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'interview': return 'Interview';
      case 'reminder': return 'Reminder';
      case 'follow_up': return 'Follow-up';
      case 'success': return 'Success';
      case 'warning': return 'Warning';
      case 'error': return 'Error';
      default: return 'Info';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 rounded-lg border border-yellow-500/30">
              <Bell className="w-6 h-6 text-yellow-500" />
            </div>
            Notifications
          </h2>
          <p className="text-gray-400 mt-1">
            Stay updated with your job search activities and reminders
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            icon={<Eye className="w-4 h-4" />}
            onClick={() => notificationService.markAllAsRead()}
            disabled={notificationService.getUnreadCount() === 0}
            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
          >
            Mark All Read
          </Button>
          <Button
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => notificationService.clearAll()}
            disabled={notifications.length === 0}
            className="bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600/30"
          >
            Clear All
          </Button>
          <Button
            icon={<Settings className="w-4 h-4" />}
            onClick={() => window.location.href = '/settings'}
            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
          >
            Settings
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Filters & Search</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AntSearch
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full"
              allowClear
            />
            
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
              <Option value="reminder">Reminders</Option>
              <Option value="interview">Interviews</Option>
              <Option value="follow_up">Follow-ups</Option>
              <Option value="success">Success</Option>
              <Option value="warning">Warnings</Option>
              <Option value="error">Errors</Option>
            </Select>
            
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
              <Option value="unread">Unread</Option>
              <Option value="read">Read</Option>
            </Select>
            
            <div className="flex items-center justify-between bg-gray-700/30 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-400">Total:</span>
              <span className="text-sm font-medium text-white">{filteredNotifications.length} notifications</span>
            </div>
          </div>
          
          {/* Quick filter buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="small"
              type={statusFilter === 'unread' ? 'primary' : 'default'}
              onClick={() => {
                setStatusFilter(statusFilter === 'unread' ? 'all' : 'unread');
                setCurrentPage(1);
              }}
              className={statusFilter === 'unread' ? 'bg-yellow-600' : ''}
            >
              Unread ({notifications.filter(n => !n.read).length})
            </Button>
            <Button
              size="small"
              type={typeFilter === 'reminder' ? 'primary' : 'default'}
              onClick={() => {
                setTypeFilter(typeFilter === 'reminder' ? 'all' : 'reminder');
                setCurrentPage(1);
              }}
              className={typeFilter === 'reminder' ? 'bg-yellow-600' : ''}
            >
              Reminders ({notifications.filter(n => n.type === 'reminder').length})
            </Button>
            <Button
              size="small"
              type={typeFilter === 'interview' ? 'primary' : 'default'}
              onClick={() => {
                setTypeFilter(typeFilter === 'interview' ? 'all' : 'interview');
                setCurrentPage(1);
              }}
              className={typeFilter === 'interview' ? 'bg-red-600' : ''}
            >
              Interviews ({notifications.filter(n => n.type === 'interview').length})
            </Button>
            {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                size="small"
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className="text-gray-400 hover:text-white"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <div className="mb-6">
              <Bell className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No notifications found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters to see more notifications'
                  : "You're all caught up! New notifications will appear here."
                }
              </p>
            </div>
            
            {(!searchQuery && typeFilter === 'all' && statusFilter === 'all') && (
              <div className="space-y-3">
                <div className="flex flex-col gap-3">
                  <Button
                    type="primary"
                    icon={<Bell className="w-4 h-4" />}
                    onClick={() => {
                      notificationService.createNotification({
                        title: 'Test Notification',
                        message: 'This is a test notification to see how it looks!',
                        type: 'info'
                      });
                    }}
                    className="bg-yellow-600 hover:bg-yellow-500"
                    size="large"
                  >
                    Create Test Notification
                  </Button>
                  
                  <Button
                    icon={<Bell className="w-4 h-4" />}
                    onClick={async () => {
                      console.log('🧪 Testing Telegram integration...');
                      
                      // Enable Telegram notifications
                      notificationService.enableTelegramNotifications();
                      
                      // Test the integration
                      await notificationService.testTelegramIntegration();
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white"
                    size="large"
                  >
                    Test Telegram Integration
                  </Button>
                </div>
                <div className="text-sm text-gray-400">
                  Notifications will appear here when you have reminders, interviews, or other important updates. Use the Telegram test to see detailed logging.
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {getPaginatedNotifications().map((notification) => (
              <div
                key={notification.id}
                className={`relative p-4 rounded-lg border transition-all cursor-pointer hover-lift ${
                  notification.read
                    ? 'bg-gray-800/30 border-gray-700'
                    : 'bg-blue-500/5 border-blue-500/30'
                }`}
                onClick={() => notificationService.markAsRead(notification.id)}
              >
                {/* Unread indicator */}
                {!notification.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg"></div>
                )}
                
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg border ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-semibold text-white text-lg">{notification.title}</h4>
                      <Tag color={notification.type === 'error' ? 'red' : notification.type === 'warning' ? 'orange' : notification.type === 'success' ? 'green' : 'blue'}>
                        {getTypeLabel(notification.type)}
                      </Tag>
                      {!notification.read && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-blue-400 font-medium">New</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(notification.timestamp)}
                      </span>
                      {notification.metadata?.activityId && (
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Activity ID: {notification.metadata.activityId}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {notification.actionUrl && (
                      <Button
                        size="small"
                        type="primary"
                        className="bg-blue-600 hover:bg-blue-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = notification.actionUrl!;
                        }}
                      >
                        {notification.actionLabel || 'View'}
                      </Button>
                    )}
                    {!notification.read && (
                      <Button
                        size="small"
                        icon={<Eye className="w-3 h-3" />}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          notificationService.markAsRead(notification.id);
                        }}
                        title="Mark as read"
                      />
                    )}
                    <Button
                      size="small"
                      icon={<X className="w-3 h-3" />}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        notificationService.deleteNotification(notification.id);
                      }}
                      title="Delete notification"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {/* Enhanced Pagination */}
            {filteredNotifications.length > pageSize && (
              <div className="flex justify-center mt-8">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="text-sm text-gray-400">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredNotifications.length)} of {filteredNotifications.length} notifications
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
                      <Option value={5}>5</Option>
                      <Option value={10}>10</Option>
                      <Option value={20}>20</Option>
                      <Option value={50}>50</Option>
                    </Select>
                  </div>
                  <Pagination
                    current={currentPage}
                    total={filteredNotifications.length}
                    pageSize={pageSize}
                    onChange={(page) => setCurrentPage(page)}
                    showSizeChanger={false}
                    showQuickJumper
                    className="custom-dark-pagination"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;