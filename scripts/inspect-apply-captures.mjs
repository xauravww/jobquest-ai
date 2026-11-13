// Inspect captured Naukri apply requests in the extension log.
// Prints each captured apply request's shape: method, URL, key headers
// (authorization/cookie), body, and response status. This is the ground-truth
// we use to learn/reproduce the apply flow.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG = path.join(__dirname, '..', 'data', 'agent-curl-logs', 'www.naukri.com.jsonl');

if (!fs.existsSync(LOG)) { console.log('no log file'); process.exit(0); }
const lines = fs.readFileSync(LOG, 'utf-8').split('\n').filter(Boolean);

let found = 0;
for (let i = lines.length - 1; i >= 0; i--) {
  try {
    const d = JSON.parse(lines[i]);
    const url = d.url || '';
    if (!url.includes('apply-workflow') && !url.includes('cloudgateway-apply')) continue;
    found++;
    console.log('\n==========================================');
    console.log('METHOD:', d.method);
    console.log('URL:', url.slice(0, 160));
    console.log('responseStatus:', d.responseStatus);
    const h = d.headers || {};
    const important = {};
    for (const k of Object.keys(h)) {
      const lk = k.toLowerCase();
      if (['authorization', 'cookie', 'user-agent', 'referer', 'origin', 'content-type', 'appid', 'clientid', 'systemid', 'nkparam', 'x-requested-with'].includes(lk)) {
        important[k] = String(h[k]).slice(0, 90);
      }
    }
    console.log('KEY HEADERS:', JSON.stringify(important, null, 1));
    console.log('BODY:', String(d.requestBody || '').slice(0, 300));
    if (found >= 3) break;
  } catch {}
}
console.log('\nTOTAL captured apply requests:', found);
