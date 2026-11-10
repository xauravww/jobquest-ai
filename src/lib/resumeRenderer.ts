import { jsPDF } from 'jspdf';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface WorkEntry {
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface EduEntry {
  degree: string;
  school: string;
  year: string;
}

export interface ProjectEntry {
  name: string;
  description: string;
  liveUrl: string;
  codeUrl: string;
}

export interface ResumeContent {
  title: string;
  location: string;
  summary: string;
  email: string;
  linkedin: string;
  portfolio: string;
  skills: string[];
  workExperience: WorkEntry[];
  education: EduEntry[];
  projects: ProjectEntry[];
  achievements: string[];
}

// ═══════════════════════════════════════════════
// Data cleaning
// ═══════════════════════════════════════════════

function cleanSkills(raw: string[]): string[] {
  const out: string[] = [];
  for (const s of raw) {
    const parts = s.split(/\n/).map(p => p.replace(/^[A-Za-z&\s/]+:\s*/, '').trim()).filter(Boolean);
    out.push(...parts);
  }
  return [...new Set(out)].filter(s => s.length > 0 && s.length < 40);
}

function cleanProjectName(raw: string): string {
  return raw
    .split(/\|/)[0]
    .replace(/\d{4}$/, '')
    .replace(/[,|]\s*(Next\.js|React|Node|TypeScript|JavaScript|Prisma|PostgreSQL|MongoDB|LangChain|OpenAI|Tailwind|AI|CSS|HTML).*/i, '')
    .trim();
}

function extractProjectUrls(desc: string, existing: { liveUrl?: string; codeUrl?: string }) {
  let liveUrl = existing.liveUrl || '';
  let codeUrl = existing.codeUrl || '';

  if (!liveUrl) {
    const liveMatch = desc.match(/Live:\s*([\w.-]+\.[\w.]+[\w/]*)/i);
    if (liveMatch) liveUrl = 'https://' + liveMatch[1];
  }
  if (!codeUrl) {
    const ghMatch = desc.match(/GitHub:\s*([\w.-]+(?:\/[\w.-]+)*)/i);
    if (ghMatch) {
      const val = ghMatch[1];
      codeUrl = val.includes('github.com') ? 'https://' + val : 'https://github.com/' + val;
    }
  }

  const cleanDesc = desc
    .replace(/[-–—]\s*Live:\s*[\w.-]+\.[\w.]+[\w/]*/gi, '')
    .replace(/[-–—]?\s*GitHub:\s*[\w.-]+(?:\/[\w.-]+)*/gi, '')
    .trim();

  return { liveUrl, codeUrl, cleanDesc };
}

// Normalize a date (Date object, ISO string, or the long serialized form
// like "Sat May 31 2025 05:30:00 GMT+0530 (India Standard Time)") into a
// compact "Mon YYYY" label for the resume.
function fmtShortDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  const s = String(value).trim();
  if (!s) return '';

  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const mo = d.toLocaleString('en-US', { month: 'short' });
    return `${mo} ${d.getFullYear()}`;
  }

  const m = s.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{1,2},?\s*(\d{4})/i);
  if (m) {
    const month = m[1].charAt(0).toUpperCase() + m[1].slice(1, 3).toLowerCase();
    return `${month} ${m[2]}`;
  }
  const y = s.match(/(\d{4})/);
  if (y) return y[1];
  return s;
}

function cleanWorkEntry(w: { position?: string; company?: string; startDate?: string; endDate?: string; description?: string }): WorkEntry {
  const role = (w.position || '').replace(/\s+/g, ' ').trim();
  const description = (w.description || '').trim();
  const company = (w.company || '')
    .replace(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{4}.*$/i, '')
    .replace(/^(Present|Current)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    role,
    company,
    startDate: fmtShortDate(w.startDate),
    endDate: fmtShortDate(w.endDate),
    description,
  };
}

function cleanEducation(edu: { degree?: string; field?: string; institution?: string; endDate?: string }): EduEntry {
  const degree = (edu.degree || '').trim();
  const field = (edu.field || '').trim();
  const school = (edu.institution || '').replace(/^[-–—]\s*/, '').trim();
  const year = edu.endDate ? (String(edu.endDate).match(/\d{4}/)?.[0] || '') : '';

  const fullDegree = degree && field ? `${degree} in ${field}` : degree || field;

  return { degree: fullDegree, school, year };
}

function splitBullets(desc: string): string[] {
  if (!desc) return [];
  const items = desc
    .split(/\s*[-–—]{1,2}\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
  return items.length > 0 ? items : [desc];
}

function isRealUrl(s: string): boolean {
  if (!s) return false;
  if (/^(gmail|yahoo|hotmail|outlook)\.(com|co)$/i.test(s.replace(/^https?:\/\/(www\.)?/, ''))) return false;
  return s.length > 5;
}

function cleanUrl(s: string): string {
  return s.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

function normalizeAchievements(raw: unknown[]): string[] {
  return (raw || [])
    .filter((a: any) => a && (typeof a === 'string' ? a.trim() : (a.title || a.description)))
    .map((a: any) => {
      if (typeof a === 'string') return a.trim();
      const title = (a.title || '').trim();
      const desc = (a.description || '').trim();
      if (title && desc) return `${title}: ${desc}`;
      return title || desc;
    })
    .filter(Boolean);
}

// ═══════════════════════════════════════════════
// Build content from a user profile document
// ═══════════════════════════════════════════════

export function contentFromProfile(user: any): ResumeContent {
  const p = (user && user.profile) || {};
  const skills = cleanSkills(p.skills || []);

  const workExperience = (p.workExperience || [])
    .map(cleanWorkEntry)
    .filter((w: any) => w.role || w.company);

  const education = (p.education || [])
    .map(cleanEducation)
    .filter((e: any) => e.degree || e.school);

  const projects = (p.projects || []).map((proj: any) => {
    const projName = cleanProjectName(proj.name || '');
    const withUrls = {
      ...proj,
      liveUrl: proj.liveUrl || (proj.url && !/github/i.test(proj.url) ? proj.url : ''),
      codeUrl: proj.codeUrl || (proj.url && /github/i.test(proj.url) ? proj.url : ''),
    };
    const { liveUrl, codeUrl, cleanDesc } = extractProjectUrls(proj.description || '', withUrls);
    return { name: projName, description: cleanDesc, liveUrl, codeUrl };
  });

  return {
    title: p.title || '',
    location: p.location || '',
    summary: p.summary || '',
    email: p.resumeEmail || user.email || '',
    linkedin: p.linkedin || '',
    portfolio: p.portfolio || '',
    skills,
    workExperience,
    education,
    projects,
    achievements: normalizeAchievements(p.achievements || []),
  };
}

// Apply normalization to a content object coming from the edit form (the form
// sends plain strings/arrays, but we still want the same split/date rules).
export function normalizeContent(raw: Partial<ResumeContent>): ResumeContent {
  return {
    title: (raw.title || '').trim(),
    location: (raw.location || '').trim(),
    summary: (raw.summary || '').trim(),
    email: (raw.email || '').trim(),
    linkedin: (raw.linkedin || '').trim(),
    portfolio: (raw.portfolio || '').trim(),
    skills: cleanSkills(raw.skills || []),
    workExperience: (raw.workExperience || []).map(cleanWorkEntry).filter((w: any) => w.role || w.company),
    education: (raw.education || []).map(cleanEducation).filter((e: any) => e.degree || e.school),
    projects: (raw.projects || []).map((proj: any) => {
      const projName = cleanProjectName(proj.name || '');
      const withUrls = {
        liveUrl: proj.liveUrl || '',
        codeUrl: proj.codeUrl || '',
      };
      const { liveUrl, codeUrl, cleanDesc } = extractProjectUrls(proj.description || '', withUrls);
      return { name: projName, description: cleanDesc, liveUrl, codeUrl };
    }),
    achievements: normalizeAchievements(raw.achievements || []),
  };
}

// ═══════════════════════════════════════════════
// PDF renderer
// ═══════════════════════════════════════════════

export function renderResumePdf(name: string, content: ResumeContent): Buffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const PW = 210;
  const M = 14;
  const W = PW - M * 2;
  const BOTTOM = 282;
  let y = 14;

  const BLK = '#111111';
  const GRY = '#444444';
  const LT = '#666666';

  const needPage = (h: number) => { if (y + h > BOTTOM) { doc.addPage(); y = 14; } };

  const hRule = () => {
    doc.setDrawColor('#bbbbbb');
    doc.setLineWidth(0.3);
    doc.line(M, y, M + W, y);
    y += 3;
  };

  const secHead = (label: string) => {
    y += 5;
    needPage(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(BLK);
    doc.text(label.toUpperCase(), M, y);
    y += 1.5;
    hRule();
  };

  const wrap = (text: string, maxW: number = W): string[] =>
    doc.splitTextToSize(text, maxW);

  const textBlock = (text: string, indent = 0) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(GRY);
    for (const ln of wrap(text, W - indent)) {
      needPage(3.5);
      doc.text(ln, M + indent, y);
      y += 3.5;
    }
  };

  const bulletItem = (text: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(GRY);
    const lines = wrap(text, W - 7);
    for (let i = 0; i < lines.length; i++) {
      needPage(3.5);
      if (i === 0) doc.text('•', M + 2, y);
      doc.text(lines[i], M + 5.5, y);
      y += 3.5;
    }
  };

  const LINK_CLR = '#1a5fb4';
  const ensureHttp = (url: string) => /^https?:\/\//.test(url) ? url : 'https://' + url;

  const link = (label: string, url: string, x: number) => {
    doc.setTextColor(LINK_CLR);
    doc.textWithLink(label, x, y, { url: ensureHttp(url) });
    doc.setTextColor(LT);
  };

  const getTextWidth = (text: string) => doc.getTextWidth(text);

  // ═══════════ HEADER ═══════════

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(BLK);
  doc.text(name.toUpperCase(), PW / 2, y, { align: 'center' });
  y += 5.5;

  if (content.title) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(GRY);
    doc.text(content.title, PW / 2, y, { align: 'center' });
    y += 4.5;
  }

  {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(LT);

    type ContactItem = { text: string; url?: string };
    const items: ContactItem[] = [];
    if (content.email) items.push({ text: content.email, url: 'mailto:' + content.email });
    if (content.location) items.push({ text: content.location });
    if (isRealUrl(content.linkedin)) items.push({ text: cleanUrl(content.linkedin), url: ensureHttp(content.linkedin) });
    if (isRealUrl(content.portfolio)) items.push({ text: cleanUrl(content.portfolio), url: ensureHttp(content.portfolio) });

    if (items.length) {
      const sep = '  |  ';
      const totalW = items.reduce((sum, it, i) => {
        return sum + getTextWidth(it.text) + (i < items.length - 1 ? getTextWidth(sep) : 0);
      }, 0);
      let cx = (PW - totalW) / 2;

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.url) {
          link(it.text, it.url, cx);
        } else {
          doc.setTextColor(LT);
          doc.text(it.text, cx, y);
        }
        cx += getTextWidth(it.text);
        if (i < items.length - 1) {
          doc.setTextColor(LT);
          doc.text(sep, cx, y);
          cx += getTextWidth(sep);
        }
      }
      y += 4;
    }
  }
  hRule();

  // ═══════════ SUMMARY ═══════════

  if (content.summary) {
    secHead('Summary');
    textBlock(content.summary);
  }

  // ═══════════ SKILLS ═══════════

  if (content.skills.length > 0) {
    secHead('Technical Skills');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(GRY);
    for (const ln of wrap(content.skills.join('  •  '))) {
      needPage(3.5);
      doc.text(ln, M, y);
      y += 3.5;
    }
  }

  // ═══════════ EXPERIENCE ═══════════

  if (content.workExperience.length > 0) {
    secHead('Experience');
    for (const w of content.workExperience) {
      needPage(14);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(BLK);
      doc.text(w.role, M, y);

      const dates = [w.startDate, w.endDate].filter(Boolean).join(' – ');
      if (dates) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(LT);
        doc.text(dates, M + W, y, { align: 'right' });
      }
      y += 3.8;

      if (w.company) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(LT);
        doc.text(w.company, M, y);
        y += 3.5;
      }

      for (const b of splitBullets(w.description)) {
        bulletItem(b);
      }
      y += 2;
    }
  }

  // ═══════════ PROJECTS ═══════════

  if (content.projects.length > 0) {
    secHead('Projects');
    for (const proj of content.projects) {
      needPage(12);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(BLK);
      doc.text(proj.name, M, y);
      y += 3.8;

      for (const b of splitBullets(proj.description)) {
        bulletItem(b);
      }

      const hasLive = proj.liveUrl && isRealUrl(proj.liveUrl);
      const hasCode = proj.codeUrl && isRealUrl(proj.codeUrl);
      if (hasLive || hasCode) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        needPage(3.5);
        let lx = M + 5.5;
        if (hasLive) {
          doc.setTextColor(LT);
          doc.text('Live: ', lx, y);
          lx += getTextWidth('Live: ');
          link(cleanUrl(proj.liveUrl!), proj.liveUrl!, lx);
          lx += getTextWidth(cleanUrl(proj.liveUrl!));
        }
        if (hasLive && hasCode) {
          doc.setTextColor(LT);
          doc.text('   |   ', lx, y);
          lx += getTextWidth('   |   ');
        }
        if (hasCode) {
          doc.setTextColor(LT);
          doc.text('GitHub: ', lx, y);
          lx += getTextWidth('GitHub: ');
          link(cleanUrl(proj.codeUrl!), proj.codeUrl!, lx);
        }
        y += 3.5;
      }
      y += 2;
    }
  }

  // ═══════════ EDUCATION ═══════════

  if (content.education.length > 0) {
    secHead('Education');
    for (const e of content.education) {
      needPage(8);

      if (e.degree) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(BLK);
        doc.text(e.degree, M, y);

        if (e.year) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(LT);
          doc.text(e.year, M + W, y, { align: 'right' });
        }
        y += 3.8;
      }

      if (e.school) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(LT);
        doc.text(e.school, M, y);
        y += 3.8;
      }
      y += 1.5;
    }
  }

  // ═══════════ ACHIEVEMENTS ═══════════

  if (content.achievements.length > 0) {
    secHead('Achievements & Extracurricular');
    for (const a of content.achievements) {
      bulletItem(a);
    }
  }

  // ═══════════ OUTPUT ═══════════

  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}
