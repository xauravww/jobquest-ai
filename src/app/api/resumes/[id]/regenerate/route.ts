import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Resume from '@/models/Resume';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { normalizeContent, renderResumePdf, contentFromProfile } from '@/lib/resumeRenderer';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const resume = await Resume.findOne({ _id: id, userId: user._id, isActive: true });
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Rebuild from the resume's saved content; fall back to the profile when
    // the resume predates content snapshots.
    const rawContent = resume.content && resume.content.toObject ? resume.content.toObject() : resume.content;
    const content = rawContent && Object.keys(rawContent).length
      ? normalizeContent(rawContent)
      : contentFromProfile(user);

    const name = (user.name || resume.title.replace(/ — Resume$/, '') || 'Professional').trim();
    const pdfBuffer = renderResumePdf(name, content);

    const safeName = name.replace(/\s+/g, '_');
    const fileName = `${safeName}_Resume.pdf`;
    const filePath = `/resumes/${Date.now()}_${fileName}`;
    const fullPath = path.join(process.cwd(), 'public', filePath);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, pdfBuffer);

    const updated = await Resume.findByIdAndUpdate(id, {
      content,
      fileName,
      filePath,
      fileSize: pdfBuffer.length,
      atsScore: 92,
      updatedAt: new Date(),
    }, { new: true });

    return NextResponse.json({ resume: updated });
  } catch (error) {
    console.error('Resume regenerate error:', error);
    return NextResponse.json({ error: 'Failed to regenerate resume' }, { status: 500 });
  }
}
