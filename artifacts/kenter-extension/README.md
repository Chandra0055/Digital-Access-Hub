# Kenter Tech Portal — Browser Extension

Automatically injects session cookies when subscribers click **Access Tool**, making it truly one-click.

## Install (Chrome / Edge / Brave)

1. Open your browser and go to `chrome://extensions`
2. Turn on **Developer mode** (toggle in the top-right)
3. Click **Load unpacked**
4. Select this folder (`kenter-extension`)
5. The extension appears in your toolbar — you're done

## How it works

- The extension runs silently in the background
- When you click **Access Tool** on the portal, it automatically:
  1. Reads the session cookie JSON stored for that tool
  2. Injects all cookies into the correct domain using Chrome's cookie API
  3. Opens the tool in a new tab — already logged in

## Permissions used

| Permission | Why |
|---|---|
| `cookies` | To set session cookies on the target tool domain |
| `tabs` | To open the tool in a new tab after injection |
| `<all_urls>` | Cookies can belong to any domain — this allows setting them anywhere |

## Notes

- Cookie data is never sent to any external server — it flows directly from the portal page to the extension background worker in your own browser
- Requires the session cookies to be saved in the Admin Panel (Admin → Tools → Edit → Session Cookie Data)
