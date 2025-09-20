import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// In-memory storage for demo (replace with database in production)
let contacts: any[] = [];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      success: true,
      contacts: contacts.sort((a, b) => new Date(b.lastContactDate || 0).getTime() - new Date(a.lastContactDate || 0).getTime())
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const newContact = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      name: body.name,
      email: body.email,
      phone: body.phone || '',
      role: body.role,
      company: body.company,
      linkedIn: body.linkedIn || '',
      notes: body.notes || '',
      tags: body.tags || [],
      status: 'active',
      lastContactDate: new Date().toISOString(),
      nextFollowUpDate: body.nextFollowUpDate || null,
      userId: session?.user?.email || 'anonymous',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    contacts.push(newContact);
    
    console.log('👤 [CONTACTS] New contact added:', {
      id: newContact.id,
      name: newContact.name,
      company: newContact.company
    });
    
    return NextResponse.json({
      success: true,
      contact: newContact,
      message: 'Contact created successfully'
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('id');
    const body = await request.json();
    
    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID required' },
        { status: 400 }
      );
    }
    
    const contactIndex = contacts.findIndex(contact => contact.id === contactId);
    
    if (contactIndex === -1) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }
    
    contacts[contactIndex] = {
      ...contacts[contactIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      contact: contacts[contactIndex],
      message: 'Contact updated successfully'
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('id');
    
    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID required' },
        { status: 400 }
      );
    }
    
    const initialLength = contacts.length;
    contacts = contacts.filter(contact => contact.id !== contactId);
    
    if (contacts.length === initialLength) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}