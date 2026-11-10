import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse/lib/pdf-parse.js');

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);
    const text = data.text;

    const result = parseResumeText(text);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Resume parse error:', err);
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 });
  }
}

function parseResumeText(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+\/?/i);
  const twitterMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/[\w-]+\/?/i);
  const portfolioMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?!linkedin|twitter|x\.com|github)[\w-]+\.[\w.]+\/?/i);
  let portfolio = portfolioMatch?.[0] || '';
  if (/gmail\.|yahoo\.|hotmail\.|outlook\.|live\.|icloud\.|protonmail\./i.test(portfolio)) portfolio = '';
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+\/?/i);

  const name = lines[0]?.length < 60 ? lines[0] : '';

  let title = '';
  const titlePatterns = [/developer/i, /engineer/i, /designer/i, /manager/i, /analyst/i, /architect/i, /consultant/i, /specialist/i];
  for (const line of lines.slice(1, 8)) {
    if (titlePatterns.some(p => p.test(line)) && line.length < 80) {
      title = line;
      break;
    }
  }

  const locationMatch = text.match(/(?:^|\n)\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/m);
  const location = locationMatch?.[1] || '';

  const skillsSection = extractSection(text, ['skills', 'technical skills', 'technologies', 'tech stack']);
  const skills = skillsSection
    ? skillsSection
        .replace(/skills?:?\s*/i, '')
        .split(/[,|•·;]/)
        .map(s => s.trim())
        .filter(s => s.length > 1 && s.length < 40)
        .slice(0, 30)
    : [];

  const summarySection = extractSection(text, ['summary', 'objective', 'about', 'profile']);
  const summary = summarySection ? summarySection.slice(0, 500) : '';

  const yearsMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i);
  const experienceYears = yearsMatch ? parseInt(yearsMatch[1]) : 0;

  const workExperience = extractWorkExperience(text);
  const education = extractEducation(text);
  const projects = extractProjects(text);

  return {
    name,
    title,
    email: emailMatch?.[0] || '',
    location,
    skills,
    summary,
    experienceYears,
    linkedin: linkedinMatch?.[0] || '',
    twitter: twitterMatch?.[0] || '',
    portfolio: portfolioMatch?.[0] || '',
    github: githubMatch?.[0] || '',
    workExperience,
    education,
    projects,
  };
}

function extractSection(text: string, headers: string[]): string {
  const pattern = new RegExp(
    `(?:^|\\n)\\s*(?:${headers.join('|')})\\s*[:\\-—]?\\s*\\n([\\s\\S]*?)(?=\\n\\s*(?:experience|education|skills|projects|work|employment|certifications|awards|references)\\s*[:\\-—]?\\s*\\n|$)`,
    'i'
  );
  const match = text.match(pattern);
  return match?.[1]?.trim() || '';
}

function splitOuterComma(s: string): { role: string; company: string } | null {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ',' && depth === 0) {
      return { role: s.slice(0, i), company: s.slice(i + 1) };
    }
  }
  return null;
}

const COMPANY_SUFFIX_RE = /(?:ltd|inc|llc|pvt|corp|gmbh|limited|technologies|services|systems|solutions|group|associates|enterprises)\b/i;

function isHeaderLine(ln: string): boolean {
  if (ln.length === 0 || ln.length > 80) return false;
  if (/^\s*[-–—•·▪◦*]\s+/.test(ln)) return false;
  if (/[.!?]$/.test(ln) && !COMPANY_SUFFIX_RE.test(ln)) return false;
  return true;
}

function splitRoleCompany(header: string): { role: string; company: string } {
  const seps: Array<{ re: RegExp; eat: RegExp }> = [
    { re: /\s+@\s+/, eat: /^\s*@\s*/ },
    { re: /\s+at\s+/i, eat: /^\s*at\s+/i },
    { re: /\s+\|\s+/, eat: /^\s*\|\s*/ },
    { re: /\s+[-–—]\s+/, eat: /^\s*[-–—]\s*/ },
    { re: /\s+for\s+/i, eat: /^\s*for\s+/i },
  ];
  for (const s of seps) {
    const idx = header.search(s.re);
    if (idx !== -1) {
      const role = header.slice(0, idx).replace(/[-–—:,]+$/, '').trim();
      const company = header.slice(idx).replace(s.eat, '').trim();
      if (role) return { role, company };
    }
  }
  const comma = splitOuterComma(header);
  if (comma && comma.role.trim()) {
    return { role: comma.role.replace(/[-–—:,]+$/, '').trim(), company: comma.company.trim() };
  }
  return { role: header.replace(/[-–—:,]+$/, '').trim(), company: '' };
}

function parseHeader(headerLines: string[]): { role: string; company: string } {
  if (!headerLines.length) return { role: '', company: '' };
  if (headerLines.length >= 2) {
    let role = headerLines[headerLines.length - 1].replace(/[-–—:,]+$/, '').trim();
    const company = headerLines.slice(0, -1).join(' ').replace(/[-–—:,]+$/, '').trim();
    const comma = splitOuterComma(role);
    if (comma && comma.company.trim() && comma.company.trim().length <= 30 && !/\d/.test(comma.company)) {
      role = comma.role.trim();
    }
    if (role) return { role, company };
  }
  return splitRoleCompany(headerLines.join(' '));
}

function extractWorkExperience(text: string) {
  const section = extractSection(text, ['experience', 'work experience', 'employment', 'work history', 'professional experience']);
  if (!section) return [];

  const entries: Array<{ role: string; company: string; startDate: string; endDate: string; description: string }> = [];
  const lines = section.split('\n').map(l => l.trim()).filter(Boolean);

  const dateToken = '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\.?\\s*\\d{4}|(?:19|20)\\d{2}';
  const rangeRe = new RegExp(`(${dateToken})\\s*[-–—to]+\\s*(${dateToken}|present|current|now)`, 'i');
  const dateRangeLineRe = new RegExp(`^\\s*(?:${dateToken})\\s*[-–—to]+\\s*(?:${dateToken}|present|current|now)\\s*$`, 'i');
  const singleDateLineRe = new RegExp(`^\\s*(?:${dateToken})\\s*$`, 'i');

  const dateIdx: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (dateRangeLineRe.test(lines[i]) || singleDateLineRe.test(lines[i])) dateIdx.push(i);
  }

  if (dateIdx.length === 0) {
    const blocks = section.split(/\n\s*\n/);
    for (const block of blocks.slice(0, 5)) {
      const bl = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (!bl.length) continue;
      let startDate = '', endDate = '';
      const range = block.match(rangeRe);
      if (range) { startDate = range[1]; endDate = range[2]; }
      const { role, company } = parseHeader(bl.filter(isHeaderLine).slice(0, 2));
      const desc = bl.filter(l => !isHeaderLine(l)).join(' ').replace(/\s+/g, ' ').trim();
      entries.push({ role: role.slice(0, 100), company: company.slice(0, 100), startDate, endDate, description: desc.slice(0, 500) });
    }
    return entries;
  }

  for (let di = 0; di < dateIdx.length; di++) {
    const dLine = dateIdx[di];
    const headerLines: string[] = [];
    for (let h = dLine - 1; h >= 0; h--) {
      if (headerLines.length >= 2) break;
      const ln = lines[h];
      if (!isHeaderLine(ln)) break;
      headerLines.unshift(ln);
    }

    let startDate = '', endDate = '';
    const range = lines[dLine].match(rangeRe);
    if (range) { startDate = range[1]; endDate = range[2]; } else { startDate = lines[dLine]; }

    const headerText = headerLines.join(' | ');
    const headerRange = headerText.match(rangeRe);
    if (headerRange && !startDate) { startDate = headerRange[1]; endDate = headerRange[2]; }
    const cleanedHeader = headerText.replace(rangeRe, '').replace(/\s{2,}/g, ' ').trim();
    const { role, company } = parseHeader(cleanedHeader.split(' | ').filter(Boolean));

    const nextD = di + 1 < dateIdx.length ? dateIdx[di + 1] : lines.length;
    const descLines = lines.slice(dLine + 1, nextD);
    while (descLines.length && isHeaderLine(descLines[descLines.length - 1])) descLines.pop();
    const desc = descLines.join(' ').replace(/\s+/g, ' ').trim();

    entries.push({ role: role.slice(0, 100), company: company.slice(0, 100), startDate, endDate, description: desc.slice(0, 500) });
  }

  return entries;
}

function extractEducation(text: string) {
  const section = extractSection(text, ['education', 'academic', 'qualifications']);
  if (!section) return [];

  const entries: Array<{ degree: string; school: string; year: string }> = [];
  const lines = section.split('\n').map(l => l.trim()).filter(Boolean);
  const degreeRe = /(?:B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|Ph\.?D|Bachelor|Master|MBA|B\.?Tech|M\.?Tech|B\.?E\.?|M\.?E\.?|Diploma|Associate|High School)/i;
  const yearRe = /\b(20\d{2}|19\d{2})\b/;
  const seps = [' at ', ' from ', ' – ', ' — ', ', ', ' - '];

  for (let i = 0; i < lines.length && entries.length < 5; i++) {
    const line = lines[i];
    const hasDegree = degreeRe.test(line);
    const yearMatch = line.match(yearRe);
    if (!hasDegree && !yearMatch) continue;

    if (!hasDegree && yearMatch) {
      const last = entries[entries.length - 1];
      if (last && !last.year) last.year = yearMatch[1];
      continue;
    }

    let degree = line;
    let school = '';
    for (const s of seps) {
      const idx = line.toLowerCase().indexOf(s.toLowerCase());
      if (idx > -1) { degree = line.slice(0, idx); school = line.slice(idx + s.length); break; }
    }

    if (i > 0) {
      const prev = lines[i - 1];
      if (prev && !degreeRe.test(prev) && !yearRe.test(prev) && prev.length > 3 && prev.length < 90) {
        school = prev;
      }
    }

    let year = yearMatch?.[1] || '';
    if (!year && lines[i + 1]) year = lines[i + 1].match(yearRe)?.[1] || '';

    entries.push({
      degree: degree.replace(/\b\d{4}\b/g, '').replace(/[|,;:]+$/, '').trim().slice(0, 100),
      school: school.replace(/\b\d{4}\b/g, '').replace(/[|,;:]+$/, '').trim().slice(0, 100),
      year,
    });
  }

  return entries;
}

function extractProjects(text: string) {
  const section = extractSection(text, ['projects', 'personal projects', 'side projects']);
  if (!section) return [];

  const entries: Array<{ name: string; description: string; liveUrl: string; codeUrl: string }> = [];
  const blocks = section.split(/\n(?=[A-Z])/);
  const badExtRe = /\.(?:js|ts|jsx|tsx|css|scss|json|html|png|jpg|jpeg|gif|svg|pdf|md)$/i;
  const bareDomainRe = /\b(?:https?:\/\/)?(?!github)[\w-]+(?:\.[a-zA-Z]{2,6})+[\w\-/]*/i;

  for (const block of blocks.slice(0, 6)) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    const name = lines[0]
      .split(/\s*\|\s*/)[0]
      .split(/\s+(?:using|with|built with|in)\s+[A-Z0-9]/i)[0]
      .replace(/[:\-–—]+$/, '')
      .trim()
      .slice(0, 80);

    const githubMatch = block.match(/(?:https?:\/\/)?github\.com\/[\w\-/]+/i);
    let liveMatch = block.match(/https?:\/\/[\w\-.]+\.[\w.]+[\w\-/]*/i);
    if (!liveMatch) {
      const body = lines.slice(1).join(' ');
      const bare = body.match(bareDomainRe);
      if (bare && !badExtRe.test(bare[0]) && !/github\.com|gmail\.|yahoo\.|hotmail\.|outlook\.|live\.|icloud\.|protonmail\./i.test(bare[0])) {
        liveMatch = bare;
      }
    }

    const description = lines.slice(1).join(' ').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim().slice(0, 500);
    entries.push({ name, description, liveUrl: liveMatch?.[0] || '', codeUrl: githubMatch?.[0] || '' });
  }

  return entries;
}
