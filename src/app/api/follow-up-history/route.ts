import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// In-memory storage for demo (replace with database in production)
let followUpHistory: any[] = [];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Sort by date, most recent first
    const sortedHistory = followUpHistory.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return NextResponse.json({
      success: true,
      history: sortedHistory
    });
  } catch (error) {
    console.error('Error fetching follow-up history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch follow-up history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const newHistoryItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      contactId: body.contactId,
      date: body.date || new Date().toISOString(),
      type: body.type,
      subject: body.subject,
      outcome: body.outcome || 'neutral',
      notes: body.notes || '',
      nextSteps: body.nextSteps || '',
      followUpId: body.followUpId || null,
      userId: session?.user?.email || 'anonymous',
      createdAt: new Date().toISOString()
    };
    
    followUpHistory.push(newHistoryItem);
    
    console.log('📋 [FOLLOW-UP HISTORY] New history item added:', {
      id: newHistoryItem.id,
      subject: newHistoryItem.subject,
      outcome: newHistoryItem.outcome
    });
    
    return NextResponse.json({
      success: true,
      historyItem: newHistoryItem,
      message: 'History item created successfully'
    });
  } catch (error) {
    console.error('Error creating history item:', error);
    return NextResponse.json(
      { error: 'Failed to create history item' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const historyId = searchParams.get('id');
    const body = await request.json();
    
    if (!historyId) {
      return NextResponse.json(
        { error: 'History ID required' },
        { status: 400 }
      );
    }
    
    const historyIndex = followUpHistory.findIndex(item => item.id === historyId);
    
    if (historyIndex === -1) {
      return NextResponse.json(
        { error: 'History item not found' },
        { status: 404 }
      );
    }
    
    followUpHistory[historyIndex] = {
      ...followUpHistory[historyIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      historyItem: followUpHistory[historyIndex],
      message: 'History item updated successfully'
    });
  } catch (error) {
    console.error('Error updating history item:', error);
    return NextResponse.json(
      { error: 'Failed to update history item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const historyId = searchParams.get('id');
    
    if (!historyId) {
      return NextResponse.json(
        { error: 'History ID required' },
        { status: 400 }
      );
    }
    
    const initialLength = followUpHistory.length;
    followUpHistory = followUpHistory.filter(item => item.id !== historyId);
    
    if (followUpHistory.length === initialLength) {
      return NextResponse.json(
        { error: 'History item not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'History item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting history item:', error);
    return NextResponse.json(
      { error: 'Failed to delete history item' },
      { status: 500 }
    );
  }
}