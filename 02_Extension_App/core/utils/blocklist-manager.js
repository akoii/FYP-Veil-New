// Blocklist Manager - Handles uBlock Origin/EasyPrivacy lists
// Manages tracking domain lists and dynamically generates blocking rules

/**
 * Blocklist sources - Popular privacy filter lists
 */
const BLOCKLIST_SOURCES = {
  easyPrivacy: 'https://easylist.to/easylist/easyprivacy.txt',
  easyList: 'https://easylist.to/easylist/easylist.txt',
  fanboy: 'https://secure.fanboy.co.nz/fanboy-annoyance.txt',
  // Add more sources as needed
};

/**
 * In-memory cache of blocklists
 */
let blocklistCache = {
  domains: new Set(),
  patterns: [],
  lastUpdated: null
};

/**
 * Fetch and parse a blocklist from a URL
 */
export async function fetchBlocklist(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    return parseBlocklist(text);
  } catch (error) {
    console.error(`Error fetching blocklist from ${url}:`, error);
    return { domains: [], patterns: [] };
  }
}

/**
 * Parse blocklist text format (Adblock Plus format)
 */
function parseBlocklist(text) {
  const lines = text.split('\n');
  const domains = [];
  const patterns = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('!') || trimmed.startsWith('[')) {
      continue;
    }
    
    // Parse domain-based rules
    if (trimmed.startsWith('||') && trimmed.includes('^')) {
      const domain = trimmed.replace('||', '').replace('^', '').split('/')[0];
      if (domain && !domain.includes('*')) {
        domains.push(domain);
      }
    }
    
    // Parse pattern-based rules
    if (trimmed.includes('*') || trimmed.includes('?')) {
      patterns.push(trimmed);
    }
  }
  
  return { domains, patterns };
}

/**
 * Load all blocklists and update cache
 */
export async function loadBlocklists() {
  console.log('Loading blocklists...');
  
  const allDomains = new Set();
  const allPatterns = [];
  
  // Fetch all blocklists in parallel
  const promises = Object.values(BLOCKLIST_SOURCES).map(url => fetchBlocklist(url));
  const results = await Promise.all(promises);
  
  // Combine all results
  for (const result of results) {
    result.domains.forEach(domain => allDomains.add(domain));
    allPatterns.push(...result.patterns);
  }
  
  // Update cache
  blocklistCache = {
    domains: allDomains,
    patterns: allPatterns,
    lastUpdated: Date.now()
  };
  
  console.log(`Loaded ${allDomains.size} domains and ${allPatterns.length} patterns`);
  
  // Store in chrome.storage for persistence
  await chrome.storage.local.set({
    blocklist: {
      domains: Array.from(allDomains),
      patterns: allPatterns,
      lastUpdated: blocklistCache.lastUpdated
    }
  });
  
  return blocklistCache;
}

/**
 * Check if a URL should be blocked
 */
export function shouldBlockURL(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Check exact domain match
    if (blocklistCache.domains.has(hostname)) {
      return true;
    }
    
    // Check parent domains
    const parts = hostname.split('.');
    for (let i = 0; i < parts.length - 1; i++) {
      const parentDomain = parts.slice(i).join('.');
      if (blocklistCache.domains.has(parentDomain)) {
        return true;
      }
    }
    
    // Check pattern matches (more expensive, so do last)
    for (const pattern of blocklistCache.patterns) {
      if (matchPattern(url, pattern)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking URL:', error);
    return false;
  }
}

/**
 * Match URL against a pattern (simplified Adblock Plus pattern matching)
 */
function matchPattern(url, pattern) {
  // Remove filter options
  const [mainPattern] = pattern.split('$');
  
  // Convert Adblock pattern to regex
  let regexPattern = mainPattern
    .replace(/\|\|/g, '^https?://([^/]+\\.)?')
    .replace(/\^/g, '[^a-zA-Z0-9._%-]')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '\\?');
  
  try {
    const regex = new RegExp(regexPattern);
    return regex.test(url);
  } catch (error) {
    return false;
  }
}

/**
 * Generate declarativeNetRequest rules from blocklist
 */
export function generateBlockingRules(maxRules = 5000) {
  const rules = [];
  let ruleId = 1;
  
  // Convert domain list to rules (limited by maxRules)
  const domainsArray = Array.from(blocklistCache.domains).slice(0, maxRules);
  
  for (const domain of domainsArray) {
    rules.push({
      id: ruleId++,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: `*://${domain}/*`,
        resourceTypes: [
          'script',
          'xmlhttprequest',
          'image',
          'sub_frame',
          'stylesheet'
        ]
      }
    });
    
    if (ruleId > maxRules) break;
  }
  
  return rules;
}

/**
 * Apply blocking rules to Chrome declarativeNetRequest
 */
export async function applyBlockingRules() {
  const rules = generateBlockingRules();
  
  try {
    // Get current rule IDs
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingIds = existingRules.map(rule => rule.id);
    
    // Update rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingIds,
      addRules: rules
    });
    
    console.log(`Applied ${rules.length} blocking rules`);
    return true;
  } catch (error) {
    console.error('Error applying blocking rules:', error);
    return false;
  }
}

/**
 * Initialize blocklist manager
 */
export async function initializeBlocklistManager() {
  // Load from cache first
  const stored = await chrome.storage.local.get('blocklist');
  
  if (stored.blocklist) {
    blocklistCache = {
      domains: new Set(stored.blocklist.domains),
      patterns: stored.blocklist.patterns,
      lastUpdated: stored.blocklist.lastUpdated
    };
    console.log('Loaded blocklist from cache');
  }
  
  // Update if cache is old (older than 24 hours)
  const needsUpdate = !blocklistCache.lastUpdated || 
                      (Date.now() - blocklistCache.lastUpdated) > 24 * 60 * 60 * 1000;
  
  if (needsUpdate) {
    await loadBlocklists();
    await applyBlockingRules();
  }
}

/**
 * Get blocklist statistics
 */
export function getBlocklistStats() {
  return {
    totalDomains: blocklistCache.domains.size,
    totalPatterns: blocklistCache.patterns.length,
    lastUpdated: blocklistCache.lastUpdated
  };
}
