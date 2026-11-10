import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResumeEditView from '@/components/ResumeEditView';

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

describe('ResumeEditView', () => {
  it('auto-fills every section from the resume content snapshot', () => {
    render(<ResumeEditView resume={resumeWithContent} onBack={vi.fn()} onSave={vi.fn()} />);

    // Metadata
    expect(screen.getByDisplayValue('Saurav — Resume')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Auto-generated from profile')).toBeInTheDocument();
    // Summary
    expect(screen.getByDisplayValue('Hello, this is my summary.')).toBeInTheDocument();
    // Skills (comma separated)
    expect(screen.getByDisplayValue('React, TypeScript, Node.js')).toBeInTheDocument();
    // Experience
    expect(screen.getByDisplayValue('Full Stack Dev')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Acme')).toBeInTheDocument();
    // Education
    expect(screen.getByDisplayValue('B.Tech in Computer Science')).toBeInTheDocument();
    // Projects
    expect(screen.getByDisplayValue('NebulaPlan')).toBeInTheDocument();
  });

  it('shows empty states when the resume has no content snapshot', () => {
    const legacy = { _id: 'r2', title: 'Legacy', description: '' };
    render(<ResumeEditView resume={legacy} onBack={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByDisplayValue('Legacy')).toBeInTheDocument();
    expect(screen.getByText('No experience entries.')).toBeInTheDocument();
    expect(screen.getByText('No education entries.')).toBeInTheDocument();
    expect(screen.getByText('No projects.')).toBeInTheDocument();
  });

  it('submits the edited content on Save & Rebuild', async () => {
    const onSave = vi.fn();
    render(<ResumeEditView resume={resumeWithContent} onBack={vi.fn()} onSave={onSave} />);

    // Change the summary to simulate an edit.
    fireEvent.change(screen.getByDisplayValue('Hello, this is my summary.'), {
      target: { value: 'Edited summary' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Save & Rebuild/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const [id, payload] = onSave.mock.calls[0];
    expect(id).toBe('r1');
    expect(payload.title).toBe('Saurav — Resume');
    expect(payload.content.summary).toBe('Edited summary');
    expect(payload.content.skills).toEqual(['React', 'TypeScript', 'Node.js']);
    expect(payload.content.workExperience).toHaveLength(1);
    expect(payload.content.education).toHaveLength(1);
    expect(payload.content.projects).toHaveLength(1);
  });

  it('switches to HTML mode and converts the form into HTML source', () => {
    render(<ResumeEditView resume={resumeWithContent} onBack={vi.fn()} onSave={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /^HTML$/i }));

    // Default view is the Design (in-place editable document) mode.
    expect(screen.getByTitle('Resume design editor')).toBeInTheDocument();

    // Switch to Source to inspect the HTML.
    fireEvent.click(screen.getByRole('button', { name: /^Source$/i }));
    const textarea = screen.getByPlaceholderText(/Paste your full HTML resume here/i) as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Convert form → HTML/i }));

    expect(textarea.value).toContain('<h1>');
    expect(textarea.value).toContain('Saurav — Resume');
    expect(textarea.value).toContain('<li>React</li>');
    expect(textarea.value).toContain('<li>TypeScript</li>');
  });

  it('shows the Edit Mode toggle and toggles read-only state', () => {
    render(<ResumeEditView resume={resumeWithContent} onBack={vi.fn()} onSave={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /^HTML$/i }));

    // Design mode is the default and Edit Mode starts on.
    const toggle = screen.getByRole('switch', { name: /Toggle edit mode/i });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText(/On — click any word and type/i)).toBeInTheDocument();

    // Turn it off → document becomes read-only.
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText(/Off — the document is read-only/i)).toBeInTheDocument();
  });
});
