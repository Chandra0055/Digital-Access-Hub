// Kenter Tech Portal — Background Service Worker

// ─── On install: inject content script into ALL already-open tabs ───────────
// This means users don't need to reload the page after installing the extension.
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-script.js'],
        }).catch(() => {
          // Some tabs (chrome://, file://, etc.) will reject — ignore them
        });
      }
    }
  } catch (err) {
    console.warn('[Kenter] Could not inject into existing tabs:', err);
  }
});

// ─── Cookie injection handler ────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'injectAndOpen') {
    injectCookiesAndOpen(message.cookies, message.url)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // keep channel open for async response
  }
});

async function injectCookiesAndOpen(cookiesJson, targetUrl) {
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

      if (cookie.domain) details.domain = cookie.domain;
      if (typeof cookie.secure === 'boolean') details.secure = cookie.secure;
      if (typeof cookie.httpOnly === 'boolean') details.httpOnly = cookie.httpOnly;

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
  await chrome.tabs.create({ url: targetUrl });
}
