import { NodeHtmlMarkdown } from 'node-html-markdown';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';

/**
 * Creates a proxy agent if proxy environment variables are set.
 * @param {string} targetUrl The URL the request is being made to.
 * @returns {HttpsProxyAgent | HttpProxyAgent | undefined}
 */
function createProxyAgent(targetUrl) {
  const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;

  if (!proxyUrl) {
    return undefined;
  }

  try {
    const parsedProxyUrl = new URL(proxyUrl);
    if (!['http:', 'https:'].includes(parsedProxyUrl.protocol)) {
      console.error(`Unsupported proxy protocol: ${parsedProxyUrl.protocol}. Only HTTP and HTTPS are supported.`);
      return undefined;
    }
    const isHttps = targetUrl.startsWith('https:');
    return isHttps ? new HttpsProxyAgent(proxyUrl) : new HttpProxyAgent(proxyUrl);
  } catch (error) {
    console.error(`Invalid proxy URL: ${proxyUrl}`);
    return undefined;
  }
}

/**
 * Fetches a URL, converts its HTML content to Markdown, and handles errors.
 * @param {string} url The URL to fetch.
 * @param {number} timeoutMs The timeout for the request in milliseconds.
 * @returns {Promise<string>} The Markdown content of the URL.
 */
export async function fetchAndConvertToMarkdown(url, timeoutMs = 10000) {
  console.log(`Fetching URL: ${url}`);

  // 1. Validate URL
  try {
    new URL(url);
  } catch (error) {
    throw new Error(`Invalid URL format: ${url}`);
  }

  // 2. Setup timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // 3. Prepare request with proxy support
    const requestOptions = {
      signal: controller.signal,
    };

    const proxyAgent = createProxyAgent(url);
    if (proxyAgent) {
      requestOptions.agent = proxyAgent;
      console.log('Using proxy server for the request.');
    }

    // 4. Fetch the URL
    let response;
    try {
      response = await fetch(url, requestOptions);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms.`);
      }
      throw new Error(`Network error fetching URL: ${error.message}`);
    }

    // 5. Handle HTTP errors
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    // 6. Get HTML content
    const htmlContent = await response.text();
    if (!htmlContent || htmlContent.trim().length === 0) {
      throw new Error('Website returned empty content.');
    }

    // 7. Convert HTML to Markdown
    const markdownContent = NodeHtmlMarkdown.translate(htmlContent);
    if (!markdownContent || markdownContent.trim().length === 0) {
      console.warn('Warning: Content appears empty after conversion. The page might require JavaScript to render.');
      return '';
    }

    console.log(`Successfully fetched and converted URL: ${url}`);
    return markdownContent;

  } catch (error) {
    // Re-throw any caught errors for the final handler
    throw error;
  } finally {
    // 8. Cleanup timeout
    clearTimeout(timeoutId);
  }
}
