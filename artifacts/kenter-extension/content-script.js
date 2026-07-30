// Kenter Tech Portal — Content Script (MV3 / Chrome)
// Idempotent: safe to run multiple times.
(function () {
  if (window.__kenterExtInstalled) return;
  window.__kenterExtInstalled = true;

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
