# 🧪 Step-by-Step Cookie Loading Test Guide

## Step 1: Load the Extension in Chrome

1. Open Chrome browser
2. Navigate to: `chrome://extensions/`
3. Enable **Developer mode** (toggle switch in top-right)
4. Click **"Load unpacked"** button
5. Navigate to and select this folder:
   ```
   d:\Projects\FYP\Front End of Veil\Veil-FYP-Project\02_Extension_App
   ```
6. The "Veil - Privacy Extension" should now appear in your extensions list

## Step 2: Visit Some Websites (Generate Cookies)

Before testing, visit a few websites to ensure you have cookies:
- https://www.google.com
- https://www.youtube.com
- https://www.github.com
- https://www.amazon.com

This ensures you have cookies to display.

## Step 3: Open the Extension Dashboard

**Option A: Via Extension Popup**
1. Click the Veil extension icon in your Chrome toolbar
   - If you don't see it, click the puzzle piece icon and pin Veil
2. Click the **"Details"** button in the popup
3. The dashboard should open in a new tab

**Option B: Via Extension Page**
1. Go to `chrome://extensions/`
2. Find "Veil - Privacy Extension"
3. Click **"Details"**
4. Click **"Extension options"** or open the dashboard page directly

## Step 4: Navigate to Cookies Section

1. In the dashboard, look at the left sidebar
2. Click on **"Cookies"** in the Tools section
3. The page should scroll to the Cookies section

## Step 5: Check Cookie Loading

### Visual Verification:

Look for these elements in the **"Advertising Cookies"** section:

✅ **Cookie Count** (top-right) should show a number > 0
✅ **Control Panel** with:
   - [ ] Active Tab Only checkbox
   - Search input field
   - Refresh button

✅ **Cookie Cards** should appear below showing:
   - Cookie name (e.g., "_ga", "SSID", "1P_JAR")
   - Domain (e.g., ".google.com", ".youtube.com")
   - Masked value (e.g., "************")
   - Security badges (HttpOnly, Secure, SameSite, etc.)
   - Show/Hide button for each cookie
   - Expiration info
   - Size in bytes

### Console Verification:

1. Press **F12** to open DevTools
2. Go to the **Console** tab
3. You should see:
   ```
   Cookie management initialized
   Loaded X cookies
   ```

4. Copy the contents of `test-console.js` and paste into the console
5. Press Enter to run the test
6. Check for ✅ green checkmarks

## Step 6: Test Interactive Features

### Test 1: Search Filter
1. Type "google" in the search box
2. Cookie list should filter to show only Google-related cookies
3. Clear the search - all cookies should reappear

### Test 2: Active Tab Toggle
1. Make sure you're on a specific website (e.g., youtube.com)
2. Check the **"Active Tab Only"** checkbox
3. Cookie list should filter to show only YouTube cookies
4. Uncheck - all cookies should reappear

### Test 3: Show/Hide Values
1. Find any cookie card
2. Click the **"Show"** button
3. The masked value should reveal (e.g., "GA1.2.1234567890.1728345678")
4. Click **"Hide"** - value should mask again

### Test 4: Refresh
1. Click the **"Refresh"** button
2. Cookie count should update if any cookies changed
3. Console should show "Loaded X cookies"

## Step 7: Check for Errors

### No Cookies Appearing?

**Check 1: Console Errors**
- Open DevTools Console (F12)
- Look for red error messages
- Common issues:
  - `CookieManager is not defined` → cookieManager.js didn't load
  - `chrome.cookies is undefined` → Extension not properly loaded
  - Permission errors → manifest.json issue

**Check 2: Current URL**
- Are you on a chrome:// or edge:// page?
- These internal pages have NO cookies
- Navigate to a regular website

**Check 3: Extension Permissions**
- Go to `chrome://extensions/`
- Click "Details" on Veil extension
- Check if permissions include:
  - Read and change all your data on all websites
  - Manage your cookies

**Check 4: File Loading**
- Open DevTools → Network tab
- Reload the dashboard page
- Check if these files loaded successfully:
  - cookieManager.js (should be 200 status)
  - dashboard.js (should be 200 status)

### Empty State Message?

If you see "No cookies found":
- This is normal if you haven't visited websites recently
- Or if you're testing on chrome:// pages
- Or if "Active Tab Only" is checked and current site has no cookies

## Step 8: Verify Data Accuracy

1. **Cross-reference with Chrome's cookie viewer:**
   - Open DevTools (F12)
   - Go to **Application** tab
   - Expand **Cookies** in the left sidebar
   - Compare with what Veil shows

2. **Check cookie counts:**
   - Chrome's Application tab shows exact count per domain
   - Veil should show similar or same count

## Expected Results

### ✅ Working Correctly:
- Cookie count shows accurate number (usually 50-500+ depending on browsing)
- Cookie cards display with all information
- Search filters work instantly
- Active Tab toggle filters correctly
- Show/Hide reveals/masks values
- Refresh updates the list
- No console errors

### ❌ Not Working:
- Cookie count stays at 0
- Empty state appears even after visiting websites
- Console shows errors
- Buttons don't respond
- Search doesn't filter

## Troubleshooting Commands

Run these in the browser console if issues occur:

```javascript
// Check if CookieManager loaded
console.log(typeof window.CookieManager);

// Manually fetch cookies
chrome.cookies.getAll({}, (cookies) => {
  console.log(`Chrome API reports ${cookies.length} cookies`);
  console.log('Sample:', cookies[0]);
});

// Check DOM elements
console.log('Container:', document.getElementById('adCookiesContainer'));
console.log('Count:', document.getElementById('adCookiesCount'));

// Force reload cookies
if (window.loadCookies) {
  loadCookies();
}
```

## Success Criteria

The cookie loading is working if:
1. ✅ Extension loads without errors
2. ✅ Dashboard opens and displays
3. ✅ Cookie section shows count > 0
4. ✅ Cookie cards display with proper formatting
5. ✅ Search, filter, and toggle features work
6. ✅ Console shows "Cookie management initialized"
7. ✅ No JavaScript errors in console

---

**Need Help?** Check the console errors first, then review TESTING.md for more details.
