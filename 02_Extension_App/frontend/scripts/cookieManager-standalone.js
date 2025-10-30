// Mock Cookie Manager for Standalone Dashboard
// This replaces Chrome extension API calls with demo data

const CookieManager = {
  // Mock demo cookies (common real-world examples)
  mockCookies: [
    { name: '_ga', domain: '.google.com', path: '/', value: 'GA1.1.123456789.1234567890', httpOnly: false, secure: true, sameSite: 'lax', session: false, expires: 'Dec 31, 2025', size: 45, hostOnly: false, partitioned: false },
    { name: '_gid', domain: '.google.com', path: '/', value: 'GA1.1.987654321.0987654321', httpOnly: false, secure: true, sameSite: 'lax', session: false, expires: 'Nov 1, 2025', size: 45, hostOnly: false, partitioned: false },
    { name: '_gat', domain: '.google.com', path: '/', value: '1', httpOnly: false, secure: true, sameSite: 'lax', session: true, expires: 'Session', size: 20, hostOnly: false, partitioned: false },
    { name: 'NID', domain: '.google.com', path: '/', value: '511=abc123def456', httpOnly: true, secure: true, sameSite: 'none', session: false, expires: 'May 1, 2026', size: 50, hostOnly: false, partitioned: false },
    { name: '_fbp', domain: '.facebook.com', path: '/', value: 'fb.1.1234567890123.1234567890', httpOnly: false, secure: true, sameSite: 'lax', session: false, expires: 'Jan 28, 2026', size: 60, hostOnly: false, partitioned: false },
    { name: '_fbc', domain: '.facebook.com', path: '/', value: 'fb.1.1234567890123.AbCdEfGh', httpOnly: false, secure: true, sameSite: 'lax', session: false, expires: 'Jan 28, 2026', size: 55, hostOnly: false, partitioned: false },
    { name: 'fr', domain: '.facebook.com', path: '/', value: '0abcdefghijklmno.ABCDEFG.Hij.Klm.Nop', httpOnly: true, secure: true, sameSite: 'none', session: false, expires: 'Jan 28, 2026', size: 70, hostOnly: false, partitioned: false },
    { name: 'sessionid', domain: 'example.com', path: '/', value: 'abc123def456ghi789jkl', httpOnly: true, secure: true, sameSite: 'strict', session: true, expires: 'Session', size: 45, hostOnly: true, partitioned: false },
    { name: 'csrftoken', domain: 'example.com', path: '/', value: 'abc123def456ghi789jklmno', httpOnly: true, secure: true, sameSite: 'strict', session: false, expires: 'Nov 1, 2026', size: 50, hostOnly: true, partitioned: false },
    { name: 'PHPSESSID', domain: 'example.com', path: '/', value: 'abcdef123456', httpOnly: true, secure: true, sameSite: 'lax', session: true, expires: 'Session', size: 32, hostOnly: true, partitioned: false },
    { name: 'auth_token', domain: 'example.com', path: '/', value: 'Bearer_abc123def456', httpOnly: true, secure: true, sameSite: 'strict', session: false, expires: 'Dec 1, 2025', size: 40, hostOnly: true, partitioned: false },
    { name: 'user_preferences', domain: 'example.com', path: '/', value: 'theme=dark&lang=en', httpOnly: false, secure: false, sameSite: 'lax', session: false, expires: 'Dec 31, 2026', size: 35, hostOnly: true, partitioned: false },
    { name: 'language', domain: 'example.com', path: '/', value: 'en-US', httpOnly: false, secure: false, sameSite: 'lax', session: false, expires: 'Dec 31, 2026', size: 15, hostOnly: true, partitioned: false },
    { name: 'theme', domain: 'example.com', path: '/', value: 'dark', httpOnly: false, secure: false, sameSite: 'lax', session: false, expires: 'Dec 31, 2026', size: 12, hostOnly: true, partitioned: false },
    { name: 'utm_source', domain: 'example.com', path: '/', value: 'google', httpOnly: false, secure: false, sameSite: 'lax', session: false, expires: 'Nov 10, 2025', size: 18, hostOnly: false, partitioned: false },
    { name: 'utm_campaign', domain: 'example.com', path: '/', value: 'summer_sale_2025', httpOnly: false, secure: false, sameSite: 'lax', session: false, expires: 'Nov 10, 2025', size: 30, hostOnly: false, partitioned: false },
    { name: 'utm_medium', domain: 'example.com', path: '/', value: 'cpc', httpOnly: false, secure: false, sameSite: 'lax', session: false, expires: 'Nov 10, 2025', size: 15, hostOnly: false, partitioned: false },
    { name: '_hjid', domain: '.hotjar.com', path: '/', value: 'abc123-def4-56gh-ijkl-mnop789qrstu', httpOnly: false, secure: true, sameSite: 'lax', session: false, expires: 'Oct 30, 2026', size: 60, hostOnly: false, partitioned: false },
    { name: '__cfduid', domain: '.cloudflare.com', path: '/', value: 'd1234567890abcdef1234567890abcd', httpOnly: true, secure: true, sameSite: 'none', session: false, expires: 'Nov 29, 2025', size: 55, hostOnly: false, partitioned: false },
    { name: 'IDE', domain: '.doubleclick.net', path: '/', value: 'AHWqTUlAbC123dEf', httpOnly: true, secure: true, sameSite: 'none', session: false, expires: 'Nov 30, 2026', size: 40, hostOnly: false, partitioned: false },
    { name: 'test_cookie', domain: '.doubleclick.net', path: '/', value: 'CheckForPermission', httpOnly: false, secure: false, sameSite: 'unspecified', session: true, expires: 'Session', size: 30, hostOnly: false, partitioned: false },
    { name: '_hjIncludedInSample', domain: '.hotjar.com', path: '/', value: '1', httpOnly: false, secure: true, sameSite: 'lax', session: true, expires: 'Session', size: 8, hostOnly: false, partitioned: false },
    { name: '__gads', domain: '.google.com', path: '/', value: 'ID=abc123def456:T=1234567890:S=ALNI_xyz', httpOnly: false, secure: true, sameSite: 'unspecified', session: false, expires: 'Oct 30, 2026', size: 60, hostOnly: false, partitioned: false },
    { name: '_gcl_au', domain: '.example.com', path: '/', value: '1.1.123456789.1234567890', httpOnly: false, secure: false, sameSite: 'lax', session: false, expires: 'Jan 28, 2026', size: 45, hostOnly: false, partitioned: false },
    { name: 'remember_me', domain: 'example.com', path: '/', value: 'yes', httpOnly: false, secure: true, sameSite: 'strict', session: false, expires: 'Dec 31, 2025', size: 15, hostOnly: true, partitioned: false },
  ],

  /**
   * Fetch all cookies (returns mock data in standalone mode)
   * @returns {Promise<Array>} Array of cookie objects
   */
  async fetchAllCookies() {
    console.log('[MockCookieManager] Returning mock cookies for standalone demo');
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.mockCookies.map(this.formatCookie);
  },

  /**
   * Fetch cookies for a specific URL (returns mock data)
   * @param {string} url - Target URL (ignored in mock)
   * @returns {Promise<Array>} Filtered cookie array
   */
  async fetchCookiesForUrl(url) {
    console.log('[MockCookieManager] Returning mock cookies for URL:', url);
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.mockCookies.map(this.formatCookie);
  },

  /**
   * Get active tab URL (returns mock URL)
   * @returns {Promise<string>} Active tab URL
   */
  async getActiveTabUrl() {
    console.log('[MockCookieManager] Returning mock active tab URL');
    return 'https://example.com';
  },

  /**
   * Format cookie object for display (same as original)
   * @param {Object} cookie - Raw cookie object
   * @returns {Object} Formatted cookie
   */
  formatCookie(cookie) {
    return {
      name: cookie.name || 'Unknown',
      domain: cookie.domain || 'Unknown',
      path: cookie.path || '/',
      value: cookie.value || '',
      httpOnly: cookie.httpOnly || false,
      secure: cookie.secure || false,
      sameSite: cookie.sameSite || 'unspecified',
      session: cookie.session || false,
      expires: cookie.expires || 'Session',
      expirationDate: cookie.expirationDate,
      size: cookie.size || 0,
      partitioned: cookie.partitioned || false,
      partitionKey: cookie.partitionKey || null,
      hostOnly: cookie.hostOnly || false,
      storeId: cookie.storeId || 'default'
    };
  },

  /**
   * Filter cookies by search term
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
  }
};

// Export for use in dashboard.js
window.CookieManager = CookieManager;

console.log('[MockCookieManager] Standalone mode - Using mock cookie data (25 cookies) ✓');
