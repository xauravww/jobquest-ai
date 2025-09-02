import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Resume from '@/models/Resume';
import { copyFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(
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

    // Find original resume
    const originalResume = await Resume.findOne({ 
      _id: params.id, 
      userId: user._id,
      isActive: true 
    });

    if (!originalResume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'resumes', user._id.toString());
    await mkdir(uploadDir, { recursive: true });

    // Generate new filename
    const timestamp = Date.now();
    const fileExtension = path.extname(originalResume.fileName);
    const baseName = path.basename(originalResume.fileName, fileExtension);
    const newFileName = `${timestamp}_copy_${baseName}${fileExtension}`;
    const newFilePath = `/uploads/resumes/${user._id}/${newFileName}`;

    // Copy file
    try {
      const originalFullPath = path.join(process.cwd(), originalResume.filePath);
      const newFullPath = path.join(process.cwd(), newFilePath);
      await copyFile(originalFullPath, newFullPath);
    } catch (fileError) {
      console.error('File copy error:', fileError);
      return NextResponse.json(
        { error: 'Failed to copy resume file' },
        { status: 500 }
      );
    }

    // Create new resume record
    const duplicateData = {
      userId: user._id,
      title: `${originalResume.title} (Copy)`,
      description: originalResume.description,
      type: originalResume.type,
      fileName: newFileName,
      filePath: newFilePath,
      fileSize: originalResume.fileSize,
      mimeType: originalResume.mimeType,
      personalInfo: originalResume.personalInfo,
      summary: originalResume.summary,
      experience: originalResume.experience,
      education: originalResume.education,
      skills: originalResume.skills,
      projects: originalResume.projects,
      certifications: originalResume.certifications,
      atsScore: originalResume.atsScore,
      atsKeywords: originalResume.atsKeywords,
      isDefault: false,
      isActive: true,
      usageCount: 0,
      version: 1,
      parentResumeId: originalResume._id,
      templateId: originalResume.templateId,
      customizations: originalResume.customizations
    };

    const duplicateResume = new Resume(duplicateData);
    await duplicateResume.save();

    return NextResponse.json(duplicateResume, { status: 201 });
  } catch (error) {
    console.error('Resume duplication error:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate resume' },
      { status: 500 }
    );
  }
}