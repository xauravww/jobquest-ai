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
    const { personalInfo, professionalInfo, preferences } = body;

    await dbConnect();
    
    const updateData = {
      name: personalInfo.fullName,
      'profile.location': personalInfo.location,
      'profile.portfolioUrl': personalInfo.website,
      'profile.linkedinUrl': personalInfo.linkedin,
      'profile.githubUrl': personalInfo.github,
      'profile.title': professionalInfo.currentRole,
      'profile.experienceYears': professionalInfo.experience ? parseInt(professionalInfo.experience) : 0,
      'profile.skills': professionalInfo.skills,
      'profile.bio': professionalInfo.bio,
      'preferences.jobTypes': preferences.jobTypes,
      'preferences.locations': preferences.locations,
      'preferences.salaryRange.min': preferences.salaryRange.min,
      'preferences.salaryRange.max': preferences.salaryRange.max,
      'preferences.remoteWork': preferences.remoteWork,
      updatedAt: new Date()
    };

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