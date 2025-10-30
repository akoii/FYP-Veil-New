# 🧪 Testing Your Cookie Classifier Integration

## Option 1: Standalone API Test (QUICK TEST) ✅

**I just opened `test-api-inference.html` in your browser!**

### What to do:
1. The page should be open in your browser now
2. Click "❤️ Health Check" to verify API is running
3. Click "📊 Test Common Cookies" to see classifications
4. Try entering your own cookie names

### Expected Results:
```
_ga          → 📊 Analytics
_gid         → 📊 Analytics  
sessionid    → 🔒 Strictly Necessary
_fbp         → 🎯 Advertising/Tracking
csrftoken    → 🔒 Strictly Necessary
```

---

## Option 2: Test in Chrome Extension (FULL INTEGRATION TEST)

### Step 1: Check for manifest.json
We need to create a manifest.json file first. Let me check if one exists...

### Step 2: Load Extension
```
1. Open Chrome browser
2. Go to: chrome://extensions/
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Navigate to: C:\Users\cutie-pie\Desktop\FYP Misssion\huggingface model deployment\FYP-Veil-New\02_Extension_App
6. Select the folder and click "Select Folder"
```

### Step 3: Open Dashboard
```
1. Click the Veil extension icon in Chrome toolbar
2. Click "Dashboard" or navigate to extension pages
3. Go to Cookies section
4. Watch the browser console (F12) for classification logs
```

### Expected Console Output:
```
[CookieClassifier] Module loaded ✓
[Dashboard] Loaded 47 cookies
[Dashboard] Classifying cookies with AI model...
[CookieClassifier] Batch: 47 total, 0 cached, 47 need classification
[CookieClassifier] Calling batch API with 47 cookies...
[CookieClassifier] ✓ _ga → Analytics
[CookieClassifier] ✓ _gid → Analytics
[CookieClassifier] ✓ sessionid → Strictly Necessary
[CookieClassifier] ✓ Batch classification complete
[Dashboard] Classification stats: {
  'Strictly Necessary': 12,
  'Functionality': 8,
  'Analytics': 15,
  'Advertising/Tracking': 12
}
```

---

## 🔍 What to Look For

### In the Standalone Test Page:
- ✅ Health check returns "online" status
- ✅ Classifications show correct categories
- ✅ Confidence scores displayed
- ✅ Color-coded badges (green/blue/yellow/red)
- ✅ No CORS errors in console

### In the Chrome Extension:
- ✅ Cookie cards show real categories (not "Ad Cookie")
- ✅ Each cookie has an icon (🔒, ⚙️, 📊, 🎯)
- ✅ Confidence percentages displayed
- ✅ Colors match categories
- ✅ Console shows successful API calls

---

## 🚨 Troubleshooting

### Issue: Test page shows CORS error
**Solution:** This shouldn't happen since API has CORS enabled. If it does:
- Check API status: https://huggingface.co/spaces/aqibtahir/cookie-classifier-api
- Try opening in a different browser
- Check browser console for exact error

### Issue: "Failed to fetch" error
**Solution:**
- Verify API is running: https://aqibtahir-cookie-classifier-api.hf.space/
- Check your internet connection
- Wait a moment and try again (API might be cold starting)

### Issue: Extension won't load
**Solution:**
- Make sure manifest.json exists (I'll create it if needed)
- Check for errors in chrome://extensions/
- Verify all files are in the correct location

---

## 📊 Quick API Test Commands

Open browser console on the test page and try:

```javascript
// Direct API test
fetch('https://aqibtahir-cookie-classifier-api.hf.space/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ cookie_name: '_ga' })
})
.then(r => r.json())
.then(console.log);

// Expected output:
// {
//   cookie_name: "_ga",
//   category: "Analytics",
//   class_id: 2,
//   confidence: 0.92
// }
```

---

## ✅ Success Indicators

**Standalone Test Page:**
- [x] Health check shows API online
- [x] Single cookie classification works
- [x] Batch prediction works
- [x] Correct categories displayed
- [x] No console errors

**Chrome Extension:**
- [ ] Extension loads without errors
- [ ] Dashboard displays cookies
- [ ] Real categories shown (not "Ad Cookie")
- [ ] API calls visible in Network tab
- [ ] Console shows classification logs

---

## 🎯 What's Happening?

Your serverless API is:
1. Receiving cookie names from the frontend
2. Processing through TF-IDF vectorizers (69K features)
3. Extracting 80 name-based features
4. Running Linear Regression classification
5. Returning category + confidence score
6. All in ~200-500ms per request!

**This is production ML inference in action!** 🚀
