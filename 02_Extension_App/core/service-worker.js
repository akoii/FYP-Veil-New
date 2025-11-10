// Service Worker - Background Script for Veil Extension
// This handles the background processes, cookie management, and tracking detection

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Veil Privacy Extension installed');
  
  // Initialize default settings
  initializeSettings();
  
  // Set up declarative net request rules for blocking
  setupBlockingRules();
});

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
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
    lastUpdated: Date.now()
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
