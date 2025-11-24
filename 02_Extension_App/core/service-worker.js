// Service Worker - Background Script for Veil Extension
// This handles the background processes, cookie management, and tracking detection

// Import cookie classifier (will be available after script loading)
importScripts('utils/cookie-classifier.js');

// Initialize Cookie Classifier
const cookieClassifier = new CookieClassifier('http://localhost:5000');

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Veil Privacy Extension installed');
  
  // Initialize default settings
  initializeSettings();
  
  // Set up declarative net request rules for blocking
  setupBlockingRules();
  
  // Classify all existing cookies on installation
  classifyAllCookies();
});

// Initialize default extension settings
async function initializeSettings() {
  const defaults = {
    privacyScore: 0,
    cookiesBlocked: 0,
    dnsRequestsBlocked: 0,
    fingerprintingBlocked: 0,
    hardwareAccessBlocked: 0,
    trackingHistory: [],
    lastUpdated: Date.now(),
    cookieClassifications: {},  // Store cookie classifications
    classificationStats: {      // Classification statistics
      total: 0,
      by_category: {},
      average_risk_score: 0
    },
    // Hardware access tracking
    hardwarePermissions: {
      camera: { blocked: true, count: 0 },
      microphone: { blocked: true, count: 0 },
      location: { blocked: true, count: 0 },
      notifications: { blocked: true, count: 0 }
    },
    hardwareActivityLog: []
  };
  
  const stored = await chrome.storage.local.get(Object.keys(defaults));
  const settings = { ...defaults, ...stored };
  
  await chrome.storage.local.set(settings);
}

// Set up blocking rules using declarativeNetRequest
function setupBlockingRules() {
  // Example: Block common tracking domains
  const rules = [
    {
      id: 1,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: '*://doubleclick.net/*',
        resourceTypes: ['script', 'xmlhttprequest', 'image']
      }
    },
    {
      id: 2,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: '*://google-analytics.com/*',
        resourceTypes: ['script', 'xmlhttprequest']
      }
    }
  ];
  
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: rules.map(r => r.id),
    addRules: rules
  });
}

// Listen for web requests to track blocking activity
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // Update statistics when requests are blocked
    updateBlockingStats(details);
  },
  { urls: ['<all_urls>'] },
  ['blocking']
);

// Update blocking statistics
async function updateBlockingStats(details) {
  const stats = await chrome.storage.local.get([
    'cookiesBlocked',
    'dnsRequestsBlocked',
    'fingerprintingBlocked',
    'hardwareAccessBlocked'
  ]);
  
  // Increment appropriate counter based on request type
  if (details.type === 'xmlhttprequest') {
    stats.dnsRequestsBlocked = (stats.dnsRequestsBlocked || 0) + 1;
  }
  
  await chrome.storage.local.set(stats);
  
  // Update privacy score
  calculatePrivacyScore();
}

// Calculate overall privacy score
async function calculatePrivacyScore() {
  const stats = await chrome.storage.local.get([
    'cookiesBlocked',
    'dnsRequestsBlocked',
    'fingerprintingBlocked',
    'hardwareAccessBlocked'
  ]);
  
  // Simple scoring algorithm (can be enhanced with AI model)
  const totalBlocked = 
    (stats.cookiesBlocked || 0) +
    (stats.dnsRequestsBlocked || 0) +
    (stats.fingerprintingBlocked || 0) +
    (stats.hardwareAccessBlocked || 0);
  
  // Score from 0-100 based on blocked items
  const score = Math.min(100, Math.floor(totalBlocked / 1000 * 100));
  
  await chrome.storage.local.set({ privacyScore: score });
}

// Listen for messages from popup or dashboard
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStats') {
    chrome.storage.local.get(null, (data) => {
      sendResponse(data);
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'clearStats') {
    initializeSettings().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'activatePrivacy') {
    // Activate privacy mode
    activatePrivacyMode().then(() => {
      sendResponse({ success: true, message: 'Privacy mode activated' });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  // NEW: Get cookie classifications
  if (request.action === 'getClassifications') {
    chrome.storage.local.get(['cookieClassifications', 'classificationStats'], (data) => {
      sendResponse({
        classifications: data.cookieClassifications || {},
        statistics: data.classificationStats || {}
      });
    });
    return true;
  }
  
  // NEW: Trigger manual cookie classification
  if (request.action === 'classifyCookies') {
    classifyAllCookies().then(() => {
      sendResponse({ success: true, message: 'Cookie classification started' });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  // NEW: Check classifier API health
  if (request.action === 'checkApiHealth') {
    cookieClassifier.checkHealth().then((isHealthy) => {
      sendResponse({ healthy: isHealthy });
    }).catch(() => {
      sendResponse({ healthy: false });
    });
    return true;
  }
});

// Activate privacy mode
async function activatePrivacyMode() {
  console.log('Activating privacy mode...');
  
  try {
    // Increase blocking rules priority
    await setupBlockingRules();
    
    // Update statistics to reflect enhanced protection
    const stats = await chrome.storage.local.get([
      'cookiesBlocked',
      'dnsRequestsBlocked',
      'fingerprintingBlocked',
      'hardwareAccessBlocked',
      'privacyScore'
    ]);
    
    // Set enhanced privacy score
    await chrome.storage.local.set({
      privacyScore: 95,
      privacyModeActive: true,
      lastActivated: Date.now()
    });
    
    console.log('Privacy mode activated successfully');
    return true;
  } catch (error) {
    console.error('Error activating privacy mode:', error);
    throw error;
  }
}

// Periodic privacy score calculation
setInterval(() => {
  calculatePrivacyScore();
}, 60000); // Every minute

// ========================================
// COOKIE CLASSIFICATION FUNCTIONS
// ========================================

/**
 * Classify all cookies in the browser
 * Called on extension installation/startup
 */
async function classifyAllCookies() {
  console.log('[CookieClassifier] Starting cookie classification...');
  
  try {
    // Check if API is available
    const isApiHealthy = await cookieClassifier.checkHealth();
    
    if (!isApiHealthy) {
      console.warn('[CookieClassifier] API is not available, using fallback classification');
    }
    
    // Get all cookies
    const cookies = await chrome.cookies.getAll({});
    console.log(`[CookieClassifier] Found ${cookies.length} cookies to classify`);
    
    if (cookies.length === 0) {
      console.log('[CookieClassifier] No cookies to classify');
      return;
    }
    
    // Classify in batch for efficiency
    const result = await cookieClassifier.classifyCookiesBatch(cookies);
    
    // Store classifications
    const classifications = {};
    result.results.forEach((classification, index) => {
      const cookie = cookies[index];
      const key = `${cookie.name}:${cookie.domain}`;
      classifications[key] = {
        ...classification,
        timestamp: Date.now()
      };
    });
    
    // Save to storage
    await chrome.storage.local.set({
      cookieClassifications: classifications,
      classificationStats: result.statistics,
      lastClassificationUpdate: Date.now()
    });
    
    console.log('[CookieClassifier] Classification complete:', result.statistics);
    
    // Update privacy score based on classifications
    updatePrivacyScoreFromClassifications(result.statistics);
    
  } catch (error) {
    console.error('[CookieClassifier] Error during cookie classification:', error);
  }
}

/**
 * Classify a single new cookie
 * Called when a new cookie is detected
 */
async function classifyNewCookie(cookie) {
  try {
    const classification = await cookieClassifier.classifyCookie(cookie);
    
    // Store classification
    const key = `${cookie.name}:${cookie.domain}`;
    const stored = await chrome.storage.local.get('cookieClassifications');
    const classifications = stored.cookieClassifications || {};
    
    classifications[key] = {
      ...classification,
      timestamp: Date.now()
    };
    
    await chrome.storage.local.set({ cookieClassifications: classifications });
    
    // Update statistics
    await updateClassificationStatistics();
    
    console.log(`[CookieClassifier] Classified new cookie: ${cookie.name} -> ${classification.category}`);
    
    return classification;
    
  } catch (error) {
    console.error('[CookieClassifier] Error classifying new cookie:', error);
    return null;
  }
}

/**
 * Update classification statistics
 */
async function updateClassificationStatistics() {
  try {
    const stored = await chrome.storage.local.get('cookieClassifications');
    const classifications = Object.values(stored.cookieClassifications || {});
    
    const stats = {
      total: classifications.length,
      by_category: {},
      average_risk_score: 0
    };
    
    let totalRisk = 0;
    
    classifications.forEach(classification => {
      const category = classification.category;
      stats.by_category[category] = (stats.by_category[category] || 0) + 1;
      totalRisk += classification.risk_score || 0;
    });
    
    stats.average_risk_score = classifications.length > 0 ? 
      Math.round(totalRisk / classifications.length) : 0;
    
    await chrome.storage.local.set({ classificationStats: stats });
    
  } catch (error) {
    console.error('[CookieClassifier] Error updating statistics:', error);
  }
}

/**
 * Update privacy score based on cookie classifications
 */
function updatePrivacyScoreFromClassifications(stats) {
  try {
    // Calculate score based on cookie risk
    // Lower risk = higher privacy score
    const avgRisk = stats.average_risk_score || 50;
    const privacyScore = Math.max(0, Math.min(100, 100 - avgRisk));
    
    // Weight by number of tracking cookies
    const trackingCookies = 
      (stats.by_category.analytics || 0) + 
      (stats.by_category.advertising || 0) +
      (stats.by_category.social_media || 0);
    
    const totalCookies = stats.total_cookies || 1;
    const trackingRatio = trackingCookies / totalCookies;
    
    // Adjust score based on tracking ratio
    const adjustedScore = Math.round(privacyScore * (1 - trackingRatio * 0.3));
    
    chrome.storage.local.set({ 
      privacyScore: adjustedScore,
      lastScoreUpdate: Date.now()
    });
    
    console.log(`[CookieClassifier] Privacy score updated to ${adjustedScore}`);
    
  } catch (error) {
    console.error('[CookieClassifier] Error updating privacy score:', error);
  }
}

/**
 * Monitor for new cookies being set
 */
chrome.cookies.onChanged.addListener((changeInfo) => {
  if (!changeInfo.removed && changeInfo.cookie) {
    // New cookie detected
    console.log(`[CookieClassifier] New cookie detected: ${changeInfo.cookie.name}`);
    classifyNewCookie(changeInfo.cookie);
  }
});

/**
 * Re-classify all cookies periodically (every 30 minutes)
 */
setInterval(() => {
  console.log('[CookieClassifier] Running periodic cookie re-classification...');
  classifyAllCookies();
}, 1800000); // 30 minutes

/**
 * ============================================
 * Hardware Access Control Functions
 * ============================================
 */

/**
 * Log hardware permission request
 */
async function logHardwareAccess(permissionType, url, action) {
  try {
    const stored = await chrome.storage.local.get(['hardwareActivityLog', 'hardwarePermissions']);
    const log = stored.hardwareActivityLog || [];
    const permissions = stored.hardwarePermissions || {
      camera: { blocked: true, count: 0 },
      microphone: { blocked: true, count: 0 },
      location: { blocked: true, count: 0 },
      notifications: { blocked: true, count: 0 }
    };

    // Add to activity log
    log.unshift({
      type: permissionType,
      url: url,
      action: action,
      timestamp: Date.now()
    });

    // Keep only last 50 entries
    if (log.length > 50) {
      log.pop();
    }

    // Update permission counter
    if (permissions[permissionType]) {
      permissions[permissionType].count++;
    }

    // Update hardware access blocked counter
    let hardwareAccessBlocked = 0;
    Object.values(permissions).forEach(perm => {
      hardwareAccessBlocked += perm.count;
    });

    await chrome.storage.local.set({
      hardwareActivityLog: log,
      hardwarePermissions: permissions,
      hardwareAccessBlocked: hardwareAccessBlocked
    });

    // Update privacy score
    calculatePrivacyScore();

    console.log(`[HardwareControl] ${permissionType} request ${action} for ${url}`);

  } catch (error) {
    console.error('[HardwareControl] Error logging hardware access:', error);
  }
}

/**
 * Toggle hardware permission
 */
async function toggleHardwarePermission(permissionType, shouldBlock) {
  try {
    const stored = await chrome.storage.local.get('hardwarePermissions');
    const permissions = stored.hardwarePermissions || {};

    if (permissions[permissionType]) {
      permissions[permissionType].blocked = shouldBlock;
    }

    await chrome.storage.local.set({ hardwarePermissions: permissions });

    // Apply the setting using content settings API
    const setting = shouldBlock ? 'block' : 'allow';
    
    switch(permissionType) {
      case 'camera':
        await chrome.contentSettings.camera.set({
          primaryPattern: '<all_urls>',
          setting: setting
        });
        break;
      case 'microphone':
        await chrome.contentSettings.microphone.set({
          primaryPattern: '<all_urls>',
          setting: setting
        });
        break;
      case 'location':
        await chrome.contentSettings.location.set({
          primaryPattern: '<all_urls>',
          setting: setting
        });
        break;
      case 'notifications':
        await chrome.contentSettings.notifications.set({
          primaryPattern: '<all_urls>',
          setting: setting
        });
        break;
    }

    console.log(`[HardwareControl] ${permissionType} ${shouldBlock ? 'blocked' : 'allowed'}`);

    return { success: true };

  } catch (error) {
    console.error(`[HardwareControl] Error toggling ${permissionType}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Initialize hardware permissions on install
 */
async function initializeHardwarePermissions() {
  try {
    const stored = await chrome.storage.local.get('hardwarePermissions');
    const permissions = stored.hardwarePermissions || {
      camera: { blocked: true, count: 0 },
      microphone: { blocked: true, count: 0 },
      location: { blocked: true, count: 0 },
      notifications: { blocked: true, count: 0 }
    };

    // Apply all blocked permissions
    for (const [type, config] of Object.entries(permissions)) {
      if (config.blocked) {
        await toggleHardwarePermission(type, true);
      }
    }

    console.log('[HardwareControl] Hardware permissions initialized');

  } catch (error) {
    console.error('[HardwareControl] Error initializing hardware permissions:', error);
  }
}

/**
 * Monitor content settings changes
 */
chrome.contentSettings.camera.onChange.addListener((details) => {
  if (details.setting === 'ask') {
    logHardwareAccess('camera', details.primaryPattern, 'requested');
  }
});

chrome.contentSettings.microphone.onChange.addListener((details) => {
  if (details.setting === 'ask') {
    logHardwareAccess('microphone', details.primaryPattern, 'requested');
  }
});

chrome.contentSettings.location.onChange.addListener((details) => {
  if (details.setting === 'ask') {
    logHardwareAccess('location', details.primaryPattern, 'requested');
  }
});

chrome.contentSettings.notifications.onChange.addListener((details) => {
  if (details.setting === 'ask') {
    logHardwareAccess('notifications', details.primaryPattern, 'requested');
  }
});

// Add hardware permission message handlers
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleHardwarePermission') {
    toggleHardwarePermission(request.permissionType, request.shouldBlock).then(result => {
      sendResponse(result);
    });
    return true;
  }

  if (request.action === 'getHardwareStats') {
    chrome.storage.local.get(['hardwarePermissions', 'hardwareActivityLog'], (data) => {
      sendResponse({
        permissions: data.hardwarePermissions || {},
        activityLog: data.hardwareActivityLog || []
      });
    });
    return true;
  }

  if (request.action === 'clearHardwareLog') {
    chrome.storage.local.set({ hardwareActivityLog: [] }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Initialize hardware permissions on extension install
chrome.runtime.onInstalled.addListener(() => {
  initializeHardwarePermissions();
});

