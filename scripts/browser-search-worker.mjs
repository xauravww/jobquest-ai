// Standalone browser-search worker: spawn one headful Chromium under Xvfb,
// inject the stored Naukri session cookies, run a keyword search, and print
// the parsed jobs as JSON on stdout.
//
// Usage:
//   xvfb-run -a node scripts/browser-search-worker.mjs "<keyword>" "<location>"
//
// Requires (local server only):
//   - MONGODB_URI env (or .env)
//   - a captured Naukri session in the `naukrisessions` collection
//   - a system Chrome/Chromium and Xvfb
import 'dotenv/config';
import mongoose from 'mongoose';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobquest-ai';

const [, , keywordArg = '', locationArg = ''] = process.argv;
let keyword = '';
let location = '';
try {
  // Prefer a single JSON argument { keyword, location } (spawn-safe).
  const parsed = JSON.parse(keywordArg);
  keyword = String(parsed.keyword || '').trim();
  location = String(parsed.location || '').trim();
} catch {
  keyword = decodeURIComponent(keywordArg).trim();
  location = decodeURIComponent(locationArg).trim();
}
keyword = keyword || 'software developer';
console.error('WORKER KEYWORD:', JSON.stringify(keyword));

const CHROME = fs.existsSync('/usr/bin/google-chrome-stable')
  ? '/usr/bin/google-chrome-stable'
  : fs.existsSync('/usr/bin/chromium-browser')
    ? '/usr/bin/chromium-browser'
    : '/usr/bin/google-chrome';

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function decodeKw(s) {
  try {
    return decodeURIComponent(String(s)).trim().replace(/%20/g, ' ');
  } catch {
    return String(s).trim().replace(/%20/g, ' ');
  }
}

function buildSearchUrl(kw, loc) {
  kw = decodeKw(kw);
  loc = decodeKw(loc);
  const seoKey = slug(kw) + (loc ? '-' + slug(loc) : '');
  const qs = [`k=${encodeURIComponent(kw)}`, 'nignbevent_src=jobsearchDeskGNB'];
  if (loc) qs.push(`l=${encodeURIComponent(loc)}`);
  const finalUrl = `https://www.naukri.com/${seoKey}-jobs?${qs.join('&')}`;
  console.error('BUILT_URL:', finalUrl);
  return finalUrl;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const coll = mongoose.connection.collection('naukrisessions');
  const s = await coll.findOne({});
  if (!s || !s.cookies) {
    console.error('NO_SESSION');
    process.exit(2);
  }

  const cookies = s.cookies.split(';').map((p) => {
    const i = p.indexOf('=');
    if (i < 0) return null;
    return {
      name: p.slice(0, i).trim(),
      value: p.slice(i + 1).trim(),
      domain: '.naukri.com',
      path: '/',
      secure: true,
      httpOnly: false,
      sameSite: 'Lax',
    };
  }).filter(Boolean);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1366,850',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--lang=en-GB',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 850 });
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    window.chrome = window.chrome || { runtime: {} };
  });
  await page.setUserAgent(
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  );
  await page.setCookie(...cookies);

  const jobs = new Map();
  const capturedUrls = new Set();

  page.on('response', async (resp) => {
    const u = resp.url();
    if (!u.includes('jobapi/v3/search') && !u.includes('jobapi/v2/search/recom-jobs')) return;
    if (capturedUrls.has(u)) return;
    capturedUrls.add(u);
    try {
      const j = await resp.json();
      const details = Array.isArray(j?.jobDetails) ? j.jobDetails : [];
      for (const jd of details) {
        if (!jd?.jobId) continue;
        const title = jd.title || 'Software Role';
        const company = jd.companyName || 'Confidential Employer';
        const locs = Array.isArray(jd.locations) ? jd.locations.join(', ') : (jd.locations || 'India');
        const sal =
          jd.minSalary && jd.maxSalary ? `${jd.minSalary}-${jd.maxSalary}` : 'Not disclosed';
        const skills = jd.tagsAndSkills ? jd.tagsAndSkills.split(',').map((x) => x.trim()).filter(Boolean) : [];
        const isExternal =
          String(jd.mode || '').toLowerCase() === 'crawled' ||
          Boolean(jd.applyUrl) ||
          jd.isExternal === true ||
          jd.applicationType === 'external' ||
          jd.mode === 'external' ||
          (jd.staticUrl && String(jd.staticUrl).startsWith('http') && (String(jd.staticUrl).includes('.com') || !String(jd.staticUrl).includes('naukri.com'))) ||
          (jd.footerPlaceholderLabel && /external|web job|posted on external/i.test(String(jd.footerPlaceholderLabel)));
        const externalUrl =
          isExternal && jd.applyUrl && String(jd.applyUrl).startsWith('http') ? jd.applyUrl
            : isExternal && jd.staticUrl && String(jd.staticUrl).startsWith('http') ? jd.staticUrl
              : undefined;
        const job = {
          id: `naukri-${jd.jobId}`,
          jobId: String(jd.jobId),
          title,
          company,
          location: locs,
          experience: jd.experience || '',
          salary: sal,
          skills,
          url: `https://www.naukri.com/job-listings-${jd.jobId}`,
          postedAgo: jd.footerPlaceholderLabel || 'Recent',
          source: 'naukri',
          applicationType: isExternal ? 'external' : 'easy_apply',
        };
        if (externalUrl) job.externalApplyUrl = externalUrl;
        jobs.set(String(jd.jobId), job);
      }
    } catch { /* ignore */ }
  });

  const url = buildSearchUrl(keyword, location);
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 8000));
  } catch (e) {
    console.error('GOTO_ERROR:', e.message);
  }

  const title = await page.title().catch(() => '?');
  console.error('PAGE_TITLE:', title);
  console.error('PAGE_URL:', page.url());
  await page.screenshot({ path: '/tmp/worker_search.png' }).catch(() => {});
  console.error('screenshot: /tmp/worker_search.png');

  await browser.close();

  const out = { keyword, location, count: jobs.size, jobs: Array.from(jobs.values()) };
  console.log(JSON.stringify(out));

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('WORKER_ERROR:', e.message);
  process.exit(1);
});
