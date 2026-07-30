// Kenter Tech Portal — Background Script (MV2)
// Firefox

// ─── On install: inject content script into ALL already-open tabs ─────────────
browser.runtime.onInstalled.addListener(() => {
  browser.tabs.query({}).then((tabs) => {
    for (const tab of tabs) {
      if (tab.id && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        browser.tabs.executeScript(tab.id, { file: 'content-script.js' }).catch(() => {});
      }
    }
  });
});

// ─── Message handler ──────────────────────────────────────────────────────────
browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'injectAndOpen') {
    return injectCookiesAndOpen(message.cookies, message.url)
      .then(() => ({ success: true }))
      .catch((err) => ({ success: false, error: err.message }));
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

      // Firefox uses standard SameSite values ('none', 'lax', 'strict')
      if (cookie.sameSite) {
        const s = cookie.sameSite.toLowerCase();
        details.sameSite = (s === 'no_restriction') ? 'none' : s;
      }

      await browser.cookies.set(details);
    } catch (err) {
      console.warn(`[Kenter] Skipping cookie "${cookie.name}":`, err.message);
    }
  }

  await browser.tabs.create({ url: targetUrl });
}
