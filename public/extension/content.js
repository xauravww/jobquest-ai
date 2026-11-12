// JobQuest AI Extension - Content Script
// Bridges communication between web pages (Settings / Job Search), in-page interceptor, and background worker

// Inject interceptor into the main web page DOM to catch responses
try {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('interceptor.js');
  script.onload = function () {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
} catch (e) {
  console.warn('[JobQuest Agent] Interceptor injection error:', e);
}

window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  const { type, payload } = event.data || {};

  // Receive intercepted request + response from in-page interceptor
  if (type === 'JOBQUEST_HTTP_INTERCEPTED') {
    chrome.runtime.sendMessage({
      type: 'LOG_HTTP_INTERCEPTION',
      data: payload
    }).catch(() => {});
    return;
  }

  if (type === 'JOBQUEST_EXTENSION_PING') {
    chrome.runtime.sendMessage({ type: 'CHECK_CONNECTION' }, (response) => {
      chrome.runtime.sendMessage({ type: 'CHECK_NAUKRI_STATUS' }, (naukriStatus) => {
        window.postMessage({
          type: 'JOBQUEST_EXTENSION_PONG',
          payload: {
            installed: true,
            connected: response?.connected || false,
            serverUrl: response?.serverUrl || 'http://localhost:3000',
            loggerEnabled: response?.loggerEnabled || false,
            naukri: naukriStatus || { isLoggedIn: false, cookieCount: 0 }
          }
        }, '*');
      });
    });
  }

  if (type === 'JOBQUEST_CHECK_NAUKRI') {
    chrome.runtime.sendMessage({ type: 'CHECK_NAUKRI_STATUS' }, (naukriStatus) => {
      window.postMessage({
        type: 'JOBQUEST_NAUKRI_STATUS_RESULT',
        payload: naukriStatus || { isLoggedIn: false, cookieCount: 0 }
      }, '*');
    });
  }

  if (type === 'JOBQUEST_CONNECT_EXTENSION') {
    chrome.runtime.sendMessage({
      type: 'SET_CONNECTION',
      connected: payload?.connected ?? true,
      apiKey: payload?.apiKey || '',
      serverUrl: payload?.serverUrl || window.location.origin
    }, (res) => {
      window.postMessage({
        type: 'JOBQUEST_CONNECT_RESULT',
        payload: { success: res?.success ?? false }
      }, '*');
    });
  }

  if (type === 'JOBQUEST_SET_LOGGER') {
    chrome.runtime.sendMessage({
      type: 'SET_LOGGER_ENABLED',
      enabled: Boolean(payload?.enabled)
    }, (res) => {
      window.postMessage({
        type: 'JOBQUEST_SET_LOGGER_RESULT',
        payload: { success: res?.success ?? false, enabled: res?.enabled }
      }, '*');
    });
  }

  if (type === 'JOBQUEST_GET_LOGS') {
    chrome.runtime.sendMessage({ type: 'GET_LOGGER_STATE' }, (res) => {
      window.postMessage({
        type: 'JOBQUEST_LOGS_RESULT',
        payload: {
          loggerEnabled: res?.loggerEnabled || false,
          capturedLogs: res?.capturedLogs || []
        }
      }, '*');
    });
  }

  if (type === 'JOBQUEST_CLEAR_LOGS') {
    chrome.runtime.sendMessage({ type: 'CLEAR_LOGS' }, (res) => {
      window.postMessage({
        type: 'JOBQUEST_CLEAR_LOGS_RESULT',
        payload: { success: res?.success ?? false }
      }, '*');
    });
  }
});

// Forward cURL logs to the dashboard in real-time
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'NEW_CURL_LOG') {
    window.postMessage({
      type: 'JOBQUEST_NEW_CURL_ENTRY',
      payload: msg.log
    }, '*');
  }
});

// Listen for storage changes from popup or background and keep web page in sync
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    if (changes.loggerEnabled !== undefined) {
      window.postMessage({
        type: 'JOBQUEST_LOGGER_STATE_CHANGED',
        payload: { loggerEnabled: changes.loggerEnabled.newValue }
      }, '*');
    }
    if (changes.connected !== undefined) {
      window.postMessage({
        type: 'JOBQUEST_CONNECTION_STATE_CHANGED',
        payload: { connected: changes.connected.newValue }
      }, '*');
    }
  }
});

window.postMessage({ type: 'JOBQUEST_EXTENSION_DETECTED' }, '*');
