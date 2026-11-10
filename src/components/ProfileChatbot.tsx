'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ProfileChatbotProps {
  profile: unknown;
  onApplyChanges: (changes: Record<string, unknown>) => Promise<number>;
}

/* ------------------------------------------------------------------
 * Minimal markdown renderer (inline styles, no library dependency).
 * Supports paragraphs, headings, bullet/numbered lists, bold, italic,
 * inline code, and links.
 * ------------------------------------------------------------------ */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Split on inline code first so code spans are never parsed for md.
  const parts = text.split(/(`[^`]+`)/g);
  parts.forEach((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      nodes.push(
        <code
          key={`${keyPrefix}-code-${i}`}
          style={{
            background: 'var(--bg-deep)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '0 4px',
            fontSize: '0.9em',
            color: 'var(--text-main)',
          }}
        >
          {part.slice(1, -1)}
        </code>,
      );
      return;
    }

    const segments = part.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
    segments.forEach((seg, j) => {
      if (!seg) return;
      const key = `${keyPrefix}-${i}-${j}`;
      if (seg.startsWith('**') && seg.endsWith('**')) {
        nodes.push(<strong key={key} style={{ color: 'var(--text-main)' }}>{seg.slice(2, -2)}</strong>);
      } else if (seg.startsWith('*') && seg.endsWith('*') && seg.length > 2) {
        nodes.push(<em key={key} style={{ color: 'var(--text-main)' }}>{seg.slice(1, -1)}</em>);
      } else if (/^\[[^\]]+\]\([^)]+\)$/.test(seg)) {
        const m = seg.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (m) {
          nodes.push(
            <a key={key} href={m[2]} target="_blank" rel="noopener noreferrer"
               style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
              {m[1]}
            </a>,
          );
          return;
        }
        nodes.push(seg);
      } else {
        nodes.push(seg);
      }
    });
  });
  return nodes;
}

function renderMarkdown(content: string): React.ReactNode {
  const lines = content.split('\n');
  const out: React.ReactNode[] = [];
  let list: { ordered: boolean; items: React.ReactNode[] } | null = null;
  let liKey = 0;

  const flushList = () => {
    if (list) {
      const items = list.items;
      const Container: any = list.ordered ? 'ol' : 'ul';
      out.push(
        <Container key={`list-${liKey++}`} style={{ margin: '4px 0', paddingLeft: '18px' }}>
          {items.map((it, idx) => (
            <li key={idx} style={{ marginBottom: '2px' }}>{it}</li>
          ))}
        </Container>,
      );
      list = null;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Headings
    const hMatch = trimmed.match(/^(#{1,3})\s+(.*)/);
    if (hMatch) {
      flushList();
      const level = hMatch[1].length;
      const size = level === 1 ? '1.05em' : level === 2 ? '1em' : '0.95em';
      out.push(
        <div key={`h-${idx}`} style={{ fontWeight: 600, margin: '6px 0 2px', color: 'var(--text-main)', fontSize: size }}>
          {renderInline(hMatch[2], `h-${idx}`)}
        </div>,
      );
      return;
    }

    // Bullet list
    const bulletMatch = trimmed.match(/^(?:[-*+]|(?:\d+\.))\s+(.*)/);
    if (bulletMatch) {
      const ordered = /^\d+\./.test(trimmed);
      if (!list) list = { ordered, items: [] };
      list.items.push(
        <span key={`li-${liKey++}`}>{renderInline(bulletMatch[1], `li-${idx}`)}</span>,
      );
      return;
    }

    flushList();

    // Blank line => paragraph break
    if (!trimmed) return;

    out.push(
      <div key={`p-${idx}`} style={{ margin: '2px 0' }}>
        {renderInline(line, `p-${idx}`)}
      </div>,
    );
  });

  flushList();
  return <>{out}</>;
}

const PROFILE_ASSISTANT_INTRO = 'I can edit your profile. Tell me what to change, e.g. "shorten my bio" or "make the first project description tighter". Changes save automatically.';

const ProfileChatbot: React.FC<ProfileChatbotProps> = ({ profile, onApplyChanges }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: PROFILE_ASSISTANT_INTRO,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          profile,
          history: messages.filter((m) => m.role === 'user' || m.role === 'assistant'),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Chat request failed');
      }

      if (data?.action === 'edit' && data.changes) {
        const keys = Object.keys(data.changes);
        const applied = await onApplyChanges(data.changes);
        const n = applied > 0 ? applied : keys.length;
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: applied > 0
              ? `Done. Updated ${n} field${n === 1 ? '' : 's'} and saved them to your profile.`
              : 'I couldn\'t apply those changes because one of the referenced fields doesn\'t exist yet. Try rephrasing, or add the section first.',
          },
        ]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: data?.text || 'Done.' }]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Check your AI config.';
      setMessages((m) => [...m, { role: 'assistant', content: message }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: PROFILE_ASSISTANT_INTRO,
      },
    ]);
  };

  return (
    <>
      <Button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle AI assistant"
        variant="primary"
        className="fixed bottom-5 right-5 z-50 w-14 h-14 !p-0 rounded-full flex items-center justify-center"
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </Button>

      {open && (
        <div
          className="fixed bottom-24 right-5 z-50 w-[360px] max-w-[calc(100vw-2.5rem)] h-[480px] max-h-[calc(100vh-8rem)] flex flex-col rounded-xl border overflow-hidden"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-deep)', color: 'var(--accent)' }}>
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>Profile Assistant</p>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Fixes fields via your AI provider</p>
            </div>
            <Button
              onClick={clearChat}
              size="sm"
              variant="ghost"
              aria-label="Clear chat"
              className="!px-2 !py-1 text-xs flex items-center gap-1 shrink-0"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed"
                  style={
                    m.role === 'user'
                      ? { background: 'var(--accent)', color: '#0e1116' }
                      : { background: 'var(--bg-raised)', color: 'var(--text-main)' }
                  }
                >
                  {m.role === 'user' ? <>{m.content}</> : renderMarkdown(m.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl text-xs flex items-center gap-2" style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
              placeholder="Tell me what to fix…"
              aria-label="Chat message"
              className="flex-1 text-sm px-3 rounded-lg border outline-none focus:ring-1 h-8"
              style={{
                background: 'var(--bg-deep)',
                borderColor: 'var(--border)',
                color: 'var(--text-main)',
                ['--tw-ring-color' as string]: 'var(--accent)',
              }}
            />
            <Button
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              variant="primary"
              className="w-9 h-8 !p-0 flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileChatbot;
