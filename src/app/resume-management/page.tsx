'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Modal from '@/components/ui/Modal';
import {
  FileText,
  Upload as UploadIcon,
  Download,
  Trash2,
  Plus,
  Star,
  Eye,
  Copy,
  BarChart3,
  File,
  CheckCircle,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

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
      toast.error('Failed to fetch resumes');
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

  const handleDelete = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
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
      <div className="p-6 lg:p-8 min-h-screen space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-[var(--primary)]/20 rounded-xl border border-[var(--primary)]/30">
                <FileText className="w-8 h-8 text-[var(--primary)]" />
              </div>
              Resume Management
            </h1>
            <p className="text-[var(--text-muted)] mt-2 ml-16">Manage and optimize your resumes for different applications</p>
          </div>

          <button
            onClick={() => setUploadModalVisible(true)}
            className="px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-xl shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Upload Resume</span>
          </button>
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
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_var(--primary-glow)]"></div>
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
                  <div className="flex gap-2 pt-4 border-t border-[var(--border-glass)] mt-auto">
                    <button
                      onClick={() => {
                        setSelectedResume(resume);
                        setPreviewModalVisible(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/20 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>

                    <button
                      onClick={() => handleDuplicate(resume._id)}
                      className="p-2 bg-[var(--bg-surface)] hover:bg-[var(--secondary)]/20 text-[var(--text-muted)] hover:text-[var(--secondary)] border border-[var(--border-glass)] hover:border-[var(--secondary)]/30 rounded-lg transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {!resume.isDefault && (
                      <button
                        onClick={() => handleSetDefault(resume._id)}
                        className="p-2 bg-[var(--bg-surface)] hover:bg-[var(--warning)]/20 text-[var(--text-muted)] hover:text-[var(--warning)] border border-[var(--border-glass)] hover:border-[var(--warning)]/30 rounded-lg transition-colors"
                        title="Set as Default"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(resume._id)}
                      className="p-2 bg-[var(--bg-surface)] hover:bg-[var(--danger)]/20 text-[var(--text-muted)] hover:text-[var(--danger)] border border-[var(--border-glass)] hover:border-[var(--danger)]/30 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                  Upload your first resume to get started with job applications and ATS optimization.
                </p>
                <button
                  onClick={() => setUploadModalVisible(true)}
                  className="px-6 py-3 bg-[var(--primary)] text-black font-bold rounded-xl hover:bg-[var(--primary)]/90 transition-all"
                >
                  Upload Your First Resume
                </button>
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

      {/* Preview Modal */}
      <PreviewModalComponent
        visible={previewModalVisible}
        resume={selectedResume}
        onClose={() => {
          setPreviewModalVisible(false);
          setSelectedResume(null);
        }}
      />
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
          <select
            value={form.database}
            onChange={(e) => setForm({ ...form, database: e.target.value })}
            className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none appearance-none"
          >
            <option value="default">Default Database</option>
            <option value="database1">Database 1</option>
            <option value="database2">Database 2</option>
            <option value="database3">Database 3</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none appearance-none"
          >
            <option value="standard">Standard</option>
            <option value="ats_optimized">ATS Optimized</option>
            <option value="latex">LaTeX</option>
            <option value="creative">Creative</option>
          </select>
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
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="px-4 py-2 rounded-xl bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading && <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>}
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const PreviewModalComponent = ({ visible, resume, onClose }: {
  visible: boolean;
  resume: Resume | null;
  onClose: () => void;
}) => {
  if (!resume) return null;

  return (
    <Modal
      isOpen={visible}
      onClose={onClose}
      title={`Preview: ${resume.title}`}
      width="max-w-4xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl">
          <div>
            <h3 className="font-bold text-white">{resume.title}</h3>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              {resume.type.replace('_', ' ').toUpperCase()} • {(resume.fileSize / 1024).toFixed(2)} KB
            </p>
          </div>
          <a
            href={`/api/resumes/${resume._id}/download`}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30 rounded-xl hover:bg-[var(--primary)]/30 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </a>
        </div>

        <div className="bg-[var(--bg-deep)] rounded-xl border border-[var(--border-glass)] h-[600px] flex items-center justify-center relative overflow-hidden">
          <div className="text-center z-10">
            <div className="w-20 h-20 bg-[var(--bg-surface)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border-glass)]">
              <FileText className="w-10 h-10 text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-muted)] font-medium">
              Preview not available in this view
            </p>
            <p className="text-[var(--text-dim)] text-sm mt-2">
              Please download the file to view its contents
            </p>
          </div>
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-5"></div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] text-white hover:bg-[var(--bg-glass)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ResumeManagementPage;
