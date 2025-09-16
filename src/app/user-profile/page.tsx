'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AppLayout from '@/components/AppLayout';
import { Card, Button } from 'antd';
import { User, Mail, Phone, MapPin, Globe, Github, Linkedin, Edit3, Save, X, Plus, Briefcase, GraduationCap, Award, Code, Cog } from 'lucide-react';
import { FormInput, FormDateInput } from '@/components/ui/FormInput';
import AIProviderConfig from '@/components/AIProviderConfig';

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
        // Show success message
      }
    } catch (error) {
      console.error('Error saving profile:', error);
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

  const handleAISave = async (aiConfig: {
    provider: string;
    apiKey?: string;
    apiUrl?: string;
    model: string;
    enabled: boolean;
  }) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ aiConfig }),
      });

      if (response.ok) {
        setProfile(prev => ({
          ...prev,
          aiConfig
        }));
      } else {
        throw new Error('Failed to save AI config');
      }
    } catch (error) {
      console.error('Error saving AI config:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <AppLayout showFooter={false}>
        <div className="flex items-center justify-center min-h-screen bg-bg">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-border border-t-primary mx-auto mb-4"></div>
              <div className="animate-ping absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 bg-primary rounded-full opacity-75"></div>
            </div>
            <h3 className="text-lg font-semibold text-text mb-2">Loading Profile</h3>
            <p className="text-text-muted">Please wait while we fetch your information...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showFooter={false}>
      <div className="p-8 bg-bg min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 mt-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">User Profile</h1>
              <p className="text-text-muted text-lg">Manage your personal and professional information</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAIConfig(!showAIConfig)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                  showAIConfig
                    ? 'bg-primary text-white border-primary'
                    : 'bg-bg-card hover:bg-bg-light text-text border-border'
                }`}
              >
                <Cog className="w-4 h-4" />
                AI Config
              </button>
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-bg-card hover:bg-bg-light text-text border border-border rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-primary to-success hover:from-success hover:to-primary text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-primary to-success hover:from-success hover:to-primary text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Edit3 className="w-4 h-4" />
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
            <Card
              className="bg-bg-card border border-border hover:border-primary/50 transition-all duration-300"
              title={
                <div className="flex items-center gap-3 text-white">
                  <User className="w-5 h-5 text-primary" />
                  Personal Information
                </div>
              }
              styles={{
                header: { backgroundColor: 'transparent', borderBottom: '1px solid var(--border)' },
                body: { backgroundColor: 'transparent' }
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Full Name</label>
                  {isEditing ? (
                    <FormInput
                      value={profile.personalInfo.fullName}
                      onChange={(value) => handleInputChange('personalInfo', 'fullName', value)}
                      icon={<User className="w-4 h-4 text-text-muted" />}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-text">{profile.personalInfo?.fullName || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Email</label>
                  {isEditing ? (
                    <FormInput
                      type="email"
                      value={profile.personalInfo.email}
                      onChange={(value) => handleInputChange('personalInfo', 'email', value)}
                      icon={<Mail className="w-4 h-4 text-text-muted" />}
                      placeholder="Enter your email"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-text-muted" />
                      <p className="text-text">{profile.personalInfo.email || session?.user?.email || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Phone</label>
                  {isEditing ? (
                    <FormInput
                      type="tel"
                      value={profile.personalInfo.phone}
                      onChange={(value) => handleInputChange('personalInfo', 'phone', value)}
                      icon={<Phone className="w-4 h-4 text-text-muted" />}
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-text-muted" />
                      <p className="text-text">{profile.personalInfo.phone || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Location</label>
                  {isEditing ? (
                    <FormInput
                      value={profile.personalInfo.location}
                      onChange={(value) => handleInputChange('personalInfo', 'location', value)}
                      icon={<MapPin className="w-4 h-4 text-text-muted" />}
                      placeholder="Enter your location"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-text-muted" />
                      <p className="text-text">{profile.personalInfo.location || 'Not provided'}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Professional Information */}
            <Card
              className="bg-bg-card border border-border hover:border-primary/50 transition-all duration-300"
              title={
                <div className="flex items-center gap-3 text-white">
                  <User className="w-5 h-5 text-primary" />
                  Professional Information
                </div>
              }
              styles={{
                header: { backgroundColor: 'transparent', borderBottom: '1px solid var(--border)' },
                body: { backgroundColor: 'transparent' }
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Current Role</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.professionalInfo.currentRole}
                      onChange={(e) => handleInputChange('professionalInfo', 'currentRole', e.target.value)}
                      className="w-full px-3 py-2 bg-bg-light border border-border rounded-lg text-text focus:border-primary focus:outline-none"
                    />
                  ) : (
                    <p className="text-text">{profile.professionalInfo.currentRole || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Experience</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.professionalInfo.experience}
                      onChange={(e) => handleInputChange('professionalInfo', 'experience', e.target.value)}
                      className="w-full px-3 py-2 bg-bg-light border border-border rounded-lg text-text focus:border-primary focus:outline-none"
                      placeholder="e.g., 3 years"
                    />
                  ) : (
                    <p className="text-text">{profile.professionalInfo.experience || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Bio</label>
                  {isEditing ? (
                    <textarea
                      value={profile.professionalInfo.bio}
                      onChange={(e) => handleInputChange('professionalInfo', 'bio', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 bg-bg-light border border-border rounded-lg text-text focus:border-primary focus:outline-none resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-text">{profile.professionalInfo.bio || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Social Links */}
            <Card
              className="bg-bg-card border border-border hover:border-primary/50 transition-all duration-300"
              title={
                <div className="flex items-center gap-3 text-white">
                  <Globe className="w-5 h-5 text-primary" />
                  Social Links
                </div>
              }
              styles={{
                header: { backgroundColor: 'transparent', borderBottom: '1px solid var(--border)' },
                body: { backgroundColor: 'transparent' }
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Website</label>
                  {isEditing ? (
                    <FormInput
                      type="url"
                      value={profile.personalInfo.website}
                      onChange={(value) => handleInputChange('personalInfo', 'website', value)}
                      icon={<Globe className="w-4 h-4 text-text-muted" />}
                      placeholder="https://yourwebsite.com"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-text-muted" />
                      <p className="text-text">{profile.personalInfo.website || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">LinkedIn</label>
                  {isEditing ? (
                    <FormInput
                      type="url"
                      value={profile.personalInfo.linkedin}
                      onChange={(value) => handleInputChange('personalInfo', 'linkedin', value)}
                      icon={<Linkedin className="w-4 h-4 text-text-muted" />}
                      placeholder="https://linkedin.com/in/username"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4 text-text-muted" />
                      <p className="text-text">{profile.personalInfo.linkedin || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">GitHub</label>
                  {isEditing ? (
                    <FormInput
                      type="url"
                      value={profile.personalInfo.github}
                      onChange={(value) => handleInputChange('personalInfo', 'github', value)}
                      icon={<Github className="w-4 h-4 text-text-muted" />}
                      placeholder="https://github.com/username"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Github className="w-4 h-4 text-text-muted" />
                      <p className="text-text">{profile.personalInfo.github || 'Not provided'}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Job Preferences */}
            <Card
              className="bg-bg-card border border-border hover:border-primary/50 transition-all duration-300"
              title={
                <div className="flex items-center gap-3 text-white">
                  <User className="w-5 h-5 text-primary" />
                  Job Preferences
                </div>
              }
              styles={{
                header: { backgroundColor: 'transparent', borderBottom: '1px solid var(--border)' },
                body: { backgroundColor: 'transparent' }
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Preferred Job Types</label>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {['full-time', 'part-time', 'contract', 'internship'].map(type => (
                        <label key={type} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={profile.preferences.jobTypes.includes(type)}
                            onChange={(e) => {
                              const newTypes = e.target.checked
                                ? [...profile.preferences.jobTypes, type]
                                : profile.preferences.jobTypes.filter(t => t !== type);
                              handleInputChange('preferences', 'jobTypes', newTypes);
                            }}
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                          <span className="text-text text-sm capitalize">{type.replace('-', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.preferences.jobTypes.length > 0 ? (
                        profile.preferences.jobTypes.map(type => (
                          <span key={type} className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs capitalize">
                            {type.replace('-', ' ')}
                          </span>
                        ))
                      ) : (
                        <p className="text-text-muted">Not specified</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Remote Work</label>
                  {isEditing ? (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={profile.preferences.remoteWork}
                        onChange={(e) => handleInputChange('preferences', 'remoteWork', e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-text">Open to remote work</span>
                    </label>
                  ) : (
                    <p className="text-text">{profile.preferences.remoteWork ? 'Yes' : 'No'}</p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Enhanced Profile Sections */}
          <div className="mt-8 space-y-8">
            {/* Work Experience Section */}
            <Card
              className="bg-bg-card border border-border hover:border-primary/50 transition-all duration-300"
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-white">
                    <Briefcase className="w-5 h-5 text-primary" />
                    Work Experience
                  </div>
                  {isEditing && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<Plus className="w-4 h-4" />}
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
                    >
                      Add Experience
                    </Button>
                  )}
                </div>
              }
              styles={{
                header: { backgroundColor: 'transparent', borderBottom: '1px solid var(--border)' },
                body: { backgroundColor: 'transparent' }
              }}
            >
              <div className="space-y-4">
                {(profile.professionalInfo.workExperience || []).map((exp, index) => (
                  <div key={exp.id} className="p-4 bg-bg-light rounded-lg border border-border">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormInput
                            label="Company"
                            value={exp.company}
                            onChange={(value) => {
                              const newExp = [...(profile.professionalInfo.workExperience || [])];
                              newExp[index].company = value;
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
                            onChange={(value) => {
                              const newExp = [...(profile.professionalInfo.workExperience || [])];
                              newExp[index].position = value;
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
                            onChange={(value) => {
                              const newExp = [...(profile.professionalInfo.workExperience || [])];
                              newExp[index].location = value;
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
                            onChange={(value) => {
                              const newExp = [...(profile.professionalInfo.workExperience || [])];
                              newExp[index].startDate = value;
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
                              onChange={(value) => {
                                const newExp = [...(profile.professionalInfo.workExperience || [])];
                                newExp[index].endDate = value;
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
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                          <span className="text-text text-sm">Currently working here</span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-muted mb-2">Description</label>
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
                            className="w-full px-3 py-2 bg-bg-card border border-border rounded-lg text-text focus:border-primary focus:outline-none resize-none"
                            placeholder="Describe your role and achievements..."
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            danger
                            size="small"
                            icon={<X className="w-4 h-4" />}
                            onClick={() => {
                              const newExp = (profile.professionalInfo.workExperience || []).filter((_, i) => i !== index);
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, workExperience: newExp }
                              }));
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-text">{exp.position}</h3>
                          <span className="text-sm text-text-muted">
                            {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                          </span>
                        </div>
                        <p className="text-primary font-medium mb-1">{exp.company}</p>
                        <p className="text-text-muted text-sm mb-2">{exp.location}</p>
                        <p className="text-text text-sm">{exp.description}</p>
                      </div>
                    )}
                  </div>
                ))}
                {(!profile.professionalInfo.workExperience || profile.professionalInfo.workExperience.length === 0) && (
                  <div className="text-center py-8 text-text-muted">
                    <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No work experience added yet.</p>
                    {isEditing && <p className="text-sm">Click &quot;Add Experience&quot; to get started.</p>}
                  </div>
                )}
              </div>
            </Card>

            {/* Education Section */}
            <Card
              className="bg-bg-card border border-border hover:border-primary/50 transition-all duration-300"
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-white">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    Education
                  </div>
                  {isEditing && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={() => {
                        const newEducation: Education = {
                          id: Date.now().toString(),
                          institution: '',
                          degree: '',
                          field: '',
                          startDate: '',
                          endDate: '',
                          current: false,
                          gpa: ''
                        };
                        setProfile(prev => ({
                          ...prev,
                          professionalInfo: {
                            ...prev.professionalInfo,
                            education: [...(prev.professionalInfo.education || []), newEducation]
                          }
                        }));
                      }}
                    >
                      Add Education
                    </Button>
                  )}
                </div>
              }
              styles={{
                header: { backgroundColor: 'transparent', borderBottom: '1px solid var(--border)' },
                body: { backgroundColor: 'transparent' }
              }}
            >
              <div className="space-y-4">
                {(profile.professionalInfo.education || []).map((edu, index) => (
                  <div key={edu.id} className="p-4 bg-bg-light rounded-lg border border-border">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormInput
                            label="Institution"
                            value={edu.institution}
                            onChange={(value) => {
                              const newEdu = [...profile.professionalInfo.education];
                              newEdu[index].institution = value;
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, education: newEdu }
                              }));
                            }}
                            icon={<GraduationCap className="w-4 h-4" />}
                            placeholder="University/School name"
                          />
                          <FormInput
                            label="Degree"
                            value={edu.degree}
                            onChange={(value) => {
                              const newEdu = [...profile.professionalInfo.education];
                              newEdu[index].degree = value;
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, education: newEdu }
                              }));
                            }}
                            icon={<Award className="w-4 h-4" />}
                            placeholder="Bachelor's, Master's, etc."
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormInput
                            label="Field of Study"
                            value={edu.field}
                            onChange={(value) => {
                              const newEdu = [...profile.professionalInfo.education];
                              newEdu[index].field = value;
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, education: newEdu }
                              }));
                            }}
                            icon={<Code className="w-4 h-4" />}
                            placeholder="Computer Science, etc."
                          />
                          <FormDateInput
                            label="Start Date"
                            value={edu.startDate}
                            onChange={(value) => {
                              const newEdu = [...profile.professionalInfo.education];
                              newEdu[index].startDate = value;
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, education: newEdu }
                              }));
                            }}
                          />
                          {!edu.current && (
                            <FormDateInput
                              label="End Date"
                              value={edu.endDate}
                              onChange={(value) => {
                                const newEdu = [...profile.professionalInfo.education];
                                newEdu[index].endDate = value;
                                setProfile(prev => ({
                                  ...prev,
                                  professionalInfo: { ...prev.professionalInfo, education: newEdu }
                                }));
                              }}
                            />
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormInput
                            label="GPA (Optional)"
                            value={edu.gpa || ''}
                            onChange={(value) => {
                              const newEdu = [...profile.professionalInfo.education];
                              newEdu[index].gpa = value;
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, education: newEdu }
                              }));
                            }}
                            placeholder="3.8/4.0"
                          />
                          <div className="flex items-center gap-2 pt-6">
                            <input
                              type="checkbox"
                              checked={edu.current}
                              onChange={(e) => {
                                const newEdu = [...profile.professionalInfo.education];
                                newEdu[index].current = e.target.checked;
                                if (e.target.checked) {
                                  newEdu[index].endDate = '';
                                }
                                setProfile(prev => ({
                                  ...prev,
                                  professionalInfo: { ...prev.professionalInfo, education: newEdu }
                                }));
                              }}
                              className="rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="text-text text-sm">Currently studying</span>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            danger
                            size="small"
                            icon={<X className="w-4 h-4" />}
                            onClick={() => {
                              const newEdu = (profile.professionalInfo.education || []).filter((_, i) => i !== index);
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, education: newEdu }
                              }));
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-text">{edu.degree} in {edu.field}</h3>
                          <span className="text-sm text-text-muted">
                            {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                          </span>
                        </div>
                        <p className="text-primary font-medium mb-1">{edu.institution}</p>
                        {edu.gpa && <p className="text-text-muted text-sm">GPA: {edu.gpa}</p>}
                      </div>
                    )}
                  </div>
                ))}
                {(!profile.professionalInfo.education || profile.professionalInfo.education.length === 0) && (
                  <div className="text-center py-8 text-text-muted">
                    <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No education added yet.</p>
                    {isEditing && <p className="text-sm">Click &apos;Add Education&apos; to get started.</p>}
                  </div>
                )}
              </div>
            </Card>

            {/* Projects Section */}
            <Card
              className="bg-bg-card border border-border hover:border-primary/50 transition-all duration-300"
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-white">
                    <Code className="w-5 h-5 text-primary" />
                    Projects
                  </div>
                  {isEditing && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={() => {
                        const newProject: Project = {
                          id: Date.now().toString(),
                          name: '',
                          description: '',
                          technologies: [],
                          url: '',
                          github: '',
                          startDate: '',
                          endDate: ''
                        };
                        setProfile(prev => ({
                          ...prev,
                          professionalInfo: {
                            ...prev.professionalInfo,
                            projects: [...(prev.professionalInfo.projects || []), newProject]
                          }
                        }));
                      }}
                    >
                      Add Project
                    </Button>
                  )}
                </div>
              }
              styles={{
                header: { backgroundColor: 'transparent', borderBottom: '1px solid var(--border)' },
                body: { backgroundColor: 'transparent' }
              }}
            >
              <div className="space-y-4">
                {(profile.professionalInfo.projects || []).map((project, index) => (
                  <div key={project.id} className="p-4 bg-bg-light rounded-lg border border-border">
                    {isEditing ? (
                      <div className="space-y-4">
                          <FormInput
                            label="Project Name"
                            value={project.name}
                            onChange={(value) => {
                              const newProjects = [...profile.professionalInfo.projects];
                              newProjects[index].name = value;
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, projects: newProjects }
                              }));
                            }}
                            icon={<Code className="w-4 h-4" />}
                            placeholder="Project name"
                          />
                        <div>
                          <label className="block text-sm font-medium text-text-muted mb-2">Description</label>
                          <textarea
                            value={project.description}
                            onChange={(e) => {
                              const newProjects = [...profile.professionalInfo.projects];
                              newProjects[index].description = e.target.value;
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, projects: newProjects }
                              }));
                            }}
                            rows={3}
                            className="w-full px-3 py-2 bg-bg-card border border-border rounded-lg text-text focus:border-primary focus:outline-none resize-none"
                            placeholder="Describe your project..."
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormInput
                            label="Project URL (Optional)"
                            value={project.url || ''}
                            onChange={(value) => {
                              const newProjects = [...profile.professionalInfo.projects];
                              newProjects[index].url = value;
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, projects: newProjects }
                              }));
                            }}
                            icon={<Globe className="w-4 h-4" />}
                            placeholder="https://project-demo.com"
                          />
                          <FormInput
                            label="GitHub URL (Optional)"
                            value={project.github || ''}
                            onChange={(value) => {
                              const newProjects = [...profile.professionalInfo.projects];
                              newProjects[index].github = value;
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, projects: newProjects }
                              }));
                            }}
                            icon={<Github className="w-4 h-4" />}
                            placeholder="https://github.com/user/repo"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormDateInput
                            label="Start Date (Optional)"
                            value={project.startDate || ''}
                            onChange={(value) => {
                              const newProjects = [...profile.professionalInfo.projects];
                              newProjects[index].startDate = value;
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, projects: newProjects }
                              }));
                            }}
                          />
                          <FormDateInput
                            label="End Date (Optional)"
                            value={project.endDate || ''}
                            onChange={(value) => {
                              const newProjects = [...profile.professionalInfo.projects];
                              newProjects[index].endDate = value;
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, projects: newProjects }
                              }));
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-muted mb-2">Technologies (comma-separated)</label>
                          <input
                            type="text"
                            value={project.technologies.join(', ')}
                            onChange={(e) => {
                              const newProjects = [...profile.professionalInfo.projects];
                              newProjects[index].technologies = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, projects: newProjects }
                              }));
                            }}
                            className="w-full px-3 py-2 bg-bg-card border border-border rounded-lg text-text focus:border-primary focus:outline-none"
                            placeholder="React, Node.js, MongoDB, etc."
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            danger
                            size="small"
                            icon={<X className="w-4 h-4" />}
                            onClick={() => {
                              const newProjects = (profile.professionalInfo.projects || []).filter((_, i) => i !== index);
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, projects: newProjects }
                              }));
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-text">{project.name}</h3>
                          <div className="flex gap-2">
                            {project.url && (
                              <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                                <Globe className="w-4 h-4" />
                              </a>
                            )}
                            {project.github && (
                              <a href={project.github} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                                <Github className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                        <p className="text-text text-sm mb-3">{project.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech, techIndex) => (
                            <span key={techIndex} className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">
                              {tech}
                            </span>
                          ))}
                        </div>
                        {(project.startDate || project.endDate) && (
                          <p className="text-text-muted text-xs mt-2">
                            {project.startDate} {project.endDate && `- ${project.endDate}`}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {(!profile.professionalInfo.projects || profile.professionalInfo.projects.length === 0) && (
                  <div className="text-center py-8 text-text-muted">
                    <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No projects added yet.</p>
                    {isEditing && <p className="text-sm">Click &apos;Add Project&apos; to get started.</p>}
                  </div>
                )}
              </div>
            </Card>

            {/* Achievements Section */}
            <Card
              className="bg-bg-card border border-border hover:border-primary/50 transition-all duration-300"
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-white">
                    <Award className="w-5 h-5 text-primary" />
                    Achievements
                  </div>
                  {isEditing && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={() => {
                        const newAchievement: Achievement = {
                          id: Date.now().toString(),
                          title: '',
                          description: '',
                          date: '',
                          organization: ''
                        };
                        setProfile(prev => ({
                          ...prev,
                          professionalInfo: {
                            ...prev.professionalInfo,
                            achievements: [...(prev.professionalInfo.achievements || []), newAchievement]
                          }
                        }));
                      }}
                    >
                      Add Achievement
                    </Button>
                  )}
                </div>
              }
              styles={{
                header: { backgroundColor: 'transparent', borderBottom: '1px solid var(--border)' },
                body: { backgroundColor: 'transparent' }
              }}
            >
              <div className="space-y-4">
                {(profile.professionalInfo.achievements || []).map((achievement, index) => (
                  <div key={achievement.id} className="p-4 bg-bg-light rounded-lg border border-border">
                    {isEditing ? (
                      <div className="space-y-4">
                        <FormInput
                          label="Achievement Title"
                          value={achievement.title}
                          onChange={(value) => {
                            const newAchievements = [...profile.professionalInfo.achievements];
                            newAchievements[index].title = value;
                            setProfile(prev => ({
                              ...prev,
                              professionalInfo: { ...prev.professionalInfo, achievements: newAchievements }
                            }));
                          }}
                          icon={<Award className="w-4 h-4" />}
                          placeholder="Achievement title"
                        />
                        <div>
                          <label className="block text-sm font-medium text-text-muted mb-2">Description</label>
                  <textarea
                    value={achievement.description}
                    onChange={(e) => {
                      const newAchievements = [...profile.professionalInfo.achievements];
                      newAchievements[index].description = e.target.value;
                      setProfile(prev => ({
                        ...prev,
                        professionalInfo: { ...prev.professionalInfo, achievements: newAchievements }
                      }));
                    }}
                    rows={3}
                    className="w-full px-3 py-2 bg-bg-card border border-border rounded-lg text-text focus:border-primary focus:outline-none resize-none"
                    placeholder="Describe your achievement..."
                  />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormInput
                            label="Organization (Optional)"
                            value={achievement.organization || ''}
                            onChange={(value) => {
                              const newAchievements = [...profile.professionalInfo.achievements];
                              newAchievements[index].organization = value;
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, achievements: newAchievements }
                              }));
                            }}
                            icon={<Briefcase className="w-4 h-4" />}
                            placeholder="Organization name"
                          />
                          <FormDateInput
                            label="Date (Optional)"
                            value={achievement.date || ''}
                            onChange={(value) => {
                              const newAchievements = [...profile.professionalInfo.achievements];
                              newAchievements[index].date = value;
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, achievements: newAchievements }
                              }));
                            }}
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            danger
                            size="small"
                            icon={<X className="w-4 h-4" />}
                            onClick={() => {
                              const newAchievements = (profile.professionalInfo.achievements || []).filter((_, i) => i !== index);
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, achievements: newAchievements }
                              }));
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-text">{achievement.title}</h3>
                          {achievement.date && (
                            <span className="text-sm text-text-muted">{achievement.date}</span>
                          )}
                        </div>
                        {achievement.organization && (
                          <p className="text-primary font-medium mb-1">{achievement.organization}</p>
                        )}
                        <p className="text-text text-sm">{achievement.description}</p>
                      </div>
                    )}
                  </div>
                ))}
                {(!profile.professionalInfo.achievements || profile.professionalInfo.achievements.length === 0) && (
                  <div className="text-center py-8 text-text-muted">
                    <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No achievements added yet.</p>
                    {isEditing && <p className="text-sm">Click &quot;Add Achievement&quot; to get started.</p>}
                  </div>
                )}
              </div>
            </Card>

            {/* Certifications Section */}
            <Card
              className="bg-bg-card border border-border hover:border-primary/50 transition-all duration-300"
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-white">
                    <Award className="w-5 h-5 text-primary" />
                    Certifications
                  </div>
                  {isEditing && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<Plus className="w-4 h-4" />}
                      onClick={() => {
                        const newCertification: Certification = {
                          id: Date.now().toString(),
                          name: '',
                          issuer: '',
                          date: '',
                          url: ''
                        };
                        setProfile(prev => ({
                          ...prev,
                          professionalInfo: {
                            ...prev.professionalInfo,
                            certifications: [...(prev.professionalInfo.certifications || []), newCertification]
                          }
                        }));
                      }}
                    >
                      Add Certification
                    </Button>
                  )}
                </div>
              }
              styles={{
                header: { backgroundColor: 'transparent', borderBottom: '1px solid var(--border)' },
                body: { backgroundColor: 'transparent' }
              }}
            >
              <div className="space-y-4">
                {(profile.professionalInfo.certifications || []).map((cert, index) => (
                  <div key={cert.id} className="p-4 bg-bg-light rounded-lg border border-border">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormInput
                            label="Certification Name"
                            value={cert.name}
                            onChange={(value) => {
                              const newCerts = [...profile.professionalInfo.certifications];
                              newCerts[index].name = value;
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, certifications: newCerts }
                              }));
                            }}
                            icon={<Award className="w-4 h-4" />}
                            placeholder="Certification name"
                          />
                          <FormInput
                            label="Issuer"
                            value={cert.issuer}
                            onChange={(value) => {
                              const newCerts = [...profile.professionalInfo.certifications];
                              newCerts[index].issuer = value;
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, certifications: newCerts }
                              }));
                            }}
                            icon={<Briefcase className="w-4 h-4" />}
                            placeholder="Issuing organization"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormDateInput
                            label="Date Obtained"
                            value={cert.date}
                            onChange={(value) => {
                              const newCerts = [...profile.professionalInfo.certifications];
                              newCerts[index].date = value;
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, certifications: newCerts }
                              }));
                            }}
                          />
                          <FormInput
                            label="Certificate URL (Optional)"
                            value={cert.url || ''}
                            onChange={(value) => {
                              const newCerts = [...profile.professionalInfo.certifications];
                              newCerts[index].url = value;
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, certifications: newCerts }
                              }));
                            }}
                            icon={<Globe className="w-4 h-4" />}
                            placeholder="https://certificate-url.com"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            danger
                            size="small"
                            icon={<X className="w-4 h-4" />}
                            onClick={() => {
                              const newCerts = (profile.professionalInfo.certifications || []).filter((_, i) => i !== index);
                              setProfile(prev => ({
                                ...prev,
                                professionalInfo: { ...prev.professionalInfo, certifications: newCerts }
                              }));
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-text">{cert.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-text-muted">{cert.date}</span>
                            {cert.url && (
                              <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                                <Globe className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                        <p className="text-primary font-medium">{cert.issuer}</p>
                      </div>
                    )}
                  </div>
                ))}
                {(profile.professionalInfo.certifications || []).length === 0 && (
                  <div className="text-center py-8 text-text-muted">
                    <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No certifications added yet.</p>
                    {isEditing && <p className="text-sm">Click &quot;Add Certification&quot; to get started.</p>}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default UserProfilePage;