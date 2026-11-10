import React, { useState, useRef } from 'react';
import Button from '@/components/ui/Button';
import { ArrowLeft, CheckCircle, Plus, Trash2, Code2, ListChecks } from 'lucide-react';
import toast from 'react-hot-toast';
import { htmlElementToPdfBlob, blobToBase64 } from '@/lib/htmlToPdf';

// Minimal resume shape the editor needs. The full page resumes (which come from
// the API) carry an optional normalized `content` snapshot that auto-fills the
// form.
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
    workExperience?: any[];
    education?: any[];
    projects?: any[];
  };
}

interface Props {
  resume: EditResume;
  onBack: () => void;
  onSave: (id: string, payload: {
    title: string;
    description: string;
    content?: any;
    html?: string;
    pdfBase64?: string;
  }) => void;
}

/**
 * Full-page editor for a single resume. Reads the resume's content snapshot and
 * auto-fills every section (summary, skills, experience, education, projects).
 * Saving sends the edited content back so the API can rebuild the PDF.
 */
const STARTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 32px; }
  h1 { font-size: 26px; margin: 0 0 2px; }
  .contact { color: #444; font-size: 13px; margin-bottom: 18px; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #bbb; padding-bottom: 3px; margin: 18px 0 8px; }
  .entry { margin-bottom: 10px; }
  .entry .top { font-weight: bold; }
  .entry .dates { float: right; color: #666; font-weight: normal; font-size: 12px; }
  ul { margin: 4px 0; padding-left: 20px; }
</style>
</head>
<body>
  <h1>Your Name</h1>
  <div class="contact">email@example.com &bull; City, Country &bull; linkedin.com/in/you</div>

  <h2>Summary</h2>
  <p>Professional summary goes here.</p>

  <h2>Experience</h2>
  <div class="entry">
    <div class="top">Job Title <span class="dates">May 2024 – Present</span></div>
    <div>Company Name</div>
    <ul><li>Highlight your impact.</li></ul>
  </div>

  <h2>Education</h2>
  <div class="entry">
    <div>Degree, Field — University (2020)</div>
  </div>
</body>
</html>`;

const ResumeEditView = ({ resume, onBack, onSave }: Props) => {
  const c0 = resume.content || {};
  const [title, setTitle] = useState(resume.title);
  const [description, setDescription] = useState(resume.description || '');
  const [summary, setSummary] = useState(c0.summary || '');
  const [skillsText, setSkillsText] = useState((c0.skills || []).join(', '));
  const [work, setWork] = useState<any[]>((c0.workExperience || []).map((w: any) => ({ ...w })));
  const [edu, setEdu] = useState<any[]>((c0.education || []).map((e: any) => ({ ...e })));
  const [projects, setProjects] = useState<any[]>((c0.projects || []).map((p: any) => ({ ...p })));
  const [saving, setSaving] = useState(false);

  const [mode, setMode] = useState<'form' | 'html'>('form');
  const [htmlSrc, setHtmlSrc] = useState<string>(resume.html || '');
  const [htmlView, setHtmlView] = useState<'design' | 'source'>('design');
  const [designKey, setDesignKey] = useState(0);
  const printRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '<br/>');

  const formToHtml = () => {
    const skillItems = skillsText.split(',').map(s => s.trim()).filter(Boolean).map(s => `<li>${escapeHtml(s)}</li>`).join('');
    const workHtml = work.filter(w => w.role || w.company).map(w => `
      <div class="entry">
        <div class="top">${escapeHtml(w.role)} <span class="dates">${escapeHtml(w.startDate)} – ${escapeHtml(w.endDate || 'Present')}</span></div>
        <div>${escapeHtml(w.company)}</div>
        <ul><li>${escapeHtml(w.description || '')}</li></ul>
      </div>`).join('');
    const eduHtml = edu.filter(e => e.degree || e.school).map(e => `
      <div class="entry">
        <div>${escapeHtml(e.degree)} — ${escapeHtml(e.school)} (${escapeHtml(e.year)})</div>
      </div>`).join('');
    const projHtml = projects.filter(p => p.name).map(p => `
      <div class="entry">
        <div class="top">${escapeHtml(p.name)}</div>
        <ul><li>${escapeHtml(p.description || '')}${p.liveUrl ? ` · ${escapeHtml(p.liveUrl)}` : ''}</li></ul>
      </div>`).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" />
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 32px; }
  h1 { font-size: 26px; margin: 0 0 2px; }
  .contact { color: #444; font-size: 13px; margin-bottom: 18px; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #bbb; padding-bottom: 3px; margin: 18px 0 8px; }
  .entry { margin-bottom: 10px; }
  .entry .top { font-weight: bold; }
  .entry .dates { float: right; color: #666; font-weight: normal; font-size: 12px; }
  ul { margin: 4px 0; padding-left: 20px; }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="contact">${escapeHtml(c0.email || '')} &bull; ${escapeHtml(c0.location || '')}</div>
  <h2>Summary</h2><p>${escapeHtml(summary)}</p>
  ${skillItems ? `<h2>Skills</h2><ul>${skillItems}</ul>` : ''}
  ${workHtml ? `<h2>Experience</h2>${workHtml}` : ''}
  ${projHtml ? `<h2>Projects</h2>${projHtml}` : ''}
  ${eduHtml ? `<h2>Education</h2>${eduHtml}` : ''}
</body>
</html>`;
  };

  // Turn the preview iframe into an editable "design mode" document. Any text
  // can be clicked and edited in place; changes sync back to htmlSrc.
  const handleIframeLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc || !doc.body) return;
    doc.designMode = 'on';
    doc.body.style.margin = '0';
    doc.addEventListener('input', () => {
      const html = doc.documentElement ? doc.documentElement.outerHTML : doc.body.innerHTML;
      setHtmlSrc(html);
    });
  };

  const applyHtml = (next: string) => {
    setHtmlSrc(next);
    setDesignKey((k) => k + 1); // force the design iframe to reload with new content
  };

  const updateItem = (setter: React.Dispatch<React.SetStateAction<any[]>>, index: number, patch: object) => {
    setter(prev => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const inputCls = "w-full px-3 py-2 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-lg text-white focus:border-[var(--primary)] focus:outline-none text-sm";
  const labelCls = "block text-xs font-medium text-[var(--text-muted)] mb-1";

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      if (mode === 'html') {
        // Free-form HTML mode: persist the raw HTML and generate the PDF in the
        // browser from the live preview.
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
      } else {
        const existing = resume.content || {};
        const content = {
          ...existing,
          summary,
          skills: skillsText.split(',').map((s: string) => s.trim()).filter(Boolean),
          workExperience: work.filter(w => (w.role || '').trim() || (w.company || '').trim()),
          education: edu.filter(e => (e.degree || '').trim() || (e.school || '').trim()),
          projects: projects.filter(p => (p.name || '').trim()),
        };
        await onSave(resume._id, {
          title: title.trim(),
          description: description.trim(),
          content,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 lg:px-8 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-raised)' }}>
        <Button
          variant="ghost"
          onClick={onBack}
          leftIcon={<ArrowLeft className="w-5 h-5" />}
          className="px-4 py-2 shrink-0"
        >
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate" style={{ color: 'var(--text-main)' }}>Edit — {resume.title}</h2>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Changes rebuild the PDF when you save</p>
        </div>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={saving}
          isLoading={saving}
          leftIcon={<CheckCircle className="w-4 h-4" />}
          className="px-5 py-2"
        >
          {saving ? 'Saving...' : 'Save & Rebuild'}
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Mode toggle */}
          <div className="flex items-center gap-2 border-b border-[var(--border-glass)] pb-3">
            <Button
              variant={mode === 'form' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setMode('form')}
              leftIcon={<ListChecks className="w-4 h-4" />}
            >
              Form
            </Button>
            <Button
              variant={mode === 'html' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setMode('html')}
              leftIcon={<Code2 className="w-4 h-4" />}
            >
              HTML
            </Button>
          </div>

          <div style={{ display: mode === 'form' ? undefined : 'none' }}>
          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Title <span className="text-[var(--danger)]">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Software Engineer Resume"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
                className={inputCls}
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className={labelCls}>Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="Professional summary shown at the top of the resume"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Skills */}
          <div>
            <label className={labelCls}>Skills (comma separated)</label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="React, TypeScript, Node.js, ..."
              className={inputCls}
            />
          </div>

          {/* Experience */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-[var(--text-main)]">Experience</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWork(prev => [...prev, { role: '', company: '', startDate: '', endDate: '', description: '' }])}
                leftIcon={<Plus className="w-4 h-4" />}
                className="!px-3 !py-1 text-xs"
              >
                Add
              </Button>
            </div>
            <div className="space-y-3">
              {work.map((w: any, i: number) => (
                <div key={i} className="border border-[var(--border-glass)] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">Experience {i + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setWork(prev => prev.filter((_, j) => j !== i))}
                      aria-label="Remove experience"
                      className="w-7 h-7 !p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Role</label>
                      <input className={inputCls} value={w.role || ''} onChange={(e) => updateItem(setWork, i, { role: e.target.value })} placeholder="Frontend Developer" />
                    </div>
                    <div>
                      <label className={labelCls}>Company</label>
                      <input className={inputCls} value={w.company || ''} onChange={(e) => updateItem(setWork, i, { company: e.target.value })} placeholder="Acme Inc" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Start</label>
                      <input className={inputCls} value={w.startDate || ''} onChange={(e) => updateItem(setWork, i, { startDate: e.target.value })} placeholder="May 2025" />
                    </div>
                    <div>
                      <label className={labelCls}>End</label>
                      <input className={inputCls} value={w.endDate || ''} onChange={(e) => updateItem(setWork, i, { endDate: e.target.value })} placeholder="Present" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea className={`${inputCls} resize-none`} rows={2} value={w.description || ''} onChange={(e) => updateItem(setWork, i, { description: e.target.value })} placeholder="Key responsibilities / achievements" />
                  </div>
                </div>
              ))}
              {work.length === 0 && (
                <p className="text-xs text-[var(--text-dim)]">No experience entries.</p>
              )}
            </div>
          </div>

          {/* Education */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-[var(--text-main)]">Education</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEdu(prev => [...prev, { degree: '', school: '', year: '' }])}
                leftIcon={<Plus className="w-4 h-4" />}
                className="!px-3 !py-1 text-xs"
              >
                Add
              </Button>
            </div>
            <div className="space-y-3">
              {edu.map((e: any, i: number) => (
                <div key={i} className="border border-[var(--border-glass)] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">Education {i + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEdu(prev => prev.filter((_, j) => j !== i))}
                      aria-label="Remove education"
                      className="w-7 h-7 !p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Degree</label>
                      <input className={inputCls} value={e.degree || ''} onChange={(ev) => updateItem(setEdu, i, { degree: ev.target.value })} placeholder="B.Tech" />
                    </div>
                    <div>
                      <label className={labelCls}>Institution</label>
                      <input className={inputCls} value={e.school || ''} onChange={(ev) => updateItem(setEdu, i, { school: ev.target.value })} placeholder="University Name" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Year</label>
                      <input className={inputCls} value={e.year || ''} onChange={(ev) => updateItem(setEdu, i, { year: ev.target.value })} placeholder="2025" />
                    </div>
                  </div>
                </div>
              ))}
              {edu.length === 0 && (
                <p className="text-xs text-[var(--text-dim)]">No education entries.</p>
              )}
            </div>
          </div>

          {/* Projects */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-[var(--text-main)]">Projects</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProjects(prev => [...prev, { name: '', description: '', liveUrl: '', codeUrl: '' }])}
                leftIcon={<Plus className="w-4 h-4" />}
                className="!px-3 !py-1 text-xs"
              >
                Add
              </Button>
            </div>
            <div className="space-y-3">
              {projects.map((p: any, i: number) => (
                <div key={i} className="border border-[var(--border-glass)] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">Project {i + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProjects(prev => prev.filter((_, j) => j !== i))}
                      aria-label="Remove project"
                      className="w-7 h-7 !p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Name</label>
                      <input className={inputCls} value={p.name || ''} onChange={(e) => updateItem(setProjects, i, { name: e.target.value })} placeholder="Project name" />
                    </div>
                    <div>
                      <label className={labelCls}>URL</label>
                      <input className={inputCls} value={p.liveUrl || ''} onChange={(e) => updateItem(setProjects, i, { liveUrl: e.target.value })} placeholder="https://..." />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea className={`${inputCls} resize-none`} rows={2} value={p.description || ''} onChange={(e) => updateItem(setProjects, i, { description: e.target.value })} placeholder="What it does / your role" />
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-xs text-[var(--text-dim)]">No projects.</p>
              )}
            </div>
          </div>
          </div>

          <div style={{ display: mode === 'html' ? undefined : 'none' }} className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-2">
                <Button variant={htmlView === 'design' ? 'primary' : 'ghost'} size="sm" onClick={() => { setHtmlView('design'); setDesignKey((k) => k + 1); }} className="!px-3 !py-1 text-xs">
                  Design
                </Button>
                <Button variant={htmlView === 'source' ? 'primary' : 'ghost'} size="sm" onClick={() => setHtmlView('source')} className="!px-3 !py-1 text-xs">
                  Source
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => applyHtml(formToHtml())} className="!px-3 !py-1 text-xs">
                  Convert form → HTML
                </Button>
                <Button variant="ghost" size="sm" onClick={() => applyHtml(STARTER_HTML)} className="!px-3 !py-1 text-xs">
                  Starter template
                </Button>
              </div>
            </div>

            {htmlView === 'design' ? (
              <div>
                <p className="text-xs text-[var(--text-dim)] mb-2">
                  Click any text on the document to edit it in place — like a PDF in design mode.
                </p>
                <div className="overflow-auto border border-[var(--border-glass)] rounded-lg bg-white" style={{ maxHeight: '70vh' }}>
                  <iframe
                    key={designKey}
                    ref={iframeRef}
                    title="Resume design editor"
                    srcDoc={htmlSrc}
                    onLoad={handleIframeLoad}
                    className="block"
                    style={{ width: 794, minHeight: 1123, border: 'none', background: '#fff' }}
                  />
                </div>
              </div>
            ) : (
              <textarea
                value={htmlSrc}
                onChange={(e) => setHtmlSrc(e.target.value)}
                spellCheck={false}
                className="w-full h-80 font-mono text-xs p-3 bg-[var(--bg-deep)] border border-[var(--border-glass)] rounded-lg text-white focus:outline-none"
                placeholder="Paste your full HTML resume here…"
              />
            )}

            {/* Hidden capture target used to rasterize the PDF on save. */}
            <div aria-hidden style={{ position: 'absolute', left: -9999, top: 0, width: 794, backgroundColor: '#fff' }}>
              <div ref={printRef} style={{ width: 794, minHeight: 1123, color: '#111' }} dangerouslySetInnerHTML={{ __html: htmlSrc }} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResumeEditView;
