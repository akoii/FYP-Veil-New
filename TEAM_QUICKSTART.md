# 🚀 Team Quick-Start Guide
## Getting Both Features Running Together

**Last Updated:** November 25, 2025

---

## 📋 What's in the Main Branch?

Your main branch now contains **TWO integrated features:**

1. **🍪 API-Powered Cookie Classification** (Your teammate's work)
   - Flask REST API with Hugging Face models
   - Rule-based fallback mechanism
   - Batch processing support

2. **🔒 Hardware Access Control** (Your work)
   - Camera, Microphone, Location, Notifications blocking
   - 4-phase detection system
   - Real-time activity monitoring

**✅ GOOD NEWS:** They work together perfectly! No conflicts.

---

## ⚡ Quick Setup (5 Minutes)

### **Step 1: Install Python Dependencies**

```powershell
# Navigate to project root
cd "c:\Users\MSI\Downloads\FYP-Veil-New-main\FYP-Veil-New-main"

# Install API dependencies
pip install -r 03_AI_ML_Pipeline\deployment\requirements-api.txt
```

### **Step 2: Start the API Server**

```powershell
# Run the startup script
.\start-api.ps1

# You should see:
# 🚀 Starting Flask API server...
# API will be available at: http://localhost:5000
```

**Note:** Keep this terminal open - the API needs to stay running.

### **Step 3: Load Extension in Chrome**

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select folder: `02_Extension_App`
5. Extension icon should appear in toolbar

### **Step 4: Test Everything**

1. **Click extension icon** → Opens popup
2. **Click "Dashboard"** → Opens full dashboard
3. **Check Cookie Section** → Should classify cookies
4. **Check Hardware Section** → Toggle switches should work

---

## 🧪 Quick Verification Tests

### **Test 1: API is Working**

```powershell
# In a new terminal:
curl http://localhost:5000/health

# Expected response:
# {"status":"healthy","model":"distilbert-base-uncased-finetuned-sst-2-english","version":"1.0.0"}
```

### **Test 2: Cookie Classification**

1. Open Chrome dashboard
2. Navigate to any website (e.g., google.com)
3. Refresh dashboard
4. Cookie count should update
5. Check console (F12) for: `[CookieClassifier] Classified X cookies`

### **Test 3: Hardware Controls**

1. In dashboard, scroll to "Hardware Access Control"
2. Toggle any permission (Camera/Microphone/Location/Notifications)
3. Counter should update
4. Activity log should show new entry
5. Check console for: `[HardwareControl] Camera toggled to blocked`

---

## 🔧 What Each Component Does

### **API Server** (`cookie_classifier_api.py`)
```
Port: 5000
Endpoints:
  GET  /health           → Check if API is alive
  POST /classify         → Classify single cookie
  POST /classify-batch   → Classify multiple cookies
  GET  /categories       → Get category list
```

### **Service Worker** (`service-worker.js`)
```
Handles:
  ✓ Cookie classification requests
  ✓ Hardware permission toggles
  ✓ Activity logging
  ✓ Privacy score calculation
  ✓ Statistics tracking
```

### **Dashboard** (`dashboard.js`)
```
Displays:
  ✓ Cookie list with classifications
  ✓ Hardware permission toggles
  ✓ Activity log with detection methods
  ✓ Real-time statistics
  ✓ Privacy score breakdown
```

---

## 📁 Important Files to Know

### **Your Teammate's API Work:**
```
03_AI_ML_Pipeline/deployment/
├── cookie_classifier_api.py      ← Main API server
├── requirements-api.txt          ← Dependencies
└── .env.example                  ← Config template

02_Extension_App/core/utils/
└── cookie-classifier.js          ← API client
```

### **Your Hardware Access Work:**
```
02_Extension_App/
├── core/
│   ├── service-worker.js         ← Hardware control logic (Lines 418-900)
│   └── api-handlers.js           ← Chrome API wrappers
└── frontend/scripts/
    └── dashboard.js              ← Hardware UI (Lines 933-1200)
```

### **Integration Points:**
```
02_Extension_App/
├── core/service-worker.js        ← Both features coordinated here
└── manifest.json                 ← All permissions defined
```

---

## 🔍 Troubleshooting

### **Problem: "API is not available" in console**

**Solution:**
```powershell
# Check if API is running:
curl http://localhost:5000/health

# If not running, start it:
.\start-api.ps1
```

**Note:** Extension still works! It uses fallback classification.

### **Problem: Hardware toggles not working**

**Check:**
1. ✓ Extension loaded in Chrome?
2. ✓ `contentSettings` permission in manifest.json?
3. ✓ Not on Chrome internal page (chrome://)?

**Fix:**
```
Reload extension: chrome://extensions/ → Click reload
```

### **Problem: No cookies showing**

**Check:**
1. ✓ On a real website (not chrome:// pages)?
2. ✓ Cookies exist on that site?
3. ✓ Extension permissions granted?

**Fix:**
```
Visit a site like google.com, then refresh dashboard
```

### **Problem: Activity log empty**

**This is normal!** Activity only logs when:
- Hardware permissions are toggled
- Websites request camera/microphone/location
- API calls detected (getUserMedia, geolocation)

---

## 💡 Development Workflow

### **Making Changes to API:**
```powershell
# 1. Stop API (Ctrl+C in terminal)
# 2. Edit cookie_classifier_api.py
# 3. Restart API
.\start-api.ps1
```

### **Making Changes to Extension:**
```powershell
# 1. Edit files in 02_Extension_App/
# 2. Go to chrome://extensions/
# 3. Click reload button for Veil extension
# 4. Hard refresh dashboard (Ctrl+Shift+R)
```

### **Testing Changes:**
```powershell
# Check service worker console:
chrome://extensions/ → Click "service worker" under Veil

# Check dashboard console:
Open dashboard → Press F12
```

---

## 📊 Feature Status Overview

| Feature | Status | Works Without API? |
|---------|--------|-------------------|
| Cookie Classification (API) | ✅ Working | ✅ Yes (fallback) |
| Cookie Classification (UI) | ✅ Working | ✅ Yes |
| Hardware - Camera Block | ✅ Working | ✅ Yes |
| Hardware - Microphone Block | ✅ Working | ✅ Yes |
| Hardware - Location Block | ✅ Working | ✅ Yes |
| Hardware - Notifications Block | ✅ Working | ✅ Yes |
| Hardware - Activity Log | ✅ Working | ✅ Yes |
| Hardware - API Detection | ✅ Working | ✅ Yes |
| Privacy Score | ✅ Working | ✅ Yes |

**Key Insight:** Extension is fully functional even without API server! The API just provides more accurate cookie classification.

---

## 🎯 What to Tell Your Team

### **For Developers:**
> "Both features are integrated and working. Start API with `start-api.ps1`, load extension from `02_Extension_App`. No conflicts, everything tested."

### **For Testers:**
> "Two main features: Cookie classification (needs API running) and Hardware blocking (always works). Test both independently and together."

### **For Demo:**
> "Show cookie classification, then toggle hardware permissions. Point out activity log with detection methods. Privacy score updates in real-time."

---

## 📝 Next Steps

### **Recommended:**
1. ✅ Both test all features together
2. ✅ Document any bugs found
3. ✅ Prepare demo script
4. ✅ Consider deploying API to cloud (remove localhost dependency)

### **Optional Improvements:**
- Add per-site exceptions for hardware blocking
- Deploy API to Heroku/AWS/Azure
- Add more detection patterns
- Create user documentation

---

## 🆘 Need Help?

### **Check These First:**
1. **Integration Report:** `INTEGRATION_STATUS_REPORT.md` (detailed technical analysis)
2. **Project Structure:** `PROJECT_STRUCTURE.md` (file organization)
3. **Console Logs:** F12 in dashboard or service worker

### **Common Issues:**
- **Port 5000 in use?** → Change in `start-api.ps1` and `cookie-classifier.js`
- **Extension not loading?** → Check for errors in `chrome://extensions/`
- **Nothing works?** → Reload extension and hard refresh dashboard

---

## ✅ Success Checklist

Before considering setup complete, verify:

- [ ] API server starts without errors
- [ ] API health check returns 200 OK
- [ ] Extension loads in Chrome
- [ ] Dashboard opens successfully
- [ ] Cookies are classified (check console)
- [ ] Hardware toggles change state
- [ ] Activity log shows entries when toggling
- [ ] Privacy score updates
- [ ] No errors in any console (service worker or dashboard)

---

**You're all set! 🎉**

Both features are working together perfectly. The integration is complete, tested, and ready for further development or deployment.

**Questions?** Check `INTEGRATION_STATUS_REPORT.md` for technical details.
