import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import FleetingNote from '@/models/FleetingNote';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const notes = await FleetingNote.find({ userEmail: session.user.email })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalCount = await FleetingNote.countDocuments({ userEmail: session.user.email });

    // Transform notes to match expected interface
    const transformedNotes = notes.map(note => ({
      id: note._id.toString(),
      content: note.content,
      source: note.source,
      timestamp: note.timestamp || note.createdAt,
      userId: session.user.email,
      tags: note.tags || [],
      archived: note.isArchived || false
    }));

    return NextResponse.json({
      success: true,
      notes: transformedNotes,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit)
    });

  } catch (error) {
    console.error('Get fleeting notes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fleeting notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, source = 'web', timestamp } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    await connectDB();

    const note = new FleetingNote({
      content: content.trim(),
      userEmail: session.user.email,
      source,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    });

    await note.save();

    // Transform note to match expected interface
    const transformedNote = {
      id: note._id.toString(),
      content: note.content,
      source: note.source,
      timestamp: note.timestamp || note.createdAt,
      userId: session.user.email,
      tags: note.tags || [],
      archived: note.isArchived || false
    };

    return NextResponse.json({
      success: true,
      message: 'Fleeting note saved successfully',
      note: transformedNote
    });

  } catch (error) {
    console.error('Create fleeting note error:', error);
    return NextResponse.json(
      { error: 'Failed to save fleeting note' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, content, tags, archived } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    await connectDB();

    const updateData: any = {};
    if (content !== undefined) updateData.content = content.trim();
    if (tags !== undefined) updateData.tags = tags;
    if (archived !== undefined) updateData.isArchived = archived;

    const note = await FleetingNote.findOneAndUpdate(
      { _id: id, userEmail: session.user.email },
      updateData,
      { new: true }
    );

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Transform note to match expected interface
    const transformedNote = {
      id: note._id.toString(),
      content: note.content,
      source: note.source,
      timestamp: note.timestamp || note.createdAt,
      userId: session.user.email,
      tags: note.tags || [],
      archived: note.isArchived || false
    };

    return NextResponse.json({
      success: true,
      message: 'Fleeting note updated successfully',
      note: transformedNote
    });

  } catch (error) {
    console.error('Update fleeting note error:', error);
    return NextResponse.json(
      { error: 'Failed to update fleeting note' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    await connectDB();

    const note = await FleetingNote.findOneAndDelete({
      _id: id,
      userEmail: session.user.email
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Fleeting note deleted successfully'
    });

  } catch (error) {
    console.error('Delete fleeting note error:', error);
    return NextResponse.json(
      { error: 'Failed to delete fleeting note' },
      { status: 500 }
    );
  }
}