/**
 * Cookie Classifier API Client
 * Integrates with Hugging Face serverless API for cookie classification
 * 
 * API: https://aqibtahir-cookie-classifier-api.hf.space
 * Model: Linear Regression (90% accuracy)
 */

const CookieClassifier = {
  // API endpoints
  API_URL: 'https://aqibtahir-cookie-classifier-api.hf.space/predict',
  API_URL_BATCH: 'https://aqibtahir-cookie-classifier-api.hf.space/predict/batch',
  
  // Classification cache to avoid redundant API calls
  cache: new Map(),
  
  // Category mapping with UI colors and labels
  CATEGORIES: {
    0: { 
      name: 'Strictly Necessary', 
      color: 'green', 
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-400',
      borderColor: 'border-green-500/30',
      icon: '🔒' 
    },
    1: { 
      name: 'Functionality', 
      color: 'blue', 
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      icon: '⚙️' 
    },
    2: { 
      name: 'Analytics', 
      color: 'yellow', 
      bgColor: 'bg-yellow-500/20',
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-500/30',
      icon: '📊' 
    },
    3: { 
      name: 'Advertising/Tracking', 
      color: 'red', 
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-400',
      borderColor: 'border-red-500/30',
      icon: '🎯' 
    }
  },
  
  /**
   * Classify a single cookie using the API
   * @param {string} cookieName - The cookie name to classify
   * @returns {Promise<Object>} Classification result with category, class_id, confidence, and UI colors
   */
  async classifyCookie(cookieName) {
    // Check cache first
    if (this.cache.has(cookieName)) {
      console.log(`[CookieClassifier] Cache hit for: ${cookieName}`);
      return this.cache.get(cookieName);
    }
    
    try {
      console.log(`[CookieClassifier] Classifying: ${cookieName}`);
      
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ cookie_name: cookieName })
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const categoryInfo = this.CATEGORIES[data.class_id];
      
      const result = {
        category: data.category,
        class_id: data.class_id,
        confidence: data.confidence || null,
        ...categoryInfo
      };
      
      // Cache the result
      this.cache.set(cookieName, result);
      console.log(`[CookieClassifier] ✓ ${cookieName} → ${result.category} (Class ${result.class_id})`);
      
      return result;
      
    } catch (error) {
      console.error('[CookieClassifier] Error classifying cookie:', error);
      
      // Fallback: classify as Advertising/Tracking (safest default for privacy)
      const fallback = {
        category: 'Advertising/Tracking',
        class_id: 3,
        confidence: null,
        ...this.CATEGORIES[3],
        error: true
      };
      
      this.cache.set(cookieName, fallback);
      return fallback;
    }
  },
  
  /**
   * Classify multiple cookies in a single batch request (more efficient)
   * @param {Array<string>} cookieNames - Array of cookie names to classify
   * @returns {Promise<Array<Object>>} Array of classification results
   */
  async classifyCookiesBatch(cookieNames) {
    if (!cookieNames || cookieNames.length === 0) {
      return [];
    }
    
    // Separate cached and uncached cookies
    const uncached = [];
    const results = new Map();
    
    cookieNames.forEach(name => {
      if (this.cache.has(name)) {
        results.set(name, this.cache.get(name));
      } else {
        uncached.push(name);
      }
    });
    
    console.log(`[CookieClassifier] Batch: ${cookieNames.length} total, ${results.size} cached, ${uncached.length} need classification`);
    
    // If all cookies are cached, return immediately
    if (uncached.length === 0) {
      return cookieNames.map(name => ({
        cookie_name: name,
        ...results.get(name)
      }));
    }
    
    try {
      console.log(`[CookieClassifier] Calling batch API with ${uncached.length} cookies...`);
      
      // Try batch endpoint first
      const response = await fetch(this.API_URL_BATCH, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ cookie_names: uncached })
      });
      
      if (!response.ok) {
        // Batch endpoint not available, fallback to individual predictions
        console.log(`[CookieClassifier] Batch API not available (${response.status}), using individual predictions...`);
        
        const predictions = await Promise.all(
          uncached.map(async (cookieName) => {
            try {
              const res = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: JSON.stringify({ cookie_name: cookieName })
              });
              
              if (!res.ok) throw new Error(`API returned ${res.status}`);
              return await res.json();
            } catch (err) {
              console.warn(`[CookieClassifier] Failed to classify ${cookieName}:`, err.message);
              return {
                cookie_name: cookieName,
                category: 'Advertising/Tracking',
                class_id: 3,
                confidence: null,
                error: true
              };
            }
          })
        );
        
        // Process fallback results
        predictions.forEach(pred => {
          const categoryInfo = this.CATEGORIES[pred.class_id];
          const result = {
            category: pred.category,
            class_id: pred.class_id,
            confidence: pred.confidence || null,
            ...categoryInfo,
            error: pred.error || false
          };
          
          this.cache.set(pred.cookie_name, result);
          results.set(pred.cookie_name, result);
          
          console.log(`[CookieClassifier] ✓ ${pred.cookie_name} → ${result.category}`);
        });
        
        console.log(`[CookieClassifier] ✓ Individual classification complete (fallback mode)`);
      } else {
        // Batch endpoint succeeded
        const data = await response.json();
        
        // Process and cache the new results
        data.predictions.forEach(pred => {
          const categoryInfo = this.CATEGORIES[pred.class_id];
          const result = {
            category: pred.category,
            class_id: pred.class_id,
            confidence: pred.confidence || null,
            ...categoryInfo
          };
          
          this.cache.set(pred.cookie_name, result);
          results.set(pred.cookie_name, result);
          
          console.log(`[CookieClassifier] ✓ ${pred.cookie_name} → ${result.category}`);
        });
        
        console.log(`[CookieClassifier] ✓ Batch classification complete`);
      }
      
    } catch (error) {
      console.error('[CookieClassifier] Batch classification error:', error);
      
      // Fallback: classify all uncached as Advertising/Tracking
      uncached.forEach(name => {
        const fallback = {
          category: 'Advertising/Tracking',
          class_id: 3,
          confidence: null,
          ...this.CATEGORIES[3],
          error: true
        };
        this.cache.set(name, fallback);
        results.set(name, fallback);
      });
    }
    
    // Return results in the same order as input
    return cookieNames.map(name => ({
      cookie_name: name,
      ...results.get(name)
    }));
  },
  
  /**
   * Get classification statistics
   * @param {Array<Object>} classifications - Array of classification results
   * @returns {Object} Count by category
   */
  getStatistics(classifications) {
    const stats = {
      'Strictly Necessary': 0,
      'Functionality': 0,
      'Analytics': 0,
      'Advertising/Tracking': 0
    };
    
    classifications.forEach(cls => {
      if (cls && cls.category) {
        stats[cls.category]++;
      }
    });
    
    return stats;
  },
  
  /**
   * Clear the classification cache (useful for testing or updates)
   */
  clearCache() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[CookieClassifier] Cache cleared (${size} entries removed)`);
  },
  
  /**
   * Check API health
   * @returns {Promise<boolean>} True if API is reachable
   */
  async checkHealth() {
    try {
      const response = await fetch('https://aqibtahir-cookie-classifier-api.hf.space/', {
        method: 'GET'
      });
      return response.ok;
    } catch (error) {
      console.error('[CookieClassifier] Health check failed:', error);
      return false;
    }
  }
};

// Export for use in dashboard.js
window.CookieClassifier = CookieClassifier;

console.log('[CookieClassifier] Module loaded ✓');
