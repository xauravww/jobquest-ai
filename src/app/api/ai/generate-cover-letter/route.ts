import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Application from '@/models/Application';
import { fetchAndConvertToMarkdown } from '@/lib/urlReader';

// Import AI service dynamically
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

    // Add explicit types for map parameters to fix TS errors
    type WorkExp = { position: string; company: string; startDate?: string; endDate?: string; description: string };
    type Project = { name: string; description: string };
    type Education = { degree: string; field: string; institution: string };

    const body = await request.json();
    const { jobId, jobTitle, company, jobDescription, location, aiConfig, jobUrl, profileDetails } = body;

    if (!jobTitle || !company) {
      return NextResponse.json({ error: 'Job title and company are required' }, { status: 400 });
    }

    // Initialize AI service with config
    await initService();
    const aiFilterService = new AiFilterService();

    // Set AI configuration if provided
    if (aiConfig) {
      aiFilterService.saveConfig(aiConfig);
    }

    // Get user profile data for personalization
    const userProfile = {
      name: user.name || (user.profile?.firstName && user.profile?.lastName ? `${user.profile.firstName} ${user.profile.lastName}` : '') || '',
      email: user.email,
      location: user.profile?.location || '',
      bio: user.profile?.bio || user.profile?.summary || '',
      skills: user.profile?.skills || [],
      experience: user.profile?.experienceYears || user.profile?.experience || 0,
      currentRole: user.profile?.title || '',
      education: user.profile?.education || [],
      workExperience: user.profile?.workExperience || [],
      projects: user.profile?.projects || [],
      linkedinUrl: user.profile?.linkedinUrl || '',
      githubUrl: user.profile?.githubUrl || '',
      portfolioUrl: user.profile?.portfolioUrl || '',
    };

    // Create system prompt for cover letter generation
    let systemPrompt = `You are an expert career counselor and professional writer specializing in creating compelling cover letters. Your task is to generate a personalized, professional cover letter based on the provided information.

Key requirements:
1. Only output the cover letter text, no explanations or additional text
2. Keep the cover letter to 2-3 paragraphs maximum, aiming for 300-400 words total
3. Make it personalized using the candidate's background and experience
4. Highlight relevant skills and experiences that match the job requirements
5. Show enthusiasm for the company and role
6. Use natural, conversational language like you're speaking directly to a hiring manager - avoid buzzwords, jargon, or overly formal phrases
7. Write it in a friendly, authentic tone as if you're telling your story to help them understand why you'd be great for the role
8. Keep it concise but impactful
9. End with a strong call to action

Structure:
- Opening paragraph: Introduce yourself and express genuine interest in the position
- Middle paragraph(s): Share specific experiences and skills in a storytelling way
- Closing paragraph: Reiterate interest and call to action

Make the cover letter sound natural and authentic, like a personal conversation, not generic or AI-generated.`;

    // If jobUrl is provided and not null, fetch content and append to system prompt
    if (jobUrl && jobUrl.trim() !== '') {
      try {
        const urlContent = await fetchAndConvertToMarkdown(jobUrl);
        if (urlContent && urlContent.length > 0) {
          systemPrompt += `\n\nAdditional information from the job posting URL:\n${urlContent}`;
        }
      } catch (error) {
        console.error('Error fetching job URL content:', error);
        // Continue without URL content if fetch fails
      }
    }

    // Create user prompt with job and profile information
    const userPrompt = `Please generate a professional cover letter for the following:

Job Information:
- Position: ${jobTitle}
- Company: ${company}
- Location: ${location || 'Not specified'}
- Job Description: ${jobDescription || 'Not provided'}

${profileDetails ? `Candidate Profile Details:\n${profileDetails}` : `Candidate Profile:
- Name: ${userProfile.name}
- Current Role: ${userProfile.currentRole}
- Years of Experience: ${userProfile.experience} years
- Location: ${userProfile.location}
- Skills: ${Array.isArray(userProfile.skills) ? userProfile.skills.join(', ') : userProfile.skills}
- Bio/Summary: ${userProfile.bio}

${userProfile.workExperience && userProfile.workExperience.length > 0 ? `Work Experience:
${(userProfile.workExperience as WorkExp[]).slice(0, 3).map(exp => `- ${exp.position} at ${exp.company} (${exp.startDate ? new Date(exp.startDate).getFullYear() : 'Present'} - ${exp.endDate ? new Date(exp.endDate).getFullYear() : 'Present'}): ${exp.description}`).join('\n')}` : ''}

${userProfile.projects && userProfile.projects.length > 0 ? `Key Projects:
${(userProfile.projects as Project[]).slice(0, 2).map(proj => `- ${proj.name}: ${proj.description}`).join('\n')}` : ''}

${userProfile.education && userProfile.education.length > 0 ? `Education:
${(userProfile.education as Education[]).slice(0, 2).map(edu => `- ${edu.degree} in ${edu.field} from ${edu.institution}`).join('\n')}` : ''}`}

Please generate a compelling cover letter that highlights the candidate's relevant qualifications and shows genuine interest in this specific role and company. Focus on specific achievements and experiences rather than using generic placeholders.`;

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
    console.error('Error generating cover letter:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating the cover letter' },
      { status: 500 }
    );
  }
}
