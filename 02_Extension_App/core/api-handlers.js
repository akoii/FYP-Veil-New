// API Handlers - Wrapper functions for Chrome Extension APIs
// Provides clean interfaces for cookie management, content settings, and privacy controls

/**
 * Cookie Management Functions
 */

// Get all cookies for a specific domain
export async function getCookiesForDomain(domain) {
  try {
    const cookies = await chrome.cookies.getAll({ domain });
    return cookies;
  } catch (error) {
    console.error('Error fetching cookies:', error);
    return [];
  }
}

// Remove a specific cookie
export async function removeCookie(cookie) {
  try {
    const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
    await chrome.cookies.remove({
      url: url,
      name: cookie.name,
      storeId: cookie.storeId
    });
    return true;
  } catch (error) {
    console.error('Error removing cookie:', error);
    return false;
  }
}

// Block all third-party cookies
export async function blockThirdPartyCookies() {
  try {
    await chrome.contentSettings.cookies.set({
      primaryPattern: '<all_urls>',
      secondaryPattern: '<all_urls>',
      setting: 'block'
    });
    return true;
  } catch (error) {
    console.error('Error blocking third-party cookies:', error);
    return false;
  }
}

/**
 * Content Settings Functions
 */

// Block JavaScript on specific domains
export async function blockJavaScriptOnDomain(domain) {
  try {
    await chrome.contentSettings.javascript.set({
      primaryPattern: `*://${domain}/*`,
      setting: 'block'
    });
    return true;
  } catch (error) {
    console.error('Error blocking JavaScript:', error);
    return false;
  }
}

// Block notifications
export async function blockNotifications() {
  try {
    await chrome.contentSettings.notifications.set({
      primaryPattern: '<all_urls>',
      setting: 'block'
    });
    return true;
  } catch (error) {
    console.error('Error blocking notifications:', error);
    return false;
  }
}

// Block location access
export async function blockLocation() {
  try {
    await chrome.contentSettings.location.set({
      primaryPattern: '<all_urls>',
      setting: 'block'
    });
    return true;
  } catch (error) {
    console.error('Error blocking location:', error);
    return false;
  }
}

// Block camera access
export async function blockCamera() {
  try {
    await chrome.contentSettings.camera.set({
      primaryPattern: '<all_urls>',
      setting: 'block'
    });
    return true;
  } catch (error) {
    console.error('Error blocking camera:', error);
    return false;
  }
}

// Block microphone access
export async function blockMicrophone() {
  try {
    await chrome.contentSettings.microphone.set({
      primaryPattern: '<all_urls>',
      setting: 'block'
    });
    return true;
  } catch (error) {
    console.error('Error blocking microphone:', error);
    return false;
  }
}

/**
 * Privacy Settings Functions
 */

// Enable Do Not Track
export async function enableDoNotTrack() {
  try {
    await chrome.privacy.websites.doNotTrackEnabled.set({ value: true });
    return true;
  } catch (error) {
    console.error('Error enabling Do Not Track:', error);
    return false;
  }
}

// Disable WebRTC (prevents IP leaks)
export async function disableWebRTC() {
  try {
    await chrome.privacy.network.webRTCIPHandlingPolicy.set({
      value: 'disable_non_proxied_udp'
    });
    return true;
  } catch (error) {
    console.error('Error disabling WebRTC:', error);
    return false;
  }
}

/**
 * Tab and Request Management
 */

// Get active tab information
export async function getActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  } catch (error) {
    console.error('Error getting active tab:', error);
    return null;
  }
}

// Get all cookies for the active tab
export async function getCookiesForActiveTab() {
  try {
    const tab = await getActiveTab();
    if (!tab || !tab.url) return [];
    
    const url = new URL(tab.url);
    const cookies = await chrome.cookies.getAll({ domain: url.hostname });
    return cookies;
  } catch (error) {
    console.error('Error getting cookies for active tab:', error);
    return [];
  }
}

/**
 * Storage Management
 */

// Save extension settings
export async function saveSettings(settings) {
  try {
    await chrome.storage.local.set(settings);
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

// Load extension settings
export async function loadSettings(keys = null) {
  try {
    const settings = await chrome.storage.local.get(keys);
    return settings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return {};
  }
}

// Clear all extension data
export async function clearAllData() {
  try {
    await chrome.storage.local.clear();
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
}
