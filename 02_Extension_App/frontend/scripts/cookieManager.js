// cookieManager.js - Cookie retrieval and formatting utilities
// NO COOKIE VALUES ARE LOGGED TO CONSOLE

const CookieManager = {
  /**
   * Fetch all cookies the extension has access to
   * @returns {Promise<Array>} Array of cookie objects
   */
  async fetchAllCookies() {
    try {
      const cookies = await chrome.cookies.getAll({});
      return cookies.map(this.formatCookie);
    } catch (error) {
      console.error('[CookieManager] Error fetching cookies:', error.message);
      throw error;
    }
  },

  /**
   * Fetch cookies for a specific URL (active tab filter)
   * @param {string} url - Target URL
   * @returns {Promise<Array>} Filtered cookie array
   */
  async fetchCookiesForUrl(url) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Get cookies matching this domain and parent domains
      const cookies = await chrome.cookies.getAll({ domain });
      
      // Also check for cookies on parent domains (e.g., .example.com)
      const parts = domain.split('.');
      const parentDomains = [];
      for (let i = 0; i < parts.length - 1; i++) {
        parentDomains.push('.' + parts.slice(i).join('.'));
      }
      
      const parentCookies = await Promise.all(
        parentDomains.map(d => chrome.cookies.getAll({ domain: d }))
      );
      
      const allCookies = [...cookies, ...parentCookies.flat()];
      
      // Deduplicate by name+domain
      const uniqueCookies = Array.from(
        new Map(allCookies.map(c => [`${c.name}:${c.domain}`, c])).values()
      );
      
      return uniqueCookies.map(this.formatCookie);
    } catch (error) {
      console.error('[CookieManager] Error fetching cookies for URL:', error.message);
      throw error;
    }
  },

  /**
   * Get active tab URL
   * @returns {Promise<string|null>} Active tab URL or null
   */
  async getActiveTabUrl() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab?.url || null;
    } catch (error) {
      console.error('[CookieManager] Error getting active tab:', error.message);
      return null;
    }
  },

  /**
   * Format cookie object for display
   * @param {Object} cookie - Raw chrome.cookies object
   * @returns {Object} Formatted cookie
   */
  formatCookie(cookie) {
    return {
      name: cookie.name || 'Unknown',
      domain: cookie.domain || 'Unknown',
      path: cookie.path || '/',
      value: cookie.value || '', // NEVER log this
      httpOnly: cookie.httpOnly || false,
      secure: cookie.secure || false,
      sameSite: cookie.sameSite || 'unspecified',
      session: !cookie.expirationDate,
      expires: cookie.expirationDate 
        ? new Date(cookie.expirationDate * 1000).toLocaleString()
        : 'Session',
      expirationDate: cookie.expirationDate,
      size: cookie.value ? new Blob([cookie.value]).size : 0,
      partitioned: cookie.partitionKey ? true : false,
      partitionKey: cookie.partitionKey || null,
      hostOnly: cookie.hostOnly || false,
      storeId: cookie.storeId || 'default'
    };
  },

  /**
   * Filter cookies by search term (name or domain)
   * @param {Array} cookies - Cookie array
   * @param {string} searchTerm - Search query
   * @returns {Array} Filtered cookies
   */
  filterCookies(cookies, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') return cookies;
    
    const term = searchTerm.toLowerCase().trim();
    return cookies.filter(cookie => 
      cookie.name.toLowerCase().includes(term) ||
      cookie.domain.toLowerCase().includes(term)
    );
  },

  /**
   * Group cookies by domain
   * @param {Array} cookies - Cookie array
   * @returns {Object} Cookies grouped by domain
   */
  groupByDomain(cookies) {
    return cookies.reduce((acc, cookie) => {
      const domain = cookie.domain;
      if (!acc[domain]) acc[domain] = [];
      acc[domain].push(cookie);
      return acc;
    }, {});
  },

  // 🆕 Block/Unblock Methods
  async blockCookie(cookie) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'blockCookie', cookie }, resolve);
    });
  },

  async unblockCookie(cookie) {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'unblockCookie', cookie }, resolve);
    });
  },

  async getBlockedCookies() {
    return new Promise(resolve => {
      chrome.runtime.sendMessage({ action: 'getBlockedCookies' }, resolve);
    });
  },

  async deleteCookie(cookie) {
    const protocol = cookie.secure ? 'https:' : 'http:';
    const url = `${protocol}//${cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain}${cookie.path}`;
    await chrome.cookies.remove({ url: url, name: cookie.name });
  }
};

// Export for use in dashboard.js
window.CookieManager = CookieManager;
