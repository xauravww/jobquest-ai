import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    // Removed session check to allow unauthenticated OTP verification during onboarding

    const { email, otp } = await request.json();
    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.otp || !user.otpExpires) {
      return NextResponse.json({ error: 'OTP not found or expired' }, { status: 400 });
    }

    if (user.otpExpires < new Date()) {
      // Clear expired OTP
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
      return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
    }

    if (user.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // OTP is valid, clear it from user
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Update onboarding status to true after successful OTP verification
    await User.findByIdAndUpdate(user._id, { isOnboarded: true });

    return NextResponse.json({ message: 'OTP verified' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
