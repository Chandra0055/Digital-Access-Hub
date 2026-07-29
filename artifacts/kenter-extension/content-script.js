// Kenter Tech Portal — Content Script
// Runs on every page at document_start.
// • On the portal: bridges portal ↔ background service worker.
// • On other pages: does nothing beyond the flag check.

// Signal the portal that the extension is present
window.__kenterExtInstalled = true;

// Also fire a custom event (React may have already rendered by the time this runs)
window.dispatchEvent(new CustomEvent('kenter:extensionReady'));

// Listen for cookie injection requests dispatched by the portal
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
          detail: { error: chrome.runtime.lastError.message }
        }));
        return;
      }

      if (response?.success) {
        window.dispatchEvent(new CustomEvent('kenter:injectionSuccess'));
      } else {
        window.dispatchEvent(new CustomEvent('kenter:injectionError', {
          detail: { error: response?.error || 'Unknown error' }
        }));
      }
    }
  );
});
