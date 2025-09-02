import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Resume from '@/models/Resume';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Find user first to get userId
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const resume = await Resume.findOne({ 
      _id: params.id, 
      userId: user._id,
      isActive: true 
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Read file
    const fullPath = path.join(process.cwd(), resume.filePath);
    const fileBuffer = await readFile(fullPath);

    // Update usage count
    await Resume.findByIdAndUpdate(params.id, {
      $inc: { usageCount: 1 },
      lastUsed: new Date()
    });

    // Return file with appropriate headers
    const response = new NextResponse(fileBuffer);
    response.headers.set('Content-Type', resume.mimeType);
    response.headers.set('Content-Disposition', `attachment; filename="${resume.fileName}"`);
    response.headers.set('Content-Length', resume.fileSize.toString());

    return response;
  } catch (error) {
    console.error('Resume download error:', error);
    return NextResponse.json(
      { error: 'Failed to download resume' },
      { status: 500 }
    );
  }
}