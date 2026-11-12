// JobQuest AI Extension - Content Script
// Bridges communication between web pages (Settings / Job Search) and the extension

window.addEventListener('message', (event) => {
  // Only accept messages from same window
  if (event.source !== window) return;

  const { type, payload } = event.data || {};

  if (type === 'JOBQUEST_EXTENSION_PING') {
    // Notify the web page that the extension is active and installed
    chrome.runtime.sendMessage({ type: 'CHECK_CONNECTION' }, (response) => {
      window.postMessage({
        type: 'JOBQUEST_EXTENSION_PONG',
        payload: {
          installed: true,
          connected: response?.connected || false,
          serverUrl: response?.serverUrl || 'http://localhost:3000'
        }
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
});

// Announce presence to the page
window.postMessage({ type: 'JOBQUEST_EXTENSION_DETECTED' }, '*');
