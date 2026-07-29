// Kenter Tech Portal — Background Script
// Compatible with: Chrome, Edge, Brave, Opera, Firefox
//
// "browser" is Firefox's Promise-based API.
// "chrome" is Chrome/Edge/Brave's callback-based API.
// We normalise them here so the rest of the code is identical.

var api = (typeof browser !== 'undefined') ? browser : chrome;

// Wrap chrome's callback-based APIs in promises when needed (Chrome-only path).
function promisify(fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    if (typeof api.runtime.lastError === 'undefined') {
      // Firefox: api.* already returns promises
      return fn.apply(null, args);
    }
    // Chrome: wrap in a promise
    return new Promise(function (resolve, reject) {
      args.push(function (result) {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve(result);
      });
      fn.apply(null, args);
    });
  };
}

// ─── On install: inject content script into ALL already-open tabs ─────────────
// This way the user never needs to reload a tab after installing.
api.runtime.onInstalled.addListener(function () {
  api.tabs.query({}, function (tabs) {
    (tabs || []).forEach(function (tab) {
      if (tab.id && tab.url && (tab.url.indexOf('http://') === 0 || tab.url.indexOf('https://') === 0)) {
        api.tabs.executeScript(tab.id, { file: 'content-script.js' }, function () {
          // Ignore errors for restricted pages (chrome://, file://, etc.)
          if (api.runtime.lastError) { /* expected */ }
        });
      }
    });
  });
});

// ─── Message handler ──────────────────────────────────────────────────────────
api.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === 'injectAndOpen') {
    injectCookiesAndOpen(message.cookies, message.url)
      .then(function () { sendResponse({ success: true }); })
      .catch(function (err) { sendResponse({ success: false, error: err.message }); });
    return true; // keep message channel open for async response
  }
});

// ─── Core: parse cookies, set them, then open the URL ────────────────────────
function injectCookiesAndOpen(cookiesJson, targetUrl) {
  var cookies;
  try {
    cookies = JSON.parse(cookiesJson);
  } catch (e) {
    return Promise.reject(new Error('Cookie data is not valid JSON. Re-export from Cookie-Editor.'));
  }

  if (!Array.isArray(cookies)) {
    return Promise.reject(new Error('Cookie data must be a JSON array.'));
  }

  var parsed;
  try {
    parsed = new URL(targetUrl);
  } catch (e) {
    return Promise.reject(new Error('Invalid tool URL: ' + targetUrl));
  }

  var promises = cookies.map(function (cookie) {
    try {
      var rawDomain = cookie.domain || parsed.hostname;
      var cleanDomain = rawDomain.charAt(0) === '.' ? rawDomain.slice(1) : rawDomain;
      var scheme = cookie.secure ? 'https' : parsed.protocol.replace(':', '');
      var cookieUrl = scheme + '://' + cleanDomain + (cookie.path || '/');

      var details = {
        url: cookieUrl,
        name: cookie.name,
        value: cookie.value,
        path: cookie.path || '/',
      };

      if (cookie.domain)                           details.domain = cookie.domain;
      if (typeof cookie.secure === 'boolean')      details.secure = cookie.secure;
      if (typeof cookie.httpOnly === 'boolean')    details.httpOnly = cookie.httpOnly;
      if (cookie.expirationDate)                   details.expirationDate = cookie.expirationDate;

      if (cookie.sameSite) {
        var s = cookie.sameSite.toLowerCase();
        // Chrome uses 'no_restriction' where the spec says 'none'
        details.sameSite = (typeof browser === 'undefined' && (s === 'none' || s === 'no_restriction'))
          ? 'no_restriction'
          : (s === 'no_restriction' ? 'none' : s);
      }

      return new Promise(function (resolve) {
        api.cookies.set(details, function () {
          // Ignore individual cookie errors — best-effort injection
          resolve();
        });
        // Firefox returns a promise; .set() may not accept a callback
        // The above will be a no-op callback in Firefox but that's fine
      }).catch(function () { /* ignore */ });

    } catch (err) {
      console.warn('[Kenter] Skipping cookie "' + (cookie.name || '?') + '":', err.message);
      return Promise.resolve();
    }
  });

  return Promise.all(promises).then(function () {
    return new Promise(function (resolve) {
      api.tabs.create({ url: targetUrl }, function () { resolve(); });
    });
  });
}
