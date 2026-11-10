'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppLayout from '@/components/AppLayout';
import { User, Mail, Phone, MapPin, Globe, Github, Linkedin, Edit3, Save, X, Plus, Briefcase, GraduationCap, Award, Code, Cog, Trash2, Target, FileUp, ExternalLink, Sparkles } from 'lucide-react';
import { FormInput, FormInputNumber, FormDateInput, FormTextarea } from '@/components/ui/FormInput';
import Modal from '@/components/ui/Modal';
import AIProviderConfig from '@/components/AIProviderConfig';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';

const fixTextWithAI = async (text: string, context: string): Promise<string> => {
  const res = await fetch('/api/ai/fix-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, context }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || 'AI fix failed');
  }
  const data = await res.json();
  return data.fixed || '';
};

const FixAIButton = ({ value, context, onFixed }: {
  value: string;
  context: string;
  onFixed: (fixed: string) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const fixed = await fixTextWithAI(value, context);
      if (fixed) onFixed(fixed);
      toast.success('Updated with AI');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI fix failed. Check your AI config.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title="Fix with AI"
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] bg-[var(--primary)]/10 hover:bg-[var(--primary)] hover:text-black px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
    >
      <Sparkles className="w-3.5 h-3.5" />
      {loading ? 'Fixing\u2026' : 'Fix'}
    </button>
  );
};

interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  location: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  current: boolean;
  gpa?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  github?: string;
  startDate?: string;
  endDate?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  date?: string;
  organization?: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

interface UserProfile {
  personalInfo: {
    fullName: string;
    email: string;
    resumeEmail: string;
    phone: string;
    location: string;
    website: string;
    linkedin: string;
    github: string;
  };
  professionalInfo: {
    currentRole: string;
    experience: string;
    skills: string[];
    bio: string;
    workExperience: WorkExperience[];
    education: Education[];
    projects: Project[];
    achievements: Achievement[];
    certifications: Certification[];
  };
  preferences: {
    jobTypes: string[];
    locations: string[];
    salaryRange: {
      min: number;
      max: number;
    };
    remoteWork: boolean;
    targetRole: string;
    targetCompanies: string[];
  };
  aiConfig: {
    provider: string;
    apiKey?: string;
    apiUrl?: string;
    model: string;
    enabled: boolean;
  };
}

const UserProfilePage = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('personal');
  const [profile, setProfile] = useState<UserProfile>({
    personalInfo: {
      fullName: '',
      email: '',
      resumeEmail: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      github: ''
    },
    professionalInfo: {
      currentRole: '',
      experience: '',
      skills: [],
      bio: '',
      workExperience: [],
      education: [],
      projects: [],
      achievements: [],
      certifications: []
    },
    preferences: {
      jobTypes: [],
      locations: [],
      salaryRange: { min: 0, max: 0 },
      remoteWork: false,
      targetRole: '',
      targetCompanies: []
    },
    aiConfig: {
      provider: 'lm-studio',
      apiKey: '',
      apiUrl: 'http://localhost:1234',
      model: 'local-model',
      enabled: true
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [showAutofillModal, setShowAutofillModal] = useState(false);
  const [autofillError, setAutofillError] = useState('');
  const [selectedResumeFile, setSelectedResumeFile] = useState<File | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [aiFixingAll, setAiFixingAll] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();

        // Transform API response to match frontend structure
        const transformedProfile: UserProfile = {
          personalInfo: {
            fullName: data.personalInfo?.fullName || '',
            email: data.personalInfo?.email || '',
            resumeEmail: data.personalInfo?.resumeEmail || '',
            phone: data.personalInfo?.phone || '',
            location: data.personalInfo?.location || '',
            website: data.personalInfo?.website || '',
            linkedin: data.personalInfo?.linkedin || '',
            github: data.personalInfo?.github || ''
          },
          professionalInfo: {
            currentRole: data.professionalInfo?.currentRole || '',
            experience: data.professionalInfo?.experience || '',
            skills: data.professionalInfo?.skills || [],
            bio: data.professionalInfo?.bio || '',
            workExperience: data.professionalInfo?.workExperience || [],
            education: data.professionalInfo?.education || [],
            projects: data.professionalInfo?.projects || [],
            achievements: data.professionalInfo?.achievements || [],
            certifications: data.professionalInfo?.certifications || []
          },
          preferences: {
            jobTypes: data.preferences?.jobTypes || [],
            locations: data.preferences?.locations || [],
            salaryRange: {
              min: data.preferences?.salaryRange?.min || 0,
              max: data.preferences?.salaryRange?.max || 0
            },
            remoteWork: data.preferences?.remoteWork || false,
            targetRole: data.preferences?.targetRole || '',
            targetCompanies: data.preferences?.targetCompanies || []
          },
          aiConfig: {
            provider: data.aiConfig?.provider || 'lm-studio',
            apiKey: data.aiConfig?.apiKey || '',
            apiUrl: data.aiConfig?.apiUrl || 'http://localhost:1234',
            model: data.aiConfig?.model || 'local-model',
            enabled: data.aiConfig?.enabled ?? true
          }
        };

        setProfile(transformedProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        setIsEditing(false);
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (section: keyof UserProfile, field: string, value: unknown) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateListItem = (field: keyof typeof profile.professionalInfo, index: number, patch: Record<string, unknown>) => {
    setProfile(prev => {
      const arr = [...((prev.professionalInfo[field] as any[]) || [])];
      arr[index] = { ...arr[index], ...patch };
      return { ...prev, professionalInfo: { ...prev.professionalInfo, [field]: arr } };
    });
  };

  const removeListItem = (field: keyof typeof profile.professionalInfo, index: number) => {
    setProfile(prev => {
      const arr = ((prev.professionalInfo[field] as any[]) || []).filter((_, i) => i !== index);
      return { ...prev, professionalInfo: { ...prev.professionalInfo, [field]: arr } };
    });
  };

  const appendListItem = (field: keyof typeof profile.professionalInfo, item: unknown) => {
    setProfile(prev => {
      const arr = [...((prev.professionalInfo[field] as any[]) || []), item];
      return { ...prev, professionalInfo: { ...prev.professionalInfo, [field]: arr } };
    });
  };

  const handleGlobalAIFix = async () => {
    if (aiFixingAll) return;
    setAiFixingAll(true);
    try {
      const prof = profile.professionalInfo;
      const name = profile.personalInfo.fullName || 'the candidate';
      const role = prof.currentRole || 'a professional';

      type Task = { key: string; value: string; context: string };
      const tasks: Task[] = [];

      tasks.push({ key: 'bio', value: prof.bio, context: `Professional bio for ${name}, current role ${role}` });

      (prof.workExperience || []).forEach((exp, i) => {
        tasks.push({
          key: `work-${i}`,
          value: exp.description,
          context: `Work experience description for ${exp.position || 'a role'} at ${exp.company || 'a company'}`,
        });
      });
      (prof.projects || []).forEach((p, i) => {
        tasks.push({ key: `project-${i}`, value: p.description, context: `Project description for ${p.name || 'a project'}` });
      });
      (prof.achievements || []).forEach((a, i) => {
        tasks.push({ key: `achievement-${i}`, value: a.description, context: `Achievement description for ${a.title || 'an achievement'}` });
      });

      const results = await Promise.allSettled(tasks.map(t => fixTextWithAI(t.value, t.context)));
      let fixedCount = 0;

      results.forEach((r, i) => {
        if (r.status !== 'fulfilled' || !r.value) return;
        const t = tasks[i];
        fixedCount++;
        if (t.key === 'bio') {
          setProfile(prev => ({ ...prev, professionalInfo: { ...prev.professionalInfo, bio: r.value } }));
        } else if (t.key.startsWith('work-')) {
          updateListItem('workExperience', Number(t.key.split('-')[1]), { description: r.value });
        } else if (t.key.startsWith('project-')) {
          updateListItem('projects', Number(t.key.split('-')[1]), { description: r.value });
        } else if (t.key.startsWith('achievement-')) {
          updateListItem('achievements', Number(t.key.split('-')[1]), { description: r.value });
        }
      });

      setIsEditing(true);
      toast.success(fixedCount > 0 ? `AI fixed ${fixedCount} field${fixedCount === 1 ? '' : 's'}` : 'Nothing to fix');
    } catch (err) {
      console.error('Global AI fix error:', err);
      toast.error('AI fix failed. Check your AI config.');
    } finally {
      setAiFixingAll(false);
    }
  };

  const handleAutofill = async () => {
    if (!selectedResumeFile) return;
    setAutofilling(true);
    setAutofillError('');
    try {
      const formData = new FormData();
      formData.append('file', selectedResumeFile);

      const response = await fetch('/api/resumes/parse', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || 'Failed to parse resume');
      }
      const parsed = await response.json();

      const makeId = (i: number) => `resume-${Date.now()}-${i}`;
      const cleanDate = (v?: unknown) => {
        if (!v) return '';
        let s = String(v).trim();
        if (!s || /invalid/i.test(s)) return '';
        // Strip " - Present", " – Current", "to present" suffixes
        s = s.split(/\s*[-–—to]+\s*(present|current|now)\b/i)[0].trim();
        // If a range remains, take the first date only
        s = s.split(/\s*[-–—to]+\s*/)[0].trim();
        if (!s) return '';
        const d = new Date(s);
        return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
      };

      const next: UserProfile = {
        ...profile,
        personalInfo: {
          fullName: parsed.name || profile.personalInfo.fullName,
          email: profile.personalInfo.email,
          resumeEmail: parsed.email || profile.personalInfo.resumeEmail,
          phone: profile.personalInfo.phone,
          location: parsed.location || profile.personalInfo.location,
          website: parsed.portfolio || profile.personalInfo.website,
          linkedin: parsed.linkedin || profile.personalInfo.linkedin,
          github: parsed.github || profile.personalInfo.github,
        },
        professionalInfo: {
          ...profile.professionalInfo,
          currentRole: parsed.title || profile.professionalInfo.currentRole,
          experience: parsed.experienceYears ? String(parsed.experienceYears) : profile.professionalInfo.experience,
          skills: Array.isArray(parsed.skills) ? (parsed.skills as string[]) : profile.professionalInfo.skills,
          bio: parsed.summary || profile.professionalInfo.bio,
          workExperience: (parsed.workExperience || []).map((exp: any, i: number) => {
            const rawEnd = exp.endDate || '';
            const isCurrent = /present|current|now\b/i.test(rawEnd);
            return {
              id: makeId(i),
              company: exp.company || '',
              position: exp.role || '',
              startDate: cleanDate(exp.startDate),
              endDate: isCurrent ? '' : cleanDate(rawEnd),
              current: isCurrent || !cleanDate(rawEnd),
              description: exp.description || '',
              location: '',
            };
          }),
          education: (parsed.education || []).map((edu: any, i: number) => ({
            id: makeId(i),
            institution: edu.school || '',
            degree: edu.degree || '',
            field: '',
            startDate: '',
            endDate: cleanDate(edu.year),
            current: false,
            gpa: '',
          })),
          projects: (parsed.projects || []).map((p: any, i: number) => ({
            id: makeId(i),
            name: p.name || '',
            description: p.description || '',
            technologies: [],
            url: p.liveUrl || '',
            github: p.codeUrl || '',
          })),
        },
      };

      if (!next.preferences.targetRole) {
        next.preferences.targetRole = next.professionalInfo.currentRole;
      }

      setProfile(next);

      const saveResponse = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!saveResponse.ok) throw new Error('Failed to save profile');

      setShowAutofillModal(false);
      setSelectedResumeFile(null);
      toast.success('Profile filled from resume');
    } catch (error) {
      console.error('Autofill error:', error);
      setAutofillError(error instanceof Error ? error.message : 'Failed to autofill from resume');
    } finally {
      setAutofilling(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAutofillError('');
    if (!file) {
      setSelectedResumeFile(null);
      return;
    }
    if (file.type !== 'application/pdf') {
      setAutofillError('Only PDF resumes are supported.');
      setSelectedResumeFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAutofillError('File must be under 10MB.');
      setSelectedResumeFile(null);
      return;
    }
    setSelectedResumeFile(file);
  };

  const TabButton = ({ id, label, icon: Icon, isActive, onClick }: {
    id: string;
    label: string;
    icon: any;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${isActive
        ? 'bg-[var(--primary)] text-black'
        : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-glass)]'
        }`}
    >
      <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-[var(--text-muted)]'}`} />
      {label}
    </button>
  );

  const SectionHeading = ({ icon: Icon, title, count, action, size = 'lg' }: {
    icon: any;
    title: string;
    count?: number;
    action?: React.ReactNode;
    size?: 'lg' | 'md';
  }) => (
    <div className={`flex items-center justify-between gap-3 border-b border-[var(--border-glass)] ${size === 'lg' ? 'pb-3 mb-4' : 'pb-2.5 mb-3'}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`flex items-center justify-center shrink-0 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg ${size === 'lg' ? 'w-7 h-7' : 'w-6 h-6'}`}>
          <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        </span>
        <h3 className={`font-bold text-white truncate ${size === 'lg' ? 'text-lg' : 'text-sm'}`}>{title}</h3>
        {typeof count === 'number' && count > 0 && (
          <span className="text-xs text-[var(--text-muted)]">({count})</span>
        )}
      </div>
      {action}
    </div>
  );

  if (loading) {
    return (
      <AppLayout showFooter={false}>
        <div className="p-6 lg:p-8 min-h-screen">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between animate-pulse">
              <div className="space-y-3">
                <div className="h-8 w-48 bg-[var(--bg-glass)] rounded-lg"></div>
                <div className="h-4 w-72 bg-[var(--bg-glass)] rounded"></div>
              </div>
              <div className="h-10 w-28 bg-[var(--bg-glass)] rounded-lg"></div>
            </div>
            <div className="flex flex-wrap gap-1.5 bg-[var(--bg-surface)]/50 rounded-2xl p-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-9 w-32 bg-[var(--bg-glass)] rounded-lg animate-pulse"></div>
              ))}
            </div>
            <div className="h-[600px] bg-[var(--bg-glass)] rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showFooter={false}>
      <div className="p-6 lg:p-8 min-h-screen bg-[var(--bg-deep)]">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-3 bg-[var(--bg-surface)] rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.3)]">
                  <User className="w-8 h-8 text-[var(--primary)]" />
                </div>
                User Profile
              </h1>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={handleGlobalAIFix}
                disabled={aiFixingAll}
                isLoading={aiFixingAll}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-glass)] text-[var(--text-muted)] hover:text-white rounded-xl transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                Fix with AI
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowAutofillModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-glass)] text-[var(--text-muted)] hover:text-white rounded-xl transition-colors"
              >
                <FileUp className="w-5 h-5" />
                Autofill with Resume
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowAIConfig(!showAIConfig)}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all ${showAIConfig
                  ? 'bg-[var(--primary)] text-black font-bold'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-glass)]'
                  }`}
              >
                <Cog className="w-5 h-5" />
                AI Config
              </Button>
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-glass)] text-[var(--text-muted)] hover:text-white rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-6 py-2.5"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center gap-2 px-6 py-2.5"
                >
                  <Edit3 className="w-5 h-5" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          <Modal isOpen={showAutofillModal} onClose={() => setShowAutofillModal(false)} title="Autofill with Resume" width="max-w-md">
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center gap-3 border border-dashed border-[var(--border-glass)] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--primary)]/50 transition-colors bg-[var(--bg-deep)]/50">
                <input type="file" accept="application/pdf,.pdf" onChange={handleFileSelect} className="hidden" />
                <FileUp className="w-8 h-8 text-[var(--text-muted)]" />
                {selectedResumeFile ? (
                  <span className="text-sm text-[var(--text-main)] font-medium break-all">{selectedResumeFile.name}</span>
                ) : (
                  <span className="text-sm text-[var(--text-muted)]">Choose your resume (PDF)</span>
                )}
              </label>
              {autofillError && (
                <p className="text-sm text-[var(--danger)]">{autofillError}</p>
              )}
              <Button
                variant="primary"
                onClick={handleAutofill}
                disabled={!selectedResumeFile || autofilling}
                isLoading={autofilling}
                className="w-full"
              >
                Autofill Profile
              </Button>
            </div>
          </Modal>

          {/* AI Configuration Panel */}
          {showAIConfig && (
            <AIProviderConfig
              showConfig={showAIConfig}
              setShowConfig={setShowAIConfig}
            />
          )}

          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5 bg-[var(--bg-surface)]/50 backdrop-blur-xl rounded-2xl p-2">
              <TabButton
                id="personal"
                label="Personal Info"
                icon={User}
                isActive={activeTab === 'personal'}
                onClick={() => setActiveTab('personal')}
              />
              <TabButton
                id="professional"
                label="Professional"
                icon={Briefcase}
                isActive={activeTab === 'professional'}
                onClick={() => setActiveTab('professional')}
              />
              <TabButton
                id="social"
                label="Social Links"
                icon={Globe}
                isActive={activeTab === 'social'}
                onClick={() => setActiveTab('social')}
              />
              <TabButton
                id="preferences"
                label="Job Preferences"
                icon={Target}
                isActive={activeTab === 'preferences'}
                onClick={() => setActiveTab('preferences')}
              />
            </div>

            {/* Content */}
            <div>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
                className="bg-[var(--bg-surface)]/50 backdrop-blur-xl rounded-2xl p-6"
              >
                  {activeTab === 'personal' && (
                    <div className="space-y-8">
                      <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-glass)] pb-4">
                        <User className="w-5 h-5 text-[var(--primary)]" />
                        <h2 className="text-xl font-bold text-white">Personal Information</h2>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Full Name</label>
                          {isEditing ? (
                            <FormInput
                              value={profile.personalInfo.fullName}
                              onChange={(e) => handleInputChange('personalInfo', 'fullName', e.target.value)}
                              icon={<User className="w-4 h-4" />}
                              placeholder="Enter your full name"
                            />
                          ) : (
                            <p className="text-white font-medium">{profile.personalInfo?.fullName || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Email</label>
                          <div className="flex items-center gap-2 p-3 bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg">
                            <Mail className="w-4 h-4 text-[var(--primary)]" />
                            <p className="text-white text-sm">{profile.personalInfo.email || session?.user?.email || 'Not provided'}</p>
                          </div>
                          <p className="mt-1.5 text-xs text-[var(--text-muted)]">This is your sign-in email and cannot be changed here.</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Resume Email</label>
                          {isEditing ? (
                            <FormInput
                              type="email"
                              value={profile.personalInfo.resumeEmail}
                              onChange={(e) => handleInputChange('personalInfo', 'resumeEmail', e.target.value)}
                              icon={<Mail className="w-4 h-4" />}
                              placeholder="Email on your resume"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-[var(--primary)]" />
                              <p className="text-white">{profile.personalInfo.resumeEmail || 'Not provided'}</p>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Phone</label>
                          {isEditing ? (
                            <FormInput
                              type="tel"
                              value={profile.personalInfo.phone}
                              onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                              icon={<Phone className="w-4 h-4" />}
                              placeholder="Enter your phone number"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-[var(--primary)]" />
                              <p className="text-white">{profile.personalInfo.phone || 'Not provided'}</p>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Location</label>
                          {isEditing ? (
                            <FormInput
                              value={profile.personalInfo.location}
                              onChange={(e) => handleInputChange('personalInfo', 'location', e.target.value)}
                              icon={<MapPin className="w-4 h-4" />}
                              placeholder="Enter your location"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-[var(--primary)]" />
                              <p className="text-white">{profile.personalInfo.location || 'Not provided'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'professional' && (
                    <div className="space-y-8">
                      <div className="flex items-center justify-between mb-6 border-b border-[var(--border-glass)] pb-4">
                        <div className="flex items-center gap-3">
                          <Briefcase className="w-5 h-5 text-[var(--primary)]" />
                          <h2 className="text-xl font-bold text-white">Professional Information</h2>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Current Role</label>
                          {isEditing ? (
                            <FormInput
                              value={profile.professionalInfo.currentRole}
                              onChange={(e) => handleInputChange('professionalInfo', 'currentRole', e.target.value)}
                              placeholder="e.g. Senior Frontend Developer"
                            />
                          ) : (
                            <p className="text-white font-medium">{profile.professionalInfo.currentRole || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Experience</label>
                          {isEditing ? (
                            <FormInput
                              value={profile.professionalInfo.experience}
                              onChange={(e) => handleInputChange('professionalInfo', 'experience', e.target.value)}
                              placeholder="e.g., 3 years"
                            />
                          ) : (
                            <p className="text-white">{profile.professionalInfo.experience || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-[var(--text-muted)]">Bio</label>
                            {isEditing && (
                              <FixAIButton
                                value={profile.professionalInfo.bio}
                                context={`Professional bio for ${profile.personalInfo.fullName || 'the candidate'}${profile.professionalInfo.currentRole ? `, current role ${profile.professionalInfo.currentRole}` : ''}`}
                                onFixed={(fixed) => handleInputChange('professionalInfo', 'bio', fixed)}
                              />
                            )}
                          </div>
                          {isEditing ? (
                            <FormTextarea
                              value={profile.professionalInfo.bio}
                              onChange={(e) => handleInputChange('professionalInfo', 'bio', e.target.value)}
                              rows={4}
                              placeholder="Tell us about yourself..."
                            />
                          ) : (
                            <p className="text-white leading-relaxed">{profile.professionalInfo.bio || 'Not provided'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Skills</label>
                          {isEditing ? (
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                {(profile.professionalInfo.skills || []).map((skill, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-lg px-3 py-1.5 text-sm text-white group"
                                  >
                                    {skill}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = (profile.professionalInfo.skills || []).filter((_, i) => i !== index);
                                        setProfile(prev => ({
                                          ...prev,
                                          professionalInfo: { ...prev.professionalInfo, skills: next }
                                        }));
                                      }}
                                      className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                                      aria-label={`Remove ${skill}`}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <FormInput
                                  value={newSkill}
                                  onChange={(e) => setNewSkill(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const s = newSkill.trim();
                                      if (s && !(profile.professionalInfo.skills || []).includes(s)) {
                                        setProfile(prev => ({
                                          ...prev,
                                          professionalInfo: {
                                            ...prev.professionalInfo,
                                            skills: [...(prev.professionalInfo.skills || []), s]
                                          }
                                        }));
                                      }
                                      setNewSkill('');
                                    }
                                  }}
                                  placeholder="Add a skill and press Enter"
                                />
                                <Button
                                  variant="ghost"
                                  onClick={() => {
                                    const s = newSkill.trim();
                                    if (s && !(profile.professionalInfo.skills || []).includes(s)) {
                                      setProfile(prev => ({
                                        ...prev,
                                        professionalInfo: {
                                          ...prev.professionalInfo,
                                          skills: [...(prev.professionalInfo.skills || []), s]
                                        }
                                      }));
                                    }
                                    setNewSkill('');
                                  }}
                                  className="px-3 py-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg text-sm font-bold transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add
                                </Button>
                              </div>
                            </div>
                          ) : (profile.professionalInfo.skills || []).length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {(profile.professionalInfo.skills || []).map((skill, index) => (
                                <span key={index} className="bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg px-3 py-1 text-sm font-medium">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[var(--text-muted)]">No skills added yet.</p>
                          )}
                        </div>
                      </div>

                      {/* Work Experience List */}
                      <div className="mt-8">
                        <SectionHeading
                          icon={Briefcase}
                          title="Work History"
                          count={(profile.professionalInfo.workExperience || []).length}
                          action={isEditing ? (
                            <Button
                              variant="ghost"
                              onClick={() => {
                                const newExperience: WorkExperience = {
                                  id: Date.now().toString(),
                                  company: '',
                                  position: '',
                                  startDate: '',
                                  endDate: '',
                                  current: false,
                                  description: '',
                                  location: ''
                                };
                                setProfile(prev => ({
                                  ...prev,
                                  professionalInfo: {
                                    ...prev.professionalInfo,
                                    workExperience: [...(prev.professionalInfo.workExperience || []), newExperience]
                                  }
                                }));
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg text-sm font-bold transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Add
                            </Button>
                          ) : undefined}
                        />
                        <div className="space-y-6">
                          {(profile.professionalInfo.workExperience || []).length === 0 && !isEditing && (
                            <p className="text-[var(--text-muted)] text-center py-4">No work experience added yet.</p>
                          )}

                          {(profile.professionalInfo.workExperience || []).map((exp, index) => (
                            <div key={exp.id} className="p-6 bg-[var(--bg-deep)]/50 rounded-xl relative group">
                              {isEditing ? (
                                <div className="space-y-4">
                                  <div className="flex justify-end absolute top-4 right-4">
                                    <Button
                                      variant="ghost"
                                      onClick={() => {
                                        const newExp = (profile.professionalInfo.workExperience || []).filter((_, i) => i !== index);
                                        setProfile(prev => ({
                                          ...prev,
                                          professionalInfo: { ...prev.professionalInfo, workExperience: newExp }
                                        }));
                                      }}
                                      className="p-2 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
                                      aria-label="Remove work experience"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-10">
                                    <FormInput
                                      label="Company"
                                      value={exp.company}
                                      onChange={(e) => {
                                        const newExp = [...(profile.professionalInfo.workExperience || [])];
                                        newExp[index].company = e.target.value;
                                        setProfile(prev => ({
                                          ...prev,
                                          professionalInfo: { ...prev.professionalInfo, workExperience: newExp }
                                        }));
                                      }}
                                      icon={<Briefcase className="w-4 h-4" />}
                                      placeholder="Company name"
                                    />
                                    <FormInput
                                      label="Position"
                                      value={exp.position}
                                      onChange={(e) => {
                                        const newExp = [...(profile.professionalInfo.workExperience || [])];
                                        newExp[index].position = e.target.value;
                                        setProfile(prev => ({
                                          ...prev,
                                          professionalInfo: { ...prev.professionalInfo, workExperience: newExp }
                                        }));
                                      }}
                                      icon={<User className="w-4 h-4" />}
                                      placeholder="Job title"
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormInput
                                      label="Location"
                                      value={exp.location}
                                      onChange={(e) => {
                                        const newExp = [...(profile.professionalInfo.workExperience || [])];
                                        newExp[index].location = e.target.value;
                                        setProfile(prev => ({
                                          ...prev,
                                          professionalInfo: { ...prev.professionalInfo, workExperience: newExp }
                                        }));
                                      }}
                                      icon={<MapPin className="w-4 h-4" />}
                                      placeholder="Location"
                                    />
                                    <FormDateInput
                                      label="Start Date"
                                      value={exp.startDate}
                                      onChange={(v) => {
                                        const newExp = [...(profile.professionalInfo.workExperience || [])];
                                        newExp[index].startDate = v;
                                        setProfile(prev => ({
                                          ...prev,
                                          professionalInfo: { ...prev.professionalInfo, workExperience: newExp }
                                        }));
                                      }}
                                    />
                                    {!exp.current && (
                                      <FormDateInput
                                        label="End Date"
                                        value={exp.endDate}
                                        onChange={(v) => {
                                          const newExp = [...(profile.professionalInfo.workExperience || [])];
                                          newExp[index].endDate = v;
                                          setProfile(prev => ({
                                            ...prev,
                                            professionalInfo: { ...prev.professionalInfo, workExperience: newExp }
                                          }));
                                        }}
                                      />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={exp.current}
                                      onChange={(e) => {
                                        const newExp = [...(profile.professionalInfo.workExperience || [])];
                                        newExp[index].current = e.target.checked;
                                        if (e.target.checked) {
                                          newExp[index].endDate = '';
                                        }
                                        setProfile(prev => ({
                                          ...prev,
                                          professionalInfo: { ...prev.professionalInfo, workExperience: newExp }
                                        }));
                                      }}
                                      className="h-4 w-4 rounded border border-[var(--border)] bg-[var(--bg-deep)] accent-[var(--primary)]"
                                    />
                                    <span className="text-white text-sm">Currently working here</span>
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="block text-sm font-medium text-[var(--text-muted)]">Description</label>
                                      <FixAIButton
                                        value={exp.description}
                                        context={`Work experience description for ${exp.position || 'a role'} at ${exp.company || 'a company'}`}
                                        onFixed={(fixed) => updateListItem('workExperience', index, { description: fixed })}
                                      />
                                    </div>
                                    <FormTextarea
                                      value={exp.description}
                                      onChange={(e) => {
                                        const newExp = [...(profile.professionalInfo.workExperience || [])];
                                        newExp[index].description = e.target.value;
                                        setProfile(prev => ({
                                          ...prev,
                                          professionalInfo: { ...prev.professionalInfo, workExperience: newExp }
                                        }));
                                      }}
                                      rows={3}
                                      placeholder="Describe your role and achievements..."
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h4 className="text-lg font-bold text-white">{exp.position}</h4>
                                      <p className="text-[var(--primary)]">{exp.company}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm text-[var(--text-muted)]">
                                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                                      </p>
                                      <p className="text-sm text-[var(--text-muted)]">{exp.location}</p>
                                    </div>
                                  </div>
                                  <p className="text-sm text-[var(--text-muted)] mt-2">{exp.description}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Education List */}
                      <div className="mt-8">
                        <SectionHeading
                          icon={GraduationCap}
                          title="Education"
                          count={(profile.professionalInfo.education || []).length}
                          action={isEditing ? (
                            <Button
                              variant="ghost"
                              onClick={() => appendListItem('education', {
                                id: Date.now().toString(),
                                institution: '',
                                degree: '',
                                field: '',
                                startDate: '',
                                endDate: '',
                                current: false,
                                gpa: ''
                              })}
                              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg text-sm font-bold transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Add
                            </Button>
                          ) : undefined}
                        />
                        <div className="space-y-6">
                          {(profile.professionalInfo.education || []).length === 0 && !isEditing && (
                            <p className="text-[var(--text-muted)] text-center py-4">No education added yet.</p>
                          )}

                          {(profile.professionalInfo.education || []).map((edu, index) => (
                            <div key={edu.id} className="p-6 bg-[var(--bg-deep)]/50 rounded-xl relative group">
                              {isEditing ? (
                                <div className="space-y-4">
                                  <div className="flex justify-end absolute top-4 right-4">
                                    <Button
                                      variant="ghost"
                                      onClick={() => removeListItem('education', index)}
                                      className="p-2 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
                                      aria-label="Remove education"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-10">
                                    <FormInput
                                      label="Institution"
                                      value={edu.institution}
                                      onChange={(e) => updateListItem('education', index, { institution: e.target.value })}
                                      icon={<GraduationCap className="w-4 h-4" />}
                                      placeholder="School / university"
                                    />
                                    <FormInput
                                      label="Degree"
                                      value={edu.degree}
                                      onChange={(e) => updateListItem('education', index, { degree: e.target.value })}
                                      placeholder="e.g. B.Tech"
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput
                                      label="Field of Study"
                                      value={edu.field}
                                      onChange={(e) => updateListItem('education', index, { field: e.target.value })}
                                      placeholder="e.g. Computer Science"
                                    />
                                    <FormInput
                                      label="GPA"
                                      value={edu.gpa}
                                      onChange={(e) => updateListItem('education', index, { gpa: e.target.value })}
                                      placeholder="Optional"
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormDateInput
                                      label="Start Date"
                                      value={edu.startDate}
                                      onChange={(v) => updateListItem('education', index, { startDate: v })}
                                    />
                                    {!edu.current && (
                                      <FormDateInput
                                        label="End Date"
                                        value={edu.endDate}
                                        onChange={(v) => updateListItem('education', index, { endDate: v })}
                                      />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={edu.current}
                                      onChange={(e) => {
                                        updateListItem('education', index, { current: e.target.checked, endDate: e.target.checked ? '' : edu.endDate });
                                      }}
                                      className="h-4 w-4 rounded border border-[var(--border)] bg-[var(--bg-deep)] accent-[var(--primary)]"
                                    />
                                    <span className="text-white text-sm">Currently studying</span>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h4 className="text-lg font-bold text-white">{edu.degree}</h4>
                                      <p className="text-[var(--primary)]">{edu.institution}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm text-[var(--text-muted)]">
                                        {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                                      </p>
                                      {edu.gpa && <p className="text-sm text-[var(--text-muted)]">GPA: {edu.gpa}</p>}
                                      {edu.field && <p className="text-sm text-[var(--text-muted)]">{edu.field}</p>}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Projects List */}
                      <div className="mt-8">
                        <SectionHeading
                          icon={Code}
                          title="Projects"
                          size="md"
                          count={(profile.professionalInfo.projects || []).length}
                          action={isEditing ? (
                            <Button
                              variant="ghost"
                              onClick={() => appendListItem('projects', {
                                id: Date.now().toString(),
                                name: '',
                                description: '',
                                technologies: [],
                                url: '',
                                github: '',
                                startDate: '',
                                endDate: ''
                              })}
                              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg text-sm font-bold transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Add
                            </Button>
                          ) : undefined}
                        />
                        <div className="space-y-6">
                          {(profile.professionalInfo.projects || []).length === 0 && !isEditing && (
                            <p className="text-[var(--text-muted)] text-center py-4">No projects added yet.</p>
                          )}

                          {(profile.professionalInfo.projects || []).map((proj, index) => (
                            <div key={proj.id} className="p-6 bg-[var(--bg-deep)]/50 rounded-xl relative group">
                              {isEditing ? (
                                <div className="space-y-4">
                                  <div className="flex justify-end absolute top-4 right-4">
                                    <Button
                                      variant="ghost"
                                      onClick={() => removeListItem('projects', index)}
                                      className="p-2 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
                                      aria-label="Remove project"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-10">
                                    <FormInput
                                      label="Project Name"
                                      value={proj.name}
                                      onChange={(e) => updateListItem('projects', index, { name: e.target.value })}
                                      icon={<Code className="w-4 h-4" />}
                                      placeholder="Project name"
                                    />
                                    <FormInput
                                      label="Live URL"
                                      type="url"
                                      value={proj.url}
                                      onChange={(e) => updateListItem('projects', index, { url: e.target.value })}
                                      icon={<Globe className="w-4 h-4" />}
                                      placeholder="https://..."
                                    />
                                  </div>
                                  <FormInput
                                    label="Repository"
                                    type="url"
                                    value={proj.github}
                                    onChange={(e) => updateListItem('projects', index, { github: e.target.value })}
                                    icon={<Github className="w-4 h-4" />}
                                    placeholder="https://github.com/..."
                                  />
                                  <FormInput
                                    label="Technologies"
                                    value={(proj.technologies || []).join(', ')}
                                    onChange={(e) => {
                                      const techs = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                                      updateListItem('projects', index, { technologies: techs });
                                    }}
                                    placeholder="Comma separated"
                                  />
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="block text-sm font-medium text-[var(--text-muted)]">Description</label>
                                      <FixAIButton
                                        value={proj.description}
                                        context={`Project description for ${proj.name || 'a project'}`}
                                        onFixed={(fixed) => updateListItem('projects', index, { description: fixed })}
                                      />
                                    </div>
                                    <FormTextarea
                                      value={proj.description}
                                      onChange={(e) => updateListItem('projects', index, { description: e.target.value })}
                                      rows={3}
                                      placeholder="Describe the project..."
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      {proj.url || proj.github ? (
                                        <a
                                          href={proj.url || proj.github}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 text-lg font-bold text-white hover:text-[var(--secondary)] hover:underline transition-colors"
                                        >
                                          {proj.name}
                                          <ExternalLink className="w-4 h-4 text-[var(--text-muted)]" />
                                        </a>
                                      ) : (
                                        <h4 className="text-lg font-bold text-white">{proj.name}</h4>
                                      )}
                                      <div className="flex gap-3 text-sm">
                                        {proj.url && <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-[var(--secondary)] hover:underline">Live</a>}
                                        {proj.github && <a href={proj.github} target="_blank" rel="noopener noreferrer" className="text-[var(--secondary)] hover:underline">Repo</a>}
                                      </div>
                                    </div>
                                  </div>
                                  {(proj.technologies || []).length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {(proj.technologies || []).map((tech, ti) => (
                                        <span key={ti} className="bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg px-2.5 py-0.5 text-xs font-medium">{tech}</span>
                                      ))}
                                    </div>
                                  )}
                                  <p className="text-sm text-[var(--text-muted)] mt-2">{proj.description}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Certifications List */}
                      <div className="mt-8">
                        <SectionHeading
                          icon={Award}
                          title="Certifications"
                          size="md"
                          count={(profile.professionalInfo.certifications || []).length}
                          action={isEditing ? (
                            <Button
                              variant="ghost"
                              onClick={() => appendListItem('certifications', {
                                id: Date.now().toString(),
                                name: '',
                                issuer: '',
                                date: '',
                                url: ''
                              })}
                              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg text-sm font-bold transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Add
                            </Button>
                          ) : undefined}
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                          {(profile.professionalInfo.certifications || []).length === 0 && !isEditing && (
                            <p className="text-[var(--text-muted)] text-center py-4">No certifications added yet.</p>
                          )}

                          {(profile.professionalInfo.certifications || []).map((cert, index) => (
                            <div key={cert.id} className="p-5 bg-[var(--bg-deep)]/50 rounded-xl relative group">
                              {isEditing ? (
                                <div className="space-y-4">
                                  <div className="flex justify-end absolute top-4 right-4">
                                    <Button
                                      variant="ghost"
                                      onClick={() => removeListItem('certifications', index)}
                                      className="p-2 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
                                      aria-label="Remove certification"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-10">
                                    <FormInput
                                      label="Certification"
                                      value={cert.name}
                                      onChange={(e) => updateListItem('certifications', index, { name: e.target.value })}
                                      icon={<Award className="w-4 h-4" />}
                                      placeholder="e.g. AWS Certified Developer"
                                    />
                                    <FormInput
                                      label="Issuer"
                                      value={cert.issuer}
                                      onChange={(e) => updateListItem('certifications', index, { issuer: e.target.value })}
                                      placeholder="e.g. Amazon Web Services"
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormDateInput
                                      label="Date Earned"
                                      value={cert.date}
                                      onChange={(v) => updateListItem('certifications', index, { date: v })}
                                    />
                                    <FormInput
                                      label="Credential URL"
                                      type="url"
                                      value={cert.url}
                                      onChange={(e) => updateListItem('certifications', index, { url: e.target.value })}
                                      placeholder="https://..."
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h4 className="text-base font-bold text-white">{cert.name}</h4>
                                      <p className="text-[var(--primary)]">{cert.issuer}</p>
                                    </div>
                                    <div className="text-right">
                                      {cert.date && <p className="text-sm text-[var(--text-muted)]">{cert.date}</p>}
                                      {cert.url && <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--secondary)] hover:underline">View</a>}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Achievements List */}
                      <div className="mt-8">
                        <SectionHeading
                          icon={Award}
                          title="Achievements"
                          size="md"
                          count={(profile.professionalInfo.achievements || []).length}
                          action={isEditing ? (
                            <Button
                              variant="ghost"
                              onClick={() => appendListItem('achievements', {
                                id: Date.now().toString(),
                                title: '',
                                description: '',
                                date: '',
                                organization: ''
                              })}
                              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg text-sm font-bold transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Add
                            </Button>
                          ) : undefined}
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                          {(profile.professionalInfo.achievements || []).length === 0 && !isEditing && (
                            <p className="text-[var(--text-muted)] text-center py-4">No achievements added yet.</p>
                          )}

                          {(profile.professionalInfo.achievements || []).map((ach, index) => (
                            <div key={ach.id} className="p-5 bg-[var(--bg-deep)]/50 rounded-xl relative group">
                              {isEditing ? (
                                <div className="space-y-4">
                                  <div className="flex justify-end absolute top-4 right-4">
                                    <Button
                                      variant="ghost"
                                      onClick={() => removeListItem('achievements', index)}
                                      className="p-2 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
                                      aria-label="Remove achievement"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-10">
                                    <FormInput
                                      label="Title"
                                      value={ach.title}
                                      onChange={(e) => updateListItem('achievements', index, { title: e.target.value })}
                                      icon={<Award className="w-4 h-4" />}
                                      placeholder="e.g. Employee of the Month"
                                    />
                                    <FormInput
                                      label="Organization"
                                      value={ach.organization}
                                      onChange={(e) => updateListItem('achievements', index, { organization: e.target.value })}
                                      placeholder="e.g. ACM"
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormDateInput
                                      label="Date"
                                      value={ach.date}
                                      onChange={(v) => updateListItem('achievements', index, { date: v })}
                                    />
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="block text-sm font-medium text-[var(--text-muted)]">Description</label>
                                      <FixAIButton
                                        value={ach.description}
                                        context={`Achievement description for ${ach.title || 'an achievement'}${ach.organization ? ` at ${ach.organization}` : ''}`}
                                        onFixed={(fixed) => updateListItem('achievements', index, { description: fixed })}
                                      />
                                    </div>
                                    <FormTextarea
                                      value={ach.description}
                                      onChange={(e) => updateListItem('achievements', index, { description: e.target.value })}
                                      rows={3}
                                      placeholder="What did you achieve?"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h4 className="text-base font-bold text-white">{ach.title}</h4>
                                      {ach.organization && <p className="text-[var(--primary)]">{ach.organization}</p>}
                                    </div>
                                    {ach.date && <p className="text-sm text-[var(--text-muted)]">{ach.date}</p>}
                                  </div>
                                  {ach.description && <p className="text-sm text-[var(--text-muted)] mt-2">{ach.description}</p>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'social' && (
                    <div className="space-y-8">
                      <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-glass)] pb-4">
                        <Globe className="w-5 h-5 text-[var(--primary)]" />
                        <h2 className="text-xl font-bold text-white">Social Links</h2>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Website</label>
                          {isEditing ? (
                            <FormInput
                              type="url"
                              value={profile.personalInfo.website}
                              onChange={(e) => handleInputChange('personalInfo', 'website', e.target.value)}
                              icon={<Globe className="w-4 h-4" />}
                              placeholder="https://yourwebsite.com"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-[var(--primary)]" />
                              {profile.personalInfo.website ? (
                                <a href={profile.personalInfo.website} target="_blank" rel="noopener noreferrer" className="text-[var(--secondary)] hover:underline">
                                  {profile.personalInfo.website}
                                </a>
                              ) : (
                                <p className="text-[var(--text-muted)]">Not provided</p>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">LinkedIn</label>
                          {isEditing ? (
                            <FormInput
                              type="url"
                              value={profile.personalInfo.linkedin}
                              onChange={(e) => handleInputChange('personalInfo', 'linkedin', e.target.value)}
                              icon={<Linkedin className="w-4 h-4" />}
                              placeholder="https://linkedin.com/in/username"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Linkedin className="w-4 h-4 text-[var(--primary)]" />
                              {profile.personalInfo.linkedin ? (
                                <a href={profile.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-[var(--secondary)] hover:underline">
                                  {profile.personalInfo.linkedin}
                                </a>
                              ) : (
                                <p className="text-[var(--text-muted)]">Not provided</p>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">GitHub</label>
                          {isEditing ? (
                            <FormInput
                              type="url"
                              value={profile.personalInfo.github}
                              onChange={(e) => handleInputChange('personalInfo', 'github', e.target.value)}
                              icon={<Github className="w-4 h-4" />}
                              placeholder="https://github.com/username"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Github className="w-4 h-4 text-[var(--primary)]" />
                              {profile.personalInfo.github ? (
                                <a href={profile.personalInfo.github} target="_blank" rel="noopener noreferrer" className="text-[var(--secondary)] hover:underline">
                                  {profile.personalInfo.github}
                                </a>
                              ) : (
                                <p className="text-[var(--text-muted)]">Not provided</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'preferences' && (
                    <div className="space-y-8">
                      <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-glass)] pb-4">
                        <Target className="w-5 h-5 text-[var(--primary)]" />
                        <h2 className="text-xl font-bold text-white">Job Preferences</h2>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Preferred Job Types</label>
                          {isEditing ? (
                            <div className="flex flex-wrap gap-2">
                              {['full-time', 'part-time', 'contract', 'internship'].map(type => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={profile.preferences.jobTypes.includes(type)}
                                    onChange={(e) => {
                                      const newTypes = e.target.checked
                                        ? [...profile.preferences.jobTypes, type]
                                        : profile.preferences.jobTypes.filter(t => t !== type);
                                      handleInputChange('preferences', 'jobTypes', newTypes);
                                    }}
                                    className="h-4 w-4 rounded border border-[var(--border)] bg-[var(--bg-deep)] accent-[var(--primary)]"
                                  />
                                  <span className="text-white text-sm capitalize">{type.replace('-', ' ')}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {profile.preferences.jobTypes.length > 0 ? (
                                profile.preferences.jobTypes.map(type => (
                                  <span key={type} className="px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full text-xs font-bold capitalize">
                                    {type.replace('-', ' ')}
                                  </span>
                                ))
                              ) : (
                                <p className="text-[var(--text-muted)]">Not specified</p>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Remote Work</label>
                          {isEditing ? (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={profile.preferences.remoteWork}
                                onChange={(e) => handleInputChange('preferences', 'remoteWork', e.target.checked)}
                                className="h-4 w-4 rounded border border-[var(--border)] bg-[var(--bg-deep)] accent-[var(--primary)]"
                              />
                              <span className="text-white">Open to remote work</span>
                            </label>
                          ) : (
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${profile.preferences.remoteWork
                              ? 'bg-[var(--success)]/10 text-[var(--success)]'
                              : 'bg-[var(--bg-deep)] text-[var(--text-muted)]'
                              }`}>
                              {profile.preferences.remoteWork ? 'Yes, Open to Remote' : 'No Remote Work'}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Preferred Locations</label>
                          {isEditing ? (
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                {(profile.preferences.locations || []).map((loc, index) => (
                                  <span key={index} className="inline-flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-lg px-3 py-1.5 text-sm text-white group">
                                    {loc}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = (profile.preferences.locations || []).filter((_, i) => i !== index);
                                        handleInputChange('preferences', 'locations', next);
                                      }}
                                      className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                                      aria-label={`Remove ${loc}`}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <FormInput
                                  value={newLocation}
                                  onChange={(e) => setNewLocation(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const s = newLocation.trim();
                                      if (s && !(profile.preferences.locations || []).includes(s)) {
                                        handleInputChange('preferences', 'locations', [...(profile.preferences.locations || []), s]);
                                      }
                                      setNewLocation('');
                                    }
                                  }}
                                  placeholder="Add a city / region and press Enter"
                                />
                                <Button
                                  variant="ghost"
                                  onClick={() => {
                                    const s = newLocation.trim();
                                    if (s && !(profile.preferences.locations || []).includes(s)) {
                                      handleInputChange('preferences', 'locations', [...(profile.preferences.locations || []), s]);
                                    }
                                    setNewLocation('');
                                  }}
                                  className="px-3 py-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg text-sm font-bold transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add
                                </Button>
                              </div>
                            </div>
                          ) : (profile.preferences.locations || []).length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {(profile.preferences.locations || []).map((loc, index) => (
                                <span key={index} className="bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg px-3 py-1 text-sm font-medium">{loc}</span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[var(--text-muted)]">Not specified</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Target Role</label>
                          {isEditing ? (
                            <FormInput
                              value={profile.preferences.targetRole}
                              onChange={(e) => handleInputChange('preferences', 'targetRole', e.target.value)}
                              placeholder="e.g. Senior Frontend Developer"
                            />
                          ) : (
                            <p className="text-white">{profile.preferences.targetRole || 'Not specified'}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Target Companies</label>
                          {isEditing ? (
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                {(profile.preferences.targetCompanies || []).map((comp, index) => (
                                  <span key={index} className="inline-flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-lg px-3 py-1.5 text-sm text-white group">
                                    {comp}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = (profile.preferences.targetCompanies || []).filter((_, i) => i !== index);
                                        handleInputChange('preferences', 'targetCompanies', next);
                                      }}
                                      className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                                      aria-label={`Remove ${comp}`}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <FormInput
                                  value={newCompany}
                                  onChange={(e) => setNewCompany(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const s = newCompany.trim();
                                      if (s && !(profile.preferences.targetCompanies || []).includes(s)) {
                                        handleInputChange('preferences', 'targetCompanies', [...(profile.preferences.targetCompanies || []), s]);
                                      }
                                      setNewCompany('');
                                    }
                                  }}
                                  placeholder="Add a company and press Enter"
                                />
                                <Button
                                  variant="ghost"
                                  onClick={() => {
                                    const s = newCompany.trim();
                                    if (s && !(profile.preferences.targetCompanies || []).includes(s)) {
                                      handleInputChange('preferences', 'targetCompanies', [...(profile.preferences.targetCompanies || []), s]);
                                    }
                                    setNewCompany('');
                                  }}
                                  className="px-3 py-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded-lg text-sm font-bold transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add
                                </Button>
                              </div>
                            </div>
                          ) : (profile.preferences.targetCompanies || []).length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {(profile.preferences.targetCompanies || []).map((comp, index) => (
                                <span key={index} className="bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg px-3 py-1 text-sm font-medium">{comp}</span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[var(--text-muted)]">Not specified</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Salary Range</label>
                          {isEditing ? (
                            <div className="grid grid-cols-2 gap-4">
                              <FormInputNumber
                                label="Min (₹)"
                                value={profile.preferences.salaryRange.min ? String(profile.preferences.salaryRange.min) : ''}
                                onChange={(e) => handleInputChange('preferences', 'salaryRange', { ...profile.preferences.salaryRange, min: Number(e.target.value) || 0 })}
                                placeholder="0"
                              />
                              <FormInputNumber
                                label="Max (₹)"
                                value={profile.preferences.salaryRange.max ? String(profile.preferences.salaryRange.max) : ''}
                                onChange={(e) => handleInputChange('preferences', 'salaryRange', { ...profile.preferences.salaryRange, max: Number(e.target.value) || 0 })}
                                placeholder="0"
                              />
                            </div>
                          ) : (
                            <p className="text-white">
                              {(profile.preferences.salaryRange.min || profile.preferences.salaryRange.max)
                                ? `${profile.preferences.salaryRange.min || 0} - ${profile.preferences.salaryRange.max || 0}`
                                : 'Not specified'}
                            </p>
                          )}
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

export default UserProfilePage;