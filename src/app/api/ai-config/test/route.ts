import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider, apiUrl, apiKey, model } = await request.json();

    if (!provider || !model) {
      return NextResponse.json({ ok: false, error: 'Provider and model are required' });
    }

    let endpoint: string;
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    let body: unknown;

    if (provider === 'gemini') {
      if (!apiKey) {
        return NextResponse.json({ ok: false, error: 'API key required for Gemini' });
      }
      endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;
      headers['x-goog-api-key'] = apiKey;
      body = {
        contents: [{ parts: [{ text: 'Reply with exactly: ok' }] }],
        generationConfig: { maxOutputTokens: 5 },
      };
    } else {
      if (!apiUrl) {
        return NextResponse.json({ ok: false, error: 'Base URL is required' });
      }
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
      endpoint = `${apiUrl.replace(/\/+$/, '')}/v1/chat/completions`;
      body = {
        model,
        messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
        max_tokens: 5,
        temperature: 0,
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      const e = err as { name?: string; message?: string };
      return NextResponse.json({
        ok: false,
        error: e?.name === 'AbortError' ? 'Connection timed out' : e?.message || 'Connection failed',
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return NextResponse.json({ ok: false, error: `HTTP ${res.status}`, detail: detail.slice(0, 200) });
    }

    const data = await res.json();
    const content =
      provider === 'gemini'
        ? data.candidates?.[0]?.content?.parts?.[0]?.text
        : data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ ok: false, error: 'No response received from model' });
    }

    return NextResponse.json({ ok: true, reply: String(content).trim().slice(0, 200) });
  } catch {
    return NextResponse.json({ ok: false, error: 'Unexpected error testing connection' });
  }
}
