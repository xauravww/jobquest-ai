// Backfill applicationType for every JobCache job by visiting each job page
// in a real (headful) browser session and reading the actual Apply button:
//   "Apply on company site" -> external
//   "Apply" (in-site)      -> easy_apply
import 'dotenv/config';
import mongoose from 'mongoose';
import puppeteer from 'puppeteer-core';
import fs from 'fs';

process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobquest-ai';
const CHROME = fs.existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/chromium-browser';

await mongoose.connect(process.env.MONGODB_URI);
const s = await mongoose.connection.collection('naukrisessions').findOne({});
if (!s?.cookies) { console.log('NO_SESSION'); process.exit(2); }
const cookies = s.cookies.split(';').map((p) => {
  const i = p.indexOf('=');
  if (i < 0) return null;
  return { name: p.slice(0, i).trim(), value: p.slice(i + 1).trim(), domain: '.naukri.com', path: '/', secure: true, httpOnly: false, sameSite: 'Lax' };
}).filter(Boolean);

const jc = mongoose.connection.collection('jobcaches');
const jobs = await jc.find({}).project({ jobId: 1, url: 1 }).toArray();
console.log('Total jobs to classify:', jobs.length);

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

let external = 0, easy = 0, unknown = 0, updated = 0;
for (let i = 0; i < jobs.length; i++) {
  const job = jobs[i];
  const url = job.url || `https://www.naukri.com/job-listings-${job.jobId}`;
  let kind = null;
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2500));
    kind = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button')).map((b) => (b.innerText || '').trim());
      const company = btns.some((t) => /company site/i.test(t));
      const direct = btns.some((t) => t === 'Apply');
      if (company) return 'external';
      if (direct) return 'easy_apply';
      if (/Apply on company site/i.test(document.body.innerText || '')) return 'external';
      return 'unknown';
    });
  } catch {
    kind = 'unknown';
  }

  if (kind === 'external' || kind === 'easy_apply') {
    await jc.updateOne({ jobId: job.jobId }, { $set: { applicationType: kind } });
    updated++;
    if (kind === 'external') external++; else easy++;
  } else {
    unknown++;
  }
  if ((i + 1) % 10 === 0) console.log(`progress ${i + 1}/${jobs.length}`);
}

await browser.close();
console.log('\nDONE. updated:', updated, '| external:', external, '| easy:', easy, '| unknown:', unknown);
const breakdown = await jc.aggregate([{ $group: { _id: '$applicationType', n: { $sum: 1 } } }]).toArray();
console.log('JobCache appType breakdown:', JSON.stringify(breakdown));
await mongoose.disconnect();
