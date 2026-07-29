// Kenter Tech Portal — Content Script
// Idempotent: safe to run multiple times on the same page.

if (!window.__kenterExtInstalled) {
  window.__kenterExtInstalled = true;

  // Signal the portal that the extension is present
  window.dispatchEvent(new CustomEvent('kenter:extensionReady'));

  // Listen for cookie injection requests dispatched by the portal page
  window.addEventListener('kenter:injectAndOpen', (event) => {
    const { cookies, url } = event.detail || {};

    if (!cookies || !url) {
      console.warn('[Kenter] injectAndOpen event missing cookies or url');
      return;
    }

    chrome.runtime.sendMessage(
      { action: 'injectAndOpen', cookies, url },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Kenter]', chrome.runtime.lastError.message);
          window.dispatchEvent(new CustomEvent('kenter:injectionError', {
            detail: { error: chrome.runtime.lastError.message },
          }));
          return;
        }

        if (response?.success) {
          window.dispatchEvent(new CustomEvent('kenter:injectionSuccess'));
        } else {
          window.dispatchEvent(new CustomEvent('kenter:injectionError', {
            detail: { error: response?.error || 'Unknown error' },
          }));
        }
      }
    );
  });
}
