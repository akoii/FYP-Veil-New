# 🚀 QUICK START - Load Extension in Chrome

## ✅ Everything is Ready!

Your extension has been configured with:
- ✅ Complete manifest.json with all permissions
- ✅ Serverless API integration (Hugging Face)
- ✅ Cookie classification on ANY website
- ✅ Real-time AI predictions
- ✅ Tracker blocking rules

---

## 📦 Install in 3 Steps

### Step 1: Open Extensions
```
chrome://extensions/
```
Or: Chrome Menu → Extensions → Manage Extensions

### Step 2: Enable Developer Mode
Toggle the **Developer mode** switch (top-right)

### Step 3: Load Extension
1. Click **"Load unpacked"**
2. Navigate to: 
   ```
   C:\Users\cutie-pie\Desktop\FYP Misssion\huggingface model deployment\FYP-Veil-New\02_Extension_App
   ```
3. Click **"Select Folder"**

---

## ✅ Verify Installation

You should see:
- ✅ "Veil - Privacy & Cookie Classifier" in extension list
- ✅ Extension icon in Chrome toolbar (top-right)
- ✅ No error badges
- ✅ Service worker shows "active"

---

## 🧪 Test It Now!

### Quick Test:
1. **Visit Google**: https://www.google.com
2. **Click Veil icon** in toolbar
3. **See classified cookies**:
   - 📊 _ga → Analytics (Yellow)
   - 📊 _gid → Analytics (Yellow)  
   - 🎯 NID → Advertising (Red)

### Check API Working:
1. Press **F12** (DevTools)
2. Go to **Network** tab
3. Filter: **Fetch/XHR**
4. Click Veil icon
5. See API calls to: `aqibtahir-cookie-classifier-api.hf.space`
6. Status should be: **200 OK**

---

## 🎯 What It Does

### On Every Website Visit:
- 🍪 **Detects all cookies** automatically
- 🤖 **Classifies via AI API** (Hugging Face serverless)
- 🎨 **Shows color-coded badges**:
  - 🔒 Blue = Strictly Necessary
  - ⚙️ Green = Functionality
  - 📊 Yellow = Analytics
  - 🎯 Red = Advertising/Tracking
- 📊 **Updates dashboard** with statistics
- 🛡️ **Blocks trackers** (DoubleClick, Google Analytics, Facebook)

### Dashboard Features:
- Cookie count and statistics
- Category distribution charts
- Individual cookie details
- Search and filter
- Active tab / All cookies toggle

---

## 🌐 Test Websites

Try these to see different cookie types:

**Analytics Heavy:**
- https://www.google.com
- https://www.youtube.com

**Advertising Heavy:**
- https://www.facebook.com
- https://www.reddit.com

**E-commerce (Sessions):**
- https://www.amazon.com
- https://www.ebay.com

**News Sites (Mixed):**
- https://www.cnn.com
- https://www.bbc.com

---

## 📊 Expected Results

### Console Logs (F12):
```
[Dashboard] Chrome APIs detected - Loading extension CookieManager
[Dashboard] Fetching cookies for: https://www.google.com
[Dashboard] Loaded 5 cookies
[Dashboard] Classifying cookies with AI model...
[CookieClassifier] Batch API not available (404), using individual predictions...
[CookieClassifier] ✓ _ga → Analytics
[CookieClassifier] ✓ _gid → Analytics
[CookieClassifier] ✓ NID → Advertising/Tracking
[CookieClassifier] ✓ Individual classification complete (fallback mode)
[Dashboard] Classification stats: {0: 0, 1: 0, 2: 2, 3: 3}
```

### Network Tab:
```
POST https://aqibtahir-cookie-classifier-api.hf.space/predict
Status: 200 OK
Response: {"cookie_name":"_ga","category":"Analytics","class_id":2}
```

### Dashboard UI:
- Cookie cards with colored borders
- Category badges with icons
- Confidence percentages (if available)
- Statistics: X Necessary, Y Functional, Z Analytics, W Advertising

---

## 🐛 Troubleshooting

### Extension won't load
- Ensure all files exist (run `python check_extension.py`)
- Check manifest.json is valid JSON
- Look for errors in chrome://extensions/

### No cookies showing
- Make sure you're NOT on chrome:// pages
- Try a regular website like google.com
- Check permissions granted to extension

### API calls failing
- Test API directly: https://aqibtahir-cookie-classifier-api.hf.space/
- Check internet connection
- Look at Network tab for error details

### Dashboard blank
- Right-click extension icon → Inspect
- Check Console for JavaScript errors
- Verify cookieClassifier.js and dashboard.js loaded

---

## 📈 Success Metrics

✅ You'll know it's working when:
- Extension icon appears in toolbar
- Dashboard opens on click
- Cookies listed with color badges
- Console shows "✓" for classifications
- Network shows 200 OK responses
- Different websites show different cookies

---

## 🎉 You're All Set!

Your AI-powered cookie classifier is:
- ✅ Deployed on Hugging Face (serverless)
- ✅ Integrated in Chrome Extension
- ✅ Working on ANY website
- ✅ Real-time classifications
- ✅ Privacy protection enabled

**Enjoy your FYP project!** 🚀

---

## 📞 Need Help?

Check these files:
- `EXTENSION_INSTALL_GUIDE.md` - Detailed installation
- `check_extension.py` - Verify all files exist
- Console logs (F12) - Debug errors
- chrome://extensions/ - Extension status

**Happy Testing!** 🎊
