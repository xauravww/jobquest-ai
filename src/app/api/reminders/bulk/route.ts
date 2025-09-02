import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Reminder } from '@/models/Reminder';

// POST - Bulk operations on reminders
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { action, reminderIds, updateData } = body;
    
    if (!action || !reminderIds || !Array.isArray(reminderIds)) {
      return NextResponse.json(
        { error: 'Action and reminder IDs are required' },
        { status: 400 }
      );
    }
    
    let result;
    
    switch (action) {
      case 'complete':
        result = await Reminder.updateMany(
          { _id: { $in: reminderIds } },
          { 
            status: 'completed',
            completedAt: new Date()
          }
        );
        break;
        
      case 'snooze':
        if (!updateData?.snoozedUntil) {
          return NextResponse.json(
            { error: 'Snooze date is required' },
            { status: 400 }
          );
        }
        result = await Reminder.updateMany(
          { _id: { $in: reminderIds } },
          { 
            status: 'snoozed',
            snoozedUntil: new Date(updateData.snoozedUntil),
            $inc: { snoozeCount: 1 }
          }
        );
        break;
        
      case 'cancel':
        result = await Reminder.updateMany(
          { _id: { $in: reminderIds } },
          { status: 'cancelled' }
        );
        break;
        
      case 'delete':
        result = await Reminder.deleteMany(
          { _id: { $in: reminderIds } }
        );
        break;
        
      case 'update':
        if (!updateData) {
          return NextResponse.json(
            { error: 'Update data is required' },
            { status: 400 }
          );
        }
        result = await Reminder.updateMany(
          { _id: { $in: reminderIds } },
          updateData
        );
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount || result.deletedCount,
      message: `Successfully ${action}ed ${result.modifiedCount || result.deletedCount} reminders`
    });
    
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}