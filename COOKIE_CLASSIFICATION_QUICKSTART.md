# 🎯 Cookie Classification System - Quick Reference

## What We Built

A **real-time cookie classification system** that:
1. ✅ Retrieves all browser cookies on extension launch
2. ✅ Classifies each cookie using a Hugging Face-powered API
3. ✅ Categorizes cookies by purpose (necessary, analytics, advertising, etc.)
4. ✅ Calculates privacy risk scores for each cookie
5. ✅ Updates privacy score based on cookie analysis

---

## 📁 Files Created/Modified

### New Files Created:

1. **`03_AI_ML_Pipeline/deployment/cookie_classifier_api.py`**
   - Flask REST API server
   - Connects to Hugging Face
   - Classifies cookies via ML + rule-based hybrid approach
   - Endpoints: `/health`, `/classify`, `/classify-batch`, `/categories`

2. **`02_Extension_App/core/utils/cookie-classifier.js`**
   - Client library for Chrome extension
   - Handles API communication
   - Implements caching and fallback classification
   - Methods: `classifyCookie()`, `classifyCookiesBatch()`, `checkHealth()`

3. **`03_AI_ML_Pipeline/deployment/requirements-api.txt`**
   - Python dependencies for the API server
   - Flask, Flask-CORS, Hugging Face Hub, Transformers

4. **`COOKIE_CLASSIFICATION_GUIDE.md`**
   - Comprehensive implementation guide
   - Step-by-step setup instructions
   - API documentation
   - Troubleshooting tips

5. **`start-api.ps1`**
   - PowerShell script to start the API server easily
   - Configures environment variables
   - Checks dependencies
   - Starts Flask server

### Modified Files:

1. **`02_Extension_App/core/service-worker.js`**
   - Added: Cookie classifier import
   - Added: `classifyAllCookies()` function
   - Added: `classifyNewCookie()` function
   - Added: Cookie change listener
   - Added: Message handlers for classifications
   - Updated: `initializeSettings()` to store classifications
   - Added: Automatic re-classification every 30 minutes

---

## 🚀 How to Use (Step-by-Step)

### STEP 1: Start the API Server

**Option A: Using PowerShell Script (Easiest)**
```powershell
cd "d:\Projects\FYP\Front End of Veil\Veil-FYP-Project"
.\start-api.ps1
```

**Option B: Manual Start**
```powershell
cd "d:\Projects\FYP\Front End of Veil\Veil-FYP-Project\03_AI_ML_Pipeline\deployment"
$env:HF_TOKEN = "YOUR_HUGGING_FACE_TOKEN_HERE"
python cookie_classifier_api.py
```

**Expected Output:**
```
🍪 Starting Veil Cookie Classification API...
✓ Environment configured
✓ All dependencies installed
🚀 Starting Flask API server...
 * Running on http://127.0.0.1:5000
```

### STEP 2: Verify API is Running

Open a browser and go to:
```
http://localhost:5000/health
```

Should return:
```json
{
  "status": "healthy",
  "model": "distilbert-base-uncased-finetuned-sst-2-english",
  "version": "1.0.0"
}
```

### STEP 3: Load Chrome Extension

1. Open Chrome: `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select folder: `d:\Projects\FYP\Front End of Veil\Veil-FYP-Project\02_Extension_App`
5. Verify "Veil - Privacy Extension" appears

### STEP 4: Test Cookie Classification

1. Navigate to any website (e.g., YouTube, Google, Facebook)
2. Open Chrome DevTools (F12) → Console tab
3. Look for classification logs:
   ```
   [CookieClassifier] Starting cookie classification...
   [CookieClassifier] Found 15 cookies to classify
   [CookieClassifier] Classification complete
   ```

4. Check stored data:
   ```javascript
   chrome.storage.local.get(['classificationStats'], (data) => {
     console.log(data);
   });
   ```

---

## 🎨 Cookie Categories

| Category | Description | Examples |
|----------|-------------|----------|
| 🟢 **Necessary** | Essential cookies | `session_id`, `csrf_token`, `auth_token` |
| 🔵 **Functional** | User preferences | `language`, `theme`, `currency` |
| 🟡 **Performance** | Speed optimization | `cache_key`, `cdn_session` |
| 🟠 **Analytics** | Behavior tracking | `_ga`, `_gid`, `analytics_session` |
| 🟣 **Social Media** | Social integration | `fb_pixel`, `twitter_id`, `linkedin_session` |
| 🔴 **Advertising** | Ad targeting | `doubleclick`, `adsense`, `fbp` |

---

## 📊 How Classification Works

```
┌──────────────────┐
│  Browser Cookie  │
└────────┬─────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Extract Features:                  │
│  - Cookie name                      │
│  - Domain                           │
│  - Security flags (httpOnly, etc.)  │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Rule-Based Classification:         │
│  - Check against keyword patterns   │
│  - Match domain names               │
│  - Analyze cookie attributes        │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Calculate Risk Score:              │
│  - Base score by category           │
│  - Adjust for security flags        │
│  - Consider third-party status      │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│  Return Classification:             │
│  {                                  │
│    category: "analytics",           │
│    confidence: 0.85,                │
│    risk_score: 65,                  │
│    description: "..."               │
│  }                                  │
└─────────────────────────────────────┘
```

---

## 🔌 API Endpoints Reference

### 1. Health Check
```bash
curl http://localhost:5000/health
```

### 2. Classify Single Cookie
```bash
curl -X POST http://localhost:5000/classify \
  -H "Content-Type: application/json" \
  -d '{
    "name": "_ga",
    "domain": ".google.com",
    "httpOnly": false,
    "secure": true
  }'
```

### 3. Classify Multiple Cookies
```bash
curl -X POST http://localhost:5000/classify-batch \
  -H "Content-Type: application/json" \
  -d '{
    "cookies": [
      {"name": "_ga", "domain": ".google.com"},
      {"name": "session_id", "domain": "example.com"}
    ]
  }'
```

### 4. Get Categories
```bash
curl http://localhost:5000/categories
```

---

## 💾 Data Storage

Classifications are stored in Chrome's local storage:

```javascript
// Structure in chrome.storage.local
{
  cookieClassifications: {
    "_ga:.google.com": {
      category: "analytics",
      confidence: 0.9,
      risk_score: 65,
      timestamp: 1699632000000
    },
    // ... more cookies
  },
  classificationStats: {
    total_cookies: 25,
    by_category: {
      necessary: 5,
      analytics: 8,
      advertising: 7,
      functional: 3,
      social_media: 2
    },
    average_risk_score: 52
  }
}
```

---

## 🔄 Automatic Features

1. **On Extension Install**: Classifies all existing cookies
2. **On New Cookie**: Automatically classifies when detected
3. **Periodic Re-classification**: Every 30 minutes
4. **Privacy Score Update**: Updated after each classification
5. **Caching**: Results cached for 1 hour to reduce API calls

---

## 🎯 Integration Points

### Service Worker Messages

```javascript
// Get all classifications
chrome.runtime.sendMessage(
  { action: 'getClassifications' },
  (response) => {
    console.log(response.classifications);
    console.log(response.statistics);
  }
);

// Trigger manual classification
chrome.runtime.sendMessage(
  { action: 'classifyCookies' },
  (response) => console.log(response)
);

// Check API health
chrome.runtime.sendMessage(
  { action: 'checkApiHealth' },
  (response) => console.log('API:', response.healthy)
);
```

---

## 🚨 Common Issues & Solutions

### Issue: API won't start
**Solution**: Check if port 5000 is in use
```powershell
netstat -ano | findstr :5000
# If in use, change port:
$env:PORT = "5001"
```

### Issue: Extension can't connect
**Solution**: Verify API is running
```bash
curl http://localhost:5000/health
```

### Issue: No cookies classified
**Solution**: Check service worker console
1. Go to `chrome://extensions/`
2. Click "Service worker" under Veil extension
3. Look for error messages

### Issue: CORS errors
**Solution**: Flask-CORS should handle this, but verify:
```python
# In cookie_classifier_api.py
CORS(app)  # Should be present
```

---

## 📈 Next Steps

### Phase 1: Testing (Current)
- [ ] Start API server
- [ ] Load Chrome extension
- [ ] Visit websites and verify classification
- [ ] Check console logs
- [ ] Verify data storage

### Phase 2: Dashboard Integration
- [ ] Display classification statistics on dashboard
- [ ] Show cookie categories with charts
- [ ] Add "Classify Now" button
- [ ] Display API health status
- [ ] Show individual cookie details

### Phase 3: Model Improvement
- [ ] Collect cookie dataset
- [ ] Train custom classification model
- [ ] Fine-tune on Hugging Face
- [ ] Update API to use custom model
- [ ] Improve accuracy

### Phase 4: Production Deployment
- [ ] Deploy API to cloud (Heroku, AWS, etc.)
- [ ] Add authentication
- [ ] Implement rate limiting
- [ ] Add monitoring/logging
- [ ] Update extension to use prod API

---

## ✅ Checklist

- [x] Hugging Face token configured
- [x] Python packages installed
- [x] API server code created
- [x] Chrome extension integration complete
- [x] Documentation written
- [ ] API server running
- [ ] Extension loaded in Chrome
- [ ] Cookie classification tested
- [ ] Dashboard UI updated

---

## 🎓 What You Learned

1. ✅ How to connect to Hugging Face APIs
2. ✅ Building REST APIs with Flask
3. ✅ Chrome extension background scripts
4. ✅ Cookie analysis and classification
5. ✅ Privacy risk score calculation
6. ✅ Real-time data processing
7. ✅ Hybrid ML + rule-based systems

---

## 📞 Commands Quick Reference

```powershell
# Start API server
.\start-api.ps1

# Test API
curl http://localhost:5000/health

# Install dependencies
pip install -r 03_AI_ML_Pipeline/deployment/requirements-api.txt

# Load extension
# Chrome → chrome://extensions/ → Load unpacked → 02_Extension_App

# Check service worker
# Chrome → chrome://extensions/ → Veil → Service worker
```

---

**🚀 You're ready to test! Start with STEP 1 above.**
