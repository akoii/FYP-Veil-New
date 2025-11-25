/**
 * Cookie Classifier Client
 * Connects to the Hugging Face-powered API to classify cookies
 */

class CookieClassifier {
  constructor(apiUrl = 'https://aqibtahir-cookie-classifier-api.hf.space') {
    this.apiUrl = apiUrl;
    this.cache = new Map(); // Cache classifications to avoid redundant API calls
    this.cacheTimeout = 3600000; // 1 hour cache
  }

  /**
   * Classify a single cookie
   * @param {Object} cookie - Cookie object from Chrome API
   * @returns {Promise<Object>} Classification result
   */
  async classifyCookie(cookie) {
    try {
      // Check cache first
      const cacheKey = `${cookie.name}:${cookie.domain}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`[CookieClassifier] Using cached result for ${cookie.name}`);
        return cached.data;
      }

      // Prepare cookie data (exclude sensitive value)
      const cookieData = {
        name: cookie.name,
        domain: cookie.domain,
        path: cookie.path,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        session: !cookie.expirationDate
      };

      const response = await fetch(`${this.apiUrl}/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cookieData)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error('[CookieClassifier] Error classifying cookie:', error);
      
      // Return fallback classification
      return this.fallbackClassification(cookie);
    }
  }

  /**
   * Classify multiple cookies in batch
   * @param {Array} cookies - Array of cookie objects
   * @returns {Promise<Object>} Batch classification results with statistics
   */
  async classifyCookiesBatch(cookies) {
    try {
      console.log(`[CookieClassifier] Classifying ${cookies.length} cookies...`);

      // Prepare cookie data (exclude sensitive values)
      const cookiesData = cookies.map(cookie => ({
        name: cookie.name,
        domain: cookie.domain,
        path: cookie.path,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        session: !cookie.expirationDate
      }));

      const response = await fetch(`${this.apiUrl}/classify-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cookies: cookiesData })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // Cache all results
      result.results.forEach((classification, index) => {
        const cookie = cookies[index];
        const cacheKey = `${cookie.name}:${cookie.domain}`;
        this.cache.set(cacheKey, {
          data: classification,
          timestamp: Date.now()
        });
      });

      console.log('[CookieClassifier] Batch classification complete:', result.statistics);

      return result;

    } catch (error) {
      console.error('[CookieClassifier] Error in batch classification:', error);
      
      // Fallback to individual classifications
      const results = await Promise.all(
        cookies.map(cookie => this.classifyCookie(cookie))
      );

      return {
        results,
        statistics: this.calculateStatistics(results)
      };
    }
  }

  /**
   * Fallback classification using simple rules (when API is unavailable)
   * @param {Object} cookie - Cookie object
   * @returns {Object} Classification result
   */
  fallbackClassification(cookie) {
    const name = cookie.name.toLowerCase();
    const domain = cookie.domain.toLowerCase();

    // Simple rule-based classification
    if (name.includes('session') || name.includes('csrf') || name.includes('auth')) {
      return {
        category: 'necessary',
        confidence: 0.7,
        description: 'Essential for website functionality',
        risk_score: 20,
        classification_method: 'fallback'
      };
    }

    if (name.includes('analytics') || name.includes('_ga') || name.includes('_gid')) {
      return {
        category: 'analytics',
        confidence: 0.7,
        description: 'Used for analyzing user behavior',
        risk_score: 60,
        classification_method: 'fallback'
      };
    }

    if (name.includes('ad') || domain.includes('doubleclick') || domain.includes('facebook')) {
      return {
        category: 'advertising',
        confidence: 0.7,
        description: 'Used for targeted advertising',
        risk_score: 80,
        classification_method: 'fallback'
      };
    }

    // Default
    return {
      category: 'functional',
      confidence: 0.5,
      description: 'Cookie function unclear',
      risk_score: 50,
      classification_method: 'fallback'
    };
  }

  /**
   * Calculate statistics from classification results
   * @param {Array} results - Classification results
   * @returns {Object} Statistics
   */
  calculateStatistics(results) {
    const stats = {
      total_cookies: results.length,
      by_category: {},
      average_risk_score: 0
    };

    let totalRisk = 0;

    results.forEach(result => {
      const category = result.category;
      stats.by_category[category] = (stats.by_category[category] || 0) + 1;
      totalRisk += result.risk_score || 0;
    });

    stats.average_risk_score = results.length > 0 ? totalRisk / results.length : 0;

    return stats;
  }

  /**
   * Get available cookie categories
   * @returns {Promise<Object>} Categories and descriptions
   */
  async getCategories() {
    try {
      const response = await fetch(`${this.apiUrl}/categories`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('[CookieClassifier] Error fetching categories:', error);
      
      // Return default categories
      return {
        categories: {
          necessary: 'Essential for website functionality',
          functional: 'Enhances user experience',
          analytics: 'Used for analyzing user behavior',
          advertising: 'Used for targeted advertising',
          social_media: 'Social media integration',
          performance: 'Website performance optimization'
        }
      };
    }
  }

  /**
   * Check API health status
   * @returns {Promise<boolean>} True if API is healthy
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      console.log('[CookieClassifier] API Health:', data);
      
      return data.status === 'healthy';

    } catch (error) {
      console.error('[CookieClassifier] API health check failed:', error);
      return false;
    }
  }

  /**
   * Clear the classification cache
   */
  clearCache() {
    this.cache.clear();
    console.log('[CookieClassifier] Cache cleared');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CookieClassifier;
}
