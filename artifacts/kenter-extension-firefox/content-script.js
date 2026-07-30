// Kenter Tech Portal — Content Script (MV2 / Firefox)
// Idempotent: safe to run multiple times.
(function () {
  if (window.__kenterExtInstalled) return;
  window.__kenterExtInstalled = true;

  window.dispatchEvent(new CustomEvent('kenter:extensionReady'));

  window.addEventListener('kenter:injectAndOpen', function (event) {
    const { cookies, url } = event.detail || {};
    if (!cookies || !url) return;

    // Firefox: browser.runtime.sendMessage returns a Promise
    browser.runtime.sendMessage({ action: 'injectAndOpen', cookies, url })
      .then((response) => {
        window.dispatchEvent(new CustomEvent(
          response?.success ? 'kenter:injectionSuccess' : 'kenter:injectionError',
          response?.success ? {} : { detail: { error: response?.error } }
        ));
      })
      .catch((err) => {
        window.dispatchEvent(new CustomEvent('kenter:injectionError', {
          detail: { error: err.message }
        }));
      });
  });
})();
