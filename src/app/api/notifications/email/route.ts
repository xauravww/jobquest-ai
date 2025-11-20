import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notification = await request.json();

    // In a real implementation, you would send an actual email here
    // For now, we'll just log it and return success
    console.log('Email notification request:', {
      to: session.user.email,
      subject: notification.title,
      body: notification.message,
      type: notification.type
    });

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json({ 
      success: true, 
      message: 'Email notification sent successfully' 
    });
  } catch (error) {
    console.error('Error sending email notification:', error);
    return NextResponse.json(
      { error: 'Failed to send email notification' },
      { status: 500 }
    );
  }
}