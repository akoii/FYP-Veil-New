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
  
  // Rate limiting configuration for optimized batch API
  MAX_BATCH_SIZE: 50,        // Reduced batch size to avoid throttling
  MAX_CONCURRENT: 5,         // Reduced concurrent requests to prevent throttling
  DELAY_BETWEEN_BATCHES: 1000, // 1 second delay between batches to respect rate limits
  MAX_RETRIES: 3,            // Maximum retry attempts for failed requests
  RETRY_DELAY: 2000,         // 2 seconds delay before retry
  
  // Rate limiting tracking
  lastRequestTime: 0,
  requestQueue: [],
  isProcessing: false,
  
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
   * Classify a single cookie using the API with rate limiting and retries
   * @param {string} cookieName - The cookie name to classify
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<Object>} Classification result with category, class_id, confidence, and UI colors
   */
  async classifyCookie(cookieName, retryCount = 0) {
    // Check cache first
    if (this.cache.has(cookieName)) {
      console.log(`[CookieClassifier] Cache hit for: ${cookieName}`);
      return this.cache.get(cookieName);
    }
    
    // Rate limiting: ensure minimum delay between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minDelay = 200; // 200ms minimum between requests
    
    if (timeSinceLastRequest < minDelay) {
      await this.sleep(minDelay - timeSinceLastRequest);
    }
    
    try {
      console.log(`[CookieClassifier] Classifying: ${cookieName}`);
      this.lastRequestTime = Date.now();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ cookie_name: cookieName }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Check if it's a rate limit error (429)
        if (response.status === 429 && retryCount < this.MAX_RETRIES) {
          console.warn(`[CookieClassifier] Rate limited, retrying in ${this.RETRY_DELAY}ms (attempt ${retryCount + 1}/${this.MAX_RETRIES})`);
          await this.sleep(this.RETRY_DELAY);
          return this.classifyCookie(cookieName, retryCount + 1);
        }
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
      
      // Retry on network errors
      if (error.name === 'AbortError' || error.message.includes('fetch')) {
        if (retryCount < this.MAX_RETRIES) {
          console.warn(`[CookieClassifier] Network error, retrying (attempt ${retryCount + 1}/${this.MAX_RETRIES})`);
          await this.sleep(this.RETRY_DELAY);
          return this.classifyCookie(cookieName, retryCount + 1);
        }
      }
      
      // Return null - don't classify if API fails
      // This cookie will be filtered out and not displayed
      const failed = {
        category: null,
        class_id: null,
        confidence: null,
        error: true
      };
      
      this.cache.set(cookieName, failed);
      return failed;
    }
  },
  
  /**
   * Helper: Sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Helper: Process a batch using optimized batch API endpoint with rate limiting
   */
  async processBatch(batch, retryCount = 0) {
    try {
      // Add delay to respect rate limits
      if (this.lastRequestTime > 0) {
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        if (timeSinceLastRequest < this.DELAY_BETWEEN_BATCHES) {
          await this.sleep(this.DELAY_BETWEEN_BATCHES - timeSinceLastRequest);
        }
      }
      
      this.lastRequestTime = Date.now();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for batch
      
      // Use optimized batch endpoint
      const response = await fetch(this.API_URL_BATCH, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ cookie_names: batch }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Check if it's a rate limit error (429)
        if (response.status === 429 && retryCount < this.MAX_RETRIES) {
          console.warn(`[CookieClassifier] Batch rate limited, retrying in ${this.RETRY_DELAY * 2}ms (attempt ${retryCount + 1}/${this.MAX_RETRIES})`);
          await this.sleep(this.RETRY_DELAY * 2); // Double delay for batch retries
          return this.processBatch(batch, retryCount + 1);
        }
        throw new Error(`Batch API returned ${response.status}`);
      }
      
      const data = await response.json();
      return data.predictions || data;
      
    } catch (error) {
      console.warn(`[CookieClassifier] Batch API failed:`, error.message);
      
      // Retry on network errors
      if ((error.name === 'AbortError' || error.message.includes('fetch')) && retryCount < this.MAX_RETRIES) {
        console.warn(`[CookieClassifier] Network error, retrying batch (attempt ${retryCount + 1}/${this.MAX_RETRIES})`);
        await this.sleep(this.RETRY_DELAY * 2);
        return this.processBatch(batch, retryCount + 1);
      }
      
      console.warn(`[CookieClassifier] Using individual fallback with rate limiting`);
      
      // Fallback: Process individually with strict rate limiting
      const results = [];
      for (let i = 0; i < batch.length; i += this.MAX_CONCURRENT) {
        const chunk = batch.slice(i, i + this.MAX_CONCURRENT);
        
        // Add delay between chunks
        if (i > 0) {
          await this.sleep(this.DELAY_BETWEEN_BATCHES);
        }
        
        const chunkResults = await Promise.all(
          chunk.map(async (cookieName, index) => {
            // Stagger requests within chunk
            if (index > 0) {
              await this.sleep(200); // 200ms between individual requests
            }
            
            try {
              const res = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: JSON.stringify({ cookie_name: cookieName })
              });
              
              if (!res.ok) {
                if (res.status === 429) {
                  console.warn(`[CookieClassifier] Rate limited on ${cookieName}, backing off`);
                  await this.sleep(2000);
                }
                throw new Error(`API returned ${res.status}`);
              }
              return await res.json();
            } catch (err) {
              console.warn(`[CookieClassifier] Failed to classify ${cookieName}:`, err.message);
              return {
                cookie_name: cookieName,
                category: null,
                class_id: null,
                confidence: null,
                error: true
              };
            }
          })
        );
        results.push(...chunkResults);
      }
      
      return results;
    }
  },

  /**
   * Classify multiple cookies with smart batching and rate limiting
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
      // Split uncached cookies into manageable batches
      const batches = [];
      for (let i = 0; i < uncached.length; i += this.MAX_BATCH_SIZE) {
        batches.push(uncached.slice(i, i + this.MAX_BATCH_SIZE));
      }
      
      console.log(`[CookieClassifier] Processing ${uncached.length} cookies in ${batches.length} batch(es) with rate limiting...`);
      
      // Process batches sequentially to avoid overwhelming the API
      let processedCount = 0;
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`[CookieClassifier] Processing batch ${i + 1}/${batches.length} (${batch.length} cookies)...`);
        
        // Add delay between batches (except for first batch)
        if (i > 0 && this.DELAY_BETWEEN_BATCHES > 0) {
          await this.sleep(this.DELAY_BETWEEN_BATCHES);
        }
        
        const predictions = await this.processBatch(batch);
        
        // Process results from this batch
        predictions.forEach(pred => {
          if (pred.class_id !== null && pred.class_id !== undefined) {
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
            processedCount++;
          } else {
            // Mark as failed
            const failed = {
              category: null,
              class_id: null,
              confidence: null,
              error: true
            };
            this.cache.set(pred.cookie_name, failed);
            results.set(pred.cookie_name, failed);
          }
        });
        
        console.log(`[CookieClassifier] ✓ Batch ${i + 1}/${batches.length} complete: ${processedCount}/${uncached.length} total`);
      }
      
      console.log(`[CookieClassifier] ✅ All batches complete: ${processedCount}/${uncached.length} cookies classified successfully`);
      
    } catch (error) {
      console.error('[CookieClassifier] Batch classification error:', error);
      
      // Mark all uncached cookies as failed (will be filtered out)
      uncached.forEach(name => {
        if (!results.has(name)) {
          const failed = {
            category: null,
            class_id: null,
            confidence: null,
            error: true
          };
          this.cache.set(name, failed);
          results.set(name, failed);
        }
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
