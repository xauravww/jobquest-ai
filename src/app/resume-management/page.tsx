'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Modal from '@/components/ui/Modal';
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner';
import {
  FileText,
  Upload as UploadIcon,
  Download,
  Trash2,
  Star,
  Eye,
  Copy,
  BarChart3,
  File,
  CheckCircle,
  X,
  Pencil,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmAction } from '@/lib/confirm';
import { motion, AnimatePresence } from 'framer-motion';
import { Select } from 'antd';
import Button from '@/components/ui/Button';

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
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingResume, setEditingResume] = useState<Resume | null>(null);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [fullPreview, setFullPreview] = useState(false);

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
      toast.error('Failed to fetch resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/resumes/generate', {
        method: 'POST',
      });
      const data = await response.json().catch(() => null);
      if (response.ok) {
        toast.success('Resume generated from your profile');
        fetchResumes();
      } else {
        toast.error(data?.error || 'Failed to generate resume');
      }
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('Failed to generate resume');
    } finally {
      setGenerating(false);
    }
  };

  const handleEdit = (resume: Resume) => {
    setEditingResume(resume);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (id: string, title: string, description: string) => {
    try {
      const response = await fetch(`/api/resumes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      if (response.ok) {
        toast.success('Resume updated');
        setEditModalVisible(false);
        setEditingResume(null);
        fetchResumes();
      } else {
        const data = await response.json().catch(() => null);
        toast.error(data?.error || 'Failed to update resume');
      }
    } catch (error) {
      console.error('Edit error:', error);
      toast.error('Failed to update resume');
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
        toast.success('Resume uploaded successfully');
        fetchResumes();
        setUploadModalVisible(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to upload resume');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    }
  };

  const handleSetDefault = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}/set-default`, {
        method: 'PUT',
      });

      if (response.ok) {
        toast.success('Default resume updated');
        fetchResumes();
      }
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set default resume');
    }
  };

  const handleDelete = (resumeId: string) => {
    confirmAction({
      title: 'Delete this resume?',
      onOk: async () => {
        try {
          const response = await fetch(`/api/resumes/${resumeId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            toast.success('Resume deleted successfully');
            fetchResumes();
          }
        } catch (error) {
          console.error('Error deleting resume:', error);
          toast.error('Failed to delete resume');
        }
      },
    });
  };

  const handleDuplicate = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Resume duplicated successfully');
        fetchResumes();
      }
    } catch (error) {
      console.error('Error duplicating resume:', error);
      toast.error('Failed to duplicate resume');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ats_optimized': return 'text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/20';
      case 'latex': return 'text-[var(--secondary)] bg-[var(--secondary)]/10 border-[var(--secondary)]/20';
      case 'creative': return 'text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/20';
      default: return 'text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/20';
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

  return (
    <AppLayout showFooter={false}>
      {fullPreview && selectedResume ? (
        <ResumePreviewView
          resume={selectedResume}
          onBack={() => {
            setFullPreview(false);
            setSelectedResume(null);
          }}
        />
      ) : (
        <>
          <div className="p-6 lg:p-8 min-h-screen space-y-8">
            <ProfileCompletionBanner />

        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-[var(--primary)]/20 rounded-xl border border-[var(--primary)]/30">
                <FileText className="w-8 h-8 text-[var(--primary)]" />
              </div>
              Resume Management
            </h1>
            <p className="text-[var(--text-muted)] mt-2 ml-16">Generate resumes from your profile and optimize them for each application</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setUploadModalVisible(true)}
              leftIcon={<UploadIcon className="w-5 h-5" />}
              className="px-5 py-3"
            >
              Upload
            </Button>

            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={generating}
              isLoading={generating}
              leftIcon={<FileText className="w-5 h-5" />}
              className="px-6 py-3"
            >
              {generating ? 'Generating...' : 'Generate Resume'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[var(--bg-surface)]/50 border border-[var(--border-glass)] rounded-xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--primary)]/20 rounded-xl flex items-center justify-center border border-[var(--primary)]/30">
              <FileText className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-sm">Total Resumes</p>
              <p className="text-2xl font-bold text-white">{resumes.length}</p>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)]/50 border border-[var(--border-glass)] rounded-xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--success)]/20 rounded-xl flex items-center justify-center border border-[var(--success)]/30">
              <BarChart3 className="w-6 h-6 text-[var(--success)]" />
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-sm">ATS Optimized</p>
              <p className="text-2xl font-bold text-white">
                {resumes.filter(r => r.type === 'ats_optimized').length}
              </p>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)]/50 border border-[var(--border-glass)] rounded-xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--warning)]/20 rounded-xl flex items-center justify-center border border-[var(--warning)]/30">
              <Star className="w-6 h-6 text-[var(--warning)]" />
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-sm">Default Resume</p>
              <p className="text-lg font-semibold text-white truncate max-w-[150px]">
                {resumes.find(r => r.isDefault)?.title || 'None'}
              </p>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)]/50 border border-[var(--border-glass)] rounded-xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--secondary)]/20 rounded-xl flex items-center justify-center border border-[var(--secondary)]/30">
              <Download className="w-6 h-6 text-[var(--secondary)]" />
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-sm">Total Usage</p>
              <p className="text-2xl font-bold text-white">
                {resumes.reduce((sum, r) => sum + r.usageCount, 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Resume Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-[var(--bg-surface)]/50 border border-[var(--border-glass)] rounded-xl p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-8 w-8 bg-[var(--bg-glass)] rounded-lg"></div>
                  <div className="h-6 w-14 bg-[var(--bg-glass)] rounded-full"></div>
                </div>
                <div className="h-5 bg-[var(--bg-glass)] rounded w-2/3 mb-2"></div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-[var(--bg-glass)] rounded w-full"></div>
                  <div className="h-4 bg-[var(--bg-glass)] rounded w-1/2"></div>
                </div>
                <div className="h-8 bg-[var(--bg-glass)] rounded-lg w-24"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {resumes.map((resume) => (
                <motion.div
                  key={resume._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-[var(--bg-surface)]/50 border border-[var(--border-glass)] hover:border-[var(--primary)]/50 rounded-xl p-6 transition-all hover:shadow-lg hover:shadow-[var(--primary)]/5 group flex flex-col h-full"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center border border-[var(--primary)]/20">
                        <FileText className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                      {resume.isDefault && (
                        <div className="w-6 h-6 bg-[var(--warning)]/20 rounded-full flex items-center justify-center border border-[var(--warning)]/30" title="Default Resume">
                          <Star className="w-3 h-3 text-[var(--warning)] fill-current" />
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getTypeColor(resume.type)}`}>
                      {getTypeLabel(resume.type)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[var(--primary)] transition-colors truncate">
                      {resume.title}
                    </h3>
                    <p className="text-[var(--text-muted)] text-sm mb-4 line-clamp-2 h-10">
                      {resume.description || 'No description provided'}
                    </p>

                    {/* Metadata */}
                    <div className="space-y-2 mb-4 bg-[var(--bg-deep)]/50 p-3 rounded-lg border border-[var(--border-glass)]">
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-muted)]">Database</span>
                        <span className="text-white capitalize">{resume.database ? resume.database.replace('_', ' ') : 'Default'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-muted)]">File Size</span>
                        <span className="text-white">{formatFileSize(resume.fileSize)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-muted)]">Usage</span>
                        <span className="text-white">{resume.usageCount}</span>
                      </div>
                      {resume.atsScore !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--text-muted)]">ATS Score</span>
                          <span className={`font-bold ${resume.atsScore >= 80 ? 'text-[var(--success)]' : resume.atsScore >= 60 ? 'text-[var(--warning)]' : 'text-[var(--danger)]'}`}>
                            {resume.atsScore}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-[var(--border-glass)] mt-auto space-y-2">
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => handleEdit(resume)}
                        leftIcon={<Pencil className="w-4 h-4" />}
                        className="flex-1 px-3 py-2 text-sm"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleGenerate}
                        disabled={generating}
                        leftIcon={<RefreshCw className="w-4 h-4" />}
                        className="flex-1 px-3 py-2 text-sm"
                      >
                        Regenerate
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelectedResume(resume);
                          setFullPreview(true);
                        }}
                        leftIcon={<Eye className="w-4 h-4" />}
                        className="flex-1 px-3 py-2 text-sm"
                      >
                        View
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => handleDuplicate(resume._id)}
                        aria-label="Duplicate"
                        className="p-2"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>

                      {!resume.isDefault && (
                        <Button
                          variant="ghost"
                          onClick={() => handleSetDefault(resume._id)}
                          aria-label="Set as Default"
                          className="p-2"
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        onClick={() => handleDelete(resume._id)}
                        aria-label="Delete"
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--danger)]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty State */}
            {resumes.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 border border-dashed border-[var(--border-glass)] rounded-2xl bg-[var(--bg-surface)]/20">
                <div className="w-20 h-20 bg-[var(--bg-surface)] rounded-full flex items-center justify-center mb-6">
                  <FileText className="w-10 h-10 text-[var(--text-muted)]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No resumes yet</h3>
                <p className="text-[var(--text-muted)] text-center mb-6 max-w-md">
                  Generate a resume from your profile in one click, or upload an existing PDF.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Button
                    variant="primary"
                    onClick={handleGenerate}
                    disabled={generating}
                    isLoading={generating}
                    leftIcon={<FileText className="w-5 h-5" />}
                    className="px-6 py-3"
                  >
                    {generating ? 'Generating...' : 'Generate Resume'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setUploadModalVisible(true)}
                    leftIcon={<UploadIcon className="w-5 h-5" />}
                    className="px-5 py-3"
                  >
                    Upload PDF
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
          </div>

          {/* Upload Modal */}
          <UploadModalComponent
            visible={uploadModalVisible}
            onClose={() => setUploadModalVisible(false)}
            onUpload={handleUpload}
          />

          {/* Edit Modal */}
          <EditModalComponent
            visible={editModalVisible}
            resume={editingResume}
            onClose={() => {
              setEditModalVisible(false);
              setEditingResume(null);
            }}
            onSave={handleSaveEdit}
          />
        </>
      )}
    </AppLayout>
  );
};

const UploadModalComponent = ({ visible, onClose, onUpload }: {
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
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!file || !form.title) {
      toast.error('Please provide a title and select a file');
      return;
    }

    setUploading(true);
    try {
      await onUpload(file, form);
      setForm({ title: '', description: '', database: 'default', type: 'standard' });
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={visible}
      onClose={onClose}
      title="Upload Resume"
      width="max-w-lg"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Title <span className="text-[var(--danger)]">*</span></label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Software Engineer Resume"
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Brief description..."
            className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Database</label>
          <Select
            value={form.database}
            onChange={(v) => setForm({ ...form, database: v })}
            options={[
              { value: 'default', label: 'Default Database' },
              { value: 'database1', label: 'Database 1' },
              { value: 'database2', label: 'Database 2' },
              { value: 'database3', label: 'Database 3' }
            ]}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Type</label>
          <Select
            value={form.type}
            onChange={(v) => setForm({ ...form, type: v })}
            options={[
              { value: 'standard', label: 'Standard' },
              { value: 'ats_optimized', label: 'ATS Optimized' },
              { value: 'latex', label: 'LaTeX' },
              { value: 'creative', label: 'Creative' }
            ]}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">File <span className="text-[var(--danger)]">*</span></label>
          <div className="relative">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${file ? 'border-[var(--success)] bg-[var(--success)]/5' : 'border-[var(--border-glass)] hover:border-[var(--primary)] hover:bg-[var(--bg-surface)]'}`}
            >
              {file ? (
                <>
                  <CheckCircle className="w-8 h-8 text-[var(--success)] mb-2" />
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <UploadIcon className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                  <p className="text-[var(--text-muted)]">Click to upload or drag and drop</p>
                  <p className="text-xs text-[var(--text-dim)] mt-1">PDF, DOC, DOCX (Max 10MB)</p>
                </>
              )}
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-glass)]">
          <Button
            variant="secondary"
            onClick={onClose}
            className="px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={uploading}
            isLoading={uploading}
            className="px-4 py-2"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const ResumePreviewView = ({ resume, onBack }: {
  resume: Resume;
  onBack: () => void;
}) => {
  // Generated resumes store a local public path (/resumes/...pdf);
  // uploaded resumes store a cloudinary secure_url. Both embed inline.
  const previewSrc = resume.filePath || `/api/resumes/${resume._id}/download`;
  const downloadHref = resume.filePath && resume.filePath.startsWith('/')
    ? `/api/resumes/${resume._id}/download`
    : resume.filePath || `/api/resumes/${resume._id}/download`;

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          leftIcon={<ArrowLeft className="w-5 h-5" />}
          className="px-4 py-2 shrink-0"
        >
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate" style={{ color: 'var(--text-main)' }}>{resume.title}</h2>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            {resume.type.replace('_', ' ').toUpperCase()} • {(resume.fileSize / 1024).toFixed(2)} KB
          </p>
        </div>
        <a href={downloadHref} target="_blank" rel="noreferrer">
          <Button variant="primary" leftIcon={<Download className="w-4 h-4" />} className="px-5 py-2">
            Download
          </Button>
        </a>
      </div>

      {/* PDF embed */}
      <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: 'var(--border)', height: '85vh' }}>
        <iframe
          src={previewSrc}
          title={resume.title}
          className="w-full h-full"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
};

const EditModalComponent = ({ visible, resume, onClose, onSave }: {
  visible: boolean;
  resume: Resume | null;
  onClose: () => void;
  onSave: (id: string, title: string, description: string) => void;
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (resume) {
      setTitle(resume.title);
      setDescription(resume.description || '');
    }
  }, [resume]);

  const handleSubmit = async () => {
    if (!resume) return;
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      await onSave(resume._id, title.trim(), description.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={visible}
      onClose={onClose}
      title="Edit Resume"
      width="max-w-lg"
    >
      {resume && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Title <span className="text-[var(--danger)]">*</span></label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Software Engineer Resume"
                className="w-full pl-10 pr-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description..."
              className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-glass)]">
            <Button
              variant="secondary"
              onClick={onClose}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={saving}
              isLoading={saving}
              className="px-4 py-2"
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ResumeManagementPage;
