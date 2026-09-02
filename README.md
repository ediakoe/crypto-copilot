# Crypto Copilot 🚀

AI Copilot for X (Twitter)

## ⚠️ Installation — Important

This repository contains the ready-to-load Chrome/Brave extension in the **repository root**.

After downloading **Code → Download ZIP** from GitHub, extract the ZIP first.

Then open:
- Chrome/Brave → Extensions
- Enable **Developer mode**
- Click **Load unpacked**
- Select the extracted **`crypto-copilot-main`** folder — **NOT** the `api` folder.

The folder you select must contain this file directly:

```text
crypto-copilot-main/
├── manifest.json ✅
├── background.js
├── content-final.js
├── icon16.png
├── icon32.png
├── icon48.png
├── icon128.png
└── tweet-icon.png
```

If Chrome/Brave shows **"Manifest file is missing or unreadable"**, you selected the wrong folder. Go up one level and select the folder that contains `manifest.json`.

## Features

🤖 AI Reply

🌍 Persian Translation

🧵 Thread Generator

✍️ Custom Tweet

## Version

Release: **2.2.4**

## Powered By

Centralized Cloudflare Worker + OpenRouter AI
