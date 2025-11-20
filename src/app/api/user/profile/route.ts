import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return complete profile data
    const profileData = {
      personalInfo: {
        fullName: user.name || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
        location: user.profile?.location || 'Remote',
        website: user.profile?.portfolioUrl || '',
        linkedin: user.profile?.linkedinUrl || '',
        github: user.profile?.githubUrl || ''
      },
      professionalInfo: {
        currentRole: user.profile?.title || 'Software Developer',
        experience: user.profile?.experienceYears?.toString() || '0',
        skills: user.profile?.skills || [],
        bio: user.profile?.bio || '',
        workExperience: user.profile?.workExperience || [],
        education: user.profile?.education || [],
        projects: user.profile?.projects || [],
        achievements: user.profile?.achievements || [],
        certifications: user.profile?.certifications || []
      },
      preferences: {
        jobTypes: user.preferences?.jobTypes || [],
        locations: user.preferences?.locations || [],
        salaryRange: {
          min: user.preferences?.salaryRange?.min || 0,
          max: user.preferences?.salaryRange?.max || 0,
          currency: user.preferences?.salaryRange?.currency || 'USD'
        },
        remoteWork: user.preferences?.remoteWork || false,
        targetRole: user.profile?.title || 'Software Developer',
        targetCompanies: user.preferences?.targetCompanies || [],
        notifications: {
          email: user.preferences?.notifications?.email ?? true,
          push: user.preferences?.notifications?.push ?? true,
          jobAlerts: user.preferences?.notifications?.jobAlerts ?? true,
          applicationUpdates: user.preferences?.notifications?.applicationUpdates ?? true
        }
      },
      aiConfig: {
        provider: user.aiConfig?.provider || 'lm-studio',
        apiKey: user.aiConfig?.apiKey || '',
        apiUrl: user.aiConfig?.apiUrl || 'http://localhost:1234',
        model: user.aiConfig?.model || 'local-model',
        enabled: user.aiConfig?.enabled ?? true
      }
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { personalInfo, professionalInfo, preferences, aiConfig } = body;

    await dbConnect();

    // Build update data conditionally based on what was provided
    const updateData: any = {
      updatedAt: new Date()
    };

    // Handle personal info updates
    if (personalInfo) {
      if (personalInfo.fullName !== undefined) updateData.name = personalInfo.fullName;
      if (personalInfo.email !== undefined) updateData.email = personalInfo.email;
      if (personalInfo.phone !== undefined) updateData['profile.phone'] = personalInfo.phone;
      if (personalInfo.location !== undefined) updateData['profile.location'] = personalInfo.location;
      if (personalInfo.website !== undefined) updateData['profile.portfolioUrl'] = personalInfo.website;
      if (personalInfo.linkedin !== undefined) updateData['profile.linkedinUrl'] = personalInfo.linkedin;
      if (personalInfo.github !== undefined) updateData['profile.githubUrl'] = personalInfo.github;
    }

    // Handle professional info updates
    if (professionalInfo) {
      if (professionalInfo.currentRole !== undefined) updateData['profile.title'] = professionalInfo.currentRole;
      if (professionalInfo.experience !== undefined) updateData['profile.experienceYears'] = professionalInfo.experience ? parseInt(professionalInfo.experience) : 0;
      if (professionalInfo.skills !== undefined) updateData['profile.skills'] = professionalInfo.skills;
      if (professionalInfo.bio !== undefined) updateData['profile.bio'] = professionalInfo.bio;
      
      // Handle detailed professional data
      if (professionalInfo.workExperience !== undefined) {
        updateData['profile.workExperience'] = professionalInfo.workExperience.map((exp: any) => ({
          company: exp.company,
          position: exp.position,
          startDate: exp.startDate ? new Date(exp.startDate) : undefined,
          endDate: exp.endDate ? new Date(exp.endDate) : undefined,
          current: exp.current,
          description: exp.description,
          location: exp.location
        }));
      }
      
      if (professionalInfo.education !== undefined) {
        updateData['profile.education'] = professionalInfo.education.map((edu: any) => ({
          institution: edu.institution,
          degree: edu.degree,
          field: edu.field,
          startDate: edu.startDate ? new Date(edu.startDate) : undefined,
          endDate: edu.endDate ? new Date(edu.endDate) : undefined,
          current: edu.current,
          gpa: edu.gpa
        }));
      }
      
      if (professionalInfo.projects !== undefined) {
        updateData['profile.projects'] = professionalInfo.projects.map((project: any) => ({
          name: project.name,
          description: project.description,
          technologies: project.technologies,
          url: project.url,
          github: project.github,
          startDate: project.startDate ? new Date(project.startDate) : undefined,
          endDate: project.endDate ? new Date(project.endDate) : undefined
        }));
      }
      
      if (professionalInfo.achievements !== undefined) {
        updateData['profile.achievements'] = professionalInfo.achievements.map((achievement: any) => ({
          title: achievement.title,
          description: achievement.description,
          date: achievement.date ? new Date(achievement.date) : undefined
        }));
      }
      
      if (professionalInfo.certifications !== undefined) {
        updateData['profile.certifications'] = professionalInfo.certifications;
      }
    }

    // Handle preferences updates
    if (preferences) {
      if (preferences.jobTypes !== undefined) updateData['preferences.jobTypes'] = preferences.jobTypes;
      if (preferences.locations !== undefined) updateData['preferences.locations'] = preferences.locations;
      if (preferences.salaryRange?.min !== undefined) updateData['preferences.salaryRange.min'] = preferences.salaryRange.min;
      if (preferences.salaryRange?.max !== undefined) updateData['preferences.salaryRange.max'] = preferences.salaryRange.max;
      if (preferences.remoteWork !== undefined) updateData['preferences.remoteWork'] = preferences.remoteWork;
      if (preferences.targetCompanies !== undefined) updateData['preferences.targetCompanies'] = preferences.targetCompanies;
    }

    // Handle AI config updates
    if (aiConfig) {
      if (aiConfig.provider !== undefined) updateData['aiConfig.provider'] = aiConfig.provider;
      if (aiConfig.apiKey !== undefined) updateData['aiConfig.apiKey'] = aiConfig.apiKey;
      if (aiConfig.apiUrl !== undefined) updateData['aiConfig.apiUrl'] = aiConfig.apiUrl;
      if (aiConfig.model !== undefined) updateData['aiConfig.model'] = aiConfig.model;
      if (aiConfig.enabled !== undefined) updateData['aiConfig.enabled'] = aiConfig.enabled;
    }

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      updateData,
      { new: true, upsert: true }
    );

    return NextResponse.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}