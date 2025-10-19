# 🧪 Testing Cookie Loading in Veil Extension

## Quick Test Instructions

### Method 1: Load as Chrome Extension (Recommended)

1. **Open Chrome and go to:** `chrome://extensions/`

2. **Enable Developer Mode** (toggle in top-right corner)

3. **Click "Load unpacked"**

4. **Select folder:** 
   ```
   d:\Projects\FYP\Front End of Veil\Veil-FYP-Project\02_Extension_App
   ```

5. **Test the extension:**
   - Click the Veil icon in Chrome toolbar (you may need to pin it)
   - Click the "Details" button in the popup
   - Scroll down to the "Cookies" section
   - You should see cookies loading automatically

6. **Check browser console:**
   - Press F12 to open DevTools
   - Go to Console tab
   - Look for any error messages
   - You should see: "Cookie management initialized"

### Method 2: Use Test Page (For Debugging)

1. **Load the extension first** (see Method 1)

2. **Open the test page:**
   - In the extension popup, open DevTools (F12)
   - In the console, run:
     ```javascript
     chrome.tabs.create({ url: chrome.runtime.getURL('test-cookies.html') })
     ```

3. **Run tests** by clicking the buttons:
   - "Test Chrome API Access" - Verifies Chrome extension APIs are available
   - "Test Cookie Manager Module" - Checks if cookieManager.js loaded correctly
   - "Fetch All Cookies" - Gets all cookies from all domains
   - "Fetch Active Tab Cookies" - Gets cookies only from the current tab's domain

### What to Look For

#### ✅ Success Indicators:
- Cookie count shows a number > 0
- Cookie cards appear in the Ad Cookies section
- Each cookie shows: name, domain, masked value, badges (HttpOnly, Secure, etc.)
- Search filter works
- "Active Tab Only" toggle filters cookies
- "Show/Hide" buttons reveal/mask cookie values

#### ❌ Error Indicators:
- "No cookies found" message appears
- Console shows errors like "chrome.cookies is not defined"
- Cookie count stays at 0
- Empty state appears even after visiting websites

### Troubleshooting

**If no cookies appear:**
1. Visit some websites first (Google, YouTube, etc.) to generate cookies
2. Make sure the extension has permissions (check manifest.json)
3. Check if you're on a Chrome internal page (chrome://, edge://, etc.) - these have no cookies
4. Look for JavaScript errors in the console

**If you see permission errors:**
- The manifest.json already includes "cookies", "tabs", and "<all_urls>" permissions
- Try reloading the extension (chrome://extensions/ → click reload icon)

**If CookieManager is undefined:**
- Make sure cookieManager.js loads before dashboard.js
- Check the script order in dashboard.html (should be cookieManager.js first)

### Expected Output

When working correctly, you should see cookies displayed like this:

```
Cookie Name: _ga
Domain: .google.com
Value: ************ [Show]
Size: 32 bytes
[HttpOnly] [Secure] [SameSite: Lax]
Expires: 2027-10-08
Path: /
```

### Testing Different Scenarios

1. **Test with multiple websites:**
   - Visit google.com, youtube.com, github.com
   - Refresh the cookies in dashboard
   - Count should increase

2. **Test Active Tab filter:**
   - Open dashboard on youtube.com
   - Enable "Active Tab Only"
   - Should only show YouTube cookies

3. **Test Search:**
   - Type "google" in search box
   - Should filter to only Google-related cookies

4. **Test Show/Hide:**
   - Click "Show" on any cookie
   - Value should become visible
   - Click "Hide" to mask it again

---

## Current Status

- ✅ manifest.json configured with correct permissions
- ✅ cookieManager.js created with Chrome Cookies API calls
- ✅ dashboard.js updated with cookie rendering logic
- ✅ dashboard.html updated with UI controls
- ⚠️ Extension icons missing (will show default icon)
- 🧪 Ready for testing!

## Notes

- Cookie values are MASKED by default for security
- Values are NEVER logged to console
- Handles 200+ cookies with smooth scrolling
- XSS prevention on all displayed data
