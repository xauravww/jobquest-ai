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

interface ChatRequestBody {
  message?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  profile?: unknown;
}

const SYSTEM_PROMPT = `You are a sharp, concise resume editor embedded in Applytron, a job-application app. You look at the user's profile and their instruction, then either fix profile fields or answer briefly.

Your tone: direct, practical, and human. No fluff, no filler, no marketing-speak. Short sentences. Be specific to the user's actual profile (their role, projects, experience) instead of giving generic advice.

You can do two things:

1. EDIT the profile — when the user asks you to rewrite/improve/shorten/add to specific fields. Respond with ONLY a JSON object:
{"action":"edit","changes":{"professionalInfo.bio":"new text", ...}}

Nested fields use dot notation with array indexes:
- professionalInfo.bio, professionalInfo.currentRole, professionalInfo.experience
- personalInfo.phone, personalInfo.location, personalInfo.website
- professionalInfo.skills  (full array of strings)
- professionalInfo.projects.0.description, professionalInfo.projects.0.name, professionalInfo.projects.1.technologies (full array)
- professionalInfo.workExperience.0.description, professionalInfo.workExperience.0.position, professionalInfo.workExperience.0.company
- professionalInfo.achievements.0.description
- professionalInfo.education.0.degree, professionalInfo.education.0.field

Rules:
- Only include fields you actually change.
- Never invent facts not implied by the profile or the instruction. If the user asks for something you don't have data for, either leave it out or ask a one-line clarifying question (reply mode).
- Rewrite to be clear, professional, and concise. Match the field's existing length roughly.
- Output ONLY the JSON object (no markdown fences, no extra text) for edits.

2. REPLY — for anything else (questions, advice, chat). Respond with:
{"action":"reply","text":"answer"}

Prefer edits whenever the instruction clearly targets profile content. Keep replies under ~150 words unless the user asks for more.`;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ChatRequestBody = await request.json();
    const message = (body.message || '').trim();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });

    await initService();
    const aiFilterService = new AiFilterService();

    const config = await resolveAIConfig(String(session.user.id), user?.aiConfig);
    aiFilterService.saveConfig(config);

    const profileJson = JSON.stringify(body.profile ?? {}, null, 2);
    const history = (body.history || [])
      .slice(-10)
      .map((h) => ({ role: h.role, content: h.content }));

    const userPrompt = `Here is the user's current profile:\n<profile>\n${profileJson}\n</profile>\n\nUser said: "${message}"`;

    const raw = await aiFilterService.generateCoverLetter(SYSTEM_PROMPT, userPrompt, history);
    if (!raw) {
      return NextResponse.json({ error: 'No response from AI provider' }, { status: 502 });
    }

    // Try to parse as JSON
    let parsed: { action?: string; changes?: Record<string, unknown>; text?: string } | null = null;
    const trimmed = raw.trim();
    // Strip possible markdown fences
    const cleaned = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Not valid JSON — fall back to reply
    }

    // If we couldn't parse but the model clearly emitted an edit-ish JSON,
    // still present the raw text as a reply.
    if (!parsed) {
      return NextResponse.json({ action: 'reply', text: raw.trim() });
    }

    if (parsed.action === 'edit' && parsed.changes) {
      return NextResponse.json({ action: 'edit', changes: parsed.changes });
    }

    return NextResponse.json({ action: 'reply', text: parsed.text || raw.trim() });
  } catch (error) {
    console.error('Chat error:', error as Error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Chat failed' }, { status: 500 });
  }
}
