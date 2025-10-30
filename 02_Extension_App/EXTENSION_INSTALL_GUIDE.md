# 🚀 Veil Extension - Installation & Testing Guide

## ✅ Extension Ready!

Your Chrome extension is now configured with:
- ✅ AI-powered cookie classification via Hugging Face serverless API
- ✅ Real-time classification on any website you visit
- ✅ Dashboard with cookie analytics
- ✅ Tracker blocking (DoubleClick, Google Analytics, Facebook)
- ✅ Privacy scoring and statistics

---

## 📦 Installation Steps

### 1. Open Chrome Extensions Page
1. Open Google Chrome
2. Navigate to: `chrome://extensions/`
3. Or click: Menu (⋮) → Extensions → Manage Extensions

### 2. Enable Developer Mode
- Toggle **"Developer mode"** switch in the top-right corner

### 3. Load the Extension
1. Click **"Load unpacked"** button
2. Navigate to: `C:\Users\cutie-pie\Desktop\FYP Misssion\huggingface model deployment\FYP-Veil-New\02_Extension_App`
3. Click **"Select Folder"**

### 4. Verify Installation
You should see:
- ✅ Extension card with "Veil - Privacy & Cookie Classifier"
- ✅ Version 1.0.0
- ✅ Green "Enabled" status
- ✅ Extension icon in Chrome toolbar

---

## 🧪 Testing Cookie Classification

### Test 1: Dashboard View
1. **Click the Veil extension icon** in Chrome toolbar
2. Dashboard popup opens showing:
   - 📊 Cookie statistics
   - 🍪 List of all cookies from current tab
   - 🎨 Color-coded categories:
     - 🔒 Blue = Strictly Necessary
     - ⚙️ Green = Functionality
     - 📊 Yellow = Analytics
     - 🎯 Red = Advertising/Tracking

### Test 2: Visit a Website
1. Navigate to any website (e.g., `https://www.google.com`)
2. Click the Veil icon
3. See cookies automatically classified from that site
4. Each cookie shows:
   - Cookie name
   - Category badge with icon
   - Confidence percentage (if available)
   - Domain and expiry info

### Test 3: Multiple Websites
Try these cookie-heavy sites:
- **Google**: `https://www.google.com` (Analytics cookies: _ga, _gid)
- **Facebook**: `https://www.facebook.com` (Ad cookies: _fbp, fr)
- **YouTube**: `https://www.youtube.com` (Mixed: PREF, VISITOR_INFO)
- **Amazon**: `https://www.amazon.com` (Session: session-id)

### Test 4: Developer Console Logs
1. Open website (e.g., Google)
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Click Veil extension icon
5. Watch logs:
   ```
   [Dashboard] Fetching cookies for: https://www.google.com
   [Dashboard] Loaded X cookies
   [Dashboard] Classifying cookies with AI model...
   [CookieClassifier] Calling batch API (or individual predictions)
   [CookieClassifier] ✓ _ga → Analytics
   [CookieClassifier] ✓ NID → Advertising/Tracking
   [Dashboard] Classification stats: {...}
   ```

### Test 5: Network Activity
1. Open website
2. Press **F12** → **Network** tab
3. Filter by: **Fetch/XHR**
4. Click Veil extension icon
5. See API calls to:
   ```
   https://aqibtahir-cookie-classifier-api.hf.space/predict
   ```
6. Check responses show classifications

---

## 🔍 Verification Checklist

✅ **Extension loads without errors**
- No error badges on extension card
- Service worker shows "active"

✅ **Dashboard opens on icon click**
- Popup displays correctly
- Styling loads (TailwindCSS)
- No JavaScript errors in console

✅ **Cookies are fetched**
- Cookie list populates
- Shows count (e.g., "25 cookies found")

✅ **API classification works**
- Color-coded badges appear
- Network shows API calls with 200 OK
- Console logs show "✓" successful classifications

✅ **Works across different websites**
- Classifications update per site
- "Active Tab Only" toggle works

✅ **Cache works**
- Second visit to same site is faster
- Console shows "X cached" messages

---

## 🐛 Troubleshooting

### Issue: Extension won't load
**Solution:**
1. Check all files are in `02_Extension_App` folder
2. Ensure `manifest.json` is valid (no syntax errors)
3. Remove and re-add the extension

### Issue: No cookies showing
**Solution:**
1. Make sure you're on a real website (not `chrome://` pages)
2. Check permissions granted in `chrome://extensions/`
3. Click "Reload" on extension card after changes

### Issue: API calls failing
**Solution:**
1. Check internet connection
2. Verify API is online: https://aqibtahir-cookie-classifier-api.hf.space/
3. Check console for CORS errors (shouldn't happen with proper manifest)

### Issue: Blank dashboard
**Solution:**
1. Right-click extension icon → Inspect
2. Check console for errors
3. Verify all script files exist in `frontend/scripts/`

### Issue: Classifications show wrong colors
**Solution:**
1. Hard refresh: Ctrl+Shift+R in dashboard
2. Clear cache: `chrome://settings/clearBrowserData`
3. Reload extension

---

## 📊 Expected Behavior

### On Google.com:
```
_ga          → 📊 Analytics (Yellow)
_gid         → 📊 Analytics (Yellow)
NID          → 🎯 Advertising/Tracking (Red)
CONSENT      → 🔒 Strictly Necessary (Blue)
```

### On Facebook.com:
```
_fbp         → 🎯 Advertising/Tracking (Red)
_fbc         → 🎯 Advertising/Tracking (Red)
fr           → 🎯 Advertising/Tracking (Red)
c_user       → ⚙️ Functionality (Green)
xs           → 🔒 Strictly Necessary (Blue)
```

### On E-commerce sites:
```
sessionid    → 🔒 Strictly Necessary (Blue)
csrftoken    → 🔒 Strictly Necessary (Blue)
cart_id      → ⚙️ Functionality (Green)
user_prefs   → ⚙️ Functionality (Green)
```

---

## 🎯 Key Features Working

1. **Real-time Classification**
   - Every cookie classified via HF API
   - Results cached for performance

2. **Visual Indicators**
   - Color-coded categories
   - Icons for quick identification
   - Confidence percentages

3. **Performance**
   - Parallel API calls (when batch fails)
   - Smart caching system
   - Fast UI rendering

4. **Privacy Protection**
   - Tracker blocking rules active
   - Cookie visibility and control
   - Privacy scoring

---

## 📝 Next Steps

### Test thoroughly:
1. Visit 10+ different websites
2. Verify classifications make sense
3. Check API logs for errors

### Customize:
1. Add more tracker blocking rules in `core/rules/tracker_rules.json`
2. Adjust UI colors in `frontend/styles/dashboard.css`
3. Add more features to `core/service-worker.js`

### Deploy:
1. Package as `.crx` for distribution
2. Submit to Chrome Web Store
3. Share with users for testing

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Extension icon shows in toolbar
- ✅ Dashboard opens with styled UI
- ✅ Cookies listed with colored badges
- ✅ Console shows API success logs
- ✅ Network tab shows 200 OK responses
- ✅ Different websites show different classifications

**Your serverless API is LIVE and integrated!** 🚀

---

## 📞 Support

If you encounter issues:
1. Check browser console (F12)
2. Check extension error logs in `chrome://extensions/`
3. Verify manifest.json syntax
4. Test API directly: https://aqibtahir-cookie-classifier-api.hf.space/

**Happy Testing!** 🎊
