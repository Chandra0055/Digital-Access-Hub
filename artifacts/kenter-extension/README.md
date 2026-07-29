# Kenter Tech Portal — Browser Extension

Works on **Chrome, Firefox, Edge, Brave, and Opera**.

## Install on Chrome / Edge / Brave / Opera

1. Go to `chrome://extensions` (or `edge://extensions`, `brave://extensions`)
2. Turn on **Developer mode** (toggle, top-right)
3. Click **Load unpacked**
4. Select this `kenter-extension` folder
5. Done — the extension icon appears in your toolbar

## Install on Firefox

1. Go to `about:debugging`
2. Click **This Firefox** in the left sidebar
3. Click **Load Temporary Add-on...**
4. Navigate to this folder and select the `manifest.json` file
5. Done — the extension icon appears in your toolbar

> **Note for Firefox permanent install:** Firefox requires extensions to be signed to install permanently. For a permanent install, the extension needs to be submitted to addons.mozilla.org or self-signed. The temporary method above works until Firefox restarts.

## How it works

When you click **Access Tool** on the portal, the extension:
1. Reads the session cookie JSON for that tool
2. Injects all cookies into the correct domain
3. Opens the tool in a new tab — already logged in

## Permissions

| Permission | Why |
|---|---|
| `cookies` | Set session cookies on the target tool's domain |
| `tabs` | Open the tool in a new tab after injection |
| `<all_urls>` | Cookies can belong to any domain |
