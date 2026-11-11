import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { resolveAIConfig } from '@/lib/aiConfig';

// Import AI service dynamically
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let AiFilterService: any;
const initService = async () => {
  if (!AiFilterService) {
    AiFilterService = (await import('@/lib/aiFilterService')).default;
  }
};

interface FixResumeRequestBody {
  html?: string;
  instruction?: string;
}

const MAX_HTML_LENGTH = 50000;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: FixResumeRequestBody = await request.json();
    const html = typeof body.html === 'string' ? body.html.trim() : '';
    const instruction = typeof body.instruction === 'string' ? body.instruction.trim() : '';

    if (!html) {
      return NextResponse.json({ error: 'No HTML provided' }, { status: 400 });
    }
    if (html.length > MAX_HTML_LENGTH) {
      return NextResponse.json({ error: 'HTML is too large' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await initService();
    const aiFilterService = new AiFilterService();

    const config = await resolveAIConfig(String(session.user.id), user.aiConfig);
    aiFilterService.saveConfig(config);
    console.log('[fix-resume] resolved AI config:', { provider: config.provider, apiUrl: config.apiUrl, model: config.model });

    const systemPrompt = `You are an expert resume HTML editor.

You will receive the full HTML of a professional resume — a complete HTML document, possibly wrapped in a code fence.

Your job is to improve it while keeping its structure intact:
- Fix grammar, spelling, punctuation, and awkward wording in every visible piece of text.
- Rewrite weak or generic bullet points so they read clearer and more achievement-oriented, without inventing new facts.
- Keep the layout, tags, and overall structure exactly as-is. Only change text content and, where genuinely helpful, minimal styling (spacing, font sizes, section header consistency).
- Preserve all factual information. Do not add new skills, jobs, degrees, URLs, or claims that are not already present.
- Make sure the result is a valid, complete HTML document (starting with <!DOCTYPE html> and ending with </html>).

Output ONLY the improved, complete HTML document. No commentary, no labels, no markdown code fences.`;

    let userPrompt = `Here is the resume HTML:\n"""\n${html}\n"""\n\nPlease return the improved, complete HTML document only.`;

    if (instruction) {
      userPrompt += `\n\nThe editor also asked you to focus on this: ${instruction}`;
    }

    // Use a larger token budget so the full document comes back intact.
    const improved = await aiFilterService.generateCoverLetter(systemPrompt, userPrompt, undefined, 3000);

    if (!improved) {
      return NextResponse.json({ error: 'Failed to generate HTML' }, { status: 500 });
    }

    // Strip wrapping code fences the model might add.
    const cleaned = improved
      .replace(/^```(?:html)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    return NextResponse.json({ html: cleaned });
  } catch (error) {
    console.error('Fix resume error:', error);
    const message = error instanceof Error && error.message
      ? error.message
      : 'An error occurred while fixing the resume';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
