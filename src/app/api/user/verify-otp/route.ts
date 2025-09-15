import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Temporary in-memory OTP store (should be replaced with shared persistent store)
const otpStore = new Map();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, otp } = await request.json();
    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const storedOtpData = otpStore.get(email);
    if (!storedOtpData) {
      return NextResponse.json({ error: 'OTP not found or expired' }, { status: 400 });
    }

    if (storedOtpData.expiresAt < Date.now()) {
      otpStore.delete(email);
      return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
    }

    if (storedOtpData.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // OTP is valid, delete it from store
    otpStore.delete(email);

    return NextResponse.json({ message: 'OTP verified' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
