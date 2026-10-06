# Crypto Copilot

Chrome extension for X (Twitter). AI calls go through the central worker `https://crypto-copilot-api.diako1.workers.dev/`. No API key is stored in the extension.

## Install

1. Download this repository and extract it.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Choose **Load unpacked** and select this folder (the folder that contains `manifest.json`).
5. Open https://x.com and use the Crypto Copilot button on a tweet.

Do not install `Crypto-Copilot-2.2.4-verified.zip`. That archive in the repository is corrupt and is no longer the install path.

## Version

2.2.5 loads only `content-final.js`. Older `content-v*.js` files are unused history and are not injected.
