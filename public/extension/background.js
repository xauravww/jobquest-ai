// JobQuest AI Extension - Background Service Worker with Stream-to-Disk Logger

chrome.runtime.onInstalled.addListener(() => {
  console.log('[JobQuest Agent] Extension installed.');
  chrome.storage.local.get(['serverUrl', 'apiKey', 'connected', 'loggerEnabled'], (res) => {
    const updates = {};
    if (res.serverUrl === undefined) updates.serverUrl = 'http://localhost:3000';
    if (res.connected === undefined) updates.connected = false;
    if (res.loggerEnabled === undefined) updates.loggerEnabled = false;

    // Purge old heavy capturedLogs array out of browser storage entirely
    updates.capturedLogs = [];

    chrome.storage.local.set(updates);
  });
});

function truncate(str, max = 8000) {
  if (!str) return '';
  if (typeof str !== 'string') {
    try {
      str = JSON.stringify(str);
    } catch {
      str = String(str);
    }
  }
  if (str.length > max) {
    return str.substring(0, max) + '... [truncated]';
  }
  return str;
}

// Helper: convert request data into exact curl command
function generateCurl(details) {
  const method = details.method || 'GET';
  const url = details.url;
  const parts = [`curl '${url}'`];

  if (method !== 'GET') {
    parts.push(`-X ${method}`);
  }

  // Include request headers (exclude internal pseudo-headers)
  if (details.headers) {
    if (Array.isArray(details.headers)) {
      for (const h of details.headers) {
        const name = (h.name || '').toLowerCase();
        if (!name.startsWith(':')) {
          const val = (h.value || '').replace(/'/g, `'\\''`);
          parts.push(`-H '${h.name}: ${val}'`);
        }
      }
    } else if (typeof details.headers === 'object') {
      for (const [k, v] of Object.entries(details.headers)) {
        if (!k.startsWith(':')) {
          const val = String(v || '').replace(/'/g, `'\\''`);
          parts.push(`-H '${k}: ${val}'`);
        }
      }
    }
  }

  // Include request body
  if (details.requestBody) {
    if (typeof details.requestBody === 'string') {
      const safeBody = truncate(details.requestBody, 8000).replace(/'/g, `'\\''`);
      parts.push(`--data-raw '${safeBody}'`);
    } else if (details.requestBody.raw && details.requestBody.raw[0] && details.requestBody.raw[0].bytes) {
      try {
        const decoder = new TextDecoder('utf-8');
        const rawStr = decoder.decode(details.requestBody.raw[0].bytes);
        const safeBody = truncate(rawStr, 8000).replace(/'/g, `'\\''`);
        parts.push(`--data-raw '${safeBody}'`);
      } catch (e) {}
    } else if (details.requestBody.formData) {
      const formParts = [];
      for (const [k, vals] of Object.entries(details.requestBody.formData)) {
        for (const v of vals) {
          formParts.push(`${encodeURIComponent(k)}=${encodeURIComponent(truncate(String(v), 500))}`);
        }
      }
      if (formParts.length > 0) {
        parts.push(`--data '${formParts.join('&')}'`);
      }
    }
  }

  return parts.join(' \\\n  ');
}

/**
 * Stream log entry directly to the local backend disk (ZERO storage in browser storage.local)
 */
function streamLogToDisk(logEntry) {
  // CRITICAL: Ignore all internal local server traffic to prevent loop
  if (
    !logEntry.url ||
    logEntry.url.includes('localhost:3000') ||
    logEntry.url.includes('127.0.0.1:3000') ||
    logEntry.url.startsWith('chrome-extension://')
  ) {
    return;
  }

  chrome.storage.local.get(['connected', 'serverUrl'], (res) => {
    // Stream directly to backend disk file
    const serverUrl = res.serverUrl || 'http://localhost:3000';
    const endpoint = `${serverUrl}/api/agent-logs`;

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry),
    }).catch(() => {
      // Offline/server not running; silently ignore
    });

    // Notify open popup/web views with small lightweight event (no browser storage footprint)
    try {
      chrome.runtime.sendMessage({
        type: 'NEW_CURL_LOG',
        log: {
          id: logEntry.id,
          timestamp: logEntry.timestamp,
          method: logEntry.method,
          url: logEntry.url,
          hostname: logEntry.hostname,
          pathname: logEntry.pathname,
          curl: logEntry.curl,
          responseStatus: logEntry.responseStatus,
        },
      }).catch(() => {});
    } catch (e) {}
  });
}

// In-flight map for webRequest
const inFlightRequests = new Map();

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    chrome.storage.local.get(['loggerEnabled'], (res) => {
      if (!res.loggerEnabled) return;
      if (
        details.type === 'image' ||
        details.type === 'stylesheet' ||
        details.type === 'font' ||
        details.type === 'media' ||
        details.url.includes('localhost:3000') ||
        details.url.startsWith('chrome-extension://')
      ) return;

      if (details.requestBody) {
        inFlightRequests.set(details.requestId, {
          requestBody: details.requestBody,
          timestamp: Date.now()
        });
      }
    });
  },
  { urls: ['<all_urls>'] },
  ['requestBody']
);

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    chrome.storage.local.get(['loggerEnabled'], (res) => {
      if (!res.loggerEnabled) return;
      if (
        details.type === 'image' ||
        details.type === 'stylesheet' ||
        details.type === 'font' ||
        details.type === 'media' ||
        details.url.includes('localhost:3000') ||
        details.url.startsWith('chrome-extension://')
      ) return;

      const bodyData = inFlightRequests.get(details.requestId);
      if (bodyData) {
        inFlightRequests.delete(details.requestId);
      }

      const mergedDetails = {
        ...details,
        headers: details.requestHeaders,
        requestBody: bodyData ? bodyData.requestBody : details.requestBody
      };

      const curlCmd = generateCurl(mergedDetails);
      let hostname = '';
      let pathname = '';
      try {
        const urlObj = new URL(details.url);
        hostname = urlObj.hostname;
        pathname = urlObj.pathname;
      } catch {
        hostname = 'unknown';
      }

      const logEntry = {
        id: details.requestId || String(Date.now()),
        timestamp: new Date().toLocaleTimeString(),
        method: details.method,
        url: details.url,
        hostname,
        pathname,
        curl: curlCmd,
        requestBody: typeof mergedDetails.requestBody === 'string' ? mergedDetails.requestBody : '',
        headers: details.requestHeaders ? Object.fromEntries(details.requestHeaders.map(h => [h.name, h.value || ''])) : {},
        responseStatus: null,
        responseBody: ''
      };

      streamLogToDisk(logEntry);
    });
  },
  { urls: ['<all_urls>'] },
  ['requestHeaders', 'extraHeaders']
);

// Message Handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PING') {
    sendResponse({ status: 'ok', version: '1.3.0' });
    return true;
  }

  // In-page intercepted fetch/XHR with responses
  if (request.type === 'LOG_HTTP_INTERCEPTION') {
    chrome.storage.local.get(['loggerEnabled'], (res) => {
      if (!res.loggerEnabled) return;
      const data = request.data;
      if (
        !data ||
        !data.url ||
        data.url.includes('localhost:3000') ||
        data.url.startsWith('chrome-extension://')
      ) return;

      let hostname = '';
      let pathname = '';
      try {
        const urlObj = new URL(data.url, 'http://localhost');
        hostname = urlObj.hostname;
        pathname = urlObj.pathname;
      } catch {
        hostname = 'unknown';
      }

      const curlCmd = generateCurl({
        method: data.method,
        url: data.url,
        headers: data.headers,
        requestBody: data.requestBody
      });

      const logEntry = {
        id: String(Date.now()) + Math.random().toString(36).substr(2, 4),
        timestamp: data.timestamp || new Date().toLocaleTimeString(),
        method: data.method,
        url: data.url,
        hostname,
        pathname,
        curl: curlCmd,
        headers: data.headers || {},
        requestBody: data.requestBody || '',
        responseStatus: data.status,
        responseStatusText: data.statusText,
        responseHeaders: data.responseHeaders || {},
        responseBody: data.responseBody || ''
      };

      streamLogToDisk(logEntry);
    });
    return true;
  }

  if (request.type === 'SET_LOGGER_ENABLED') {
    chrome.storage.local.set({ loggerEnabled: request.enabled }, () => {
      sendResponse({ success: true, enabled: request.enabled });
    });
    return true;
  }

  if (request.type === 'CHECK_CONNECTION') {
    chrome.storage.local.get(['connected', 'serverUrl', 'apiKey', 'loggerEnabled'], (data) => {
      sendResponse({
        connected: Boolean(data.connected),
        serverUrl: data.serverUrl || 'http://localhost:3000',
        hasKey: Boolean(data.apiKey),
        loggerEnabled: Boolean(data.loggerEnabled)
      });
    });
    return true;
  }

  if (request.type === 'SET_CONNECTION') {
    chrome.storage.local.set({
      connected: request.connected,
      apiKey: request.apiKey || '',
      serverUrl: request.serverUrl || 'http://localhost:3000'
    }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  // Check Naukri Cookies / Session state
  if (request.type === 'CHECK_NAUKRI_STATUS') {
    // Query both with and without domain dot, and exact URL to handle all cookie scoping
    chrome.cookies.getAll({ url: 'https://www.naukri.com' }, (urlCookies) => {
      chrome.cookies.getAll({ domain: '.naukri.com' }, (domainCookies) => {
        chrome.cookies.getAll({ domain: 'naukri.com' }, (plainDomainCookies) => {
          const all = [
            ...(urlCookies || []),
            ...(domainCookies || []),
            ...(plainDomainCookies || [])
          ];
          const uniqueMap = new Map();
          for (const c of all) {
            if (c && c.name) uniqueMap.set(c.name, c);
          }
          const cookies = Array.from(uniqueMap.values());

          if (cookies.length === 0) {
            sendResponse({
              isLoggedIn: false,
              cookieCount: 0,
              userEmail: null,
              hasAuthToken: false,
              lastChecked: new Date().toLocaleTimeString()
            });
            return;
          }

          // Check key session cookies: nauk_at, is_login, NKAUTH, MYNAUKRI[UNID]
          const authCookie = cookies.find(c => c.name === 'nauk_at' || c.name === 'NKAUTH');
          const loginFlag = cookies.find(c => c.name === 'is_login');
          const unidCookie = cookies.find(c => c.name === 'MYNAUKRI[UNID]' || c.name === 'UNID');
          const userCookie = cookies.find(c => c.name === 'USER' || c.name === 'user');

          let userEmail = null;
          if (userCookie && userCookie.value) {
            try {
              const decoded = decodeURIComponent(userCookie.value);
              const match = decoded.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
              if (match) userEmail = match[1];
            } catch {}
          }

          const isLoggedIn = Boolean(
            (authCookie && authCookie.value) ||
            (loginFlag && loginFlag.value === '1') ||
            (unidCookie && unidCookie.value)
          );

          sendResponse({
            isLoggedIn,
            cookieCount: cookies.length,
            hasAuthToken: Boolean(authCookie && authCookie.value),
            userEmail: userEmail || (isLoggedIn ? 'Active User' : null),
            lastChecked: new Date().toLocaleTimeString()
          });
        });
      });
    });
    return true;
  }
});
