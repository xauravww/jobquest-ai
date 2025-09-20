import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// In-memory storage for demo (replace with database in production)
let followUps: any[] = [];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Sort by scheduled date, with overdue items first
    const sortedFollowUps = followUps.sort((a, b) => {
      const now = new Date();
      const aDate = new Date(a.scheduledDate);
      const bDate = new Date(b.scheduledDate);
      
      // Check if items are overdue
      const aOverdue = aDate < now && a.status === 'scheduled';
      const bOverdue = bDate < now && b.status === 'scheduled';
      
      // Overdue items come first
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      // Then sort by date
      return aDate.getTime() - bDate.getTime();
    });
    
    return NextResponse.json({
      success: true,
      followUps: sortedFollowUps
    });
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch follow-ups' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const newFollowUp = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      contactId: body.contactId,
      type: body.type || 'email',
      subject: body.subject,
      message: body.message,
      scheduledDate: body.scheduledDate,
      status: 'scheduled',
      priority: body.priority || 'medium',
      tags: body.tags || [],
      jobId: body.jobId || null,
      applicationId: body.applicationId || null,
      attachments: body.attachments || [],
      userId: session?.user?.email || 'anonymous',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    followUps.push(newFollowUp);
    
    console.log('📞 [FOLLOW-UPS] New follow-up scheduled:', {
      id: newFollowUp.id,
      subject: newFollowUp.subject,
      type: newFollowUp.type,
      scheduledDate: newFollowUp.scheduledDate
    });
    
    return NextResponse.json({
      success: true,
      followUp: newFollowUp,
      message: 'Follow-up scheduled successfully'
    });
  } catch (error) {
    console.error('Error creating follow-up:', error);
    return NextResponse.json(
      { error: 'Failed to create follow-up' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const followUpId = searchParams.get('id');
    const body = await request.json();
    
    if (!followUpId) {
      return NextResponse.json(
        { error: 'Follow-up ID required' },
        { status: 400 }
      );
    }
    
    const followUpIndex = followUps.findIndex(followUp => followUp.id === followUpId);
    
    if (followUpIndex === -1) {
      return NextResponse.json(
        { error: 'Follow-up not found' },
        { status: 404 }
      );
    }
    
    // If marking as completed, add completion date
    if (body.status === 'completed' && !followUps[followUpIndex].completedDate) {
      body.completedDate = new Date().toISOString();
    }
    
    followUps[followUpIndex] = {
      ...followUps[followUpIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    console.log('📞 [FOLLOW-UPS] Follow-up updated:', {
      id: followUps[followUpIndex].id,
      status: followUps[followUpIndex].status,
      subject: followUps[followUpIndex].subject
    });
    
    return NextResponse.json({
      success: true,
      followUp: followUps[followUpIndex],
      message: 'Follow-up updated successfully'
    });
  } catch (error) {
    console.error('Error updating follow-up:', error);
    return NextResponse.json(
      { error: 'Failed to update follow-up' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const followUpId = searchParams.get('id');
    
    if (!followUpId) {
      return NextResponse.json(
        { error: 'Follow-up ID required' },
        { status: 400 }
      );
    }
    
    const initialLength = followUps.length;
    followUps = followUps.filter(followUp => followUp.id !== followUpId);
    
    if (followUps.length === initialLength) {
      return NextResponse.json(
        { error: 'Follow-up not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Follow-up deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting follow-up:', error);
    return NextResponse.json(
      { error: 'Failed to delete follow-up' },
      { status: 500 }
    );
  }
}