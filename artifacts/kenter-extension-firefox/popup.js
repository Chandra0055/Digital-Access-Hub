const manifest = browser.runtime.getManifest();
document.getElementById('version').textContent = `v${manifest.version}`;
