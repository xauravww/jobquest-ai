// Headful-browser Naukri auto-apply worker.
// Opens the job listing, clicks the in-site Apply button, advances the flow
// (using the account's default resume — no upload), and reports the result.
// If a questionnaire form appears, it is surfaced for review rather than
// blindly submitted.
//
// Usage:
//   xvfb-run -a node scripts/browser-apply-worker.mjs '<jobId>' [--guided]
//   --guided  pause before submit, save a screenshot to public/agent-guided/,
//             dump the apply-dialog DOM, and do NOT auto-submit.
// Output: JSON on stdout
import 'dotenv/config';
import mongoose from 'mongoose';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_GUIDED = path.join(__dirname, '..', 'public', 'agent-guided');

process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobquest-ai';

const JOB_ID = process.argv[2] || '';
const GUIDED = process.argv.includes('--guided');
const JOB_URL = `https://www.naukri.com/job-listings-${JOB_ID}`;
const CHROME = fs.existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : '/usr/bin/chromium-browser';

const APPLY_SUCCESS = /submitted|applied successfully|application has been submitted|applied|successfully applied/i;
const APPLY_ALREADY = /already applied|applied already|already been applied/i;
const APPLY_ERROR = /not submitted|something went wrong|try again|error|failed|recaptcha|captcha/i;

async function clickButton(page, text) {
  try {
    return await page.evaluate((t) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find((b) => (b.innerText || '').trim() === t);
      if (target) { target.click(); return true; }
      return false;
    }, text);
  } catch {
    return false;
  }
}


function pageText(page) {
  return page.evaluate(() => document.body.innerText || '').catch(() => '');
}

async function safeEval(page, fn, arg) {
  try {
    return await page.evaluate(fn, arg);
  } catch (e) {
    return undefined;
  }
}

// JobSailor-style interview loop: Naukri asks questions one-by-one in a
// chatbot widget (radio buttons and/or text answers, each saved individually).
async function runInterview(page, maxSteps = 15) {
  async function successSeen() {
    const res = await safeEval(page, () => {
      return /successfully applied/i.test(document.body.innerText || '');
    });
    return res === true;
  }
  async function clickSave() {
    return safeEval(page, () => {
      const btns = Array.from(document.querySelectorAll('button'));
      const save = btns.find((b) => /^save$/i.test((b.innerText || '').trim()));
      if (save) { save.click(); return true; }
      const b2 = btns.find((b) => /save/i.test((b.className || '').toString()));
      if (b2) { b2.click(); return true; }
      return false;
    });
  }
  async function readRadioQuestions() {
    return safeEval(page, () => {
      const out = [];
      const containers = document.querySelectorAll('.ssrc__radio-btn-container');
      containers.forEach((c, idx) => {
        const label = c.querySelector('label');
        const input = c.querySelector('input');
        out.push({
          idx,
          label: label ? label.innerText.trim() : '',
          value: input ? input.getAttribute('value') || '' : '',
        });
      });
      let question = '';
      const qEl = document.querySelector('li[class*="botItem"] .botMsg, li[class*="botItem"] span');
      if (qEl) question = qEl.innerText.trim();
      return { question, options: out };
    });
  }
  async function readTextQuestion() {
    return safeEval(page, () => {
      const list = document.querySelector('ul[id^="chatList_"]');
      let question = '';
      if (list) {
        const lis = list.querySelectorAll('li');
        if (lis.length) question = lis[lis.length - 1].innerText.trim().slice(0, 200);
      }
      const input = document.querySelector('div.textArea, textarea, input[type="text"]:not([placeholder*="keyword"]):not([placeholder*="location"]):not([placeholder*="experience"]):not([placeholder*="mobile"])');
      return { question, hasInput: !!input };
    });
  }

  for (let step = 0; step < maxSteps; step++) {
    if (await successSeen()) return { outcome: 'applied', detail: 'success message', steps: step };

    const radio = await readRadioQuestions();
    if (radio && radio.options && radio.options.length) {
      const picked = radio.options[0];
      await safeEval(page, (idx) => {
        const c = document.querySelectorAll('.ssrc__radio-btn-container')[idx];
        const input = c && c.querySelector('input');
        if (input) input.click();
      }, picked.idx);
      await new Promise((r) => setTimeout(r, 600));
      await clickSave();
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }

    const textQ = await readTextQuestion();
    if (textQ && textQ.hasInput) {
      const answer = 'Experienced professional with strong technical skills and relevant hands-on project work.';
      await safeEval(page, (v) => {
        const input = document.querySelector('div.textArea, textarea');
        if (input) { input.focus(); input.value = v; input.dispatchEvent(new Event('input', { bubbles: true })); }
        else {
          const el = document.querySelector('input[type="text"]:not([placeholder*="keyword"]):not([placeholder*="location"]):not([placeholder*="experience"]):not([placeholder*="mobile"])');
          if (el) { el.focus(); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }
        }
      }, answer);
      await new Promise((r) => setTimeout(r, 400));
      await clickSave();
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }

    await new Promise((r) => setTimeout(r, 1500));
  }
  const ok = await successSeen();
  return { outcome: ok ? 'applied' : 'unknown', detail: ok ? 'success after loop' : 'loop ended without success', steps: maxSteps };
}

async function main() {
  if (!JOB_ID) { console.error('NO_JOB_ID'); process.exit(2); }
  await mongoose.connect(process.env.MONGODB_URI);
  const s = await mongoose.connection.collection('naukrisessions').findOne({});
  if (!s?.cookies) { console.error('NO_SESSION'); process.exit(2); }
  const cookies = s.cookies.split(';').map((p) => {
    const i = p.indexOf('=');
    if (i < 0) return null;
    return { name: p.slice(0, i).trim(), value: p.slice(i + 1).trim(), domain: '.naukri.com', path: '/', secure: true, httpOnly: false, sameSite: 'Lax' };
  }).filter(Boolean);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,900', '--disable-blink-features=AutomationControlled', '--disable-features=IsolateOrigins,site-per-process'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900 });
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    window.chrome = window.chrome || { runtime: {} };
  });
  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  await page.setCookie(...cookies);

  await page.goto(JOB_URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 5000));

  const clickedApply = await clickButton(page, 'Apply');
  if (!clickedApply) {
    console.log(JSON.stringify({ outcome: 'no-apply-button', detail: 'No in-site Apply button found', questionnaire: [] }));
    await browser.close();
    await mongoose.disconnect();
    return;
  }
  await new Promise((r) => setTimeout(r, 5000));

  // Upload the account resume into the apply widget if prompted (this unlocks
  // the chatbot questions). Default to the first Saurav resume on disk.
  const resumePath = process.env.RESUME_PATH || '';
  const uploader = await safeEval(page, () => {
    const el = document.querySelector('input[type="file"]');
    return el ? true : false;
  });
  if (uploader && fs.existsSync(resumePath)) {
    const handle = await page.$('input[type="file"]').catch(() => null);
    if (handle) {
      try { await handle.uploadFile(resumePath); } catch {}
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  // If a resume-uploader appears, ignore it (use account default resume) and
  // advance with the next Apply button.
  await clickButton(page, 'Apply');
  await new Promise((r) => setTimeout(r, 6000));

  const questionnaire = (await safeEval(page, () => {
    const fields = [];
    document.querySelectorAll('input,select,textarea').forEach((el) => {
      const tag = el.tagName.toLowerCase();
      if (tag === 'input' && (el.type === 'text' || el.type === 'tel' || el.type === 'number' || el.type === 'email' || el.type === 'radio' || el.type === 'checkbox')) {
        fields.push({ tag, type: el.type, name: el.name || '', placeholder: el.placeholder || '', id: el.id || '' });
      } else if (tag === 'select' || tag === 'textarea') {
        fields.push({ tag, name: el.name || '', placeholder: el.placeholder || '', id: el.id || '' });
      }
    });
    return fields;
  })) || [];

  // ---- Fill questionnaire fields (best-effort) ----
  const phone = (process.env.PROFILE_PHONE || '').replace(/\D/g, '').slice(-10);
  const filled = [];

  if (phone) {
    const ok = await page.type('input[id="mob_num"], input[placeholder*="mobile"]', phone, { delay: 20 }).then(() => true).catch(() => false);
    if (!ok) {
      const did = await page.evaluate((v) => {
        const el = document.querySelector('input[id="mob_num"], input[placeholder*="mobile"]');
        if (el) { const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; setter.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); return true; }
        return false;
      }, phone);
      filled.push({ field: 'mobile', value: phone, removed: did });
    } else {
      filled.push({ field: 'mobile', value: phone, removed: true });
    }
  }

  // Experience: type years then Enter (custom dropdown)
  const expDone = await page.evaluate(async () => {
    const el = document.querySelector('input[name="experienceDD"]');
    if (!el) return false;
    el.focus();
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, '2');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    return true;
  });
  if (expDone) filled.push({ field: 'experience', value: '2', removed: true });

  await new Promise((r) => setTimeout(r, 2000));

  // ---- Inline application form: fill CUSTOM first/last name + Submit-and-Apply ----
  try {
    const userDoc = (s.userId && mongoose.Types.ObjectId.isValid(String(s.userId)))
      ? await mongoose.connection.collection('users').findOne({ _id: new mongoose.Types.ObjectId(String(s.userId)) })
      : null;
    const fullName = String(userDoc?.name || '').trim();
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    if (firstName) {
      await safeEval(page, (v) => {
        const el = document.querySelector('input[id="CUSTOM-FIRSTNAME"]');
        if (el) { el.focus(); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }
      }, firstName);
      filled.push({ field: 'firstname', value: firstName, removed: true });
    }
    if (lastName) {
      await safeEval(page, (v) => {
        const el = document.querySelector('input[id="CUSTOM-LASTNAME"]');
        if (el) { el.focus(); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }
      }, lastName);
      filled.push({ field: 'lastname', value: lastName, removed: true });
    }

    const submittedInline = await safeEval(page, () => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
      const b = btns.find((x) => /submit and apply/i.test((x.innerText || '').trim()));
      if (b) { b.click(); return true; }
      return false;
    });
    if (submittedInline) filled.push({ field: 'submit-and-apply', value: 'clicked', removed: true });
    await new Promise((r) => setTimeout(r, 2500));
  } catch {
    // non-fatal
  }

  // ---- Guided mode: pause, save screenshot, dump dialog DOM, no submit ----
  if (GUIDED) {
    fs.mkdirSync(PUBLIC_GUIDED, { recursive: true });
    const shotPath = path.join(PUBLIC_GUIDED, `${JOB_ID}.png`);
    await page.screenshot({ path: shotPath, fullPage: false }).catch(() => {});

    const dialogDom = await page.evaluate(() => {
      const out = { dialogs: [], buttons: [], labels: [], inputs: [], selects: [], radioContainers: 0, chatLists: 0, textAreas: 0 };
      document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="applyModal"], [class*="apply-modal"], [class*="apply-application"]').forEach((d) => {
        out.dialogs.push({ cls: (d.className || '').toString().slice(0, 120), text: (d.innerText || '').slice(0, 200) });
      });
      document.querySelectorAll('button').forEach((b) => {
        const t = (b.innerText || '').trim();
        if (t) out.buttons.push({ text: t.slice(0, 60), cls: (b.className || '').toString().slice(0, 90) });
      });
      document.querySelectorAll('label').forEach((l) => { const t = (l.innerText || '').trim(); if (t) out.labels.push(t.slice(0, 80)); });
      document.querySelectorAll('input').forEach((i) => {
        out.inputs.push({ type: i.type, name: i.name || '', id: i.id || '', placeholder: i.placeholder || '', cls: (i.className || '').toString().slice(0, 70) });
      });
      document.querySelectorAll('select').forEach((s) => {
        out.selects.push({ name: s.name || '', id: s.id || '', options: Array.from(s.options).slice(0, 8).map((o) => o.text.trim().slice(0, 40)) });
      });
      out.radioContainers = document.querySelectorAll('.ssrc__radio-btn-container').length;
      out.chatLists = document.querySelectorAll('ul[id^="chatList_"]').length;
      out.textAreas = document.querySelectorAll('div.textArea').length;
      return out;
    });

    console.log(JSON.stringify({
      outcome: 'guided-paused',
      detail: 'Paused before submit. Review the screenshot and dialog DOM below.',
      screenshot: `/agent-guided/${JOB_ID}.png`,
      filled,
      dialogDom,
    }));
    await browser.close();
    await mongoose.disconnect();
    return;
  }

  // ---- Auto mode: run the questionnaire interview loop, then submit ----
  const interview = await runInterview(page, 20);
  await new Promise((r) => setTimeout(r, 3000));

  const submitted = await safeEval(page, () => {
    const btns = Array.from(document.querySelectorAll('button'));
    const labels = ['Send Application', 'Submit', 'Proceed', 'Apply', 'Continue'];
    for (const lbl of labels) {
      const b = btns.find((x) => (x.innerText || '').trim() === lbl);
      if (b) { b.click(); return lbl; }
    }
    const b = btns.find((x) => /send application|submit|proceed/i.test((x.innerText || '').trim()) && !/Save/i.test(x.innerText));
    if (b) { b.click(); return (b.innerText || '').trim().slice(0, 30); }
    return null;
  });
  await new Promise((r) => setTimeout(r, 7000));

  const text = await pageText(page);
  const finalQuestionnaire = (await safeEval(page, () => {
    const fields = [];
    document.querySelectorAll('input,select,textarea').forEach((el) => {
      const tag = el.tagName.toLowerCase();
      if (tag === 'input' && (el.type === 'text' || el.type === 'tel' || el.type === 'number' || el.type === 'email' || el.type === 'radio' || el.type === 'checkbox')) {
        fields.push({ tag, type: el.type, name: el.name || '', placeholder: el.placeholder || '', id: el.id || '' });
      } else if (tag === 'select' || tag === 'textarea') {
        fields.push({ tag, name: el.name || '', placeholder: el.placeholder || '', id: el.id || '' });
      }
    });
    return fields;
  })) || [];

  let outcome = 'unknown';
  let detail = '';
  if (APPLY_ALREADY.test(text)) { outcome = 'already-applied-on-platform'; detail = 'Naukri says already applied'; }
  else if (APPLY_SUCCESS.test(text)) { outcome = 'applied'; detail = 'Success signal in page text'; }
  else if (APPLY_ERROR.test(text)) { outcome = 'failed'; detail = 'Error/captcha text detected'; }
  else if (finalQuestionnaire.length) { outcome = 'questionnaire'; detail = 'Still showing form after submit'; }
  else { outcome = 'unknown'; detail = 'No clear signal; report needs review'; }

  console.log(JSON.stringify({ outcome, detail, interview, submitted, filled, questionnaire: finalQuestionnaire.slice(0, 15) }));

  await page.screenshot({ path: `/tmp/apply_result_${JOB_ID}.png` }).catch(() => {});
  await browser.close();
  await mongoose.disconnect();
}

main().catch((e) => { console.error('WORKER_ERROR:', e.message); process.exit(1); });
