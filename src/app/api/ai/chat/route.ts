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

const SYSTEM_PROMPT = `You are a helpful profile-editing assistant inside a job application app called Applytron.
The user talks to you and asks you to improve or fix their resume/profile. You can either:

1. REPLY with plain text (when the user is chatting, asking questions, or giving general advice), or
2. EDIT their profile fields (when the user asks you to change/rewrite/improve specific parts).

The user's current profile is provided as JSON in the user message, under the key "profile".

If the user wants you to EDIT the profile, respond with ONLY a JSON object of this exact shape:
{"action":"edit","changes":{"professionalInfo.bio":"new bio text", ...}}

For nested fields use dot notation with array indexes, e.g.:
- professionalInfo.bio
- professionalInfo.currentRole
- professionalInfo.experience
- personalInfo.phone
- personalInfo.location
- personalInfo.website
- professionalInfo.skills  (array of strings; provide the full array if changing)
- professionalInfo.projects.0.description  (index into the array)
- professionalInfo.projects.0.name
- professionalInfo.workExperience.1.description
- professionalInfo.achievements.0.description
- professionalInfo.education.0.degree

Rules:
- Only include fields you actually intend to change. Reproduce unchanged values only when required by the schema (e.g. arrays like skills).
- Keep the same overall structure. For simple string fields, provide the new string.
- Never invent facts that are not implied by the user's message or the existing profile. If the user asks to "add" something you don't have data for, either ask a clarifying question (reply mode) or fill from what is implied.
- Output ONLY the JSON object — no markdown fences, no extra text — when going the edit route.

If you are just replying, respond with:
{"action":"reply","text":"your answer here"}

Prefer the "edit" action whenever the user's instruction clearly targets profile content.`;

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
