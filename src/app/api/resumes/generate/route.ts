import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { jsPDF } from 'jspdf';

// ═══════════════════════════════════════════════
// Data cleaning — normalize mangled parser output
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

function cleanWorkRole(raw: string): { role: string; company: string } {
  // "Digitech Services Pvt. Ltd.Jun 2025" → separate company from date
  // "Prodoc AIJan 2025" → separate
  const dateStripped = raw.replace(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{4}.*$/i, '').trim();
  return { role: dateStripped, company: '' };
}

function cleanWorkEntry(w: { role: string; company: string; startDate: string; endDate: string; description: string }) {
  const desc = w.description || '';

  // Extract actual role and company from description prefix
  // Pattern: "Full Stack Developer (Contract, Remote)Delhi – ..."
  // or "Full Stack Developer InternBengaluru, India – ..."
  const roleMatch = desc.match(/^([\w\s]+(?:Developer|Engineer|Designer|Manager|Intern|Analyst|Architect|Lead)[\w\s()]*?)(?:\s*[-–—]|\n)/i);

  let actualRole = '';
  let actualCompany = '';
  let cleanDesc = desc;

  // Clean the role field — remove mashed dates
  const roleCleaned = w.role
    .replace(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{4}.*$/i, '')
    .replace(/\d{4}.*$/, '')
    .trim();

  // If role field looks like a company name (has Ltd, Inc, AI, etc.)
  const looksLikeCompany = /(?:Pvt|Ltd|Inc|LLC|Corp|AI|Tech|Services|Solutions|Group|Labs)\b/i.test(roleCleaned);

  if (looksLikeCompany) {
    actualCompany = roleCleaned;
    // Try to get role from description
    if (roleMatch) {
      actualRole = roleMatch[1].replace(/\(.*?\)/g, '').replace(/\b(?:Delhi|Mumbai|Bengaluru|Bangalore|Remote|India|Hyderabad)\b.*/gi, '').trim();
    }
  } else {
    actualRole = roleCleaned;
    actualCompany = w.company
      .replace(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{4}.*$/i, '')
      .replace(/^(Present|Current)$/i, '')
      .trim();
  }

  // Clean description — remove role/location prefix
  cleanDesc = cleanDesc
    .replace(/^[\w\s()]+(?:Developer|Engineer|Designer|Manager|Intern|Analyst|Architect|Lead)[\w\s()]*?(?:Delhi|Mumbai|Bengaluru|Bangalore|Remote|India|Hyderabad)?[\s,]*[-–—]\s*/i, '')
    .trim();

  // Fix dates
  const startDate = w.startDate.replace(/^[A-Za-z]+(?=\w)/i, (m) => {
    // "AIJan" → "Jan"
    const monthMatch = m.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);
    return monthMatch ? monthMatch[1] : m;
  }).replace(/^[^A-Za-z]*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i, (m) => m.replace(/^[^A-Za-z]+/, ''));

  return {
    role: actualRole || roleCleaned,
    company: actualCompany,
    startDate,
    endDate: w.endDate,
    description: cleanDesc,
  };
}

function cleanEducation(edu: { degree: string; school: string; year: string }): { degree: string; school: string; year: string } {
  let { degree, school, year } = edu;

  // "BRCM College of Engineering and Technology2020" → separate school + year
  // "B.Tech in Computer ScienceCGPA: 8.43/10" → separate degree + CGPA
  const yearInDegree = degree.match(/(\d{4})$/);
  if (yearInDegree) {
    const beforeYear = degree.slice(0, -4).trim();
    if (!year) year = yearInDegree[1];

    // Check if this is actually a school name (contains College/University/Institute)
    if (/(?:College|University|Institute|School|Academy)/i.test(beforeYear)) {
      if (!school) school = beforeYear;
      degree = '';
    } else {
      degree = beforeYear;
    }
  }

  // "B.Tech in Computer ScienceCGPA: 8.43/10"
  const cgpaMatch = degree.match(/CGPA:\s*[\d.]+\/\d+/i);
  if (cgpaMatch) {
    degree = degree.replace(/CGPA:\s*[\d.]+\/\d+/i, '').trim();
    degree = degree + ' (' + cgpaMatch[0] + ')';
  }

  // Clean school — remove leading dashes
  school = school.replace(/^[-–—]\s*/, '').trim();

  return { degree, school, year };
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

// ═══════════════════════════════════════════════
// PDF Generator
// ═══════════════════════════════════════════════

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ email: session.user.email });

    if (!user || !user.isOnboarded) {
      return NextResponse.json({ error: 'Complete your profile first' }, { status: 400 });
    }

    const { name } = user;
    const p = user.profile || {};
    const resumeEmail: string = p.resumeEmail || user.email;
    const title: string = p.title || '';
    const location: string = p.location || '';
    const summary: string = p.summary || '';
    const skills = cleanSkills(p.skills || []);
    const linkedin: string = p.linkedin || '';
    const portfolio: string = p.portfolio || '';

    const rawWork: Array<{ role: string; company: string; startDate: string; endDate: string; description: string }> = p.workExperience || [];
    const rawEdu: Array<{ degree: string; school: string; year: string }> = p.education || [];
    const rawProjects: Array<{ name: string; description: string; liveUrl?: string; codeUrl?: string }> = p.projects || [];

    const workExperience = rawWork.map(cleanWorkEntry);
    const education = rawEdu.map(cleanEducation).filter(e => e.degree || e.school);
    const projects = rawProjects.map(proj => {
      const projName = cleanProjectName(proj.name);
      const { liveUrl, codeUrl, cleanDesc } = extractProjectUrls(proj.description, proj);
      return { name: projName, description: cleanDesc, liveUrl, codeUrl };
    });

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

    if (title) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(GRY);
      doc.text(title, PW / 2, y, { align: 'center' });
      y += 4.5;
    }

    // Contact line with hyperlinks
    {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(LT);

      type ContactItem = { text: string; url?: string };
      const items: ContactItem[] = [];
      if (resumeEmail) items.push({ text: resumeEmail, url: 'mailto:' + resumeEmail });
      if (location) items.push({ text: location });
      if (isRealUrl(linkedin)) items.push({ text: cleanUrl(linkedin), url: ensureHttp(linkedin) });
      if (isRealUrl(portfolio)) items.push({ text: cleanUrl(portfolio), url: ensureHttp(portfolio) });

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

    if (summary) {
      secHead('Summary');
      textBlock(summary);
    }

    // ═══════════ SKILLS ═══════════

    if (skills.length > 0) {
      secHead('Technical Skills');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(GRY);
      for (const ln of wrap(skills.join('  •  '))) {
        needPage(3.5);
        doc.text(ln, M, y);
        y += 3.5;
      }
    }

    // ═══════════ EXPERIENCE ═══════════

    if (workExperience.length > 0) {
      secHead('Experience');
      for (const w of workExperience) {
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

    if (projects.length > 0) {
      secHead('Projects');
      for (const proj of projects) {
        needPage(12);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(BLK);
        doc.text(proj.name, M, y);
        y += 3.8;

        for (const b of splitBullets(proj.description)) {
          bulletItem(b);
        }

        // Hyperlinked project URLs
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

    if (education.length > 0) {
      secHead('Education');
      for (const e of education) {
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

    const achievements: string[] = (p.achievements || []).filter((a: string) => a && a.trim());
    if (achievements.length > 0) {
      secHead('Achievements & Extracurricular');
      for (const a of achievements) {
        bulletItem(a.trim());
      }
    }

    // ═══════════ OUTPUT ═══════════

    const pdfOutput = doc.output('arraybuffer');
    const pdfBuffer = Buffer.from(pdfOutput);

    const now = new Date();
    const hasDefault = await db.collection('resumes').findOne({ userEmail: session.user.email, isDefault: true });

    await db.collection('resumes').insertOne({
      userEmail: session.user.email,
      title: `${name} — Resume`,
      description: 'Auto-generated from profile',
      database: 'default',
      type: 'ats_optimized',
      fileName: `${name.replace(/\s+/g, '_')}_Resume.pdf`,
      fileData: pdfBuffer,
      fileSize: pdfBuffer.length,
      atsScore: 92,
      isDefault: !hasDefault,
      isActive: true,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${name.replace(/\s+/g, '_')}_Resume.pdf"`,
      },
    });
  } catch (err) {
    console.error('Resume generation error:', err);
    return NextResponse.json({ error: 'Failed to generate resume' }, { status: 500 });
  }
}
