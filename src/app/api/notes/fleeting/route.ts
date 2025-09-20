import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// In-memory storage for demo (replace with database in production)
let fleetingNotes: any[] = [];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      success: true,
      notes: fleetingNotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    });
  } catch (error) {
    console.error('Error fetching fleeting notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const newNote = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      content: body.content,
      source: body.source || 'web',
      timestamp: body.timestamp || new Date().toISOString(),
      userId: session?.user?.email || 'anonymous',
      tags: body.tags || [],
      archived: false
    };
    
    fleetingNotes.push(newNote);
    
    console.log('📝 [FLEETING NOTES] New note added:', {
      id: newNote.id,
      content: newNote.content.substring(0, 50) + '...',
      source: newNote.source
    });
    
    return NextResponse.json({
      success: true,
      note: newNote,
      message: 'Fleeting note saved successfully'
    });
  } catch (error) {
    console.error('Error creating fleeting note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const noteIndex = fleetingNotes.findIndex(note => note.id === body.id);
    if (noteIndex === -1) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }
    
    // Update the note
    const updatedNote = {
      ...fleetingNotes[noteIndex],
      ...(body.content !== undefined && { content: body.content }),
      ...(body.tags !== undefined && { tags: body.tags }),
      ...(body.archived !== undefined && { archived: body.archived }),
      updatedAt: new Date().toISOString()
    };
    
    fleetingNotes[noteIndex] = updatedNote;
    
    console.log('📝 [FLEETING NOTES] Note updated:', {
      id: updatedNote.id,
      content: updatedNote.content.substring(0, 50) + '...',
      archived: updatedNote.archived
    });
    
    return NextResponse.json({
      success: true,
      note: updatedNote,
      message: 'Note updated successfully'
    });
  } catch (error) {
    console.error('Error updating fleeting note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('id');
    
    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID required' },
        { status: 400 }
      );
    }
    
    const initialLength = fleetingNotes.length;
    fleetingNotes = fleetingNotes.filter(note => note.id !== noteId);
    
    if (fleetingNotes.length === initialLength) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting fleeting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}