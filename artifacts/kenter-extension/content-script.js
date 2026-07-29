// Kenter Tech Portal — Content Script
// Compatible with Chrome, Edge, Brave, Opera, Firefox
// Idempotent: safe to run multiple times on the same page.

(function () {
  if (window.__kenterExtInstalled) return;
  window.__kenterExtInstalled = true;

  // Normalise API
  var api = (typeof browser !== 'undefined') ? browser : chrome;

  // Signal the portal that the extension is present
  window.dispatchEvent(new CustomEvent('kenter:extensionReady'));

  // Listen for cookie injection requests from the portal page
  window.addEventListener('kenter:injectAndOpen', function (event) {
    var detail = event.detail || {};
    var cookies = detail.cookies;
    var url = detail.url;

    if (!cookies || !url) {
      console.warn('[Kenter] injectAndOpen event missing cookies or url');
      return;
    }

    function handleResponse(response) {
      if (response && response.success) {
        window.dispatchEvent(new CustomEvent('kenter:injectionSuccess'));
      } else {
        window.dispatchEvent(new CustomEvent('kenter:injectionError', {
          detail: { error: (response && response.error) || 'Unknown error' }
        }));
      }
    }

    function handleError(err) {
      var msg = (err && err.message) ? err.message : String(err);
      console.error('[Kenter]', msg);
      window.dispatchEvent(new CustomEvent('kenter:injectionError', {
        detail: { error: msg }
      }));
    }

    try {
      if (typeof browser !== 'undefined') {
        // Firefox: Promise-based sendMessage
        browser.runtime.sendMessage({ action: 'injectAndOpen', cookies: cookies, url: url })
          .then(handleResponse)
          .catch(handleError);
      } else {
        // Chrome / Edge / Brave: callback-based sendMessage
        chrome.runtime.sendMessage(
          { action: 'injectAndOpen', cookies: cookies, url: url },
          function (response) {
            if (chrome.runtime.lastError) {
              handleError(chrome.runtime.lastError);
            } else {
              handleResponse(response);
            }
          }
        );
      }
    } catch (err) {
      handleError(err);
    }
  });
})();
