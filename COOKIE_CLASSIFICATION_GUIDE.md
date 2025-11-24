# 🍪 Cookie Classification System - Implementation Guide

## Overview
This system uses a Hugging Face-powered API to classify browser cookies in real-time, categorizing them by purpose and calculating privacy risk scores.

---

## 📁 Architecture

```
┌─────────────────────────────────────────────────────┐
│           Chrome Extension (Frontend)               │
│  - Service Worker (Background)                      │
│  - Dashboard UI                                     │
│  - Popup UI                                         │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP/REST API
                   ↓
┌─────────────────────────────────────────────────────┐
│      Flask API Server (Backend)                     │
│  - Cookie Classifier API                            │
│  - Rule-based Classification                        │
│  - Hugging Face Integration                         │
└──────────────────┬──────────────────────────────────┘
                   │ Inference API
                   ↓
┌─────────────────────────────────────────────────────┐
│         Hugging Face Models                         │
│  - Text Classification Models                       │
│  - Custom Fine-tuned Models (Optional)              │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Step-by-Step Setup Guide

### **STEP 1: Start the Classification API Server**

#### 1.1 Navigate to the deployment directory
```bash
cd "d:\Projects\FYP\Front End of Veil\Veil-FYP-Project\03_AI_ML_Pipeline\deployment"
```

#### 1.2 Install Python dependencies
```bash
pip install -r requirements-api.txt
```

#### 1.3 Set environment variables (Optional)
```bash
# Windows PowerShell
$env:HF_TOKEN="YOUR_HUGGING_FACE_TOKEN_HERE"
$env:PORT="5000"
$env:MODEL_NAME="distilbert-base-uncased-finetuned-sst-2-english"

# Or use .env file (create .env in deployment folder)
# HF_TOKEN=YOUR_HUGGING_FACE_TOKEN_HERE
# PORT=5000
# MODEL_NAME=distilbert-base-uncased-finetuned-sst-2-english
```

#### 1.4 Start the Flask API server
```bash
python cookie_classifier_api.py
```

You should see:
```
 * Running on http://0.0.0.0:5000
 * Running on http://127.0.0.1:5000
```

#### 1.5 Verify API is running
Open browser or use curl:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "model": "distilbert-base-uncased-finetuned-sst-2-english",
  "version": "1.0.0"
}
```

---

### **STEP 2: Load the Chrome Extension**

#### 2.1 Open Chrome Extension Management
1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)

#### 2.2 Load unpacked extension
1. Click "Load unpacked"
2. Select folder: `d:\Projects\FYP\Front End of Veil\Veil-FYP-Project\02_Extension_App`
3. Extension should appear in the list

#### 2.3 Verify extension loaded
- You should see "Veil - Privacy Extension" in the extensions list
- Click the extension icon in the toolbar
- Popup should open showing privacy score

---

### **STEP 3: Test Cookie Classification**

#### 3.1 Navigate to a website
Open any website (e.g., https://www.google.com, https://www.youtube.com)

#### 3.2 Open extension dashboard
1. Click the Veil extension icon
2. Click "View Dashboard" or navigate to the dashboard page

#### 3.3 Verify classification is working
Check the browser console (F12) for logs:
```
[CookieClassifier] Starting cookie classification...
[CookieClassifier] Found X cookies to classify
[CookieClassifier] Classification complete: { total_cookies: X, ... }
```

#### 3.4 Check API logs
In the terminal running the Flask server, you should see:
```
INFO:__main__:Batch classified X cookies
```

---

## 📊 Cookie Categories

The system classifies cookies into these categories:

| Category | Description | Risk Score Range |
|----------|-------------|------------------|
| **Necessary** | Essential for website functionality (login, CSRF tokens) | 0-20 |
| **Functional** | Enhances user experience (preferences, settings) | 20-40 |
| **Performance** | Website performance optimization | 30-50 |
| **Analytics** | User behavior tracking and analysis | 50-70 |
| **Social Media** | Social media integration and sharing | 60-80 |
| **Advertising** | Targeted advertising and marketing | 70-100 |

---

## 🔌 API Endpoints

### 1. Health Check
```
GET /health
```
Returns API health status.

### 2. Classify Single Cookie
```
POST /classify
Content-Type: application/json

{
  "name": "session_id",
  "domain": "example.com",
  "path": "/",
  "httpOnly": true,
  "secure": true,
  "sameSite": "lax",
  "session": false
}
```

Response:
```json
{
  "cookie_name": "session_id",
  "category": "necessary",
  "confidence": 0.85,
  "description": "Essential for website functionality",
  "risk_score": 15,
  "classification_method": "rule-based"
}
```

### 3. Classify Multiple Cookies (Batch)
```
POST /classify-batch
Content-Type: application/json

{
  "cookies": [
    { "name": "session_id", "domain": "example.com", ... },
    { "name": "_ga", "domain": ".google.com", ... }
  ]
}
```

Response:
```json
{
  "results": [
    {
      "cookie_name": "session_id",
      "category": "necessary",
      "confidence": 0.85,
      "risk_score": 15
    },
    {
      "cookie_name": "_ga",
      "category": "analytics",
      "confidence": 0.9,
      "risk_score": 65
    }
  ],
  "statistics": {
    "total_cookies": 2,
    "by_category": {
      "necessary": 1,
      "analytics": 1
    },
    "average_risk_score": 40
  }
}
```

### 4. Get Available Categories
```
GET /categories
```

---

## 🔧 Chrome Extension Integration

### Service Worker Functions

#### `classifyAllCookies()`
- Called on extension installation/startup
- Retrieves all browser cookies
- Sends batch classification request to API
- Stores results in chrome.storage.local

#### `classifyNewCookie(cookie)`
- Called when a new cookie is detected
- Classifies single cookie via API
- Updates stored classifications

#### `updatePrivacyScoreFromClassifications(stats)`
- Calculates privacy score based on cookie risk
- Higher score = better privacy
- Updates dashboard display

### Message Handlers

Send messages from popup/dashboard to service worker:

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
  (response) => {
    console.log(response.message);
  }
);

// Check API health
chrome.runtime.sendMessage(
  { action: 'checkApiHealth' },
  (response) => {
    console.log('API healthy:', response.healthy);
  }
);
```

---

## 🎨 Dashboard Integration (Next Steps)

To display cookie classifications in the dashboard, add this code to `dashboard.js`:

```javascript
// Fetch and display cookie classifications
async function displayCookieClassifications() {
  chrome.runtime.sendMessage(
    { action: 'getClassifications' },
    (response) => {
      const stats = response.statistics;
      
      // Update UI with statistics
      document.getElementById('total-cookies').textContent = stats.total_cookies;
      document.getElementById('avg-risk-score').textContent = 
        Math.round(stats.average_risk_score);
      
      // Display category breakdown
      const categoryContainer = document.getElementById('category-breakdown');
      categoryContainer.innerHTML = '';
      
      Object.entries(stats.by_category).forEach(([category, count]) => {
        const element = document.createElement('div');
        element.className = 'category-item';
        element.innerHTML = `
          <span class="category-name">${category}</span>
          <span class="category-count">${count}</span>
        `;
        categoryContainer.appendChild(element);
      });
    }
  );
}

// Call on page load
document.addEventListener('DOMContentLoaded', displayCookieClassifications);
```

---

## 🔒 Privacy & Security Notes

1. **No Cookie Values Transmitted**: Only cookie metadata (name, domain, flags) is sent to the API, never the actual cookie value.

2. **Local API**: The API runs locally (localhost:5000) for maximum privacy.

3. **Optional Caching**: Classifications are cached for 1 hour to reduce API calls.

4. **Fallback Classification**: If the API is unavailable, a rule-based fallback classifier runs locally in the extension.

---

## 🚨 Troubleshooting

### API won't start
- Check if port 5000 is already in use: `netstat -ano | findstr :5000`
- Try a different port: `$env:PORT="5001"` then restart

### Extension can't connect to API
- Verify API is running: `curl http://localhost:5000/health`
- Check browser console for CORS errors
- Ensure Flask-CORS is installed

### No cookies being classified
- Check if cookies exist: Open DevTools → Application → Cookies
- Verify service worker is running: `chrome://extensions/` → Click "Service worker"
- Check console logs for errors

### Classifications not accurate
- The default system uses rule-based classification
- To improve accuracy, train a custom model on cookie datasets
- See "Training Custom Model" section below

---

## 📈 Training a Custom Model (Advanced)

To train a custom cookie classification model:

1. **Collect Training Data**: Create a dataset of cookies with labels
```csv
cookie_name,domain,category
session_id,example.com,necessary
_ga,google.com,analytics
fbp,facebook.com,advertising
```

2. **Fine-tune a Model**: Use Hugging Face Transformers
```python
from transformers import AutoModelForSequenceClassification, Trainer

# Load pre-trained model
model = AutoModelForSequenceClassification.from_pretrained(
    "distilbert-base-uncased",
    num_labels=6  # 6 categories
)

# Train with your dataset
# ... (training code)

# Push to Hugging Face Hub
model.push_to_hub("your-username/cookie-classifier")
```

3. **Update API Configuration**
```python
MODEL_NAME = "your-username/cookie-classifier"
```

---

## ✅ Verification Checklist

- [ ] Python dependencies installed
- [ ] Hugging Face token configured
- [ ] Flask API server running on localhost:5000
- [ ] API health check returns "healthy"
- [ ] Chrome extension loaded in browser
- [ ] Service worker shows no errors
- [ ] Cookies are being classified on page load
- [ ] Classification statistics stored in chrome.storage
- [ ] Dashboard displays cookie data (if implemented)

---

## 📞 Next Steps

1. ✅ **API Running**: Start the Flask server
2. ✅ **Extension Loaded**: Load unpacked extension in Chrome
3. ⏳ **Test Classification**: Visit websites and verify cookies are classified
4. ⏳ **Dashboard UI**: Add classification display to dashboard
5. ⏳ **Train Custom Model**: Create dataset and fine-tune model
6. ⏳ **Deploy API**: Deploy to cloud for production use

---

## 🎯 Current Status

- [x] Hugging Face token connected
- [x] Flask API created
- [x] Cookie classifier client created
- [x] Service worker integration complete
- [ ] Start API server
- [ ] Test cookie classification
- [ ] Update dashboard UI to display classifications

---

**Ready to proceed with testing! 🚀**
