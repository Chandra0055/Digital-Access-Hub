// Kenter Tech Portal — Content Script (MV3 / Chrome)
// Idempotent: safe to run multiple times.
(function () {
  if (document.documentElement.getAttribute('data-kenter-ext')) return;

  // DOM attributes are shared across the isolated-world boundary —
  // the page's JS can read this even though window.* vars cannot be shared.
  document.documentElement.setAttribute('data-kenter-ext', '1');

  // Also dispatch an event for the dynamic-injection case
  // (when the background script pushes this script into an already-open tab).
  window.dispatchEvent(new CustomEvent('kenter:extensionReady'));

  window.addEventListener('kenter:injectAndOpen', function (event) {
    const { cookies, url } = event.detail || {};
    if (!cookies || !url) return;

    chrome.runtime.sendMessage({ action: 'injectAndOpen', cookies, url }, (response) => {
      if (chrome.runtime.lastError) {
        window.dispatchEvent(new CustomEvent('kenter:injectionError', {
          detail: { error: chrome.runtime.lastError.message }
        }));
        return;
      }
      window.dispatchEvent(new CustomEvent(
        response?.success ? 'kenter:injectionSuccess' : 'kenter:injectionError',
        response?.success ? {} : { detail: { error: response?.error } }
      ));
    });
  });
})();
