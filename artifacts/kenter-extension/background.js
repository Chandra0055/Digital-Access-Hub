// Kenter Tech Portal — Background Service Worker
// Receives cookie injection requests from the content script,
// sets cookies on the target domain, then opens the tool in a new tab.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'injectAndOpen') {
    injectCookiesAndOpen(message.cookies, message.url)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // keep channel open for async response
  }
});

async function injectCookiesAndOpen(cookiesJson, targetUrl) {
  // Parse the cookie JSON exported from Cookie-Editor
  let cookies;
  try {
    cookies = JSON.parse(cookiesJson);
  } catch {
    throw new Error('Cookie data is not valid JSON. Please re-export from Cookie-Editor.');
  }

  if (!Array.isArray(cookies)) {
    throw new Error('Cookie data must be a JSON array. Use Cookie-Editor → Export As: JSON.');
  }

  const parsed = new URL(targetUrl);

  let injected = 0;
  let failed = 0;

  for (const cookie of cookies) {
    try {
      // Build the URL the cookie belongs to
      const rawDomain = cookie.domain || parsed.hostname;
      const cleanDomain = rawDomain.startsWith('.') ? rawDomain.slice(1) : rawDomain;
      const scheme = cookie.secure ? 'https' : parsed.protocol.replace(':', '');
      const cookieUrl = `${scheme}://${cleanDomain}${cookie.path || '/'}`;

      const details = {
        url: cookieUrl,
        name: cookie.name,
        value: cookie.value,
        path: cookie.path || '/',
      };

      // Domain (optional — omit to let Chrome infer from URL)
      if (cookie.domain) details.domain = cookie.domain;

      if (typeof cookie.secure === 'boolean') details.secure = cookie.secure;
      if (typeof cookie.httpOnly === 'boolean') details.httpOnly = cookie.httpOnly;

      // Chrome uses different sameSite vocabulary than Cookie-Editor
      if (cookie.sameSite) {
        const s = cookie.sameSite.toLowerCase();
        if (s === 'none' || s === 'no_restriction') details.sameSite = 'no_restriction';
        else if (s === 'lax') details.sameSite = 'lax';
        else if (s === 'strict') details.sameSite = 'strict';
        else details.sameSite = 'unspecified';
      }

      if (cookie.expirationDate) details.expirationDate = cookie.expirationDate;

      await chrome.cookies.set(details);
      injected++;
    } catch (err) {
      console.warn(`[Kenter] Failed to set cookie "${cookie.name}":`, err.message);
      failed++;
    }
  }

  console.log(`[Kenter] Injected ${injected} cookies, ${failed} failed. Opening ${targetUrl}`);

  // Open the tool in a new tab
  await chrome.tabs.create({ url: targetUrl });
}
