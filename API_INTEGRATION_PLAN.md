# Veil Extension - Cookie Classifier API Integration Plan

## 📋 Project Review

### Current State
**Project**: Veil - Privacy Protection Browser Extension  
**Branch**: `aqib_working_branch` (testing branch)  
**Tech Stack**: 
- Frontend: Vanilla JavaScript, TailwindCSS, Chart.js
- Backend: Chrome Extension APIs (Service Worker)
- Structure: Chrome Extension with dashboard, popup, and service worker

### Current Cookie System
Currently, the extension:
- ✅ Fetches cookies using `chrome.cookies` API
- ✅ Displays cookies in the dashboard (`dashboard.html`)
- ✅ Shows cookie details (domain, path, security flags, etc.)
- ❌ **Hard-codes all cookies as "Ad Cookie"** (line 418 in `dashboard.js`)
- ❌ **No real classification/categorization**

### Files Analyzed
1. **`02_Extension_App/frontend/scripts/dashboard.js`** (921 lines)
   - Cookie management logic
   - Currently labels all as "Ad Cookie"
   - Has sections for: Advertising, Functional, Strictly Necessary

2. **`02_Extension_App/frontend/scripts/cookieManager.js`** (115 lines)
   - Cookie fetching utilities
   - Format and filter functions
   - Clean, well-structured

3. **`02_Extension_App/frontend/pages/dashboard.html`** (505 lines)
   - Dashboard UI
   - Three cookie category sections already in place:
     - Advertising Cookies (border-red-500)
     - Functional Cookies (border-yellow-500) 
     - Strictly Necessary Cookies (border-green-500)

4. **`02_Extension_App/core/service-worker.js`** (180 lines)
   - Background processes
   - Blocking rules
   - Statistics tracking

---

## 🎯 Integration Goal

**Replace the hard-coded "Ad Cookie" label with real AI-powered classification using your deployed Hugging Face serverless API.**

### Your Serverless API
- **Endpoint**: `https://aqibtahir-cookie-classifier-api.hf.space/predict`
- **Model**: Linear Regression (90% accuracy)
- **Categories**:
  - Class 0: Strictly Necessary
  - Class 1: Functionality
  - Class 2: Analytics
  - Class 3: Advertising/Tracking

---

## 🔧 Implementation Plan

### Phase 1: Add API Client Module
Create a new file: `02_Extension_App/frontend/scripts/cookieClassifier.js`

**Purpose**: Handle all API communication
**Features**:
- Call prediction API
- Batch prediction support
- Caching to avoid redundant calls
- Error handling and fallback
- Rate limiting (if needed)

### Phase 2: Update Dashboard Logic
Modify: `02_Extension_App/frontend/scripts/dashboard.js`

**Changes**:
1. Import the new classifier module
2. Classify cookies before rendering
3. Update `createCookieCard()` to use real categories
4. Add category badges with proper colors
5. Sort cookies by category

### Phase 3: Enhance UI/UX
Modify: `02_Extension_App/frontend/pages/dashboard.html`

**Improvements**:
1. Update category sections to show dynamic counts
2. Add loading states during classification
3. Show classification confidence (optional)
4. Add manual override/report button (optional)

### Phase 4: Update Service Worker (Optional)
Modify: `02_Extension_App/core/service-worker.js`

**Enhancements**:
- Cache classifications in chrome.storage
- Update blocking rules based on categories
- Track category-specific statistics

---

## 📝 Code Changes Required

### File 1: `cookieClassifier.js` (NEW)
```javascript
/**
 * Cookie Classifier API Client
 * Integrates with Hugging Face serverless API
 */

const CookieClassifier = {
  API_URL: 'https://aqibtahir-cookie-classifier-api.hf.space/predict',
  API_URL_BATCH: 'https://aqibtahir-cookie-classifier-api.hf.space/predict/batch',
  
  // Cache to avoid redundant API calls
  cache: new Map(),
  
  // Category mapping
  CATEGORIES: {
    0: { name: 'Strictly Necessary', color: 'green', icon: '✓' },
    1: { name: 'Functionality', color: 'blue', icon: '⚙️' },
    2: { name: 'Analytics', color: 'yellow', icon: '📊' },
    3: { name: 'Advertising/Tracking', color: 'red', icon: '🎯' }
  },
  
  /**
   * Classify a single cookie
   */
  async classifyCookie(cookieName) {
    // Check cache
    if (this.cache.has(cookieName)) {
      return this.cache.get(cookieName);
    }
    
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookie_name: cookieName })
      });
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      const result = {
        category: data.category,
        class_id: data.class_id,
        confidence: data.confidence || null,
        color: this.CATEGORIES[data.class_id].color,
        icon: this.CATEGORIES[data.class_id].icon
      };
      
      // Cache result
      this.cache.set(cookieName, result);
      return result;
      
    } catch (error) {
      console.error('[CookieClassifier] Error:', error);
      // Fallback: classify as Advertising (safest default)
      return {
        category: 'Advertising/Tracking',
        class_id: 3,
        confidence: null,
        color: 'red',
        icon: '🎯'
      };
    }
  },
  
  /**
   * Classify multiple cookies in batch
   */
  async classifyCookiesBatch(cookieNames) {
    // Filter out cached cookies
    const uncached = cookieNames.filter(name => !this.cache.has(name));
    
    if (uncached.length === 0) {
      // All cached
      return cookieNames.map(name => ({
        cookie_name: name,
        ...this.cache.get(name)
      }));
    }
    
    try {
      const response = await fetch(this.API_URL_BATCH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookie_names: uncached })
      });
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      
      // Process and cache results
      data.predictions.forEach(pred => {
        const result = {
          category: pred.category,
          class_id: pred.class_id,
          confidence: pred.confidence || null,
          color: this.CATEGORIES[pred.class_id].color,
          icon: this.CATEGORIES[pred.class_id].icon
        };
        this.cache.set(pred.cookie_name, result);
      });
      
      // Return all results (cached + new)
      return cookieNames.map(name => ({
        cookie_name: name,
        ...this.cache.get(name)
      }));
      
    } catch (error) {
      console.error('[CookieClassifier] Batch error:', error);
      // Fallback: classify all as Advertising
      return cookieNames.map(name => ({
        cookie_name: name,
        category: 'Advertising/Tracking',
        class_id: 3,
        confidence: null,
        color: 'red',
        icon: '🎯'
      }));
    }
  },
  
  /**
   * Clear cache (useful for testing or updates)
   */
  clearCache() {
    this.cache.clear();
  }
};

// Export for use in dashboard.js
window.CookieClassifier = CookieClassifier;
```

### File 2: Modify `dashboard.js`
**Location**: Line ~285-320 (loadCookies function)

**Before**:
```javascript
async function loadCookies() {
  // ... existing code ...
  allCookies = await CookieManager.fetchAllCookies();
  // ... filtering ...
  renderCookies(displayedCookies);
}
```

**After**:
```javascript
async function loadCookies() {
  showCookieLoading();
  
  try {
    // ... existing fetch logic ...
    
    // 🆕 CLASSIFY COOKIES USING API
    console.log('[Dashboard] Classifying cookies...');
    const cookieNames = allCookies.map(c => c.name);
    const classifications = await CookieClassifier.classifyCookiesBatch(cookieNames);
    
    // 🆕 MERGE CLASSIFICATION DATA
    allCookies = allCookies.map((cookie, idx) => ({
      ...cookie,
      classification: classifications[idx]
    }));
    
    // ... rest of existing code ...
  }
}
```

**Location**: Line ~390-420 (createCookieCard function)

**Before**:
```javascript
<span class="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">Ad Cookie</span>
```

**After**:
```javascript
<span class="px-2 py-1 bg-${cookie.classification.color}-500/20 text-${cookie.classification.color}-400 rounded text-xs">
  ${cookie.classification.icon} ${cookie.classification.category}
  ${cookie.classification.confidence ? `(${Math.round(cookie.classification.confidence * 100)}%)` : ''}
</span>
```

### File 3: Update `dashboard.html`
**Location**: Line ~81 (Add script import)

**Add before closing `</body>` tag**:
```html
<!-- Cookie Classifier API Client -->
<script src="../scripts/cookieClassifier.js"></script>

<!-- Cookie Manager -->
<script src="../scripts/cookieManager.js"></script>

<!-- Dashboard Logic -->
<script src="../scripts/dashboard.js"></script>
```

---

## ✅ Testing Checklist

### 1. API Connection
- [ ] Test single cookie prediction
- [ ] Test batch prediction
- [ ] Verify API response format
- [ ] Check error handling

### 2. Classification Accuracy
- [ ] Test with known tracking cookies (_ga, _gid, etc.)
- [ ] Test with session cookies (sessionid, csrf_token)
- [ ] Test with functional cookies
- [ ] Verify categories match expected

### 3. UI/UX
- [ ] Loading state shows during classification
- [ ] Categories display with correct colors
- [ ] Confidence scores show (if available)
- [ ] Cache works (no redundant API calls)

### 4. Performance
- [ ] Batch processing works for many cookies
- [ ] Page doesn't freeze during classification
- [ ] Cache reduces API calls on refresh

### 5. Edge Cases
- [ ] Handle API timeout
- [ ] Handle network errors
- [ ] Handle invalid cookie names
- [ ] Handle empty cookie list

---

## 🚀 Deployment Steps

### Step 1: Create New Files
```bash
cd "02_Extension_App/frontend/scripts"
# Create cookieClassifier.js (copy from above)
```

### Step 2: Modify Existing Files
- Update `dashboard.js` with classification logic
- Update `dashboard.html` with script import

### Step 3: Test in Extension
1. Reload extension in Chrome
2. Open dashboard
3. Check browser console for logs
4. Verify API calls in Network tab

### Step 4: Debug & Iterate
- Check for CORS issues
- Verify API responses
- Test with different websites

---

## 📊 Expected Results

### Before Integration
```
All cookies: "Ad Cookie" (hard-coded)
```

### After Integration
```
_ga → Analytics (Class 2)
_gid → Analytics (Class 2)
sessionid → Strictly Necessary (Class 0)
_fbp → Advertising/Tracking (Class 3)
preferences → Functionality (Class 1)
```

---

## 🔐 Security Considerations

1. **API Key**: Currently no auth needed (public endpoint)
2. **CORS**: API has `allow_origins=["*"]` ✓
3. **Rate Limiting**: Consider adding client-side throttling
4. **Data Privacy**: Only cookie names sent (no values)
5. **Caching**: Reduces API calls and improves performance

---

## 📈 Future Enhancements

### Phase 5 (Optional)
1. **Statistics by Category**: Track how many cookies blocked per category
2. **Manual Override**: Let users correct classifications
3. **Feedback Loop**: Send corrections back to improve model
4. **Offline Mode**: Pre-load classifications for common cookies
5. **Settings Panel**: Toggle AI classification on/off

---

## 🎓 Learning Points

### What You'll Learn
- Chrome Extension APIs
- Async JavaScript and Promises
- API integration in browser extensions
- Caching strategies
- Error handling and fallbacks
- UI state management

### Code Quality Principles Applied
- ✅ Separation of concerns (classifier module)
- ✅ Error handling with graceful fallbacks
- ✅ Performance optimization (caching, batching)
- ✅ Clean code with clear comments
- ✅ Minimal changes to existing codebase

---

## 📞 Support

### API Status
- Dashboard: https://huggingface.co/spaces/aqibtahir/cookie-classifier-api
- API Docs: https://aqibtahir-cookie-classifier-api.hf.space/docs
- Model Repo: https://huggingface.co/aqibtahir/cookie-classifier-lr-tfidf

### Testing Endpoints
```bash
# Health check
curl https://aqibtahir-cookie-classifier-api.hf.space/

# Single prediction
curl -X POST https://aqibtahir-cookie-classifier-api.hf.space/predict \
  -H "Content-Type: application/json" \
  -d '{"cookie_name": "_ga"}'

# Batch prediction
curl -X POST https://aqibtahir-cookie-classifier-api.hf.space/predict/batch \
  -H "Content-Type: application/json" \
  -d '{"cookie_names": ["_ga", "_gid", "sessionid"]}'
```

---

**Ready to implement? Let's start with Phase 1! 🚀**
