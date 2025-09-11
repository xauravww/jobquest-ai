'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppLayout from '@/components/AppLayout';
import { Card, Modal, Upload, message, Select } from 'antd';
import { 
  FileText, 
  Upload as UploadIcon, 
  Download, 
  Edit3, 
  Trash2, 
  Plus, 
  Star,
  Eye,
  Copy,
  BarChart3
} from 'lucide-react';
import { FormInput } from '@/components/ui/FormInput';

interface Resume {
  _id: string;
  title: string;
  description: string;
  database: 'default' | 'database1' | 'database2' | 'database3';
  type: 'standard' | 'latex' | 'ats_optimized' | 'creative';
  fileName: string;
  filePath: string;
  fileSize: number;
  atsScore?: number;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

const ResumeManagementPage = () => {
  const { data: session } = useSession();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/resumes');
      if (response.ok) {
        const data = await response.json();
        setResumes(data);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
      message.error('Failed to fetch resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File, resumeData: { title: string; description: string; database: string; type: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', resumeData.title);
    formData.append('description', resumeData.description);
    formData.append('database', resumeData.database);
    formData.append('type', resumeData.type);

    try {
      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        message.success('Resume uploaded successfully');
        fetchResumes();
        setUploadModalVisible(false);
      } else {
        message.error('Failed to upload resume');
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error('Upload failed');
    }
  };

  const handleSetDefault = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}/set-default`, {
        method: 'PUT',
      });

      if (response.ok) {
        message.success('Default resume updated');
        fetchResumes();
      }
    } catch (error) {
      console.error('Error setting default:', error);
      message.error('Failed to set default resume');
    }
  };

  const handleDelete = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Resume deleted successfully');
        fetchResumes();
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      message.error('Failed to delete resume');
    }
  };

  const handleDuplicate = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        message.success('Resume duplicated successfully');
        fetchResumes();
      }
    } catch (error) {
      console.error('Error duplicating resume:', error);
      message.error('Failed to duplicate resume');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ats_optimized': return 'text-success';
      case 'latex': return 'text-secondary';
      case 'creative': return 'text-warning';
      default: return 'text-primary';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ats_optimized': return 'ATS Optimized';
      case 'latex': return 'LaTeX';
      case 'creative': return 'Creative';
      default: return 'Standard';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <AppLayout showFooter={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showFooter={false}>
      <div className="p-8 bg-bg min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Resume Management</h1>
              <p className="text-text-muted text-lg">Manage your resumes and optimize them for different job applications</p>
            </div>
            
            <button
              onClick={() => setUploadModalVisible(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-success hover:from-success hover:to-primary text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Upload Resume
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-bg-card border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-text-muted text-sm">Total Resumes</p>
                  <p className="text-2xl font-bold text-white">{resumes.length}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-bg-card border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-text-muted text-sm">ATS Optimized</p>
                  <p className="text-2xl font-bold text-white">
                    {resumes.filter(r => r.type === 'ats_optimized').length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-bg-card border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-text-muted text-sm">Default Resume</p>
                  <p className="text-lg font-semibold text-white">
                    {resumes.find(r => r.isDefault)?.title || 'None'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-bg-card border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <Download className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-text-muted text-sm">Total Usage</p>
                  <p className="text-2xl font-bold text-white">
                    {resumes.reduce((sum, r) => sum + r.usageCount, 0)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Resume Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <Card
                key={resume._id}
                className="bg-bg-card border border-border hover:border-primary/50 transition-all duration-300 group"
                styles={{ body: { padding: '24px' } }}
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      {resume.isDefault && (
                        <div className="w-6 h-6 bg-warning/20 rounded-full flex items-center justify-center">
                          <Star className="w-3 h-3 text-warning fill-current" />
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(resume.type)} bg-current/10`}>
                      {getTypeLabel(resume.type)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary transition-colors">
                      {resume.title}
                    </h3>
                    <p className="text-text-muted text-sm mb-4 line-clamp-2">
                      {resume.description || 'No description provided'}
                    </p>

                    {/* Metadata */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Database:</span>
                        <span className="text-text capitalize">{resume.database ? resume.database.replace('_', ' ') : ''}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">File Size:</span>
                        <span className="text-text">{formatFileSize(resume.fileSize)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Usage Count:</span>
                        <span className="text-text">{resume.usageCount}</span>
                      </div>
                      {resume.atsScore && (
                        <div className="flex justify-between text-sm">
                          <span className="text-text-muted">ATS Score:</span>
                          <span className={`font-medium ${resume.atsScore >= 80 ? 'text-success' : resume.atsScore >= 60 ? 'text-warning' : 'text-danger'}`}>
                            {resume.atsScore}%
                          </span>
                        </div>
                      )}
                      {resume.lastUsed && (
                        <div className="flex justify-between text-sm">
                          <span className="text-text-muted">Last Used:</span>
                          <span className="text-text">
                            {new Date(resume.lastUsed).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-border">
                    <button
                      onClick={() => {
                        setSelectedResume(resume);
                        setPreviewModalVisible(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary hover:bg-primary/20 text-text hover:text-primary rounded-lg transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    
                    <button
                      onClick={() => handleDuplicate(resume._id)}
                      className="flex items-center justify-center p-2 bg-bg-light hover:bg-secondary/20 text-text hover:text-secondary rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {!resume.isDefault && (
                      <button
                        onClick={() => handleSetDefault(resume._id)}
                        className="flex items-center justify-center p-2 bg-bg-light hover:bg-warning/20 text-text hover:text-warning rounded-lg transition-colors"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(resume._id)}
                      className="flex items-center justify-center p-2 bg-bg-light hover:bg-danger/20 text-text hover:text-danger rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Empty State */}
            {resumes.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16">
                <div className="w-24 h-24 bg-bg-light rounded-full flex items-center justify-center mb-6">
                  <FileText className="w-12 h-12 text-text-muted" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No resumes yet</h3>
                <p className="text-text-muted text-center mb-6 max-w-md">
                  Upload your first resume to get started with job applications and ATS optimization.
                </p>
                <button
                  onClick={() => setUploadModalVisible(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-success hover:from-success hover:to-primary text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  Upload Your First Resume
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upload Modal */}
        <UploadModal
          visible={uploadModalVisible}
          onClose={() => setUploadModalVisible(false)}
          onUpload={handleUpload}
        />

        {/* Preview Modal */}
        <PreviewModal
          visible={previewModalVisible}
          resume={selectedResume}
          onClose={() => {
            setPreviewModalVisible(false);
            setSelectedResume(null);
          }}
        />
      </div>
    </AppLayout>
  );
};

// Upload Modal Component
const UploadModal = ({ visible, onClose, onUpload }: {
  visible: boolean;
  onClose: () => void;
  onUpload: (file: File, data: { title: string; description: string; database: string; type: string }) => void;
}) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    database: 'default',
    type: 'standard'
  });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = () => {
    if (!file || !form.title) {
      message.error('Please provide a title and select a file');
      return;
    }

    onUpload(file, form);
    setForm({ title: '', description: '', database: 'default', type: 'standard' });
    setFile(null);
  };

  return (
    <Modal
      title="Upload Resume"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Upload"
      className="upload-modal"
    >
      <div className="space-y-4">
        <FormInput
          label="Title *"
          value={form.title}
          onChange={(value) => setForm({ ...form, title: value })}
          placeholder="e.g., Software Engineer Resume"
          icon={<FileText className="w-4 h-4" />}
        />

        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 bg-bg-light border border-border rounded-lg text-text focus:border-primary focus:outline-none resize-none"
            placeholder="Brief description of this resume version..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">Database</label>
          <Select
            value={form.database}
            onChange={(value) => setForm({ ...form, database: value })}
            className="w-full"
            placeholder="Select resume database"
          >
            <Select.Option value="default">Default Database</Select.Option>
            <Select.Option value="database1">Database 1</Select.Option>
            <Select.Option value="database2">Database 2</Select.Option>
            <Select.Option value="database3">Database 3</Select.Option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full px-3 py-2 bg-bg-light border border-border rounded-lg text-text focus:border-primary focus:outline-none"
          >
            <option value="standard">Standard</option>
            <option value="ats_optimized">ATS Optimized</option>
            <option value="latex">LaTeX</option>
            <option value="creative">Creative</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">File *</label>
          <Upload
            beforeUpload={(file) => {
              setFile(file);
              return false;
            }}
            accept=".pdf,.doc,.docx"
            showUploadList={false}
          >
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
              <UploadIcon className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-text-muted">
                {file ? file.name : 'Click or drag file to upload'}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Supports PDF, DOC, DOCX (Max 10MB)
              </p>
            </div>
          </Upload>
        </div>
      </div>
    </Modal>
  );
};

// Helper functions for modal
const getTypeLabel = (type: string) => {
  switch (type) {
    case 'ats_optimized': return 'ATS Optimized';
    case 'latex': return 'LaTeX';
    case 'creative': return 'Creative';
    default: return 'Standard';
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Preview Modal Component
const PreviewModal = ({ visible, resume, onClose }: {
  visible: boolean;
  resume: Resume | null;
  onClose: () => void;
}) => {
  if (!resume) return null;

  return (
    <Modal
      title={`Preview: ${resume.title}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className="preview-modal"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-bg-light rounded-lg">
          <div>
            <h3 className="font-semibold text-white">{resume.title}</h3>
            <p className="text-text-muted text-sm">{getTypeLabel(resume.type)} • {formatFileSize(resume.fileSize)}</p>
          </div>
          <a
            href={`/api/resumes/${resume._id}/download`}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        </div>

        <div className="bg-bg-light rounded-lg p-4 min-h-96 flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted">
              Resume preview will be available soon
            </p>
            <p className="text-text-secondary text-sm mt-2">
              For now, you can download the file to view it
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ResumeManagementPage;