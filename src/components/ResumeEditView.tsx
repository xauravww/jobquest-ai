'use client';

import React, { useState, useRef, useEffect } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  keymap,
  drawSelection,
  highlightActiveLine,
  placeholder,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab, undo, redo, undoDepth, redoDepth } from '@codemirror/commands';
import { syntaxHighlighting, HighlightStyle, bracketMatching, indentOnInput } from '@codemirror/language';
import { html } from '@codemirror/lang-html';
import { tags as t } from '@lezer/highlight';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import {
  ArrowLeft,
  Bot,
  CheckCircle,
  Code2,
  Pencil,
  Redo2,
  Send,
  Undo2,
  X,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { htmlElementToPdfBlob, blobToBase64 } from '@/lib/htmlToPdf';

// Minimal resume shape the editor needs. The full page resumes (which come from
// the API) carry an optional normalized `content` snapshot used to build the
// initial HTML when the resume has no saved HTML source yet.
interface WorkEntry {
  role?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface EducationEntry {
  degree?: string;
  school?: string;
  year?: string;
}

interface ProjectEntry {
  name?: string;
  description?: string;
  liveUrl?: string;
  codeUrl?: string;
}

export interface EditResume {
  _id: string;
  title: string;
  description?: string;
  html?: string;
  content?: {
    summary?: string;
    email?: string;
    location?: string;
    skills?: string[];
    workExperience?: WorkEntry[];
    education?: EducationEntry[];
    projects?: ProjectEntry[];
  };
}

type ChatMsg = { role: 'user' | 'assistant'; text: string };

type DiffLine = { type: 'ctx' | 'del' | 'add'; text: string };

// Minimal LCS-based line diff for reviewing AI proposals. Returns a unified
// sequence of context / removed / added lines.
const diffLines = (oldText: string, newText: string): DiffLine[] => {
  const A = oldText.split('\n');
  const B = newText.split('\n');
  const n = A.length;
  const m = B.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      out.push({ type: 'ctx', text: A[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'del', text: A[i] });
      i++;
    } else {
      out.push({ type: 'add', text: B[j] });
      j++;
    }
  }
  while (i < n) out.push({ type: 'del', text: A[i++] });
  while (j < m) out.push({ type: 'add', text: B[j++] });
  return out;
};

interface Props {
  resume: EditResume;
  onBack: () => void;
  onSave: (id: string, payload: {
    title: string;
    description: string;
    html?: string;
    pdfBase64?: string;
  }) => void;
}

const escapeHtml = (s?: string) =>
  (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Build an HTML document that mirrors the server-side PDF layout
// (resumeRenderer.ts) so the editor preview matches the generated PDF.
const cleanUrl = (u?: string) =>
  String(u || '').replace(/^https?:\/\//i, '').replace(/\/$/, '');

const linesToBullets = (text?: string): string =>
  String(text || '')
    .split(/\r?\n/)
    .map((s) => s.replace(/^\s*[-–—]\s*/, '').trim())
    .filter(Boolean)
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join('');

const contentToHtml = (resume: EditResume): string => {
  const c = resume.content || {};
  const name = resume.title.replace(/\s*(—|-)\s*Resume$/i, '').trim() || resume.title;

  const skillLine = (c.skills || []).filter(Boolean).map((s) => escapeHtml(s)).join('  •  ');

  const workHtml = (c.workExperience || [])
    .filter((w) => w.role || w.company)
    .map((w) => {
      const dates = [w.startDate, w.endDate].filter(Boolean).join(' – ');
      const bullets = linesToBullets(w.description);
      return `
      <div class="entry">
        ${w.role ? `<div class="top"><span class="role">${escapeHtml(w.role)}</span>${dates ? `<span class="dates">${escapeHtml(dates)}</span>` : ''}</div>` : ''}
        ${w.company ? `<div class="company">${escapeHtml(w.company)}</div>` : ''}
        ${bullets ? `<ul>${bullets}</ul>` : ''}
      </div>`;
    }).join('');

  const projHtml = (c.projects || [])
    .filter((p) => p.name)
    .map((p) => {
      const bullets = linesToBullets(p.description);
      const links = [];
      if (p.liveUrl) links.push(`Live: <span>${escapeHtml(cleanUrl(p.liveUrl))}</span>`);
      if (p.codeUrl) links.push(`GitHub: <span>${escapeHtml(cleanUrl(p.codeUrl))}</span>`);
      return `
      <div class="entry">
        <div class="role">${escapeHtml(p.name)}</div>
        ${bullets ? `<ul>${bullets}</ul>` : ''}
        ${links.length ? `<div class="links">${links.join('&nbsp;&nbsp;|&nbsp;&nbsp;')}</div>` : ''}
      </div>`;
    }).join('');

  const eduHtml = (c.education || [])
    .filter((e) => e.degree || e.school)
    .map((e) => `
      <div class="entry">
        ${e.degree ? `<div class="top"><span class="role">${escapeHtml(e.degree)}</span>${e.year ? `<span class="dates">${escapeHtml(e.year)}</span>` : ''}</div>` : ''}
        ${e.school ? `<div class="company">${escapeHtml(e.school)}</div>` : ''}
      </div>`).join('');

  const contact = [c.email, c.location].filter(Boolean).map((x) => escapeHtml(x)).join(' &nbsp;|&nbsp; ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: Helvetica, Arial, sans-serif; color: #111; margin: 0; padding: 40px 60px 56px; font-size: 11.5px; line-height: 1.45; }
  .name { font-size: 25px; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 3px; color: #111; }
  .contact { text-align: center; font-size: 10.5px; color: #666; margin: 0 0 8px; }
  hr { border: none; border-top: 1px solid #bbb; margin: 0 0 6px; }
  h2.sec { font-size: 12.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #111; margin: 14px 0 2px; padding-bottom: 2px; border-bottom: 1px solid #bbb; }
  p.body { margin: 4px 0; color: #444; }
  ul { margin: 2px 0 4px; padding-left: 16px; color: #444; }
  li { margin: 0 0 2px; }
  .entry { margin: 0 0 9px; }
  .top { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .role { font-weight: 700; font-size: 12.5px; color: #111; }
  .dates { font-weight: 400; font-size: 11px; color: #666; white-space: nowrap; }
  .company { font-style: italic; color: #666; font-size: 11.5px; }
  .links { font-size: 10px; color: #666; margin: 2px 0 0; }
  .links span { color: #1a5fb4; }
</style>
</head>
<body>
  <h1 class="name">${escapeHtml(name)}</h1>
  ${contact ? `<div class="contact">${contact}</div>` : ''}
  <hr>
  ${c.summary ? `<h2 class="sec">Summary</h2><p class="body">${escapeHtml(c.summary)}</p>` : ''}
  ${skillLine ? `<h2 class="sec">Technical Skills</h2><p class="body">${skillLine}</p>` : ''}
  ${workHtml ? `<h2 class="sec">Experience</h2>${workHtml}` : ''}
  ${projHtml ? `<h2 class="sec">Projects</h2>${projHtml}` : ''}
  ${eduHtml ? `<h2 class="sec">Education</h2>${eduHtml}` : ''}
</body>
</html>`;
};

// ── CodeMirror theme: mirrors the app's editable palette ────────────────────
const resumeTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: 'var(--bg-deep)',
    color: 'var(--text-main)',
    fontSize: '13px',
  },
  '.cm-scroller': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    lineHeight: '20px',
    overflow: 'auto',
  },
  '.cm-content': {
    padding: '16px',
    caretColor: 'var(--accent)',
  },
  '.cm-line': {
    padding: '0',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--accent)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'var(--accent-soft)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--text-dim)',
    borderRight: '1px solid var(--border)',
  },
  '.cm-gutterElement': {
    minWidth: '36px',
    padding: '0 10px 0 14px',
    textAlign: 'right',
    lineHeight: '20px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'rgba(255,255,255,0.1)',
    outline: '1px solid rgba(255,255,255,0.25)',
  },
  '.cm-scroller::-webkit-scrollbar': { width: '10px', height: '10px' },
  '.cm-scroller::-webkit-scrollbar-thumb': { background: '#3a4150', borderRadius: '6px', border: '2px solid var(--bg-deep)' },
  '.cm-scroller::-webkit-scrollbar-thumb:hover': { background: '#4a5468' },
  '.cm-scroller::-webkit-scrollbar-track': { background: 'transparent' },
});

const resumeSyntax = HighlightStyle.define([
  { tag: t.angleBracket, color: '#8a93a6' },
  { tag: t.tagName, color: '#ff6b4a' },
  { tag: t.attributeName, color: '#6fd0e0' },
  { tag: [t.attributeValue, t.string], color: '#e0b34c' },
  { tag: t.comment, color: '#6a7280', fontStyle: 'italic' },
  { tag: [t.name, t.typeName, t.className], color: '#ff6b4a' },
  { tag: t.documentMeta, color: '#5c6575' },
  { tag: [t.keyword, t.meta], color: '#c792ea' },
]);

const ResumeEditView = ({ resume, onBack, onSave }: Props) => {
  const initialHtml = resume.html?.trim() || contentToHtml(resume);

  const [title, setTitle] = useState(resume.title);
  const [description, setDescription] = useState(resume.description || '');
  const [htmlSrc, setHtmlSrc] = useState<string>(initialHtml);
  const [saving, setSaving] = useState(false);
  const [aiFixing, setAiFixing] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  // Resume details live in a modal (button in the toolbar) so the workspace
  // stays focused on the HTML editor.
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftDescription, setDraftDescription] = useState(description);

  // AI assistant chat panel.
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role: 'assistant', text: 'Hi! Tell me what to improve in your resume and I’ll draft the changes for you to approve.' },
  ]);

  // AI output is never applied directly. It is held here until the user
  // reviews the diff and approves it.
  const [aiProposal, setAiProposal] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);
  const editorHostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const lineCount = htmlSrc.split('\n').length;
  const dirty = htmlSrc !== initialHtml;

  // Snapshot the initial source so the one-time editor creation effect has no
  // changing dependencies.
  const initialHtmlRef = useRef(initialHtml);

  // Create the CodeMirror editor once on mount. The view owns editing + syntax
  // highlighting + wrapping; htmlSrc stays in sync for the live preview/PDF.
  useEffect(() => {
    const host = editorHostRef.current;
    if (!host) return;

    const view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: initialHtmlRef.current,
        extensions: [
          resumeTheme,
          syntaxHighlighting(resumeSyntax),
          html(),
          EditorView.lineWrapping,
          history(),
          drawSelection(),
          highlightActiveLine(),
          bracketMatching(),
          indentOnInput(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          placeholder('Paste your full HTML resume here…'),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) setHtmlSrc(update.state.doc.toString());
          }),
        ],
      }),
    });

    viewRef.current = view;
    // Expose the view for tests / harness access.
    (host as unknown as { __cmView?: EditorView }).__cmView = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Push external updates (e.g. "Fix with AI") into the editor.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (view.state.doc.toString() === htmlSrc) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: htmlSrc } });
  }, [htmlSrc]);

  const openDetails = () => {
    setDraftTitle(title);
    setDraftDescription(description);
    setDetailsOpen(true);
  };

  const handleSaveDetails = () => {
    setTitle(draftTitle.trim());
    setDescription(draftDescription.trim());
    setDetailsOpen(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      let pdfBase64: string | undefined;
      if (printRef.current) {
        try {
          const blob = await htmlElementToPdfBlob(printRef.current);
          pdfBase64 = await blobToBase64(blob);
        } catch (err) {
          console.error('HTML→PDF generation failed:', err);
          toast.error('PDF generation failed — HTML will still be saved');
        }
      }
      await onSave(resume._id, {
        title: title.trim(),
        description: description.trim(),
        html: htmlSrc,
        pdfBase64,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const instruction = aiInstruction.trim();
    if (!instruction || aiFixing) return;

    setChatMessages((m) => [...m, { role: 'user', text: instruction }]);
    setAiInstruction('');
    setAiFixing(true);
    try {
      const res = await fetch('/api/ai/fix-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: htmlSrc, instruction }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.html) {
        // Hold the proposal for review. The editor is not touched yet.
        setAiProposal(data.html);
        setChatMessages((m) => [
          ...m,
          { role: 'assistant', text: 'I’ve drafted changes. Review them, then approve or reject.' },
        ]);
      } else {
        throw new Error(data?.error || 'AI fix failed');
      }
    } catch {
      setChatMessages((m) => [
        ...m,
        { role: 'assistant', text: 'Sorry, I couldn’t draft that change. Check your AI provider in settings and try again.' },
      ]);
    } finally {
      setAiFixing(false);
    }
  };

  const handleApprove = () => {
    if (!aiProposal) return;
    setHtmlSrc(aiProposal);
    setAiProposal(null);
    setReviewOpen(false);
    setChatMessages((m) => [
      ...m,
      { role: 'assistant', text: 'Applied. Review the editor, then save.' },
    ]);
  };

  const handleReject = () => {
    setAiProposal(null);
    setReviewOpen(false);
    setChatMessages((m) => [
      ...m,
      { role: 'assistant', text: 'Change discarded.' },
    ]);
  };

  const paneHeaderCls = "flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-raised)]/50";

  // Undo/redo availability reads straight from the CodeMirror history.
  const cmView = viewRef.current;
  const canUndo = !!cmView && undoDepth(cmView.state) > 0;
  const canRedo = !!cmView && redoDepth(cmView.state) > 0;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-deep)]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 px-4 lg:px-6 py-3 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <Button
          variant="ghost"
          onClick={onBack}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="px-3 py-2 shrink-0"
        >
          Back
        </Button>

        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={saving}
          isLoading={saving}
          leftIcon={<CheckCircle className="w-4 h-4" />}
          className="px-4 sm:px-5 py-2 shrink-0 order-2 sm:order-3 ml-auto sm:ml-0"
        >
          {saving ? 'Saving...' : 'Save & Rebuild'}
        </Button>

        <div className="order-3 sm:order-2 flex flex-1 min-w-0 basis-full sm:basis-auto items-center gap-2">
          <Code2 className="w-4 h-4 text-[var(--text-dim)] shrink-0" />
          <span className="truncate text-sm font-semibold text-[var(--text-main)]">{title || 'Untitled resume'}</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={openDetails}
            aria-label="Edit details"
            leftIcon={<Pencil className="w-3.5 h-3.5" />}
            className="shrink-0"
          >
            Edit details
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setChatOpen((v) => !v)}
            aria-label="AI assistant"
            aria-pressed={chatOpen}
            leftIcon={<Bot className="w-3.5 h-3.5 text-[var(--accent)]" />}
            className="shrink-0"
          >
            AI
          </Button>
          <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${dirty ? 'bg-[var(--warning)]' : 'bg-transparent'}`} title={dirty ? 'Unsaved changes' : 'Saved'} />
        </div>
      </div>

      {/* Workspace */}
      <div className="relative flex-1 min-h-0 p-3 lg:p-4">
        {/* Full-width code editor */}
        <div className="flex flex-col h-full min-h-[420px] rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] overflow-hidden">
          <div className={paneHeaderCls}>
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
              <Code2 className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="font-mono-ui tracking-wide">index.html</span>
              {dirty && <span className="text-[10px] font-normal text-[var(--warning)]">edited</span>}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-dim)] font-mono">
              <span>{lineCount} lines</span>
              <span>{htmlSrc.length} chars</span>
              <div className="flex items-center gap-1 border-l border-[var(--border)] pl-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => cmView && undo(cmView)}
                  disabled={!canUndo}
                  aria-label="Undo"
                  leftIcon={<Undo2 className="w-3.5 h-3.5" />}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => cmView && redo(cmView)}
                  disabled={!canRedo}
                  aria-label="Redo"
                  leftIcon={<Redo2 className="w-3.5 h-3.5" />}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPreviewOpen((v) => !v)}
                aria-label={previewOpen ? 'Hide preview' : 'Show preview'}
                leftIcon={previewOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
                className="shrink-0"
              >
                {previewOpen ? 'Hide preview' : 'Preview'}
              </Button>
            </div>
          </div>

          <div ref={editorHostRef} className="flex-1 min-h-0 overflow-hidden" />
        </div>

        {/* On-demand preview drawer */}
        <AnimatePresence>
          {previewOpen && (
            <motion.div
              initial={{ x: 48, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 48, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              role="dialog"
              aria-label="Resume live preview"
              className="absolute inset-y-3 right-3 w-[min(88vw,860px)] z-20 flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] shadow-2xl overflow-hidden"
            >
              <div className={paneHeaderCls}>
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--live)] opacity-60"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--live)]"></span>
                  </span>
                  Preview
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPreviewOpen(false)}
                  aria-label="Hide preview"
                  leftIcon={<PanelRightClose className="w-3.5 h-3.5" />}
                >
                  Hide
                </Button>
              </div>

              <div className="flex-1 overflow-auto bg-[var(--bg-deep)]">
                {htmlSrc.trim() ? (
                  <div className="mx-auto w-max min-w-full p-4 lg:p-5">
                    <iframe
                      title="Resume live preview"
                      srcDoc={htmlSrc}
                      className="block bg-white"
                      style={{
                        width: 794,
                        minHeight: 1123,
                        border: 'none',
                        boxShadow: '0 10px 34px -18px rgba(0,0,0,0.7)',
                      }}
                    />
                    <p className="mt-3 text-center text-[11px] text-[var(--text-dim)] font-mono">
                      Print width · 794px · matches PDF
                    </p>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[56vh] items-center justify-center px-6 text-center text-sm text-[var(--text-dim)]">
                    The preview will appear here as you write HTML.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI assistant chat panel */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              role="dialog"
              aria-label="AI assistant"
              className="fixed top-16 right-4 bottom-4 w-[min(92vw,380px)] z-30 flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden"
            >
              <div className={paneHeaderCls}>
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
                  <Bot className="w-3.5 h-3.5 text-[var(--accent)]" />
                  AI Assistant
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setChatOpen(false)}
                  aria-label="Close AI assistant"
                  leftIcon={<X className="w-4 h-4" />}
                />
              </div>

              {/* Messages */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-[var(--bg-deep)]">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                        ? 'bg-[var(--accent)] text-black rounded-br-sm'
                        : 'bg-[var(--bg-raised)] border border-[var(--border)] text-[var(--text-main)] rounded-bl-sm'}`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {aiFixing && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-xl rounded-bl-sm px-3 py-2 text-[13px] text-[var(--text-dim)] bg-[var(--bg-raised)] border border-[var(--border)]">
                      Thinking...
                    </div>
                  </div>
                )}
                {aiProposal && !aiFixing && (
                  <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-raised)] p-3 space-y-2">
                    <p className="text-[12px] text-[var(--text-muted)]">AI drafted changes. Review before applying.</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setReviewOpen(true)}
                        aria-label="Review AI changes"
                      >
                        Review
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleApprove}
                        aria-label="Approve"
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleReject}
                        aria-label="Reject"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Composer */}
              <form onSubmit={handleSend} className="border-t border-[var(--border)] p-3 flex items-end gap-2 bg-[var(--bg-surface)]">
                <textarea
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  rows={2}
                  placeholder="Describe what to improve…"
                  aria-label="AI instruction"
                  disabled={aiFixing}
                  className="flex-1 resize-none px-3 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-lg text-white text-sm placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={aiFixing || !aiInstruction.trim()}
                  aria-label="Send"
                  leftIcon={<Send className="w-4 h-4" />}
                  className="w-9 h-9 !p-0 shrink-0"
                />
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden capture target used to rasterize the PDF on save. */}
      <div aria-hidden style={{ position: 'absolute', left: -9999, top: 0, width: 794, backgroundColor: '#fff' }}>
        <div ref={printRef} style={{ width: 794, minHeight: 1123, color: '#111' }} dangerouslySetInnerHTML={{ __html: htmlSrc }} />
      </div>

      {/* Resume details modal (title + description) */}
      <Modal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} title="Resume details" width="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
              Title <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="e.g. Software Engineer Resume"
              className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white text-sm placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Description</label>
            <textarea
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              rows={3}
              placeholder="Short description"
              className="w-full px-4 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-xl text-white text-sm placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-glass)]">
            <Button variant="secondary" onClick={() => setDetailsOpen(false)} className="px-4 py-2">Cancel</Button>
            <Button variant="primary" onClick={handleSaveDetails} className="px-4 py-2">Save</Button>
          </div>
        </div>
      </Modal>

      {/* AI review modal: never apply AI output without explicit approval */}
      <Modal isOpen={reviewOpen} onClose={() => setReviewOpen(false)} title="Review AI changes" width="max-w-3xl">
        {aiProposal ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] overflow-hidden font-mono text-[12px] leading-5 max-h-[55vh] overflow-y-auto">
              {diffLines(htmlSrc, aiProposal).map((l, i) => (
                <div
                  key={i}
                  className={`px-3 whitespace-pre-wrap ${l.type === 'del' ? 'bg-[var(--danger)]/10 text-[var(--danger)]' : l.type === 'add' ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'text-[var(--text-dim)]'}`}
                >
                  {l.type === 'add' ? '+ ' : l.type === 'del' ? '- ' : '  '}{l.text}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={handleReject} className="px-4 py-2">Reject</Button>
              <Button variant="primary" onClick={handleApprove} className="px-4 py-2">Approve</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-dim)]">No pending changes.</p>
        )}
      </Modal>
    </div>
  );
};

export default ResumeEditView;
