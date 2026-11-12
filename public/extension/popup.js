document.addEventListener('DOMContentLoaded', () => {
  const badge = document.getElementById('statusBadge');
  const desc = document.getElementById('statusDesc');
  const btn = document.getElementById('toggleBtn');

  function render(connected) {
    if (connected) {
      badge.textContent = 'Connected';
      badge.className = 'badge connected';
      desc.textContent = 'JobQuest Agent is active and connected to your dashboard for automated form filling.';
      btn.textContent = 'Disconnect';
    } else {
      badge.textContent = 'Disconnected';
      badge.className = 'badge disconnected';
      desc.textContent = 'Connect your extension to JobQuest AI to enable one-click form autofill and job syncing.';
      btn.textContent = 'Open Settings to Connect';
    }
  }

  chrome.storage.local.get(['connected', 'serverUrl'], (res) => {
    render(Boolean(res.connected));
  });

  btn.addEventListener('click', () => {
    chrome.storage.local.get(['connected', 'serverUrl'], (res) => {
      const serverUrl = res.serverUrl || 'http://localhost:3000';
      if (res.connected) {
        chrome.storage.local.set({ connected: false }, () => render(false));
      } else {
        chrome.tabs.create({ url: `${serverUrl}/settings?tab=extension` });
      }
    });
  });
});
