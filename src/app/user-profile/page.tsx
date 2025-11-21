'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppLayout from '@/components/AppLayout';
import { User, Mail, Phone, MapPin, Globe, Github, Linkedin, Edit3, Save, X, Plus, Briefcase, GraduationCap, Award, Code, Cog, Trash2 } from 'lucide-react';
import { FormInput, FormDateInput } from '@/components/ui/FormInput';
import AIProviderConfig from '@/components/AIProviderConfig';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

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
  const [profile, setProfile] = useState<UserProfile>({
    personalInfo: {
      fullName: '',
      email: '',
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
            fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || '',
            email: data.email || '',
            phone: data.phone || '',
            location: data.location || '',
            website: data.portfolioUrl || '',
            linkedin: data.linkedinUrl || '',
            github: data.githubUrl || ''
          },
          professionalInfo: {
            currentRole: data.targetRole || '',
            experience: data.experienceYears?.toString() || '',
            skills: data.skills || [],
            bio: data.bio || '',
            workExperience: data.workExperience || [],
            education: data.education || [],
            projects: data.projects || [],
            achievements: data.achievements || [],
            certifications: data.certifications || []
          },
          preferences: {
            jobTypes: data.preferences?.jobTypes || [],
            locations: data.preferences?.locations || [],
            salaryRange: {
              min: data.preferences?.salaryRange?.min || 0,
              max: data.preferences?.salaryRange?.max || 0
            },
            remoteWork: data.preferences?.remoteWork || false,
            targetRole: data.targetRole || '',
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

  if (loading) {
    return (
      <AppLayout showFooter={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin"></div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Loading Profile</h3>
            <p className="text-[var(--text-muted)]">Please wait while we fetch your information...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showFooter={false}>
      <div className="p-6 lg:p-8 min-h-screen space-y-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-[var(--primary)]/20 rounded-xl border border-[var(--primary)]/30">
                  <User className="w-8 h-8 text-[var(--primary)]" />
                </div>
                User Profile
              </h1>
              <p className="text-[var(--text-muted)] mt-2 ml-16">Manage your personal and professional information</p>
            </div>

            <div className="flex gap-3 w-full lg:w-auto">
              <button
                onClick={() => setShowAIConfig(!showAIConfig)}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all border ${showAIConfig
                    ? 'bg-[var(--primary)] text-black border-[var(--primary)] font-bold'
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-glass)] hover:text-white hover:bg-[var(--bg-glass)]'
                  }`}
              >
                <Cog className="w-5 h-5" />
                AI Config
              </button>
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-glass)] text-[var(--text-muted)] hover:text-white border border-[var(--border-glass)] rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-xl shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-xl shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 hover:scale-105 transition-all"
                >
                  <Edit3 className="w-5 h-5" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* AI Configuration Panel */}
          {showAIConfig && (
            <AIProviderConfig
              showConfig={showAIConfig}
              setShowConfig={setShowAIConfig}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--bg-surface)]/50 backdrop-blur-xl border border-[var(--border-glass)] rounded-2xl p-6 hover:border-[var(--primary)]/30 transition-colors"
            >
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
                  {isEditing ? (
                    <FormInput
                      type="email"
                      value={profile.personalInfo.email}
                      onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                      icon={<Mail className="w-4 h-4" />}
                      placeholder="Enter your email"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[var(--primary)]" />
                      <p className="text-white">{profile.personalInfo.email || session?.user?.email || 'Not provided'}</p>
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
            </motion.div>

            {/* Professional Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[var(--bg-surface)]/50 backdrop-blur-xl border border-[var(--border-glass)] rounded-2xl p-6 hover:border-[var(--primary)]/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-glass)] pb-4">
                <Briefcase className="w-5 h-5 text-[var(--primary)]" />
                <h2 className="text-xl font-bold text-white">Professional Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Current Role</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.professionalInfo.currentRole}
                      onChange={(e) => handleInputChange('professionalInfo', 'currentRole', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none transition-all"
                      placeholder="e.g. Senior Frontend Developer"
                    />
                  ) : (
                    <p className="text-white font-medium">{profile.professionalInfo.currentRole || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Experience</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.professionalInfo.experience}
                      onChange={(e) => handleInputChange('professionalInfo', 'experience', e.target.value)}
                      className="w-full px-4 py-2.5 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none transition-all"
                      placeholder="e.g., 3 years"
                    />
                  ) : (
                    <p className="text-white">{profile.professionalInfo.experience || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Bio</label>
                  {isEditing ? (
                    <textarea
                      value={profile.professionalInfo.bio}
                      onChange={(e) => handleInputChange('professionalInfo', 'bio', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2.5 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none resize-none transition-all"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-white leading-relaxed">{profile.professionalInfo.bio || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[var(--bg-surface)]/50 backdrop-blur-xl border border-[var(--border-glass)] rounded-2xl p-6 hover:border-[var(--primary)]/30 transition-colors"
            >
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
            </motion.div>

            {/* Job Preferences */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[var(--bg-surface)]/50 backdrop-blur-xl border border-[var(--border-glass)] rounded-2xl p-6 hover:border-[var(--primary)]/30 transition-colors"
            >
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
                            className="rounded border-[var(--border-glass)] bg-[var(--bg-deep)] text-[var(--primary)] focus:ring-[var(--primary)]"
                          />
                          <span className="text-white text-sm capitalize">{type.replace('-', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.preferences.jobTypes.length > 0 ? (
                        profile.preferences.jobTypes.map(type => (
                          <span key={type} className="px-3 py-1 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] rounded-full text-xs font-bold capitalize">
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
                        className="rounded border-[var(--border-glass)] bg-[var(--bg-deep)] text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                      <span className="text-white">Open to remote work</span>
                    </label>
                  ) : (
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${profile.preferences.remoteWork
                        ? 'bg-[var(--success)]/10 border-[var(--success)]/20 text-[var(--success)]'
                        : 'bg-[var(--bg-deep)] border-[var(--border-glass)] text-[var(--text-muted)]'
                      }`}>
                      {profile.preferences.remoteWork ? 'Yes, Open to Remote' : 'No Remote Work'}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Enhanced Profile Sections */}
          <div className="mt-8 space-y-8">
            {/* Work Experience Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[var(--bg-surface)]/50 backdrop-blur-xl border border-[var(--border-glass)] rounded-2xl p-6 hover:border-[var(--primary)]/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-6 border-b border-[var(--border-glass)] pb-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-[var(--primary)]" />
                  <h2 className="text-xl font-bold text-white">Work Experience</h2>
                </div>
                {isEditing && (
                  <button
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
                    className="flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/20 rounded-lg text-sm font-bold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Experience
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {(profile.professionalInfo.workExperience || []).length === 0 && !isEditing && (
                  <p className="text-[var(--text-muted)] text-center py-4">No work experience added yet.</p>
                )}

                {(profile.professionalInfo.workExperience || []).map((exp, index) => (
                  <div key={exp.id} className="p-6 bg-[var(--bg-deep)]/50 rounded-xl border border-[var(--border-glass)] relative group">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="flex justify-end absolute top-4 right-4">
                          <button
                            onClick={() => {
                              const newExp = (profile.professionalInfo.workExperience || []).filter((_, i) => i !== index);
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, workExperience: newExp }
                              }));
                            }}
                            className="p-2 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                            onChange={(e) => {
                              const newExp = [...(profile.professionalInfo.workExperience || [])];
                              newExp[index].startDate = e.target.value;
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
                              onChange={(e) => {
                                const newExp = [...(profile.professionalInfo.workExperience || [])];
                                newExp[index].endDate = e.target.value;
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
                            className="rounded border-[var(--border-glass)] bg-[var(--bg-deep)] text-[var(--primary)] focus:ring-[var(--primary)]"
                          />
                          <span className="text-white text-sm">Currently working here</span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Description</label>
                          <textarea
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
                            className="w-full px-4 py-2.5 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white focus:border-[var(--primary)] focus:outline-none resize-none transition-all"
                            placeholder="Describe your role and achievements..."
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-white">{exp.position}</h3>
                            <p className="text-[var(--primary)] font-medium">{exp.company}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-[var(--text-muted)] block">
                              {exp.startDate ? new Date(exp.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''} - {exp.current ? 'Present' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '')}
                            </span>
                            <span className="text-xs text-[var(--text-dim)] block mt-1">{exp.location}</span>
                          </div>
                        </div>
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed mt-3 whitespace-pre-wrap">{exp.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

function Target(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

export default UserProfilePage;