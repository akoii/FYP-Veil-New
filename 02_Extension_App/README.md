# Veil Browser Extension

This directory contains the complete browser extension code for Veil Privacy Extension.

## 📁 Structure

```
02_Extension_App/
├── manifest.json       # Extension configuration
├── frontend/          # User interface components
└── core/             # Background logic and API handlers
```

## 🚀 Installation & Development

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this directory (`02_Extension_App`)
5. The extension should now appear in your browser

### Loading the Extension in Firefox

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file in this directory

## 🎨 Frontend

The `frontend/` directory contains all user-facing components:

### index.html
The main popup that appears when clicking the extension icon. Displays:
- Privacy score (donut chart)
- Quick actions ("Go Private" and "Details")
- Real-time privacy analysis

### pages/dashboard.html
Comprehensive dashboard showing:
- Detailed privacy metrics
- Tracking history
- Cookie management
- DNS blocking statistics
- Fingerprinting protection status
- Hardware access controls

### scripts/
JavaScript files handling UI logic:
- `popup.js`: Privacy score animation and popup functionality
- `dashboard.js`: Dashboard charts and interactive features

### styles/
CSS files for visual styling:
- `popup.css`: Popup styling
- `dashboard.css`: Dashboard styling

### assets/
Images, icons, and other static assets:
- Extension icons (16x16, 48x48, 128x128)
- UI graphics
- Fonts

## ⚙️ Core

The `core/` directory contains extension background logic:

### service-worker.js
Background service worker that:
- Handles extension lifecycle
- Manages blocking rules
- Updates privacy statistics
- Communicates with frontend

### api-handlers.js
Wrapper functions for Chrome Extension APIs:
- Cookie management
- Content settings
- Privacy controls
- Tab management

### utils/blocklist-manager.js
Manages tracking blocklists:
- Fetches EasyPrivacy lists
- Parses blocklist formats
- Generates blocking rules
- Updates rules dynamically

## 🔧 Configuration

### manifest.json

Key configuration sections:

```json
{
  "manifest_version": 3,
  "permissions": [
    "cookies",
    "storage",
    "tabs",
    "webRequest",
    "contentSettings",
    "declarativeNetRequest",
    "privacy"
  ]
}
```

## 📊 Data Storage

The extension uses Chrome's storage API:

```javascript
// Example: Get privacy score
chrome.storage.local.get(['privacyScore'], (result) => {
  console.log('Privacy Score:', result.privacyScore);
});
```

## 🔒 Privacy & Permissions

### Required Permissions

- **cookies**: Block and manage tracking cookies
- **storage**: Store settings and statistics
- **tabs**: Access active tab information
- **webRequest**: Intercept and block requests
- **contentSettings**: Control privacy settings
- **declarativeNetRequest**: Apply blocking rules
- **privacy**: Modify browser privacy settings

## 🧪 Testing

### Manual Testing

1. Load the extension
2. Visit various websites
3. Check privacy score updates
4. Verify cookie blocking
5. Test dashboard features

### Debugging

- Open DevTools for popup: Right-click extension icon → "Inspect popup"
- View service worker logs: `chrome://extensions/` → "Service worker" link
- Check console for errors

## 🚀 Deployment

### Production Build

Before deployment:
1. Update version in `manifest.json`
2. Optimize images in `assets/`
3. Minify JavaScript (optional)
4. Test thoroughly
5. Create ZIP file for distribution

### Chrome Web Store

1. Create ZIP of this directory
2. Upload to Chrome Developer Dashboard
3. Fill in store listing details
4. Submit for review

## 🔄 Updates

When making changes:
1. Update version in `manifest.json`
2. Test changes locally
3. Reload extension in browser
4. Verify functionality

## 📝 Known Issues

- Add any known issues or limitations here

## 🤝 Contributing

When contributing:
1. Follow existing code style
2. Test all changes
3. Update documentation
4. Commit with clear messages

---

For more information, see the main project README.md
