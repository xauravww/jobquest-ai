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

interface FixTextRequestBody {
  text?: string;
  context?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: FixTextRequestBody = await request.json();
    const text = typeof body.text === 'string' ? body.text : '';
    const context = typeof body.context === 'string' ? body.context : '';

    if (text.length > 4000) {
      return NextResponse.json({ error: 'Text is too long' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await initService();
    const aiFilterService = new AiFilterService();

    const config = await resolveAIConfig(String(user._id), user.aiConfig);
    aiFilterService.saveConfig(config);
    console.log('[fix-text] resolved AI config:', { provider: config.provider, apiUrl: config.apiUrl, model: config.model });

    const systemPrompt = `You are an expert resume and professional profile editor.

Your job is to improve a free-text field from a candidate's profile:
- Fix spelling mistakes, grammar, punctuation, and formatting errors.
- Rewrite the text to be clear, professional, and concise — no fluff, no excessive dashes, no invented claims.
- Keep the original meaning and facts. Do not add experiences or skills that are not implied by the text or the provided context.
- Keep the length reasonable (around the original length, and generally no longer than ~220 words).
- If the input is empty or effectively blank, write a suitable short draft using the provided context. Do not invent facts beyond what the context states.

Output ONLY the corrected/rewritten text. No labels, quotes, headers, or explanations.`;

    const userPrompt = `${context ? `Field context: ${context}\n\n` : ''}Original text:\n"""\n${text || '(empty)'}\n"""\n\nPlease return the improved text only.`;

    const fixed = await aiFilterService.generateCoverLetter(systemPrompt, userPrompt);

    if (!fixed) {
      return NextResponse.json({ error: 'Failed to generate text' }, { status: 500 });
    }

    // Strip accidental wrapping quotes the model might add.
    const cleaned = fixed.replace(/^["'`]+|["'`]+$/g, '').trim();

    return NextResponse.json({ fixed: cleaned });
  } catch (error) {
    console.error('Fix text error:', error as Error);
    const message = error instanceof Error && error.message
      ? error.message
      : 'An error occurred while fixing text';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
