import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { fetchAndConvertToMarkdown } from '@/lib/urlReader';

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
  coverLetterType?: 'concise' | 'detailed' | 'professional';
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

    // Add explicit types for map parameters to fix TS errors
    type WorkExp = { position: string; company: string; startDate?: string; endDate?: string; description: string };
    type Project = { name: string; description: string };
    type Education = { degree: string; field: string; institution: string };

    const body: CoverLetterRequestBody = await request.json();
    const { jobId, jobTitle, company, jobDescription, location, aiConfig, jobUrl, profileDetails, coverLetterType = 'detailed' } = body;

    if (!jobTitle || !company) {
      return NextResponse.json({ error: 'Job title and company are required' }, { status: 400 });
    }

    // Initialize AI service with config
    await initService();
    const aiFilterService = new AiFilterService();

    // Set AI configuration - use provided config or user's stored config
    if (aiConfig) {
      aiFilterService.saveConfig(aiConfig);
    } else if (user.aiConfig) {
      aiFilterService.saveConfig({
        provider: user.aiConfig.provider,
        apiUrl: user.aiConfig.apiUrl,
        model: user.aiConfig.model,
        apiKey: user.aiConfig.apiKey
      });
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

    // Create system prompt based on cover letter type
    const coverLetterTypePrompts = {
      concise: `You are an expert career counselor specializing in concise, impactful cover letters. Generate a brief but compelling cover letter.

Key requirements:
1. Keep it to 150-200 words maximum (2-3 short paragraphs)
2. Get straight to the point - no fluff
3. Highlight 2-3 most relevant experiences/skills
4. Use bullet points if needed for clarity
5. Professional but direct tone
6. Strong opening and closing

Structure: Brief intro → Key qualifications → Call to action`,

      detailed: `You are an expert career counselor specializing in comprehensive cover letters. Generate a detailed, storytelling cover letter.

Key requirements:
1. 300-400 words (3-4 paragraphs)
2. Tell a compelling story using specific examples
3. Include multiple relevant experiences, projects, and achievements
4. Show personality and passion
5. Conversational, engaging tone
6. Detailed examples of impact and results

Structure: Engaging intro → Detailed experience stories → Achievements/projects → Strong closing`,

      professional: `You are an expert career counselor specializing in formal, corporate cover letters. Generate a polished, professional cover letter.

Key requirements:
1. 250-350 words (3 paragraphs)
2. Formal but warm tone
3. Focus on qualifications and fit
4. Use professional language without jargon
5. Emphasize value proposition
6. Traditional business letter structure

Structure: Professional introduction → Qualifications and fit → Professional closing`
    };

    let systemPrompt = coverLetterTypePrompts[coverLetterType] + `

Universal requirements for all types:
- Only output the cover letter text, no explanations
- Make it personalized using the candidate's actual background
- Never use placeholders like [Your Name] - use actual provided information
- Highlight relevant skills that match the job requirements
- Show genuine interest in the company and role
- End with a strong call to action
- Use the candidate's real experiences and achievements to make it compelling`;

    // If jobUrl is provided and not null, fetch content and append to system prompt
    if (jobUrl && jobUrl.trim() !== '') {
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

    // Create user prompt with job and profile information
    const userPrompt = `Please generate a professional cover letter for the following:

Job Information:
- Position: ${jobTitle}
- Company: ${company}
- Location: ${location || 'Not specified'}
- Job Description: ${jobDescription || 'Not provided'}

${profileDetails ? `Candidate Profile Details:\n${profileDetails}` : `Candidate Profile:
- Name: ${userProfile.name}
- Email: ${userProfile.email}
- Phone: ${userProfile.phone}
- Current Role: ${userProfile.currentRole}
- Years of Experience: ${userProfile.experience} years
- Location: ${userProfile.location}
- Skills: ${Array.isArray(userProfile.skills) ? userProfile.skills.join(', ') : userProfile.skills}
- Bio/Summary: ${userProfile.bio}

${userProfile.workExperience && userProfile.workExperience.length > 0 ? `Work Experience:
${(userProfile.workExperience as WorkExp[]).map(exp => `- ${exp.position} at ${exp.company} (${exp.startDate ? new Date(exp.startDate).getFullYear() : 'Present'} - ${exp.endDate ? new Date(exp.endDate).getFullYear() : 'Present'})
  ${exp.description || 'No description provided'}`).join('\n\n')}` : ''}

${userProfile.projects && userProfile.projects.length > 0 ? `Key Projects:
${(userProfile.projects as Project[]).filter(proj => proj.name && proj.description).map(proj => `- ${proj.name}: ${proj.description}`).join('\n')}` : ''}

${userProfile.achievements && userProfile.achievements.length > 0 ? `Achievements:
${userProfile.achievements.map((achievement: any) => `- ${achievement.title}: ${achievement.description}`).join('\n')}` : ''}

${userProfile.certifications && userProfile.certifications.length > 0 ? `Certifications:
${userProfile.certifications.map((cert: any) => `- ${cert.name} from ${cert.issuer}`).join('\n')}` : ''}

${userProfile.education && userProfile.education.length > 0 ? `Education:
${(userProfile.education as Education[]).map(edu => `- ${edu.degree} in ${edu.field} from ${edu.institution}`).join('\n')}` : ''}

Contact Information:
- LinkedIn: ${userProfile.linkedinUrl || 'Not provided'}
- GitHub: ${userProfile.githubUrl || 'Not provided'}
- Portfolio: ${userProfile.portfolioUrl || 'Not provided'}`}

Please generate a compelling cover letter that highlights the candidate's specific achievements, work experience, and projects. Use the actual details provided rather than generic placeholders. Make it personal and authentic by referencing specific experiences and accomplishments.`;

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
