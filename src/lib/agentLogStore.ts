import fs from 'fs';
import path from 'path';

export interface LocalAgentLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  hostname: string;
  pathname: string;
  curl: string;
  headers?: Record<string, string>;
  requestBody?: string;
  responseStatus?: number | null;
  responseStatusText?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  createdAt: string;
}

const LOGS_DIR = path.join(process.cwd(), 'data', 'agent-curl-logs');
const ALL_LOGS_FILE = path.join(LOGS_DIR, 'requests_all.jsonl');

function ensureDir() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

/**
 * Appends a log entry to local disk files:
 * 1. Per-domain file: data/agent-curl-logs/<hostname>.jsonl
 * 2. Master file: data/agent-curl-logs/requests_all.jsonl
 */
export function appendLocalLog(entry: LocalAgentLog) {
  try {
    ensureDir();
    const line = JSON.stringify(entry) + '\n';

    // 1. Master JSONL log file
    fs.appendFileSync(ALL_LOGS_FILE, line, 'utf-8');

    // 2. Domain-specific JSONL file (e.g. naukri.com.jsonl, linkedin.com.jsonl)
    const safeHost = String(entry.hostname || 'requests')
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase();
    const hostFile = path.join(LOGS_DIR, `${safeHost}.jsonl`);
    fs.appendFileSync(hostFile, line, 'utf-8');
  } catch (err) {
    console.error('[LocalDiskStore] Failed appending log:', err);
  }
}

/**
 * Reads the latest N logs directly from local disk files without querying the browser
 */
export function readRecentLocalLogs(limit = 50, hostname?: string): LocalAgentLog[] {
  try {
    ensureDir();
    const targetFile = hostname
      ? path.join(LOGS_DIR, `${hostname.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase()}.jsonl`)
      : ALL_LOGS_FILE;

    if (!fs.existsSync(targetFile)) return [];

    const fileContent = fs.readFileSync(targetFile, 'utf-8');
    const lines = fileContent.trim().split('\n').filter(Boolean);

    // Get the most recent lines from the end of the file
    const recentLines = lines.slice(-limit).reverse();
    const result: LocalAgentLog[] = [];

    for (const l of recentLines) {
      try {
        result.push(JSON.parse(l));
      } catch {}
    }

    return result;
  } catch (err) {
    console.error('[LocalDiskStore] Failed reading logs:', err);
    return [];
  }
}

/**
 * Clears local disk logs
 */
export function clearLocalLogs() {
  try {
    ensureDir();
    const files = fs.readdirSync(LOGS_DIR);
    for (const f of files) {
      if (f.endsWith('.jsonl')) {
        fs.unlinkSync(path.join(LOGS_DIR, f));
      }
    }
  } catch (err) {
    console.error('[LocalDiskStore] Failed clearing logs:', err);
  }
}
