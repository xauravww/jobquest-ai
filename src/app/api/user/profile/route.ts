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

    // Return simplified profile data for dashboard
    const profileData = {
      firstName: user.name?.split(' ')[0] || '',
      lastName: user.name?.split(' ').slice(1).join(' ') || '',
      email: user.email || '',
      targetRole: user.profile?.title || 'Software Developer',
      location: user.profile?.location || 'Remote',
      skills: user.profile?.skills || [],
      experienceYears: user.profile?.experienceYears || 0,
      bio: user.profile?.bio || '',
      preferences: {
        jobTypes: user.preferences?.jobTypes || [],
        locations: user.preferences?.locations || [],
        salaryRange: {
          min: user.preferences?.salaryRange?.min || 0,
          max: user.preferences?.salaryRange?.max || 0
        },
        remoteWork: user.preferences?.remoteWork || false
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
    }

    // Handle preferences updates
    if (preferences) {
      if (preferences.jobTypes !== undefined) updateData['preferences.jobTypes'] = preferences.jobTypes;
      if (preferences.locations !== undefined) updateData['preferences.locations'] = preferences.locations;
      if (preferences.salaryRange?.min !== undefined) updateData['preferences.salaryRange.min'] = preferences.salaryRange.min;
      if (preferences.salaryRange?.max !== undefined) updateData['preferences.salaryRange.max'] = preferences.salaryRange.max;
      if (preferences.remoteWork !== undefined) updateData['preferences.remoteWork'] = preferences.remoteWork;
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