import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Resume from '@/models/Resume';
import path from 'path';
import { contentFromProfile, renderResumePdf } from '@/lib/resumeRenderer';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ email: session.user.email });

    if (!user || !user.isOnboarded) {
      return NextResponse.json({ error: 'Complete your profile first' }, { status: 400 });
    }

    const name = user.name || 'Professional';
    const content = contentFromProfile(user);

    const pdfBuffer = renderResumePdf(name, content);

    const safeName = name.replace(/\s+/g, '_');
    const fileName = `${safeName}_Resume.pdf`;
    const filePath = `/resumes/${Date.now()}_${fileName}`;
    const fullPath = path.join(process.cwd(), 'public', filePath);
    const fs = await import('fs/promises');
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, pdfBuffer);

    const hasDefault = await Resume.findOne({ userId: user._id, isDefault: true, isActive: true });

    const resume = await Resume.create({
      userId: user._id,
      title: `${name} — Resume`,
      description: 'Auto-generated from profile',
      database: 'default',
      type: 'ats_optimized',
      fileName,
      filePath,
      fileSize: pdfBuffer.length,
      mimeType: 'application/pdf',
      atsScore: 92,
      isDefault: !hasDefault,
      isActive: true,
      usageCount: 0,
      content,
    });

    return NextResponse.json({ resume });
  } catch (err) {
    console.error('Resume generation error:', err);
    return NextResponse.json({ error: 'Failed to generate resume' }, { status: 500 });
  }
}
