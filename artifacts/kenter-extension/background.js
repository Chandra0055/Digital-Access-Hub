// Kenter Tech Portal — Background Service Worker (MV3)
// Chrome / Edge / Brave / Opera

// ─── On install: inject content script into ALL already-open tabs ─────────────
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content-script.js'],
        }).catch(() => { /* restricted tabs are expected */ });
      }
    }
  } catch (err) {
    console.warn('[Kenter] Could not inject into existing tabs:', err);
  }
});

// ─── Message handler ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'injectAndOpen') {
    injectCookiesAndOpen(message.cookies, message.url)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

// ─── Cookie injection ─────────────────────────────────────────────────────────
async function injectCookiesAndOpen(cookiesJson, targetUrl) {
  let cookies;
  try { cookies = JSON.parse(cookiesJson); }
  catch { throw new Error('Cookie data is not valid JSON. Re-export from Cookie-Editor.'); }

  if (!Array.isArray(cookies)) throw new Error('Cookie data must be a JSON array.');

  const parsed = new URL(targetUrl);

  for (const cookie of cookies) {
    try {
      const rawDomain = cookie.domain || parsed.hostname;
      const cleanDomain = rawDomain.startsWith('.') ? rawDomain.slice(1) : rawDomain;
      const scheme = cookie.secure ? 'https' : parsed.protocol.replace(':', '');

      const details = {
        url: `${scheme}://${cleanDomain}${cookie.path || '/'}`,
        name: cookie.name,
        value: cookie.value,
        path: cookie.path || '/',
      };

      if (cookie.domain)                        details.domain = cookie.domain;
      if (typeof cookie.secure === 'boolean')   details.secure = cookie.secure;
      if (typeof cookie.httpOnly === 'boolean') details.httpOnly = cookie.httpOnly;
      if (cookie.expirationDate)                details.expirationDate = cookie.expirationDate;

      if (cookie.sameSite) {
        const s = cookie.sameSite.toLowerCase();
        details.sameSite = (s === 'none' || s === 'no_restriction') ? 'no_restriction'
          : s === 'lax' ? 'lax'
          : s === 'strict' ? 'strict'
          : 'unspecified';
      }

      await chrome.cookies.set(details);
    } catch (err) {
      console.warn(`[Kenter] Skipping cookie "${cookie.name}":`, err.message);
    }
  }

  await chrome.tabs.create({ url: targetUrl });
}
