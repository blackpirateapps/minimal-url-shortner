# RapidLink Firefox Extension

A Firefox extension for quickly shortening URLs using your self-hosted RapidLink instance. Works on both Firefox Desktop and Firefox for Android.

## Features

- 🔗 **One-click shortening** - Click the extension icon to instantly shorten the current page URL
- 📋 **Auto-copy** - Shortened URLs are automatically copied to clipboard
- 📤 **Share support** - On mobile, use the native share dialog
- 🖱️ **Context menu** - Right-click any link to shorten it (Desktop)
- 🔒 **Secure** - Your credentials are stored locally in the browser

## Installation

### Firefox Desktop (Temporary)

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the sidebar
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from this folder

### Firefox Desktop (Permanent)

1. Package the extension: `cd firefox-extension && zip -r ../rapidlink.xpi *`
2. Go to `about:addons`
3. Click the gear icon → "Install Add-on From File"
4. Select the `.xpi` file

### Firefox for Android

Firefox for Android supports extensions through the AMO (addons.mozilla.org) or via a custom collection:

1. **Using Firefox Nightly/Developer Edition:**
   - Go to Settings → About Firefox Nightly
   - Tap the Firefox logo 5 times to enable debug mode
   - Go to Settings → Custom Add-on Collection
   - Enter your Mozilla account ID and collection name
   - Add this extension to your collection on AMO

2. **Self-signed for testing:**
   - Use `web-ext sign` with your AMO credentials
   - Install the signed `.xpi` 

## Setup

1. After installing, click the extension icon or go to the extension settings
2. Enter your RapidLink instance URL (e.g., `https://your-app.vercel.app`)
3. Enter your dashboard password
4. (Optional) Set a default domain
5. Click "Save Settings"

## Usage

### Desktop
- **Toolbar button**: Click the RapidLink icon in your toolbar
- **Context menu**: Right-click any link → "Shorten this link"
- **Context menu**: Right-click on page → "Shorten this page"

### Mobile
- Tap the puzzle/extensions icon in the browser menu
- Tap "RapidLink" to shorten the current page
- Use the "Share" button to share via any app

## File Structure

```
firefox-extension/
├── manifest.json          # Extension configuration
├── background.js          # Context menu handling
├── icons/
│   ├── icon-48.svg
│   └── icon-96.svg
├── popup/
│   ├── popup.html         # Popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic
└── options/
    ├── options.html       # Settings page
    └── options.js         # Settings logic
```

## Convert SVG Icons to PNG

Firefox requires PNG icons. Convert the SVGs using:

```bash
# Using ImageMagick
convert icons/icon-48.svg icons/icon-48.png
convert icons/icon-96.svg icons/icon-96.png

# Or using Inkscape
inkscape icons/icon-48.svg --export-filename=icons/icon-48.png
inkscape icons/icon-96.svg --export-filename=icons/icon-96.png
```

## Development

```bash
# Install web-ext for development
npm install -g web-ext

# Run with auto-reload
web-ext run

# Build for distribution
web-ext build
```

## Troubleshooting

- **"Cannot shorten browser internal pages"**: The extension cannot shorten `about:` or internal Firefox pages
- **"No domain configured"**: Add at least one domain in your RapidLink dashboard
- **Connection errors**: Check that your instance URL is correct and accessible
