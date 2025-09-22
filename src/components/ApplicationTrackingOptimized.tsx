'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Table, 
  Input, 
  Select, 
  DatePicker, 
  Button, 
  Tag, 
  Space, 
  Tooltip,
  Card,
  Statistic,
  Row,
  Col,
  Empty,
  Spin
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

// Simple debounce implementation
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface Application {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    company: string;
    location: string;
    url?: string;
  };
  status: string;
  priority: string;
  platform: string;
  appliedDate: string;
  notes?: string;
}

interface ApplicationStats {
  total: number;
  applied: number;
  interviews: number;
  offers: number;
  responseRate: number;
}

const statusColors: Record<string, string> = {
  draft: 'default',
  applied: 'blue',
  submitted: 'cyan',
  under_review: 'orange',
  phone_screening: 'purple',
  technical_interview: 'magenta',
  final_interview: 'pink',
  offer_received: 'green',
  accepted: 'success',
  rejected: 'error',
  withdrawn: 'default'
};

const priorityColors: Record<string, string> = {
  low: 'default',
  medium: 'warning',
  high: 'error'
};

export default function ApplicationTrackingOptimized() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    applied: 0,
    interviews: 0,
    offers: 0,
    responseRate: 0
  });
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setSearchText(value);
      setCurrentPage(1); // Reset to first page on search
    }, 300),
    []
  );

  // Fetch applications with optimized caching
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());
      
      if (searchText) params.append('search', searchText);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (platformFilter) params.append('platform', platformFilter);
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.append('dateFrom', dateRange[0].toISOString());
        params.append('dateTo', dateRange[1].toISOString());
      }

      const response = await fetch(`/api/applications?${params.toString()}`, {
        headers: {
          'Cache-Control': 'max-age=60' // Client-side cache for 1 minute
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      const data = await response.json();
      setApplications(data.applications || []);
      setTotal(data.totalCount || 0);
      
      // Update stats
      const applied = data.applications?.filter((app: Application) => 
        ['applied', 'submitted'].includes(app.status)
      ).length || 0;
      
      const interviews = data.applications?.filter((app: Application) => 
        ['phone_screening', 'technical_interview', 'final_interview'].includes(app.status)
      ).length || 0;
      
      const offers = data.applications?.filter((app: Application) => 
        ['offer_received', 'accepted'].includes(app.status)
      ).length || 0;
      
      setStats({
        total: data.totalCount || 0,
        applied,
        interviews,
        offers,
        responseRate: applied > 0 ? Math.round((interviews / applied) * 100) : 0
      });
      
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchText, statusFilter, priorityFilter, platformFilter, dateRange]);

  // Effect to fetch data when filters change
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Clear all filters
  const clearFilters = () => {
    setSearchText('');
    setStatusFilter('');
    setPriorityFilter('');
    setPlatformFilter('');
    setDateRange(null);
    setCurrentPage(1);
  };

  // Table columns with optimized rendering
  const columns = useMemo(() => [
    {
      title: 'Job Title',
      dataIndex: ['jobId', 'title'],
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (title: string, record: Application) => (
        <div>
          <div className="font-medium text-gray-900">{title}</div>
          <div className="text-sm text-gray-500">{record.jobId.company}</div>
        </div>
      ),
    },
    {
      title: 'Location',
      dataIndex: ['jobId', 'location'],
      key: 'location',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => (
        <Tag color={priorityColors[priority] || 'default'}>
          {priority.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      width: 120,
      render: (platform: string) => (
        <Tag>{platform.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Applied Date',
      dataIndex: 'appliedDate',
      key: 'appliedDate',
      width: 120,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a: Application, b: Application) => 
        dayjs(a.appliedDate).unix() - dayjs(b.appliedDate).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: Application) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => window.open(record.jobId.url, '_blank')}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => {
                // TODO: Implement edit functionality
                toast('Edit functionality coming soon');
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              onClick={() => {/* Handle delete */}}
            />
          </Tooltip>
        </Space>
      ),
    },
  ], []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Stats Cards */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Applications"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Applied"
              value={stats.applied}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Interviews"
              value={stats.interviews}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Response Rate"
              value={stats.responseRate}
              suffix="%"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-6">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Search
              placeholder="Search applications..."
              allowClear
              onChange={(e) => debouncedSearch(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Status"
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="draft">Draft</Option>
              <Option value="applied">Applied</Option>
              <Option value="submitted">Submitted</Option>
              <Option value="under_review">Under Review</Option>
              <Option value="phone_screening">Phone Screening</Option>
              <Option value="technical_interview">Technical Interview</Option>
              <Option value="final_interview">Final Interview</Option>
              <Option value="offer_received">Offer Received</Option>
              <Option value="accepted">Accepted</Option>
              <Option value="rejected">Rejected</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Priority"
              allowClear
              value={priorityFilter}
              onChange={setPriorityFilter}
              style={{ width: '100%' }}
            >
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Platform"
              allowClear
              value={platformFilter}
              onChange={setPlatformFilter}
              style={{ width: '100%' }}
            >
              <Option value="linkedin">LinkedIn</Option>
              <Option value="indeed">Indeed</Option>
              <Option value="naukri">Naukri</Option>
              <Option value="company_website">Company Website</Option>
              <Option value="other">Other</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
        </Row>
        <Row className="mt-4">
          <Col>
            <Space>
              <Button 
                icon={<FilterOutlined />} 
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {/* Handle add new */}}
              >
                Add Application
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchApplications}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Applications Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={applications}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} applications`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
          }}
          scroll={{ x: 1000 }}
          locale={{
            emptyText: (
              <Empty
                description="No applications found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>
    </div>
  );
}