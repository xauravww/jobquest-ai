// Fetch missing/short job descriptions for JobCache jobs by visiting each job
// page in a real (headful) browser and extracting the description DOM text.
// Usage: xvfb-run -a node scripts/fetch-missing-jd.mjs [maxJobs]
import 'dotenv/config';
import mongoose from 'mongoose';
import puppeteer from 'puppeteer-core';
import fs from 'fs';

process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobquest-ai';
const MAX = parseInt(process.argv[2] || '15', 10);
const CHROME = fs.existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/chromium-browser';
const SHORT_JD_THRESHOLD = 250;

function isShortJd(desc) {
  if (!desc) return true;
  const t = String(desc).trim();
  if (/^Key Skills:/i.test(t)) return true;
  return t.length < SHORT_JD_THRESHOLD;
}

await mongoose.connect(process.env.MONGODB_URI);
const s = await mongoose.connection.collection('naukrisessions').findOne({});
if (!s?.cookies) { console.log('NO_SESSION'); process.exit(2); }
const cookies = s.cookies.split(';').map((p) => {
  const i = p.indexOf('=');
  if (i < 0) return null;
  return { name: p.slice(0, i).trim(), value: p.slice(i + 1).trim(), domain: '.naukri.com', path: '/', secure: true, httpOnly: false, sameSite: 'Lax' };
}).filter(Boolean);

const jc = mongoose.connection.collection('jobcaches');
const jobs = await jc.find({}).project({ jobId: 1, url: 1, description: 1, skills: 1 }).toArray();
const missing = jobs.filter((j) => isShortJd(j.description));
console.log(`Total jobs: ${jobs.length} | missing/short JD: ${missing.length} | fetching up to ${MAX}`);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: false,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800', '--disable-blink-features=AutomationControlled', '--disable-features=IsolateOrigins,site-per-process'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
await page.evaluateOnNewDocument(() => {
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  window.chrome = window.chrome || { runtime: {} };
});
await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
await page.setCookie(...cookies);

  async function extractJd(url) {
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 2500));
      return await page.evaluate(() => {
        const grab = (el) => (el ? el.innerText.trim() : '');
        // The real description container (Naukri 2026):
        const desc = document.querySelector('[class*="job-desc-container"], [class*="jd-container"]');
        let text = grab(desc);
        // If the container includes a big header, narrow to the description part.
        if (text.length > 400) {
          const idx = text.indexOf('Job highlights');
          if (idx >= 0) text = text.slice(idx);
        }
        if (text.length < 200) {
          const h = Array.from(document.querySelectorAll('h2,h3,h4')).find((x) => /job description|job highlights/i.test(x.innerText || ''));
          if (h && h.parentElement) text = h.parentElement.innerText.trim();
        }
        return text;
      });
    } catch {
      return '';
    }
  }

let updated = 0, stillShort = 0;
for (let i = 0; i < Math.min(missing.length, MAX); i++) {
  const job = missing[i];
  const url = job.url || `https://www.naukri.com/job-listings-${job.jobId}`;
  const jd = await extractJd(url);
  if (!isShortJd(jd)) {
    await jc.updateOne({ jobId: job.jobId }, { $set: { description: jd } });
    await mongoose.connection.collection('jobs').updateMany({ jobId: job.jobId }, { $set: { description: jd } });
    updated++;
    console.log(`OK ${job.jobId} (${jd.length} chars)`);
  } else {
    stillShort++;
    console.log(`SHORT ${job.jobId} (${jd.length} chars)`);
  }
}

await browser.close();
console.log(`\nDONE. fetched long JDs: ${updated} | still short: ${stillShort}`);
await mongoose.disconnect();
