import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { fetchAndConvertToMarkdown } from '@/lib/urlReader';
import { resolveAIConfig } from '@/lib/aiConfig';
import { buildCoverLetterSystemPrompt, type CoverLetterType } from '@/lib/coverLetterPrompt';
import { buildUserPrompt } from '@/lib/coverLetterBuilder';
import { getExactNaukriJd } from '@/lib/naukriService';

interface AIConfig {
  provider: string;
  apiUrl: string;
  model: string;
  apiKey: string;
}

interface CoverLetterRequestBody {
  jobId?: string;
  jobTitle: string;
  company: string;
  jobDescription?: string;
  location?: string;
  aiConfig?: AIConfig;
  jobUrl?: string;
  profileDetails?: string;
  coverLetterType?: CoverLetterType[];
  guidedAnswers?: { question: string; answer: string }[];
}

// Import AI service dynamically
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
let AiFilterService: any;
const initService = async () => {
  if (!AiFilterService) {
    AiFilterService = (await import('@/lib/aiFilterService')).default;
  }
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Find user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body: CoverLetterRequestBody = await request.json();
    const { jobId, jobTitle, company, jobDescription, location, aiConfig, jobUrl, profileDetails, coverLetterType = ['detailed'], guidedAnswers } = body;

    if (!jobTitle || !company) {
      return NextResponse.json({ error: 'Job title and company are required' }, { status: 400 });
    }

    // Initialize AI service with config
    await initService();
    const aiFilterService = new AiFilterService();

    // Set AI configuration - use provided config or the user's active config
    if (aiConfig) {
      aiFilterService.saveConfig(aiConfig);
    } else {
      const resolved = await resolveAIConfig(String(session.user.id), user.aiConfig);
      aiFilterService.saveConfig(resolved);
    }

    // Get comprehensive user profile data for personalization
    const userProfile = {
      name: user.name || '',
      email: user.email,
      phone: user.profile?.phone || '',
      location: user.profile?.location || '',
      bio: user.profile?.bio || user.profile?.summary || '',
      skills: user.profile?.skills || [],
      experience: user.profile?.experienceYears || user.profile?.experience || 0,
      currentRole: user.profile?.title || '',
      education: user.profile?.education || [],
      workExperience: user.profile?.workExperience || [],
      projects: user.profile?.projects || [],
      achievements: user.profile?.achievements || [],
      certifications: user.profile?.certifications || [],
      linkedinUrl: user.profile?.linkedinUrl || '',
      githubUrl: user.profile?.githubUrl || '',
      portfolioUrl: user.profile?.portfolioUrl || '',
    };

    let effectiveJobDescription = jobDescription || '';

    // If this is a Naukri job, attempt to resolve the full original JD from extension logs
    if (jobId || (jobUrl && jobUrl.includes('naukri.com'))) {
      const match = (jobId || jobUrl || '').match(/(\d{10,14})/);
      if (match) {
        const fullJd = getExactNaukriJd(match[1]);
        if (fullJd && fullJd.length > effectiveJobDescription.length) {
          effectiveJobDescription = fullJd;
          console.log(`✅ Loaded exact Naukri JD (${fullJd.length} chars) for cover letter generation`);
        }
      }
    }

    // System prompt built from the "killer cover letter" methodology (see @/lib/coverLetterPrompt)
    let systemPrompt = buildCoverLetterSystemPrompt(coverLetterType);

    // If jobUrl is provided and not null, fetch content and append to system prompt
    if (jobUrl && jobUrl.trim() !== '' && !effectiveJobDescription) {
      try {
        const urlContent = await fetchAndConvertToMarkdown(jobUrl);
        if (urlContent && urlContent.length > 0) {
          systemPrompt += `\n\nAdditional information from the job posting URL:\n${urlContent}`;
        }
      } catch (error) {
        console.error('Error fetching job URL content:', error as Error);
        // Continue without URL content if fetch fails
      }
    }

    // User prompt built from the job + profile (+ guided answers) — pure builder
    const userPrompt = buildUserPrompt({
      jobTitle,
      company,
      location,
      jobDescription: effectiveJobDescription,
      profileDetails,
      guidedAnswers,
      fallbackProfile: userProfile,
    });

    // Generate cover letter using AI service
    const coverLetterContent = await aiFilterService.generateCoverLetter(systemPrompt, userPrompt);

    if (!coverLetterContent) {
      return NextResponse.json({ error: 'Failed to generate cover letter' }, { status: 500 });
    }

    return NextResponse.json({
      coverLetter: coverLetterContent,
      jobId,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error generating cover letter:', error as Error);
    return NextResponse.json(
      { error: 'An error occurred while generating the cover letter' },
      { status: 500 }
    );
  }
}
