document.addEventListener('DOMContentLoaded', () => {
  const badge = document.getElementById('statusBadge');
  const pairingInput = document.getElementById('pairingInput');
  const savePairingBtn = document.getElementById('savePairingBtn');
  const disconnectBtn = document.getElementById('disconnectBtn');
  const pairingMsg = document.getElementById('pairingMsg');
  const loggerToggle = document.getElementById('loggerToggle');
  const logsList = document.getElementById('logsList');
  const logCount = document.getElementById('logCount');
  const clearLogsBtn = document.getElementById('clearLogsBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const naukriBadge = document.getElementById('naukriBadge');
  const naukriDesc = document.getElementById('naukriDesc');

  let currentLogs = [];

  function renderStatus(connected, apiKey) {
    if (connected && apiKey) {
      badge.textContent = 'Connected';
      badge.className = 'badge connected';
      pairingInput.value = apiKey;
      savePairingBtn.style.display = 'none';
      disconnectBtn.style.display = 'block';
      pairingMsg.textContent = 'Paired · Streaming to local disk file';
      pairingMsg.className = 'status-msg success';
    } else {
      badge.textContent = 'Disconnected';
      badge.className = 'badge disconnected';
      if (!pairingInput.value) pairingInput.value = apiKey || '';
      savePairingBtn.style.display = 'block';
      disconnectBtn.style.display = 'none';
      pairingMsg.className = 'status-msg';
      pairingMsg.textContent = '';
    }
  }

  function renderLogs(logs) {
    currentLogs = logs || [];
    logCount.textContent = currentLogs.length;

    if (currentLogs.length === 0) {
      logsList.innerHTML = '<div class="empty-logs">Logs stream directly to local disk (data/agent-curl-logs/). Turn on logger to record.</div>';
      return;
    }

    logsList.innerHTML = '';
    currentLogs.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'log-item';
      row.title = item.url;

      const info = document.createElement('div');
      info.style.display = 'flex';
      info.style.alignItems = 'center';
      info.style.gap = '6px';
      info.style.minWidth = '0';
      info.style.flex = '1';

      const method = document.createElement('span');
      method.className = 'method';
      method.textContent = item.method;

      if (item.responseStatus) {
        const statusSpan = document.createElement('span');
        statusSpan.style.fontSize = '10px';
        statusSpan.style.fontFamily = 'monospace';
        statusSpan.style.color = item.responseStatus >= 200 && item.responseStatus < 300 ? '#22c55e' : '#ef4444';
        statusSpan.textContent = item.responseStatus;
        info.appendChild(statusSpan);
      }

      const path = document.createElement('span');
      path.className = 'path';
      path.textContent = `${item.hostname || ''}${item.pathname || ''}`;

      info.appendChild(method);
      info.appendChild(path);

      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-pill';
      copyBtn.textContent = 'cURL';
      copyBtn.onclick = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(item.curl);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'cURL'; }, 1200);
      };

      row.appendChild(info);
      row.appendChild(copyBtn);
      logsList.appendChild(row);
    });
  }

  // Fetch recent logs directly from backend disk endpoint
  function fetchDiskLogs() {
    chrome.storage.local.get(['serverUrl'], (res) => {
      const serverUrl = res.serverUrl || 'http://localhost:3000';
      fetch(`${serverUrl}/api/agent-logs?limit=30`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.logs) {
            renderLogs(data.logs);
          }
        })
        .catch(() => {});
    });
  }

  function checkNaukri() {
    try {
      chrome.runtime.sendMessage({ type: 'CHECK_NAUKRI_STATUS' }, (res) => {
        if (!naukriBadge || !naukriDesc) return;
        if (res && res.isLoggedIn) {
          naukriBadge.textContent = 'Active';
          naukriBadge.className = 'badge connected';
          naukriDesc.textContent = `${res.cookieCount} cookies · ${res.userEmail || 'Authenticated'}`;
        } else {
          naukriBadge.textContent = 'Disconnected';
          naukriBadge.className = 'badge disconnected';
          naukriDesc.textContent = res ? `${res.cookieCount} cookies detected (not logged in)` : 'No active session';
        }
      });
    } catch (e) {}
  }

  // Load status from extension storage
  chrome.storage.local.get(['connected', 'apiKey', 'loggerEnabled'], (res) => {
    renderStatus(Boolean(res.connected), res.apiKey || '');
    if (loggerToggle) loggerToggle.checked = Boolean(res.loggerEnabled);
    checkNaukri();
    fetchDiskLogs();
  });

  // Connect via Pairing Token
  savePairingBtn.addEventListener('click', () => {
    const token = (pairingInput.value || '').trim();
    if (!token) {
      pairingMsg.textContent = 'Please enter a valid pairing token';
      pairingMsg.className = 'status-msg error';
      return;
    }

    chrome.storage.local.set({
      connected: true,
      apiKey: token,
      serverUrl: 'http://localhost:3000'
    }, () => {
      renderStatus(true, token);
      fetchDiskLogs();
    });
  });

  // Disconnect
  disconnectBtn.addEventListener('click', () => {
    chrome.storage.local.set({
      connected: false,
      apiKey: '',
      serverUrl: 'http://localhost:3000'
    }, () => {
      renderStatus(false, '');
      pairingInput.value = '';
    });
  });

  // Toggle logger mode
  if (loggerToggle) {
    loggerToggle.addEventListener('change', () => {
      const enabled = loggerToggle.checked;
      chrome.storage.local.set({ loggerEnabled: enabled });
      try {
        chrome.runtime.sendMessage({
          type: 'SET_LOGGER_ENABLED',
          enabled
        });
      } catch (e) {}
    });
  }

  // Clear logs directly from disk
  if (clearLogsBtn) {
    clearLogsBtn.addEventListener('click', () => {
      chrome.storage.local.get(['serverUrl'], (res) => {
        const serverUrl = res.serverUrl || 'http://localhost:3000';
        fetch(`${serverUrl}/api/agent-logs`, { method: 'DELETE' })
          .then(() => renderLogs([]))
          .catch(() => renderLogs([]));
      });
    });
  }

  // Open settings
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      chrome.storage.local.get(['serverUrl'], (res) => {
        const serverUrl = res.serverUrl || 'http://localhost:3000';
        chrome.tabs.create({ url: `${serverUrl}/settings?tab=extension` });
      });
    });
  }

  // Live incoming cURL event from background worker
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'NEW_CURL_LOG') {
      currentLogs = [msg.log, ...currentLogs].slice(0, 30);
      renderLogs(currentLogs);
    }
  });
});
