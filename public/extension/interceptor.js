// JobQuest In-Page Network Interceptor for Fetch & XHR
// Runs directly in the main web page context to intercept exact request & response bodies

(function () {
  if (window.__JOBQUEST_INTERCEPTOR_INITIALIZED__) return;
  window.__JOBQUEST_INTERCEPTOR_INITIALIZED__ = true;

  // Allow up to 100KB for API responses (like recom-jobs or profile) while keeping safe from chrome IPC 64MB limit
  const MAX_CAPTURE_LENGTH = 120000;

  // Intercept window.fetch
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const input = args[0];
    const init = args[1] || {};

    const method = (init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);

    // Skip extension internals or data URLs
    if (url.startsWith('chrome-extension://') || url.startsWith('data:')) {
      return originalFetch.apply(this, args);
    }

    let requestBody = null;
    if (init.body) {
      if (typeof init.body === 'string') {
        requestBody = init.body.length > MAX_CAPTURE_LENGTH ? init.body.slice(0, MAX_CAPTURE_LENGTH) + '... [truncated]' : init.body;
      } else {
        try {
          const str = JSON.stringify(init.body);
          requestBody = str.length > MAX_CAPTURE_LENGTH ? str.slice(0, MAX_CAPTURE_LENGTH) + '... [truncated]' : str;
        } catch {
          requestBody = '[Complex/FormData Object]';
        }
      }
    }

    try {
      const response = await originalFetch.apply(this, args);
      // Clone response to avoid disturbing the web application's own stream consumption
      const clone = response.clone();

      clone.text().then((responseText) => {
        let safeResponseBody = responseText || '';
        if (safeResponseBody.length > MAX_CAPTURE_LENGTH) {
          safeResponseBody = safeResponseBody.slice(0, MAX_CAPTURE_LENGTH) + '... [truncated]';
        }

        window.postMessage({
          type: 'JOBQUEST_HTTP_INTERCEPTED',
          payload: {
            method,
            url,
            status: response.status,
            statusText: response.statusText,
            requestBody,
            responseBody: safeResponseBody,
            headers: init.headers ? (init.headers instanceof Headers ? Object.fromEntries(init.headers.entries()) : init.headers) : {},
            responseHeaders: Object.fromEntries(response.headers.entries()),
            timestamp: new Date().toLocaleTimeString()
          }
        }, '*');
      }).catch(() => {});

      return response;
    } catch (err) {
      throw err;
    }
  };

  // Intercept XMLHttpRequest
  const originalXHR = window.XMLHttpRequest;
  function CustomXHR() {
    const xhr = new originalXHR();
    let method = 'GET';
    let url = '';
    let reqBody = null;
    const reqHeaders = {};

    const origOpen = xhr.open;
    xhr.open = function (m, u, ...rest) {
      method = m.toUpperCase();
      url = u;
      return origOpen.apply(xhr, [m, u, ...rest]);
    };

    const origSetHeader = xhr.setRequestHeader;
    xhr.setRequestHeader = function (header, value) {
      reqHeaders[header] = value;
      return origSetHeader.apply(xhr, [header, value]);
    };

    const origSend = xhr.send;
    xhr.send = function (data) {
      if (typeof data === 'string') {
        reqBody = data.length > MAX_CAPTURE_LENGTH ? data.slice(0, MAX_CAPTURE_LENGTH) + '... [truncated]' : data;
      } else if (data) {
        reqBody = '[FormData/Binary]';
      }

      xhr.addEventListener('load', function () {
        try {
          if (url.startsWith('chrome-extension://') || url.startsWith('data:')) return;
          let respBody = xhr.responseText || '';
          if (respBody.length > MAX_CAPTURE_LENGTH) {
            respBody = respBody.slice(0, MAX_CAPTURE_LENGTH) + '... [truncated]';
          }

          window.postMessage({
            type: 'JOBQUEST_HTTP_INTERCEPTED',
            payload: {
              method,
              url,
              status: xhr.status,
              statusText: xhr.statusText,
              requestBody: reqBody,
              responseBody: respBody,
              headers: reqHeaders,
              timestamp: new Date().toLocaleTimeString()
            }
          }, '*');
        } catch {}
      });

      return origSend.apply(xhr, [data]);
    };

    return xhr;
  }

  window.XMLHttpRequest = CustomXHR;
})();
