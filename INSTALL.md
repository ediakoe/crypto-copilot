# Crypto Copilot — Installation

## Chrome / Brave

1. Download the ZIP from **Code → Download ZIP**.
2. Extract the ZIP completely.
3. Open `chrome://extensions/` (Chrome) or `brave://extensions/` (Brave).
4. Turn on **Developer mode**.
5. Click **Load unpacked**.
6. Select the extracted `crypto-copilot-main` folder.

### Important
The selected folder must contain `manifest.json` directly at its top level.

Do **not** select a subfolder such as `api`.

Expected structure:

```text
crypto-copilot-main/
├── manifest.json
├── background.js
├── content-final.js
├── icon16.png
├── icon32.png
├── icon48.png
├── icon128.png
└── tweet-icon.png
```

Release: **2.2.4**
