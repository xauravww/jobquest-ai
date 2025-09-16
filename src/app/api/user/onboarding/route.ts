import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '../../../../lib/mongodb';
import { authOptions } from '../../../../lib/auth';

interface OnboardingData {
  name: string;
  email: string;
  title: string;
  location: string;
  skills: string[];
  experienceYears: number;
  summary: string;
  jobTypes: string[];
  locations: string[];
  remote: boolean;
  salaryRange: {
    min: number;
    max: number;
  };
  industries: string[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data: OnboardingData = await request.json();

    console.log('Onboarding POST data:', data);

    // Validate required fields
    const requiredFields = ['name', 'email', 'title', 'location', 'skills', 'experienceYears', 'summary', 'jobTypes', 'locations', 'industries'];
    for (const field of requiredFields) {
      if (!data[field as keyof OnboardingData]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const { db } = await connectToDatabase();

    // Update user profile with onboarding data
    const result = await db.collection('users').updateOne(
      { email: session.user.email },
      {
        $set: {
          name: data.name,
          profile: {
            title: data.title,
            skills: data.skills,
            experienceYears: data.experienceYears,
            location: data.location,
            summary: data.summary,
            projects: [],
            achievements: [],
            education: [],
            workExperience: [],
          },
          preferences: {
            jobTypes: data.jobTypes,
            locations: data.locations,
            remote: data.remote,
            salaryRange: data.salaryRange,
            industries: data.industries,
          },
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        }
      },
      { upsert: true }
    );

    if (result.acknowledged) {
      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Onboarding API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();

    const user = await db.collection('users').findOne(
      { email: session.user.email },
      {
        projection: {
          isOnboarded: 1,
          profile: 1,
          preferences: 1,
          name: 1,
          email: 1
        }
      }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        isOnboarded: user.isOnboarded || false
      }
    });

  } catch (error) {
    console.error('Get onboarding status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
