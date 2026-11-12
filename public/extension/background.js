// JobQuest AI Extension - Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('[JobQuest Agent] Extension installed.');
  chrome.storage.local.get(['serverUrl', 'apiKey', 'connected'], (res) => {
    if (!res.serverUrl) {
      chrome.storage.local.set({
        serverUrl: 'http://localhost:3000',
        connected: false
      });
    }
  });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PING') {
    sendResponse({ status: 'ok', version: '1.0.0' });
    return true;
  }

  if (request.type === 'CHECK_CONNECTION') {
    chrome.storage.local.get(['connected', 'serverUrl', 'apiKey'], (data) => {
      sendResponse({
        connected: Boolean(data.connected),
        serverUrl: data.serverUrl || 'http://localhost:3000',
        hasKey: Boolean(data.apiKey)
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
});
