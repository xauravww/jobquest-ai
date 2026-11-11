import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { type ReactElement } from 'react';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import ResumeEditView from '@/components/ResumeEditView';

// jsdom lacks a few APIs CodeMirror touches. Polyfill just enough for the tests.
beforeAll(() => {
  if (typeof Range !== 'undefined' && Range.prototype && !Range.prototype.getClientRects) {
    Range.prototype.getClientRects = function () {
      return [];
    } as never;
    Range.prototype.getBoundingClientRect = function () {
      return { x: 0, y: 0, top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 } as DOMRect;
    } as never;
  }
  if (typeof ResizeObserver === 'undefined') {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    globalThis.ResizeObserver = ResizeObserverMock as never;
  }
  if (typeof IntersectionObserver === 'undefined') {
    class IntersectionObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    }
    globalThis.IntersectionObserver = IntersectionObserverMock as never;
  }
});

const resumeWithContent = {
  _id: 'r1',
  title: 'Saurav — Resume',
  description: 'Auto-generated from profile',
  content: {
    summary: 'Hello, this is my summary.',
    skills: ['React', 'TypeScript', 'Node.js'],
    workExperience: [
      { role: 'Full Stack Dev', company: 'Acme', startDate: 'May 2025', endDate: 'Present', description: 'Built things' },
    ],
    education: [
      { degree: 'B.Tech in Computer Science', school: 'BRCM', year: '2024' },
    ],
    projects: [
      { name: 'NebulaPlan', description: 'AI tool', liveUrl: 'nebulaplan.vercel.app', codeUrl: '' },
    ],
  },
};

// The CodeMirror view is exposed on the host element via `__cmView`. We keep a
// reference to the latest rendered container (the `Screen` object has no
// `container` accessor).
let editorHost: HTMLElement | null = null;

const renderEditor = (ui: ReactElement) => {
  const result = render(ui);
  editorHost = result.container;
  return result;
};

const getView = () => {
  if (!editorHost) return null;
  const cm = editorHost.querySelector('.cm-editor');
  if (!cm) return null;
  return (cm.parentElement as unknown as { __cmView?: { state: { doc: { toString(): string } }; dispatch(opts: { changes: { from: number; to: number; insert: string } }): void } }).__cmView ?? null;
};

const getDocText = () => getView()?.state.doc.toString() ?? '';

const setDoc = (html: string) => {
  const view = getView();
  if (!view) throw new Error('CodeMirror view not mounted');
  view.dispatch({ changes: { from: 0, to: view.state.doc.toString().length, insert: html } });
};

// AI assistant chat helpers.
const openChat = () => {
  fireEvent.click(screen.getByRole('button', { name: /AI assistant/i }));
};

const sendInstruction = (text: string) => {
  fireEvent.change(screen.getByPlaceholderText(/describe what to improve/i), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: /Send/i }));
};

describe('ResumeEditView', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('renders the split editor: metadata, code pane, live preview, and AI fix', () => {
    renderEditor(<ResumeEditView resume={resumeWithContent} onBack={vi.fn()} onSave={vi.fn()} />);

    // Title shown in the toolbar; details are hidden behind a modal
    expect(screen.getByText('Saurav — Resume')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Auto-generated from profile')).not.toBeInTheDocument();

    // Code editor (preview is hidden by default until toggled)
    expect(editorHost?.querySelector('.cm-editor')).toBeInTheDocument();
    expect(screen.queryByTitle('Resume live preview')).not.toBeInTheDocument();

    // Actions + AI assistant chat toggle
    expect(screen.getByRole('button', { name: /AI assistant/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save & Rebuild/i })).toBeInTheDocument();

    // Open the AI chat panel and verify the composer is present
    fireEvent.click(screen.getByRole('button', { name: /AI assistant/i }));
    expect(screen.getByPlaceholderText(/describe what to improve/i)).toBeInTheDocument();

    // Open the details modal to edit title/description
    fireEvent.click(screen.getByRole('button', { name: /Edit details/i }));
    expect(screen.getByDisplayValue('Saurav — Resume')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Auto-generated from profile')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    // Open the on-demand preview drawer
    fireEvent.click(screen.getByRole('button', { name: /Preview/i }));
    expect(screen.getByTitle('Resume live preview')).toBeInTheDocument();
  });

  it('edits title and description via the details modal', async () => {
    const onSave = vi.fn();
    renderEditor(<ResumeEditView resume={resumeWithContent} onBack={vi.fn()} onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: /Edit details/i }));
    fireEvent.change(screen.getByDisplayValue('Saurav — Resume'), { target: { value: 'New Title' } });
    fireEvent.change(screen.getByDisplayValue('Auto-generated from profile'), { target: { value: 'New Description' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    // Toolbar reflects the updated title.
    expect(screen.getByText('New Title')).toBeInTheDocument();

    // Submit uses the edited title/description.
    fireEvent.click(screen.getByRole('button', { name: /Save & Rebuild/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const [, payload] = onSave.mock.calls[0];
    expect(payload.title).toBe('New Title');
    expect(payload.description).toBe('New Description');
  });

  it('pre-fills the HTML source from the content snapshot when no HTML is stored', () => {
    renderEditor(<ResumeEditView resume={resumeWithContent} onBack={vi.fn()} onSave={vi.fn()} />);

    const doc = getDocText();
    expect(doc).toContain('<!DOCTYPE html>');
    expect(doc).toContain('<h1 class="name">');
    expect(doc).toContain('Saurav');
    expect(doc).toContain('Hello, this is my summary.');
    expect(doc).toContain('Technical Skills');
    expect(doc).toContain('React  •  TypeScript  •  Node.js');
  });

  it('uses the stored HTML source when present and adds placeholder standalone resume', () => {
    const withHtml = { _id: 'r3', title: 'Custom', description: '', html: '<html><body><h1>Custom Resume</h1></body></html>' };
    renderEditor(<ResumeEditView resume={withHtml} onBack={vi.fn()} onSave={vi.fn()} />);

    expect(getDocText()).toBe('<html><body><h1>Custom Resume</h1></body></html>');
  });

  it('submits the edited HTML on Save & Rebuild', async () => {
    const onSave = vi.fn();
    renderEditor(<ResumeEditView resume={resumeWithContent} onBack={vi.fn()} onSave={onSave} />);

    setDoc('<html><body><h1>Edited</h1></body></html>');
    // `setDoc` dispatches synchronously, but `htmlSrc` state flushes async; let
    // it settle before submitting so `handleSubmit` reads the edited source.
    await act(async () => {});
    fireEvent.click(screen.getByRole('button', { name: /Save & Rebuild/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const [id, payload] = onSave.mock.calls[0];
    expect(id).toBe('r1');
    expect(payload.title).toBe('Saurav — Resume');
    expect(payload.html).toBe('<html><body><h1>Edited</h1></body></html>');
  });

  it('holds the AI result for approval, then applies it on approve', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ html: '<html><body><h1>Improved</h1></body></html>' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderEditor(<ResumeEditView resume={resumeWithContent} onBack={vi.fn()} onSave={vi.fn()} />);
    openChat();
    sendInstruction('Improve the impact bullets');

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/ai/fix-resume', expect.anything()));
    // The editor is untouched until the user approves.
    await waitFor(() => expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument());
    expect(getDocText()).not.toContain('Improved');

    fireEvent.click(screen.getByRole('button', { name: /Approve/i }));
    await waitFor(() => expect(getDocText()).toContain('Improved'));
  });

  it('rejects AI changes without touching the editor', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ html: '<html><body><h1>Improved</h1></body></html>' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderEditor(<ResumeEditView resume={resumeWithContent} onBack={vi.fn()} onSave={vi.fn()} />);
    openChat();
    sendInstruction('Rewrite the summary');

    await waitFor(() => expect(screen.getByRole('button', { name: /Reject/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Reject/i }));

    expect(getDocText()).not.toContain('Improved');
  });

  it('sends the AI instruction from the chat to the endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ html: '<html><body><h1>Ok</h1></body></html>' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderEditor(<ResumeEditView resume={resumeWithContent} onBack={vi.fn()} onSave={vi.fn()} />);
    openChat();
    sendInstruction('Make the language more concise');

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [, init] = fetchMock.mock.calls[0];
    const parsed = JSON.parse(init.body);
    expect(parsed.html).toContain('<!DOCTYPE html>');
    expect(parsed.instruction).toBe('Make the language more concise');
  });

  it('shows an assistant error message when the AI fix fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'boom' }),
    }));

    renderEditor(<ResumeEditView resume={resumeWithContent} onBack={vi.fn()} onSave={vi.fn()} />);
    openChat();
    sendInstruction('Rewrite the summary');

    await waitFor(() => expect(screen.getByText(/couldn[’']t draft/i)).toBeInTheDocument());
    // Should not overwrite the source when it fails.
    expect(getDocText()).toContain('Saurav');
  });
});
