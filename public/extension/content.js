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

  if (type === 'JOBQUEST_GET_NAUKRI_COOKIES') {
    chrome.runtime.sendMessage({ type: 'GET_NAUKRI_COOKIES' }, (result) => {
      window.postMessage({
        type: 'JOBQUEST_NAUKRI_COOKIES_RESULT',
        payload: result || { success: false, error: 'No response from extension' }
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

// ============================================================
// Auto-Apply (runs inside the user's real, logged-in Naukri browser)
// ============================================================
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function getAnswer(question, options, questionType) {
  return new Promise((resolve) => {
    let done = false;
    const fin = (v) => { if (!done) { done = true; resolve(v); } };
    chrome.runtime.sendMessage(
      { type: 'JOBQUEST_AI_ANSWER', payload: { question, options, questionType } },
      (res) => fin((res && res.answer) || null)
    );
    setTimeout(() => fin(null), 5000);
  });
}

function getProfileHint() {
  return new Promise((resolve) => {
    let done = false;
    const fin = (v) => { if (!done) { done = true; resolve(v); } };
    chrome.runtime.sendMessage({ type: 'JOBQUEST_GET_PROFILE' }, (res) => fin(res || {}));
    setTimeout(() => fin({}), 4000);
  });
}

async function clickTextButton(text) {
  const els = Array.from(document.querySelectorAll('button, [role="button"], a, div, span'));

  // 1. exact text match (smallest, clickable)
  let b = els.find((e) => {
    const t = (e.innerText || '').trim();
    return t.length > 0 && t.length <= 24 && t.toLowerCase() === text.toLowerCase();
  });
  // 2. contains match
  if (!b) {
    b = els.find((e) => {
      const t = (e.innerText || '').trim();
      return t.length > 0 && t.length <= 40 && t.toLowerCase().includes(text.toLowerCase());
    });
  }
  // 3. class-based (e.g. buttons with "save" in class)
  if (!b) {
    b = els.find((e) => {
      const cls = (e.className || '').toString().toLowerCase();
      return /(^|[\s_-])save([\s_-]|$)/.test(cls) && e.tagName !== 'SPAN';
    });
  }
  if (b) {
    b.click();
    // Focusable non-button controls (e.g. div.sendMsg, tabindex="0") are often
    // keyboard-activated — send Enter as well so React registers the action.
    if (b.tagName !== 'BUTTON' && b.tagName !== 'A') {
      const o = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
      b.dispatchEvent(new KeyboardEvent('keydown', o));
      b.dispatchEvent(new KeyboardEvent('keypress', o));
      b.dispatchEvent(new KeyboardEvent('keyup', o));
    }
    return true;
  }
  return false;
}

async function clickAction() {
  for (const label of ['Save', 'Send', 'Submit', 'Next', 'Continue']) {
    if (await clickTextButton(label)) return label;
  }
  return null;
}

// Focus, click, and Enter the per-question Save control (div.sendMsg[tabindex="0"]).
async function clickSendSave() {
  const el = Array.from(document.querySelectorAll('div.sendMsg')).find((e) => e.getAttribute('tabindex') === '0')
    || document.querySelector('div.sendMsg');
  if (!el) return false;
  el.focus();
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  dispatchEnter(el);
  return true;
}

async function selectRadio(container) {
  if (!container) return;
  const input = container.querySelector('input');
  const label = container.querySelector('label');
  if (input) { input.click(); input.dispatchEvent(new Event('change', { bubbles: true })); }
  if (label) label.click();
}

async function isSuccess() {
  return /successfully applied/i.test(document.body.innerText || '');
}

async function runAutoApply() {
  const results = { steps: 0, filled: [], radioContainers: 0, chatLists: 0, success: false, error: null, probes: [] };
  const findTextInput = () => {
    const els = Array.from(document.querySelectorAll('textarea, div.textArea, [contenteditable="true"], input'));
    const candidate = els.find((el) => {
      const t = (el.type || '').toLowerCase();
      if (['hidden', 'checkbox', 'radio', 'file', 'submit', 'button', 'date', 'password'].includes(t)) return false;
      const ph = (el.placeholder || '').toLowerCase();
      const name = ((el.name || '') + ' ' + (el.id || '')).toLowerCase();
      if (/(keyword|location|experience|mobile)/.test(ph) || /mob_num|experienceDD/.test(name)) return false;
      return true;
    });
    return candidate || null;
  };

  // Properly "type" into a (possibly React-controlled) field: focus first,
  // then use the native value setter + input events so the framework registers
  // the value and enables the Save/Apply button.
  const dispatchEnter = (el) => {
    const opts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
    el.dispatchEvent(new KeyboardEvent('keydown', opts));
    el.dispatchEvent(new KeyboardEvent('keypress', opts));
    el.dispatchEvent(new KeyboardEvent('keyup', opts));
  };

  // Properly "type" into a (possibly React-controlled) field: focus first,
  // then use the native value setter + input events so the framework registers
  // the value and enables the Save/Apply button.
  const sendProbe = (state) => {
    chrome.runtime.sendMessage({ type: 'JOBQUEST_DEBUG_PROBE', payload: state }, () => {});
    console.log('[JobQuest AutoApply] probe', JSON.stringify(state));
  };

  const typeText = (el, text) => {
    el.focus();
    const clickEvt = new MouseEvent('mousedown', { bubbles: true });
    el.dispatchEvent(clickEvt);
    if (el.isContentEditable) {
      el.innerText = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(el, '');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    setter.call(el, String(text));
    el.dispatchEvent(new InputEvent('input', { bubbles: true, data: String(text), inputType: 'insertText' }));
    el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
  };
  try {
    // 1. Click the in-site Apply button
    await sleep(2500);
    const applyClicked = await clickTextButton('Apply') || await clickTextButton('Apply on company site');
    results.filled.push({ step: 'apply', clicked: applyClicked });
    await sleep(3500);

    // 2. Fill inline CUSTOM first/last name fields if present
    const fillField = async (id, value) => {
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'JOBQUEST_GET_NAME' }, (res) => {
          const name = (res && res.name) || '';
          const parts = name.split(/\s+/).filter(Boolean);
          const v = id === 'CUSTOM-FIRSTNAME' ? (parts[0] || '') : (parts.slice(1).join(' ') || '');
          if (v) {
            const el = document.getElementById(id);
            if (el) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); resolve(true); return; }
          }
          resolve(false);
        });
      });
    };
    await fillField('CUSTOM-FIRSTNAME');
    await fillField('CUSTOM-LASTNAME');
    await sleep(800);
    await clickTextButton('Submit and Apply');
    await sleep(2500);

    // 3. Chatbot questionnaire loop
    for (let step = 0; step < 12; step++) {
      if (await isSuccess()) { results.success = true; break; }

      sendProbe({
        kind: 'loop',
        step,
        jobId: (location.pathname.match(/job-listings-([^/?]+)/) || [])[1] || '',
        radios: document.querySelectorAll('.ssrc__radio-btn-container').length,
        chatList: !!document.querySelector('ul[id^="chatList_"]'),
        saveCandidates: Array.from(document.querySelectorAll('button, [role="button"], a, div, span'))
          .filter((e) => /^save$|save/i.test(((e.innerText || '').trim()) || ((e.className || '').toString())))
          .filter((e) => ((e.innerText || '').trim().length <= 12))
          .slice(0, 6)
          .map((e) => ({
            tag: e.tagName,
            text: (e.innerText || '').trim().slice(0, 14),
            cls: (e.className || '').toString().slice(0, 30),
            tab: e.getAttribute('tabindex'),
          })),
        activeTag: document.activeElement ? document.activeElement.tagName : '',
        activeCls: document.activeElement ? (document.activeElement.className || '').toString().slice(0, 30) : '',
      });

      try {
      const radios = Array.from(document.querySelectorAll('.ssrc__radio-btn-container'));
      if (radios.length) {
        results.radioContainers = radios.length;
        const options = radios.map((c) => {
          const label = c.querySelector('label');
          return label ? label.innerText.trim() : '';
        }).filter(Boolean);
        const qEl = document.querySelector('li[class*="botItem"] .botMsg, li[class*="botItem"] span');
        const question = qEl ? qEl.innerText.trim() : '';
        let answer = await getAnswer(question, options, 'Radio Button');
        if (!answer && options.length) answer = options[0];
        const idx = options.indexOf(answer);
        const pick = idx >= 0 ? idx : 0;
        await selectRadio(radios[pick]);
        results.filled.push({ step: 'radio', question, answer });
        await sleep(600);
        await clickSendSave();
        await sleep(1200);
        // If per-question Save didn't advance, try the final apply button.
        if (document.querySelectorAll('.ssrc__radio-btn-container').length > 3) {
          const applyBtn = Array.from(document.querySelectorAll('div,button')).find((e) =>
            /apply/i.test((e.innerText || '').trim()) && ((e.innerText || '').trim().length <= 20)
          );
          if (applyBtn) { applyBtn.click(); dispatchEnter(applyBtn); }
        }
        continue;
      }

      const chatList = document.querySelector('ul[id^="chatList_"]');
      const textArea = findTextInput();
      results.probes.push({
        step,
        radios: document.querySelectorAll('.ssrc__radio-btn-container').length,
        chatList: !!chatList,
        textInput: textArea ? (textArea.tagName + '|' + (textArea.className || '').toString().slice(0, 30)) : null,
      });
      if (chatList && textArea) {
        results.chatLists = 1;
        const lis = chatList.querySelectorAll('li');
        const question = lis.length ? lis[lis.length - 1].innerText.trim().slice(0, 200) : '';
        const hints = await getProfileHint();
        const ql = question.toLowerCase();
        let answer = null;

        if (/expected.*ctc|expected ctc/.test(ql)) answer = hints.expectedCtc || '20';
        else if (/current ctc/.test(ql)) answer = hints.currentCtc || '12';
        else if (/years of experience|experience.*react|total experience/.test(ql)) answer = String(hints.experience || '2');
        else if (/notice period/.test(ql)) answer = hints.noticePeriod || 'Immediate';
        else if (/date of birth|dob/.test(ql)) answer = '01/01/2000';
        else if (/numeric|number/.test(question)) answer = '2';
        else {
          answer = await getAnswer(question, [], 'Text Box');
          if (!answer || /Experienced professional with strong technical skills/.test(answer)) {
            answer = 'Experienced professional with strong technical skills and relevant hands-on project work.';
          }
        }

        if (/numeric|number/.test(question)) answer = String(answer).replace(/\D/g, '') || '2';
        typeText(textArea, answer);
        results.filled.push({ step: 'text', question, answer });
        await sleep(700);
        // Chat input submits on Enter — this is the reliable path.
        textArea.focus();
        dispatchEnter(textArea);
        await sleep(1200);
        if (!(await isSuccess())) {
          await clickAction();
          await sleep(1000);
        }
        continue;
      }

      await sleep(1500);
      } catch (err) { console.log('[JobQuest] step err', err); await sleep(1200); }
    }
    results.success = results.success || await isSuccess();
  } catch (e) {
    results.error = String(e && e.message || e);
  }
  results.steps = results.filled.length;

  // Report back to our backend via the background worker
  chrome.runtime.sendMessage({ type: 'JOBQUEST_RECORD_APPLY', payload: { jobId: (location.pathname.match(/job-listings-([^/?]+)/) || [])[1] || '', ...results } });
}

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  const { type, payload } = event.data || {};
  if (type === 'JOBQUEST_AUTO_APPLY') {
    runAutoApply();
  }
});

if (/\/job-listings-/.test(location.pathname) && new URLSearchParams(location.search).get('jqA') === '1') {
  setTimeout(runAutoApply, 2500);
}
