import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Resume from '@/models/Resume';
import { unlink, mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { normalizeContent, renderResumePdf, resolveResumeContent } from '@/lib/resumeRenderer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    const resume = await Resume.findOne({
      _id: id,
      userId: user._id,
      isActive: true
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Resumes generated before the content-snapshot feature have no `content`.
    // Backfill from the user's profile so the editor auto-fills. The snapshot
    // itself is persisted on the next save/regenerate.
    const resumeContent = resume.content && resume.content.toObject ? resume.content.toObject() : resume.content;
    resume.content = resolveResumeContent(resumeContent, user);

    return NextResponse.json(resume);
  } catch (error) {
    console.error('Resume fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resume' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    await dbConnect();

    // Find user first to get userId
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;

    const existing = await Resume.findOne({
      _id: id,
      userId: user._id,
      isActive: true
    });
    if (!existing) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    const update: Record<string, unknown> = { updatedAt: new Date() };

    // Metadata (title/description) can always be updated.
    if (typeof body.title === 'string') update.title = body.title.trim() || existing.title;
    if (typeof body.description === 'string') update.description = body.description.trim();

    // Content change -> normalize, render a fresh PDF, and swap in the new file.
    if (body.content !== undefined && body.content !== null) {
      const content = normalizeContent(body.content);
      update.content = content;

      const name = (user.name || existing.title.replace(/ — Resume$/, '') || 'Professional').trim();
      const pdfBuffer = renderResumePdf(name, content);

      const safeName = name.replace(/\s+/g, '_');
      const fileName = `${safeName}_Resume.pdf`;
      const filePath = `/resumes/${Date.now()}_${fileName}`;
      const fullPath = path.join(process.cwd(), 'public', filePath);
      await mkdir(path.dirname(fullPath), { recursive: true });
      await writeFile(fullPath, pdfBuffer);

      update.fileName = fileName;
      update.filePath = filePath;
      update.fileSize = pdfBuffer.length;
      update.atsScore = 92;
    }

    const resume = await Resume.findOneAndUpdate(
      { _id: id, userId: user._id },
      update,
      { new: true }
    );

    return NextResponse.json(resume);
  } catch (error) {
    console.error('Resume update error:', error);
    return NextResponse.json(
      { error: 'Failed to update resume' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    const resume = await Resume.findOne({
      _id: id,
      userId: user._id
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Delete file from filesystem
    try {
      const fullPath = path.join(process.cwd(), resume.filePath);
      await unlink(fullPath);
    } catch (fileError) {
      console.warn('Failed to delete file:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Soft delete - mark as inactive
    await Resume.findByIdAndUpdate(id, {
      isActive: false,
      updatedAt: new Date()
    });

    // If this was the default resume, set another one as default
    if (resume.isDefault) {
      const nextResume = await Resume.findOne({
        userId: user._id,
        isActive: true,
        _id: { $ne: id }
      }).sort({ updatedAt: -1 });

      if (nextResume) {
        await Resume.findByIdAndUpdate(nextResume._id, { isDefault: true });
      }
    }

    return NextResponse.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Resume deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete resume' },
      { status: 500 }
    );
  }
}
