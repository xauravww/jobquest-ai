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
  File,
  CheckCircle,
  Pencil,
  RefreshCw,
  ArrowLeft,
  Plus
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
  const [editing, setEditing] = useState(false);
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

  const handleEdit = async (resume: Resume) => {
    setEditingResume(resume);
    setEditing(true);
    // Load the full resume (including its content snapshot) for editing.
    try {
      const res = await fetch(`/api/resumes/${resume._id}`);
      if (res.ok) {
        const data = await res.json();
        if (data?._id) setEditingResume(data);
      }
    } catch (error) {
      console.error('Error loading resume content:', error);
    }
  };

  const handleSaveEdit = async (id: string, payload: { title: string; description: string; content?: unknown }) => {
    try {
      const response = await fetch(`/api/resumes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        toast.success('Resume updated — PDF rebuilt');
        setEditing(false);
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
      ) : editing && editingResume ? (
        <ResumeEditView
          resume={editingResume}
          onBack={() => {
            setEditing(false);
            setEditingResume(null);
          }}
          onSave={handleSaveEdit}
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
                  className="bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--border-glass-hover)] rounded-xl p-5 flex flex-col h-full transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-[var(--bg-raised)] border border-[var(--border)] flex items-center justify-center">
                        <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                      </div>
                      {resume.isDefault && (
                        <span className="text-xs font-medium text-[var(--success)] bg-[var(--success)]/10 border border-[var(--success)]/20 px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[11px] font-medium border ${getTypeColor(resume.type)}`}>
                      {getTypeLabel(resume.type)}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="text-base font-semibold text-[var(--text-main)] mb-1 truncate">{resume.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] line-clamp-2 flex-1 mb-4">
                    {resume.description || 'No description provided'}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-[var(--text-dim)] mb-4">
                    <span className="inline-flex items-center gap-1.5">
                      <File className="w-3.5 h-3.5" />
                      {formatFileSize(resume.fileSize)}
                    </span>
                    {resume.atsScore !== undefined && (
                      <span className={`font-semibold ${resume.atsScore >= 80 ? 'text-[var(--success)]' : resume.atsScore >= 60 ? 'text-[var(--warning)]' : 'text-[var(--danger)]'}`}>
                        {resume.atsScore}% ATS
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)]">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedResume(resume);
                        setFullPreview(true);
                      }}
                      leftIcon={<Eye className="w-4 h-4" />}
                      className="flex-1"
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(resume)}
                      aria-label="Edit"
                      className="w-9 h-9 !p-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleGenerate}
                      disabled={generating}
                      aria-label="Regenerate"
                      className="w-9 h-9 !p-0"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(resume._id)}
                      aria-label="Delete"
                      className="w-9 h-9 !p-0 text-[var(--text-muted)] hover:text-[var(--danger)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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

const ResumeEditView = ({ resume, onBack, onSave }: {
  resume: Resume;
  onBack: () => void;
  onSave: (id: string, payload: { title: string; description: string; content: any }) => void;
}) => {
  const c0 = (resume as any).content || {};
  const [title, setTitle] = useState(resume.title);
  const [description, setDescription] = useState(resume.description || '');
  const [summary, setSummary] = useState(c0.summary || '');
  const [skillsText, setSkillsText] = useState((c0.skills || []).join(', '));
  const [work, setWork] = useState<any[]>((c0.workExperience || []).map((w: any) => ({ ...w })));
  const [edu, setEdu] = useState<any[]>((c0.education || []).map((e: any) => ({ ...e })));
  const [projects, setProjects] = useState<any[]>((c0.projects || []).map((p: any) => ({ ...p })));
  const [saving, setSaving] = useState(false);

  const updateItem = (setter: React.Dispatch<React.SetStateAction<any[]>>, index: number, patch: object) => {
    setter(prev => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const inputCls = "w-full px-3 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-lg text-white focus:border-[var(--primary)] focus:outline-none text-sm";
  const labelCls = "block text-xs font-medium text-[var(--text-muted)] mb-1";

  const handleSubmit = async () => {
    if (!resume) return;
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    const existing = (resume as any).content || {};
    const content = {
      ...existing,
      summary,
      skills: skillsText.split(',').map((s: string) => s.trim()).filter(Boolean),
      workExperience: work.filter(w => (w.role || '').trim() || (w.company || '').trim()),
      education: edu.filter(e => (e.degree || '').trim() || (e.school || '').trim()),
      projects: projects.filter(p => (p.name || '').trim()),
    };
    setSaving(true);
    try {
      await onSave(resume._id, { title: title.trim(), description: description.trim(), content });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 lg:px-8 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
        <Button
          variant="ghost"
          onClick={onBack}
          leftIcon={<ArrowLeft className="w-5 h-5" />}
          className="px-4 py-2 shrink-0"
        >
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate" style={{ color: 'var(--text-main)' }}>Edit — {resume.title}</h2>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Changes rebuild the PDF when you save</p>
        </div>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={saving}
          isLoading={saving}
          leftIcon={<CheckCircle className="w-4 h-4" />}
          className="px-5 py-2"
        >
          {saving ? 'Saving...' : 'Save & Rebuild'}
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Title <span className="text-[var(--danger)]">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Software Engineer Resume"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
                className={inputCls}
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className={labelCls}>Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="Professional summary shown at the top of the resume"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Skills */}
          <div>
            <label className={labelCls}>Skills (comma separated)</label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="React, TypeScript, Node.js, ..."
              className={inputCls}
            />
          </div>

          {/* Experience */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-[var(--text-main)]">Experience</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWork(prev => [...prev, { role: '', company: '', startDate: '', endDate: '', description: '' }])}
                leftIcon={<Plus className="w-4 h-4" />}
                className="!px-3 !py-1 text-xs"
              >
                Add
              </Button>
            </div>
            <div className="space-y-3">
              {work.map((w: any, i: number) => (
                <div key={i} className="border border-[var(--border-glass)] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">Experience {i + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setWork(prev => prev.filter((_, j) => j !== i))}
                      aria-label="Remove experience"
                      className="w-7 h-7 !p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Role</label>
                      <input className={inputCls} value={w.role || ''} onChange={(e) => updateItem(setWork, i, { role: e.target.value })} placeholder="Frontend Developer" />
                    </div>
                    <div>
                      <label className={labelCls}>Company</label>
                      <input className={inputCls} value={w.company || ''} onChange={(e) => updateItem(setWork, i, { company: e.target.value })} placeholder="Acme Inc" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Start</label>
                      <input className={inputCls} value={w.startDate || ''} onChange={(e) => updateItem(setWork, i, { startDate: e.target.value })} placeholder="May 2025" />
                    </div>
                    <div>
                      <label className={labelCls}>End</label>
                      <input className={inputCls} value={w.endDate || ''} onChange={(e) => updateItem(setWork, i, { endDate: e.target.value })} placeholder="Present" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea className={`${inputCls} resize-none`} rows={2} value={w.description || ''} onChange={(e) => updateItem(setWork, i, { description: e.target.value })} placeholder="Key responsibilities / achievements" />
                  </div>
                </div>
              ))}
              {work.length === 0 && (
                <p className="text-xs text-[var(--text-dim)]">No experience entries.</p>
              )}
            </div>
          </div>

          {/* Education */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-[var(--text-main)]">Education</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEdu(prev => [...prev, { degree: '', school: '', year: '' }])}
                leftIcon={<Plus className="w-4 h-4" />}
                className="!px-3 !py-1 text-xs"
              >
                Add
              </Button>
            </div>
            <div className="space-y-3">
              {edu.map((e: any, i: number) => (
                <div key={i} className="border border-[var(--border-glass)] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">Education {i + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEdu(prev => prev.filter((_, j) => j !== i))}
                      aria-label="Remove education"
                      className="w-7 h-7 !p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Degree</label>
                      <input className={inputCls} value={e.degree || ''} onChange={(ev) => updateItem(setEdu, i, { degree: ev.target.value })} placeholder="B.Tech" />
                    </div>
                    <div>
                      <label className={labelCls}>Institution</label>
                      <input className={inputCls} value={e.school || ''} onChange={(ev) => updateItem(setEdu, i, { school: ev.target.value })} placeholder="University Name" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Year</label>
                      <input className={inputCls} value={e.year || ''} onChange={(ev) => updateItem(setEdu, i, { year: ev.target.value })} placeholder="2025" />
                    </div>
                  </div>
                </div>
              ))}
              {edu.length === 0 && (
                <p className="text-xs text-[var(--text-dim)]">No education entries.</p>
              )}
            </div>
          </div>

          {/* Projects */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-[var(--text-main)]">Projects</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProjects(prev => [...prev, { name: '', description: '', liveUrl: '', codeUrl: '' }])}
                leftIcon={<Plus className="w-4 h-4" />}
                className="!px-3 !py-1 text-xs"
              >
                Add
              </Button>
            </div>
            <div className="space-y-3">
              {projects.map((p: any, i: number) => (
                <div key={i} className="border border-[var(--border-glass)] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">Project {i + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProjects(prev => prev.filter((_, j) => j !== i))}
                      aria-label="Remove project"
                      className="w-7 h-7 !p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Name</label>
                      <input className={inputCls} value={p.name || ''} onChange={(e) => updateItem(setProjects, i, { name: e.target.value })} placeholder="Project name" />
                    </div>
                    <div>
                      <label className={labelCls}>URL</label>
                      <input className={inputCls} value={p.liveUrl || ''} onChange={(e) => updateItem(setProjects, i, { liveUrl: e.target.value })} placeholder="https://..." />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea className={`${inputCls} resize-none`} rows={2} value={p.description || ''} onChange={(e) => updateItem(setProjects, i, { description: e.target.value })} placeholder="What it does / your role" />
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-xs text-[var(--text-dim)]">No projects.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResumeManagementPage;
