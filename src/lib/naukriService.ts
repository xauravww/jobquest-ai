import fs from 'fs';
import path from 'path';

export interface NaukriParsedJob {
  id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  experience?: string;
  salary?: string;
  skills: string[];
  url: string;
  postedAgo?: string;
  source: 'naukri';
  matchScore?: number;
  description?: string;
}

export interface NaukriUserProfile {
  name?: string;
  email?: string;
  headline?: string;
  skills?: string[];
  experienceYears?: number;
  experienceMonths?: number;
  location?: string;
  desiredLocations?: string[];
  desiredRoles?: string[];
  expectedCtc?: string;
  currentCtc?: string;
  noticePeriod?: string;
  photoUrl?: string;
  resumeFileName?: string;
}

/**
 * Extracts recommended jobs captured by the extension from Naukri logs
 */
export function getLatestNaukriJobs(): NaukriParsedJob[] {
  const logFile = path.join(process.cwd(), 'data/agent-curl-logs/www.naukri.com.jsonl');
  if (!fs.existsSync(logFile)) return [];

  const jobMap = new Map<string, NaukriParsedJob>();

  try {
    const lines = fs.readFileSync(logFile, 'utf-8').split('\n').filter(Boolean);
    // Read reverse to get all recent jobs across captures
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const item = JSON.parse(lines[i]);
        if (item.url && item.url.includes('recom-jobs') && item.responseBody) {
          const body = item.responseBody;
          
          let list: NaukriParsedJob[] = [];
          try {
            const jsonBody = JSON.parse(body);
            if (Array.isArray(jsonBody.jobDetails)) {
              list = jsonBody.jobDetails.map((j: any) => formatNaukriJob(j));
            }
          } catch {}

          if (list.length === 0) {
            list = extractJobsViaRegex(body);
          }

          for (const j of list) {
            if (j.jobId && !jobMap.has(j.jobId)) {
              jobMap.set(j.jobId, j);
            }
          }
        }
      } catch {}
    }
  } catch (err) {
    console.error('Error reading Naukri log jobs:', err);
  }

  return Array.from(jobMap.values());
}

function formatNaukriJob(j: any): NaukriParsedJob {
  const placeholders = Array.isArray(j.placeholders) ? j.placeholders : [];
  const loc = placeholders.find((p: any) => p.type === 'location')?.label || 'India';
  const sal = placeholders.find((p: any) => p.type === 'salary')?.label || 'Not disclosed';
  const exp = placeholders.find((p: any) => p.type === 'experience')?.label || '';
  
  const skillList = j.tagsAndSkills
    ? j.tagsAndSkills.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];

  const jdUrl = j.jdURL ? (j.jdURL.startsWith('http') ? j.jdURL : `https://www.naukri.com${j.jdURL}`) : `https://www.naukri.com/job-listings-${j.jobId}`;
  const exactDesc = getExactNaukriJd(String(j.jobId));

  return {
    id: `naukri-${j.jobId}`,
    jobId: String(j.jobId),
    title: j.title || 'Software Role',
    company: j.companyName || 'Confidential Employer',
    location: loc,
    experience: exp,
    salary: sal,
    skills: skillList,
    url: jdUrl,
    postedAgo: j.footerPlaceholderLabel || 'Recent',
    source: 'naukri',
    description: exactDesc || (skillList.length > 0 ? `Key Skills: ${skillList.join(', ')} • Experience: ${exp || 'Not specified'}` : '')
  };
}

function extractJobsViaRegex(body: string): NaukriParsedJob[] {
  const jobs: NaukriParsedJob[] = [];
  const idx = body.indexOf('"jobDetails":[');
  if (idx === -1) return jobs;

  const parts = body.slice(idx).split('{"title":');
  for (const p of parts.slice(1)) {
    const titleMatch = p.match(/^"([^"]+)"/);
    const companyMatch = p.match(/"companyName":"([^"]+)"/);
    const jobIdMatch = p.match(/"jobId":"([^"]+)"/);
    const tagsMatch = p.match(/"tagsAndSkills":"([^"]+)"/);
    const locMatch = p.match(/"type":"location","label":"([^"]+)"/);
    const salMatch = p.match(/"type":"salary","label":"([^"]+)"/);
    const expMatch = p.match(/"type":"experience","label":"([^"]+)"/);
    const jdMatch = p.match(/"jdURL":"([^"]+)"/);

    if (titleMatch && jobIdMatch) {
      const jobId = jobIdMatch[1];
      const jdUrl = jdMatch ? (jdMatch[1].startsWith('http') ? jdMatch[1] : `https://www.naukri.com${jdMatch[1]}`) : `https://www.naukri.com/job-listings-${jobId}`;
      const skills = tagsMatch ? tagsMatch[1].split(',').map(s => s.trim()).filter(Boolean) : [];
      const exactDesc = getExactNaukriJd(jobId);

      jobs.push({
        id: `naukri-${jobId}`,
        jobId,
        title: titleMatch[1],
        company: companyMatch ? companyMatch[1] : 'Confidential',
        location: locMatch ? locMatch[1] : 'India',
        salary: salMatch ? salMatch[1] : 'Not disclosed',
        experience: expMatch ? expMatch[1] : '',
        skills,
        url: jdUrl,
        postedAgo: 'Active',
        source: 'naukri',
        description: exactDesc || (skills.length > 0 ? `Key Skills: ${skills.join(', ')} • Experience: ${expMatch ? expMatch[1] : 'Not specified'}` : '')
      });
    }
  }
  return jobs;
}

/**
 * Converts raw HTML job descriptions into clean formatted markdown/text
 */
export function cleanHtmlJd(rawHtml: string): string {
  if (!rawHtml) return '';
  let text = rawHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/?(?:div|p|h[1-6]|ul|ol)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .join('\n');
}

/**
 * Extracts exact full job description for a specific jobId from captured Naukri logs
 */
export function getExactNaukriJd(targetJobId: string): string | null {
  const logFile = path.join(process.cwd(), 'data/agent-curl-logs/www.naukri.com.jsonl');
  if (!fs.existsSync(logFile)) return null;

  try {
    const lines = fs.readFileSync(logFile, 'utf-8').split('\n').filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (line.includes(targetJobId) && line.includes('jobapi/v4/job')) {
        try {
          const item = JSON.parse(line);
          const body = item.responseBody;
          if (body) {
            // Check direct parse
            try {
              const parsed = JSON.parse(body);
              if (parsed.jobDetails?.description) {
                return cleanHtmlJd(parsed.jobDetails.description);
              }
            } catch {
              // Regex fallback for long bodies
              const idx = body.indexOf('"description":"');
              if (idx !== -1) {
                const endIdx = body.indexOf('","', idx);
                if (endIdx !== -1) {
                  const rawDesc = body.slice(idx + 15, endIdx);
                  return cleanHtmlJd(rawDesc.replace(/\\\//g, '/').replace(/\\"/g, '"'));
                }
              }
            }
          }
        } catch {}
      }
    }
  } catch (err) {
    console.error('Error extracting exact Naukri JD:', err);
  }

  return null;
}

/**
 * Extracts synced Naukri profile data
 */
export function getLatestNaukriProfile(): NaukriUserProfile | null {
  const logFile = path.join(process.cwd(), 'data/agent-curl-logs/www.naukri.com.jsonl');
  if (!fs.existsSync(logFile)) return null;

  try {
    const lines = fs.readFileSync(logFile, 'utf-8').split('\n').filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const item = JSON.parse(lines[i]);
        if (item.url && item.url.includes('resman-aggregator-services') && item.responseBody) {
          const jsonBody = JSON.parse(item.responseBody);
          const p = jsonBody.profile?.[0];
          if (!p) continue;

          return {
            name: p.name,
            headline: p.resumeHeadline,
            skills: p.keySkills ? p.keySkills.split(',').map((s: string) => s.trim()) : [],
            experienceYears: parseInt(p.experience?.year || '0', 10),
            experienceMonths: parseInt(p.experience?.month || '0', 10),
            location: p.city?.value || 'India',
            desiredLocations: (p.newLocationPrefId || []).map((l: any) => l.value),
            desiredRoles: (p.desiredRole || []).map((r: any) => r.value),
            expectedCtc: p.absoluteExpectedCtc ? `₹${p.absoluteExpectedCtc}` : '',
            currentCtc: p.absoluteCtc ? `₹${p.absoluteCtc}` : '',
            noticePeriod: p.noticePeriod?.value || '',
            photoUrl: p.photoInfo?.photoURL,
            resumeFileName: p.cvInfo?.fileName
          };
        }
      } catch {}
    }
  } catch (err) {
    console.error('Error reading Naukri profile:', err);
  }

  return null;
}
