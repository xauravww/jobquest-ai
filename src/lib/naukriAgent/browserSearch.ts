import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import type { NaukriParsedJob } from '@/lib/naukriService';

const execFileP = promisify(execFile);

export type BrowserJob = NaukriParsedJob;

interface WorkerResult {
  keyword: string;
  location: string;
  count: number;
  jobs: BrowserJob[];
}

function findWorkerPath(): string {
  const candidates = [
    path.join(process.cwd(), 'scripts/browser-search-worker.mjs'),
    path.join(process.cwd(), 'scripts', 'browser-search-worker.mjs'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('browser-search-worker.mjs not found');
}

/**
 * Runs a real in-browser Naukri keyword search via a headful Chromium under
 * Xvfb (using the stored session cookies). This is the only way to get past
 * Naukri's reCAPTCHA for arbitrary keyword searches.
 */
export async function browserKeywordSearch(keyword: string, location = ''): Promise<BrowserJob[]> {
  const worker = findWorkerPath();
  const arg = JSON.stringify({ keyword, location });
  const hasXvfb = fs.existsSync('/usr/bin/xvfb-run');
  const hasDisplay = Boolean(process.env.DISPLAY);

  let command: string;
  let args: string[];
  if (hasXvfb && !hasDisplay) {
    command = 'xvfb-run';
    args = ['-a', '-s', '-screen 0 1366x850x24', 'node', worker, arg];
  } else {
    command = 'node';
    args = [worker, arg];
  }

  try {
    const { stdout } = await execFileP(command, args, {
      timeout: 90000,
      maxBuffer: 8 * 1024 * 1024,
      env: { ...process.env, MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI || '' },
    });
    const parsed: WorkerResult = JSON.parse(stdout);
    return Array.isArray(parsed.jobs) ? parsed.jobs : [];
  } catch (err: any) {
    console.error('[browserSearch] worker failed:', err?.message);
    return [];
  }
}
