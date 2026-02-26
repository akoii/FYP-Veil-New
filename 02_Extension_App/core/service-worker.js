// Service Worker - Background Script for Veil Extension
// This handles the background processes, cookie management, tracking detection,
// fingerprint correlation (CLAM), DNS security, and traffic shaping.

// ============================
// Module Imports
// ============================
import { initCNAMEUncloaker, uncloakHostname, isSuspiciousSubdomain } from './cname-uncloaker.js';
import { startNoiseGenerator, stopNoiseGenerator, handleChaffAlarm, recordDNSEvent, isNoiseGeneratorActive } from './noise-generator.js';
import { isDGA, extractSubdomainLabels } from './utils/dga-detector.js';
import { getSessionSeed } from './utils/session-prng.js';

// ============================
// Structured Logger (Phase 9)
// Set VEIL_DEBUG = true locally to see verbose logs.
// In production, only warn + error are emitted.
// ============================
const VEIL_DEBUG = false;

const veilLog = {
    /** Debug-only info log — suppressed in production */
    debug: (...args) => { if (VEIL_DEBUG) console.debug('[Veil]', ...args); },
    /** Informational log — suppressed in production */
    info:  (...args) => { if (VEIL_DEBUG) console.log('[Veil]', ...args); },
    /** Always-visible warning */
    warn:  (...args) => console.warn('[Veil]', ...args),
    /** Always-visible error */
    error: (...args) => console.error('[Veil]', ...args),
};

// ============================
// Global Error Handlers (Phase 6)
// ============================
self.onerror = (message, source, lineno, colno, error) => {
    console.error('[Veil SW] Uncaught error:', { message, source, lineno, colno, error: error?.toString() });
};

self.addEventListener('unhandledrejection', (event) => {
    console.error('[Veil SW] Unhandled promise rejection:', event.reason);
    event.preventDefault();
});

// ============================
// CLAM Correlation Graph (FP-8)
// ============================
// Map<scriptUrl, { events: [{api, entropy, timestamp}], tagged: boolean }>
const correlationGraph = new Map();
const CORRELATION_WINDOW_MS = 2000; // 2 seconds temporal window
const CORRELATION_PRUNE_MS = 30000; // 30 seconds max age
const CLAM_DNR_RULE_ID_START = 1000;
const CLAM_DNR_RULE_ID_END = 1999;
const DNS_DNR_RULE_ID_START = 2000;
const DNS_DNR_RULE_ID_END = 2999;
let nextClamRuleId = CLAM_DNR_RULE_ID_START;
let nextDnsRuleId = DNS_DNR_RULE_ID_START;

// Restore correlation graph from session storage on SW restart
chrome.storage.session.get(['veil_clam_graph', 'veil_clam_rule_id', 'veil_dns_rule_id'], (stored) => {
    if (stored.veil_clam_graph) {
        const entries = JSON.parse(stored.veil_clam_graph);
        for (const [key, value] of entries) {
            correlationGraph.set(key, value);
        }
        veilLog.info(`[CLAM] Restored correlation graph: ${correlationGraph.size} entries`);
    }
    if (stored.veil_clam_rule_id) nextClamRuleId = stored.veil_clam_rule_id;
    if (stored.veil_dns_rule_id) nextDnsRuleId = stored.veil_dns_rule_id;
});

/** Persist the correlation graph to session storage */
function persistCorrelationGraph() {
    const entries = Array.from(correlationGraph.entries());
    chrome.storage.session.set({
        veil_clam_graph: JSON.stringify(entries),
        veil_clam_rule_id: nextClamRuleId,
        veil_dns_rule_id: nextDnsRuleId
    }).catch(() => { });
}

/** Prune old entries from the correlation graph */
function pruneCorrelationGraph() {
    const now = Date.now();
    for (const [scriptUrl, data] of correlationGraph.entries()) {
        data.events = data.events.filter(e => (now - e.timestamp) < CORRELATION_PRUNE_MS);
        if (data.events.length === 0) {
            correlationGraph.delete(scriptUrl);
        }
    }
}

/**
 * Add a fingerprint event to the CLAM correlation graph.
 * Prunes stale entries when the graph exceeds 100 entries
 * and persists the updated graph to session storage.
 *
 * @param {string} scriptUrl   URL of the initiating script
 * @param {string} api         Browser API that was intercepted (e.g. 'canvas', 'audio')
 * @param {number} entropy     Shannon entropy of the captured value (bits/byte)
 * @param {number} timestamp   Event timestamp (ms since epoch)
 * @returns {void}
 */
function addFingerprintEvent(scriptUrl, api, entropy, timestamp) {
    if (!correlationGraph.has(scriptUrl)) {
        correlationGraph.set(scriptUrl, { events: [], tagged: false });
    }
    const entry = correlationGraph.get(scriptUrl);
    entry.events.push({ api, entropy, timestamp });
    entry.tagged = true;

    // Prune periodically
    if (correlationGraph.size > 100) pruneCorrelationGraph();
    persistCorrelationGraph();
}

/** Check if a script URL is tagged as a fingerprinter in the CLAM graph */
function isTaggedFingerprinter(scriptUrl) {
    const entry = correlationGraph.get(scriptUrl);
    if (!entry || !entry.tagged) return false;

    const now = Date.now();
    // Check if any event is within the temporal window
    return entry.events.some(e => (now - e.timestamp) < CORRELATION_WINDOW_MS);
}

/** Check if a URL is third-party relative to the page URL */
function isThirdPartyRequest(requestUrl, pageUrl) {
    try {
        const reqDomain = new URL(requestUrl).hostname.split('.').slice(-2).join('.');
        const pageDomain = new URL(pageUrl).hostname.split('.').slice(-2).join('.');
        return reqDomain !== pageDomain;
    } catch {
        return true; // Assume third-party on parse failure
    }
}

// ============================
// Dynamic DNR Rule Management (FP-10, DNS-5)
// ============================

/** Add a dynamic blocking rule for a domain */
async function addBlockingRule(domain, ruleIdStart, ruleIdEnd, currentIdRef, source) {
    let ruleId = currentIdRef;
    if (ruleId > ruleIdEnd) ruleId = ruleIdStart; // Wrap around

    const rule = {
        id: ruleId,
        priority: 2,
        action: { type: 'block' },
        condition: {
            urlFilter: `*://${domain}/*`,
            resourceTypes: ['script', 'xmlhttprequest', 'image', 'sub_frame', 'other']
        }
    };

    try {
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [ruleId],
            addRules: [rule]
        });
        veilLog.info(`[${source}] Blocked domain: ${domain} (rule ${ruleId})`);
        return ruleId + 1;
    } catch (error) {
        veilLog.error(`[${source}] Failed to add DNR rule:`, error);
        return ruleId;
    }
}


// Listen for extension installation
chrome.runtime.onInstalled.addListener(async () => {
    veilLog.info('Veil Privacy Extension installed');

    // Initialize default settings
    await initializeSettings();

    // Set up declarative net request rules for blocking
    setupBlockingRules();

    // Clear any stale session rules on install/update
    clearAllSessionRules();

    // Initialize CNAME uncloaker (load Bloom filter)
    await initCNAMEUncloaker();

    // Start noise generator for traffic shaping
    const seed = await getSessionSeed();
    startNoiseGenerator(seed);
});

// Listen for browser startup to clear session rules
chrome.runtime.onStartup.addListener(async () => {
    veilLog.info('Veil Browser Startup - Clearing Session Rules');
    clearAllSessionRules();

    // Re-initialize modules on startup
    await initCNAMEUncloaker();
    const seed = await getSessionSeed();
    startNoiseGenerator(seed);
});

// ============================
// Alarm Listener (for Noise Generator)
// ============================
chrome.alarms.onAlarm.addListener((alarm) => {
    handleChaffAlarm(alarm);
});

// Helper to clear all session-based allow rules
async function clearAllSessionRules() {
    try {
        const types = ['camera', 'microphone', 'location', 'notifications'];

        // We can't easily know which rules were "ours", but for privacy,
        // we should reset 'allow' permissions that might have been left over.
        // Strategy: clear all extension-set content-settings, restoring user/browser defaults.
        // This ensures "Allow for Session" permissions are revoked on restart.

        const clearPromises = types.map(type =>
            chrome.contentSettings[type].clear({ scope: 'regular' })
                .then(() => veilLog.info(`Cleared ${type} settings on startup`))
                .catch(err => veilLog.error(`Failed to clear ${type}:`, err))
        );
        await Promise.allSettled(clearPromises);

        // Reset session state record in storage so the dashboard reflects clean state
        await chrome.storage.local.set({ sessionRulesCleared: true, sessionRulesClearedAt: Date.now() })
            .catch(err => veilLog.error('Failed to record sessionRulesCleared:', err));
    } catch (err) {
        veilLog.error('clearAllSessionRules failed:', err);
    }
}

// 🆕 AUTO-BLOCKER: Watch for cookies and clear value if they are in the blacklist
chrome.cookies.onChanged.addListener(async (changeInfo) => {
    if (changeInfo.removed) return; // Ignore deletions

    const cookie = changeInfo.cookie;

    // If value is already empty, it's our blocked state. Ignore.
    if (cookie.value === "") return;

    const { blockedCookies } = await chrome.storage.local.get('blockedCookies');

    if (!blockedCookies || blockedCookies.length === 0) return;

    // Check if this cookie is in the blacklist
    // We match loosely on domain to catch all variations (subdomains, dot-prefixes)
    const isBlocked = blockedCookies.some(b => {
        const domainMatch = b.domain === cookie.domain ||
            cookie.domain.endsWith(b.domain) ||
            b.domain.endsWith(cookie.domain) ||
            // Handle case where one has dot and other doesn't
            b.domain.replace(/^\./, '') === cookie.domain.replace(/^\./, '');

        return b.name === cookie.name && domainMatch;
    });

    if (isBlocked) {
        veilLog.info(`[Auto-Block] Detected blocked cookie update: ${cookie.name}. Clearing value.`);

        // Overwrite with empty value
        const protocol = cookie.secure ? 'https:' : 'http:';
        const cleanDomain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
        const url = `${protocol}//${cleanDomain}${cookie.path}`;

        const setDetails = {
            url: url,
            name: cookie.name,
            value: "",
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            storeId: cookie.storeId
        };

        if (cookie.expirationDate) {
            setDetails.expirationDate = cookie.expirationDate;
        }

        if (!cookie.hostOnly) {
            setDetails.domain = cookie.domain;
        }

        if (cookie.sameSite) {
            setDetails.sameSite = cookie.sameSite;
        }

        // CRITICAL: Support Partitioned Cookies (CHIPS)
        if (cookie.partitionKey) {
            setDetails.partitionKey = cookie.partitionKey;
        }

        try {
            await chrome.cookies.set(setDetails);
            veilLog.info(`[Auto-Block] Successfully enforced empty value for ${cookie.name}`);
        } catch (err) {
            veilLog.error(`[Auto-Block] Failed to enforce empty value:`, err);
        }

        // Update stats
        const stats = await chrome.storage.local.get('cookiesBlocked');
        await chrome.storage.local.set({ cookiesBlocked: (stats.cookiesBlocked || 0) + 1 });
        recordTrackingEvent('cookie');
    }
});

// Initialize default extension settings

/** Record a tracking event for the dashboard tracking history chart */
async function recordTrackingEvent(type) {
    try {
        const data = await chrome.storage.local.get('trackingHistory');
        const history = data.trackingHistory || [];
        history.push({ timestamp: Date.now(), count: 1, type });
        // Cap at 2000 entries to support 3 months of data
        if (history.length > 2000) history.splice(0, history.length - 2000);
        await chrome.storage.local.set({ trackingHistory: history });
    } catch (e) {
        // Non-critical — don't let tracking history failures break blocking
    }
}
async function initializeSettings() {
    try {
        const defaults = {
            privacyScore: 0,
            cookiesBlocked: 0,
            dnsRequestsBlocked: 0,
            fingerprintingBlocked: 0,
            // Hardware access tracking
            hardwareAccessBlocked: {
                camera: 0,
                microphone: 0,
                location: 0,
                notifications: 0
            },
            trackingHistory: [],
            lastUpdated: Date.now(),
            // Hardware access tracking - DEFAULT TO FALSE (ALLOWED)
            hardwarePermissions: {
                camera: { blocked: false },
                microphone: { blocked: false },
                location: { blocked: false },
                notifications: { blocked: false }
            },
            hardwareActivityLog: [],
            hardwareAccessByDomain: {},
            blockedCookies: [], // 🆕 List of auto-blocked cookies
            trustedBackgroundSites: {} // 🆕 Origin -> Expiry Timestamp (or 'always')
        };

        const stored = await chrome.storage.local.get(Object.keys(defaults));

        // Merge defaults with stored
        const settings = { ...defaults, ...stored };

        // Force unblock on initialization to fix "blocked by default" issue if needed
        // But respect user choice if they explicitly blocked it later.
        // For now, we trust the stored settings or defaults.

        await chrome.storage.local.set(settings);
    } catch (err) {
        veilLog.error('initializeSettings failed — extension may start with defaults:', err);
    }
}

// Set up blocking rules using declarativeNetRequest
function setupBlockingRules() {
    // Example: Block common tracking domains
    const rules = [{
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

// Listen for declarativeNetRequest rule matches to track blocking activity
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((details) => {
    // Update statistics when requests are blocked
    updateBlockingStats(details);
});

// Update blocking statistics
async function updateBlockingStats(details) {
    try {
        const stats = await chrome.storage.local.get([
            'cookiesBlocked',
            'dnsRequestsBlocked',
            'fingerprintingBlocked',
            'hardwareAccessBlocked'
        ]);

        // Increment appropriate counter based on request type
        if (details.request && details.request.type === 'xmlhttprequest') {
            stats.dnsRequestsBlocked = (stats.dnsRequestsBlocked || 0) + 1;
        } else {
            stats.dnsRequestsBlocked = (stats.dnsRequestsBlocked || 0) + 1;
        }

        await chrome.storage.local.set(stats);

        // Record tracking event for history chart
        recordTrackingEvent('dns');

        // Update privacy score
        calculatePrivacyScore();
    } catch (error) {
        veilLog.error('Error updating blocking stats:', error);
    }
}

// Gamification tier thresholds
/**
 * Get the privacy tier badge for a composite score.
 * @param {number} score  0–100 composite score
 * @returns {{ name: string, icon: string, color: string }}
 */
function getPrivacyTier(score) {
    if (score >= 80) return { name: 'Fortified', icon: '🏆', color: '#EBFF3D' };
    if (score >= 60) return { name: 'Protected', icon: '✅', color: '#7BEA4D' };
    if (score >= 40) return { name: 'Guarded', icon: '🛡️', color: '#FFD700' };
    if (score >= 20) return { name: 'Vulnerable', icon: '⚠️', color: '#FF8C42' };
    return { name: 'Exposed', icon: '🛑', color: '#FF4444' };
}

/**
 * Calculate and persist the overall privacy score using a
 * logarithmic gamification algorithm.
 *
 * Sub-score formula: K \u00d7 log\u2082(1 + rawCount)
 * Weights: cookies 25%, fingerprinting 30%, DNS 25%, hardware 20%.
 *
 * @returns {Promise<void>}  Resolves once the score is written to local storage.
 */
async function calculatePrivacyScore() {
    const stats = await chrome.storage.local.get([
        'cookiesBlocked',
        'dnsRequestsBlocked',
        'fingerprintingBlocked',
        'hardwareAccessBlocked',
        'uncloakedDomains',
        'dgaDetections'
    ]);

    // Logarithmic sub-scores: K × log₂(1 + rawCount)
    // Diminishing returns — rewards early action heavily, then tapers
    const cookieScore = Math.min(100, Math.round(10 * Math.log2(1 + (stats.cookiesBlocked || 0))));
    const fpScore = Math.min(100, Math.round(15 * Math.log2(1 + (stats.fingerprintingBlocked || 0))));

    // DNS combines blocked + uncloaked×3 + DGA×5
    const dnsBlocked = stats.dnsRequestsBlocked || 0;
    const uncloaked = (stats.uncloakedDomains || []).length;
    const dgaCount = (stats.dgaDetections || []).length;
    const dnsRaw = dnsBlocked + (uncloaked * 3) + (dgaCount * 5);
    const dnsScore = Math.min(100, Math.round(12 * Math.log2(1 + dnsRaw)));

    // Hardware aggregate
    let hwBlocked = 0;
    if (stats.hardwareAccessBlocked && typeof stats.hardwareAccessBlocked === 'object') {
        hwBlocked = Object.values(stats.hardwareAccessBlocked).reduce((a, b) => a + (b || 0), 0);
    }
    const hwScore = Math.min(100, Math.round(20 * Math.log2(1 + hwBlocked)));

    // Weighted combination: cookies 25%, fingerprinting 30%, DNS 25%, hardware 20%
    const composite = Math.min(100, Math.round(
        cookieScore * 0.25 +
        fpScore * 0.30 +
        dnsScore * 0.25 +
        hwScore * 0.20
    ));

    const tier = getPrivacyTier(composite);

    await chrome.storage.local.set({
        privacyScore: composite,
        privacySubScores: {
            cookies: cookieScore,
            dns: dnsScore,
            fingerprinting: fpScore,
            hardware: hwScore
        },
        privacyTier: tier
    });
}


// ============================
// Cookie Input Sanitization (Phase 7 — Security)
// ============================

/**
 * Validate and sanitize a cookie object from an untrusted message payload.
 * Strips any unexpected fields and enforces expected types.
 * Returns null if the input is structurally invalid.
 * @param {*} cookie
 * @returns {object|null}
 */
function sanitizeCookieInput(cookie) {
    if (!cookie || typeof cookie !== 'object' || Array.isArray(cookie)) return null;
    if (typeof cookie.name !== 'string' || cookie.name.length === 0) return null;
    if (typeof cookie.domain !== 'string' || cookie.domain.length === 0) return null;
    // Allow-list only known cookie fields — no prototype keys pass through
    return {
        name: cookie.name,
        domain: cookie.domain,
        path: typeof cookie.path === 'string' ? cookie.path : '/',
        secure: Boolean(cookie.secure),
        httpOnly: Boolean(cookie.httpOnly),
        storeId: typeof cookie.storeId === 'string' ? cookie.storeId : undefined,
        sameSite: typeof cookie.sameSite === 'string' ? cookie.sameSite : undefined,
        expirationDate: typeof cookie.expirationDate === 'number' && isFinite(cookie.expirationDate)
            ? cookie.expirationDate : undefined,
        partitionKey: cookie.partitionKey && typeof cookie.partitionKey === 'object'
            ? cookie.partitionKey : undefined,
        hostOnly: typeof cookie.hostOnly === 'boolean' ? cookie.hostOnly : true,
        value: typeof cookie.value === 'string' ? cookie.value : ''
    };
}

// Listen for messages from popup or dashboard
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Security: reject messages whose action is not a plain non-empty string.
    // This prevents prototype-pollution attacks (e.g. action = '__proto__').
    if (!request || typeof request.action !== 'string' || request.action.trim().length === 0) {
        return false;
    }

    if (request.action === 'getStats' || request.action === 'get_stats') {
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

    // 🆕 Handle Block/Unblock Cookie Requests
    if (request.action === 'blockCookie') {
        (async () => {
            // Security: sanitize untrusted cookie input (Phase 7)
            const sanitized = sanitizeCookieInput(request.cookie);
            if (!sanitized) {
                sendResponse({ success: false, error: 'Invalid cookie input' });
                return;
            }

            const { blockedCookies = [] } = await chrome.storage.local.get('blockedCookies');

            // Check if already blocked to avoid duplicates
            const isAlreadyBlocked = blockedCookies.some(b => b.name === sanitized.name && b.domain === sanitized.domain);

            if (!isAlreadyBlocked) {
                veilLog.info(`Blocking cookie: ${sanitized.name}.`);

                // 1. Get fresh cookie data to ensure we have the correct value
                let cookieToBlock = sanitized;

                try {
                    const protocol = sanitized.secure ? 'https:' : 'http:';
                    const cleanDomain = sanitized.domain.startsWith('.') ? sanitized.domain.substring(1) : sanitized.domain;
                    const url = `${protocol}//${cleanDomain}${sanitized.path}`;

                    const freshCookie = await chrome.cookies.get({
                        url: url,
                        name: sanitized.name,
                        storeId: sanitized.storeId
                    });

                    if (freshCookie) {
                        cookieToBlock = freshCookie;
                    }
                } catch (err) {
                    veilLog.warn(`Error fetching fresh cookie:`, err);
                }

                // 2. Save FULL backup (Name, Domain, Value, and ALL metadata)
                const backup = {
                    name: cookieToBlock.name,
                    domain: cookieToBlock.domain,
                    value: cookieToBlock.value,
                    path: cookieToBlock.path,
                    secure: cookieToBlock.secure,
                    httpOnly: cookieToBlock.httpOnly,
                    sameSite: cookieToBlock.sameSite,
                    expirationDate: cookieToBlock.expirationDate,
                    storeId: cookieToBlock.storeId,
                    partitionKey: cookieToBlock.partitionKey,
                    hostOnly: cookieToBlock.hostOnly
                };

                blockedCookies.push(backup);
                await chrome.storage.local.set({ blockedCookies });
                veilLog.debug(`Backup saved:`, backup);

                // 3. Overwrite cookie with empty value (DO NOT DELETE)
                const protocol = cookieToBlock.secure ? 'https:' : 'http:';
                const cleanDomain = cookieToBlock.domain.startsWith('.') ? cookieToBlock.domain.substring(1) : cookieToBlock.domain;
                const url = `${protocol}//${cleanDomain}${cookieToBlock.path}`;

                const setDetails = {
                    url: url,
                    name: cookieToBlock.name,
                    value: "", // Empty string to invalidate session
                    path: cookieToBlock.path,
                    secure: cookieToBlock.secure,
                    httpOnly: cookieToBlock.httpOnly,
                    storeId: cookieToBlock.storeId
                };

                if (!cookieToBlock.hostOnly) {
                    setDetails.domain = cookieToBlock.domain;
                }

                if (cookieToBlock.expirationDate) {
                    setDetails.expirationDate = cookieToBlock.expirationDate;
                }

                if (cookieToBlock.sameSite) {
                    setDetails.sameSite = cookieToBlock.sameSite;
                }

                if (cookieToBlock.partitionKey) {
                    setDetails.partitionKey = cookieToBlock.partitionKey;
                }

                await chrome.cookies.set(setDetails);
                veilLog.info(`Cookie value cleared (blocked).`);
            }

            sendResponse({ success: true });
        })();
        return true;
    }

    if (request.action === 'unblockCookie') {
        (async () => {
            // Security: sanitize untrusted cookie input (Phase 7)
            const sanitized = sanitizeCookieInput(request.cookie);
            if (!sanitized) {
                sendResponse({ success: false, error: 'Invalid cookie input' });
                return;
            }

            const { blockedCookies = [] } = await chrome.storage.local.get('blockedCookies');

            // Find the backup
            const backup = blockedCookies.find(b => b.name === sanitized.name && b.domain === sanitized.domain);

            if (backup) {
                veilLog.info(`Restoring cookie: ${backup.name}`);

                // CRITICAL: Remove from storage BEFORE restoring to prevent auto-blocker from killing it
                const newBlocked = blockedCookies.filter(b => !(b.name === sanitized.name && b.domain === sanitized.domain));
                await chrome.storage.local.set({ blockedCookies: newBlocked });

                // Construct URL from domain
                const cleanDomain = backup.domain.startsWith('.') ? backup.domain.substring(1) : backup.domain;
                const protocol = backup.secure ? 'https:' : 'http:';
                const url = `${protocol}//${cleanDomain}${backup.path}`;

                let setDetails = {
                    url: url,
                    name: backup.name,
                    value: backup.value,
                    path: backup.path,
                    secure: backup.secure,
                    httpOnly: backup.httpOnly,
                    storeId: backup.storeId,
                    expirationDate: backup.expirationDate
                };

                if (backup.sameSite) setDetails.sameSite = backup.sameSite;
                if (backup.partitionKey) setDetails.partitionKey = backup.partitionKey;

                // Handle HostOnly: If hostOnly is true, DO NOT set domain.
                // If hostOnly is false, SET domain.
                if (!backup.hostOnly) {
                    setDetails.domain = backup.domain;
                }

                try {
                    await chrome.cookies.set(setDetails);
                    veilLog.info(`Cookie restored.`);
                } catch (err) {
                    veilLog.error(`Failed to restore cookie:`, err);
                }
            } else {
                // If no backup found, just ensure it's removed from the list
                const newBlocked = blockedCookies.filter(b => !(b.name === sanitized.name && b.domain === sanitized.domain));
                await chrome.storage.local.set({ blockedCookies: newBlocked });
            }

            sendResponse({ success: true });
        })();
        return true;
    }

    if (request.action === 'getBlockedCookies') {
        chrome.storage.local.get('blockedCookies', (data) => {
            sendResponse(data.blockedCookies || []);
        });
        return true;
    }

    if (request.action === 'activatePrivacy') {
        // Recalculate the real score instead of using the dead activatePrivacyMode stub
        calculatePrivacyScore().then(() => {
            sendResponse({ success: true, message: 'Privacy score recalculated' });
        }).catch((error) => {
            sendResponse({ success: false, error: error.message });
        });
        return true;
    }
});

// Periodic privacy score calculation
setInterval(() => {
    calculatePrivacyScore();
}, 60000); // Every minute

// ============================
// CLAM Fingerprint Event Handler (FP-8)
// ============================
// (Registered inside the onMessage listener below)

// ============================
// Network Request Observer for CLAM Correlation (FP-9) + DNS Analysis (DNS-5)
// ============================
chrome.webRequest.onBeforeRequest.addListener(
    async (details) => {
        // Skip extension's own requests and browser-internal URLs
        if (!details.url.startsWith('http')) return;
        if (details.url.includes('cloudflare-dns.com')) return; // Skip our own DoH queries

        const requestUrl = details.url;
        let pageUrl = '';

        // Get the page URL from the tab
        if (details.tabId > 0) {
            try {
                const tab = await chrome.tabs.get(details.tabId);
                pageUrl = tab.url || '';
            } catch (e) {
                // Tab may not exist
            }
        }

        // --- CLAM Correlation (FP-9) ---
        if (details.initiator) {
            if (isTaggedFingerprinter(details.initiator) && isThirdPartyRequest(requestUrl, pageUrl || details.initiator)) {
                veilLog.info(`[CLAM] Fingerprint exfiltration detected: ${details.initiator} → ${requestUrl}`);

                try {
                    const blockedDomain = new URL(requestUrl).hostname;
                    nextClamRuleId = await addBlockingRule(blockedDomain, CLAM_DNR_RULE_ID_START, CLAM_DNR_RULE_ID_END, nextClamRuleId, 'CLAM');

                    // Update stats (FP-11)
                    const fpStats = await chrome.storage.local.get(['fingerprintingBlocked', 'fingerprintEvents']);
                    const events = fpStats.fingerprintEvents || [];
                    events.unshift({
                        domain: blockedDomain,
                        initiator: details.initiator,
                        timestamp: Date.now(),
                        action: 'blocked'
                    });
                    if (events.length > 100) events.pop();

                    await chrome.storage.local.set({
                        fingerprintingBlocked: (fpStats.fingerprintingBlocked || 0) + 1,
                        fingerprintEvents: events
                    });

                    recordTrackingEvent('fingerprint');
                    calculatePrivacyScore();
                } catch (e) {
                    veilLog.error('[CLAM] Error blocking exfiltration request:', e);
                }
            }
        }

        // --- DNS Analysis (DNS-5): CNAME Uncloaking + DGA Detection ---
        try {
            const hostname = new URL(requestUrl).hostname;

            // Record DNS event for burst detection (DNS-7)
            recordDNSEvent();

            // DGA Detection (DNS-4)
            const subdomainLabels = extractSubdomainLabels(hostname);
            for (const label of subdomainLabels) {
                const dgaResult = isDGA(label);
                if (dgaResult.isDGA) {
                    veilLog.info(`[DGA] Domain detected: ${hostname} (score=${dgaResult.score.toFixed(2)}, reasons=${dgaResult.reasons.join(',')})`);

                    nextDnsRuleId = await addBlockingRule(hostname, DNS_DNR_RULE_ID_START, DNS_DNR_RULE_ID_END, nextDnsRuleId, 'DGA');

                    // Update stats (DNS-8)
                    const dnsStats = await chrome.storage.local.get(['dnsRequestsBlocked', 'dgaDetections']);
                    const dgaList = dnsStats.dgaDetections || [];
                    dgaList.unshift({ hostname, score: dgaResult.score, reasons: dgaResult.reasons, timestamp: Date.now() });
                    if (dgaList.length > 100) dgaList.pop();

                    await chrome.storage.local.set({
                        dnsRequestsBlocked: (dnsStats.dnsRequestsBlocked || 0) + 1,
                        dgaDetections: dgaList
                    });
                    recordTrackingEvent('dga');
                    break; // One DGA label is enough to block
                }
            }

            // CNAME Uncloaking (DNS-3) — only for suspicious subdomains
            const pageHostname = pageUrl ? new URL(pageUrl).hostname : '';
            if (isSuspiciousSubdomain(hostname, pageHostname)) {
                const uncloakResult = await uncloakHostname(hostname);
                if (uncloakResult.isCloaked) {
                    veilLog.info(`[CNAME] Uncloaked: ${hostname} \u2192 ${uncloakResult.uncloaked}`);

                    nextDnsRuleId = await addBlockingRule(hostname, DNS_DNR_RULE_ID_START, DNS_DNR_RULE_ID_END, nextDnsRuleId, 'CNAME');

                    // Update stats (DNS-8)
                    const dnsStats = await chrome.storage.local.get(['dnsRequestsBlocked', 'uncloakedDomains']);
                    const uncloakedList = dnsStats.uncloakedDomains || [];
                    uncloakedList.unshift({
                        original: hostname,
                        uncloaked: uncloakResult.uncloaked,
                        chain: uncloakResult.chain,
                        timestamp: Date.now()
                    });
                    if (uncloakedList.length > 100) uncloakedList.pop();

                    await chrome.storage.local.set({
                        dnsRequestsBlocked: (dnsStats.dnsRequestsBlocked || 0) + 1,
                        uncloakedDomains: uncloakedList
                    });

                    recordTrackingEvent('cname');
                    calculatePrivacyScore();
                }
            }
        } catch (e) {
            // URL parsing or DNS analysis failures are non-fatal
        }
    },
    { urls: ['<all_urls>'] }
);

// --- Hardware Access Control Logic (Phase 3) ---

// --- Session-Based Allow Logic ---
const sessionAllows = new Map(); // TabID -> [{ type, pattern }]

// Restore session rules from storage on Service Worker startup
chrome.storage.session.get(null, (items) => {
    for (const [key, value] of Object.entries(items)) {
        const tabId = parseInt(key, 10);
        if (!isNaN(tabId)) {
            sessionAllows.set(tabId, value);
        }
    }
    veilLog.info(`Restored session rules for ${sessionAllows.size} tabs`);
});

// Listen for tab closure to clean up session rules
chrome.tabs.onRemoved.addListener(async (tabId) => {
    const key = tabId.toString();

    // Check persistent session storage first (more reliable than in-memory map)
    const stored = await chrome.storage.session.get(key);

    if (stored && stored[key]) {
        const rules = stored[key];
        veilLog.info(`Tab ${tabId} closed. Clearing ${rules.length} session rules.`);

        for (const rule of rules) {
            try {
                // Clear the specific allow rule for this pattern
                await chrome.contentSettings[rule.type].clear({
                    primaryPattern: rule.pattern,
                    scope: 'regular'
                });
                veilLog.info(`Cleared rule for ${rule.type} on ${rule.pattern}`);
            } catch (err) {
                veilLog.error(`Failed to clear session rule for ${rule.pattern}:`, err);
            }
        }

        // Remove from persistent session storage
        await chrome.storage.session.remove(key);

        // Update in-memory map
        if (sessionAllows.has(tabId)) {
            sessionAllows.delete(tabId);
        }
    } else if (sessionAllows.has(tabId)) {
        // Fallback to in-memory map if storage was empty (rare)
        const rules = sessionAllows.get(tabId);
        rules.forEach(rule => {
            chrome.contentSettings[rule.type].clear({
                primaryPattern: rule.pattern,
                scope: 'regular'
            }).catch(err => veilLog.error(`Failed to clear session rule:`, err));
        });
        sessionAllows.delete(tabId);
    }
});

/**
 * Merge global hardware permission settings with per-tab session exceptions.
 * Session exceptions are created when a user clicks "Allow for this session"
 * on a hardware access prompt, which temporarily overrides a global block.
 *
 * @param {number} tabId           The tab ID to look up session exceptions for.
 * @param {object} globalSettings  The global hardwarePermissions object from storage.
 * @returns {object}  A deep copy of globalSettings with session overrides applied.
 */
function getEffectiveSettings(tabId, globalSettings) {
    // Deep copy to avoid mutating the original
    const effective = JSON.parse(JSON.stringify(globalSettings));

    if (sessionAllows.has(tabId)) {
        const rules = sessionAllows.get(tabId);
        rules.forEach(rule => {
            if (effective[rule.type]) {
                effective[rule.type].blocked = false; // Override block
            }
        });
    }
    return effective;
}

// Listen for messages from popup, dashboard, and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    // ============================
    // CLAM Fingerprint Event Handler (FP-8)
    // ============================
    if (message.action === 'fingerprintEvent' || message.action === 'fingerprint_event') {
        const { api, entropy, initiator, timestamp } = message.data;
        addFingerprintEvent(initiator.scriptUrl, api, entropy, timestamp);
        sendResponse({ ok: true });
        return true;
    }

    if (message.action === 'fingerprintMonitorActive' || message.action === 'fingerprint_monitor_active') {
        veilLog.debug(`[CLAM] Fingerprint monitor active on: ${message.url}`);
        return false;
    }

    // ============================
    // DNS & Noise Generator Controls
    // ============================
    if (message.action === 'toggleNoiseGenerator' || message.action === 'toggle_noise_generator') {
        if (message.enabled) {
            getSessionSeed().then(seed => startNoiseGenerator(seed));
        } else {
            stopNoiseGenerator();
        }
        sendResponse({ success: true, active: message.enabled });
        return true;
    }

    // Start/Stop noise generator (from dashboard toggle)
    if (message.action === 'startNoiseGenerator' || message.action === 'start_noise_generator') {
        getSessionSeed().then(seed => startNoiseGenerator(seed));
        sendResponse({ success: true, active: true });
        return true;
    }

    if (message.action === 'stopNoiseGenerator' || message.action === 'stop_noise_generator') {
        stopNoiseGenerator();
        sendResponse({ success: true, active: false });
        return true;
    }

    if (message.action === 'getNoiseStatus' || message.action === 'get_noise_status') {
        sendResponse({ active: isNoiseGeneratorActive() });
        return true;
    }

    // ... (Existing handlers) ...

    // 5. Allow for Session (New Feature)
    if (message.action === 'allowSession' || message.action === 'allow_session') {
        const { type, domain } = message;
        const tabId = sender.tab ? sender.tab.id : message.tabId;

        if (!tabId) {
            veilLog.error('Cannot allow session: No Tab ID');
            return;
        }

        const pattern = `https://${domain}/*`;

        // 1. Set Content Setting to ALLOW for this specific pattern
        chrome.contentSettings[type].set({
            primaryPattern: pattern,
            setting: 'allow',
            scope: 'regular'
        }).then(() => {
            // 2. Track this rule for cleanup
            if (!sessionAllows.has(tabId)) {
                sessionAllows.set(tabId, []);
            }
            const rules = sessionAllows.get(tabId);
            rules.push({ type, pattern });

            // Persist to session storage (survives SW restart, cleared on browser close)
            chrome.storage.session.set({
                [tabId.toString()]: rules
            });

            veilLog.info(`Allowed ${type} for session on ${domain} (Tab ${tabId})`);

            // 3. IMMEDIATELY update the tab with new settings
            chrome.storage.local.get(['hardwarePermissions'], (res) => {
                const globalSettings = res.hardwarePermissions || {
                    camera: { blocked: false },
                    microphone: { blocked: false },
                    location: { blocked: false },
                    notifications: { blocked: false }
                };
                const newSettings = getEffectiveSettings(tabId, globalSettings);

                chrome.tabs.sendMessage(tabId, {
                    action: 'hardware_settings',
                    settings: newSettings,
                    globalSettings: globalSettings
                }).catch(() => { }); // Ignore if tab closed

                sendResponse({ success: true });
            });
        }).catch(err => {
            veilLog.error(`Failed to set session allow:`, err);
            sendResponse({ success: false, error: err.message });
        });

        return true;
    }

    // 1. Get Settings (from Popup/Dashboard or Page)
    if (message.action === 'getSettings' || message.action === 'get_settings') {
        chrome.storage.local.get(['hardwarePermissions'], (res) => {
            const DEFAULT_PERMISSIONS = {
                camera: { blocked: false },
                microphone: { blocked: false },
                location: { blocked: false },
                notifications: { blocked: false }
            };

            const globalSettings = res.hardwarePermissions || DEFAULT_PERMISSIONS;

            // If request comes from a tab, apply session exceptions
            if (sender.tab) {
                sendResponse({
                    settings: getEffectiveSettings(sender.tab.id, globalSettings),
                    globalSettings: globalSettings
                });
            } else {
                sendResponse({ settings: globalSettings, globalSettings: globalSettings });
            }
        });
        return true; // Async response
    }    // 2. Set Settings (from Dashboard/Popup)
    if (message.action === 'setSettings' || message.action === 'set_settings') {
        const newSettings = message.settings;

        // Apply Chrome Content Settings (Native Browser Blocking)
        // This ensures the UI (lock icon) matches the blocking state and kills streams instantly
        const types = ['camera', 'microphone', 'location', 'notifications'];
        types.forEach(type => {
            if (newSettings[type]) {
                if (newSettings[type].blocked) {
                    // Enforce BLOCK globally
                    // This overrides any user settings with a strict BLOCK
                    chrome.contentSettings[type].set({
                        primaryPattern: '<all_urls>',
                        setting: 'block',
                        scope: 'regular'
                    }).catch(err => veilLog.error(`Failed to BLOCK ${type}:`, err));
                } else {
                    // Release control (Clear extension override)
                    // This restores the user's previous settings (Allow/Ask)
                    chrome.contentSettings[type].clear({
                        scope: 'regular'
                    }).catch(err => veilLog.error(`Failed to CLEAR ${type}:`, err));
                }
            }
        });

        chrome.storage.local.set({ hardwarePermissions: newSettings }, () => {
            sendResponse({ success: true });

            // Broadcast to all tabs so they update their cache immediately
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    // Calculate effective settings for this specific tab
                    const effectiveSettings = getEffectiveSettings(tab.id, newSettings);

                    // Use a catch block to ignore errors for tabs that don't have the listener
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'hardware_settings',
                        settings: effectiveSettings,
                        globalSettings: newSettings
                    }).catch(() => {
                        // Ignore "Receiving end does not exist" for tabs without our content script
                    });
                });
            });
        });
        return true;
    }

    // 3. Get Stats (from Dashboard — returns ALL storage for data coherence)
    if (message.action === 'getStats' || message.action === 'get_stats') {
        chrome.storage.local.get(null, (res) => sendResponse(res));
        return true;
    }

    // 4. Log Hardware Event (from Content Script)
    if (message.action === 'hardwareEvent' || message.action === 'hardware_event') {
        // Initialize queue to prevent race conditions
        self.logUpdateQueue = self.logUpdateQueue || Promise.resolve();

        let { permission, action, tabStatus } = message.payload;

        // Fix for "Unknown" permission issue
        if (!permission && message.payload.type) permission = message.payload.type;

        // Auto-detect Tab Status if not provided by the page
        if (!tabStatus && sender.tab) {
            // Check if the tab is active in its window
            tabStatus = sender.tab.active ? 'ACTIVE' : 'BACKGROUND';
        }

        const url = message.url || (sender.tab && sender.tab.url) || '';
        let domain = 'unknown';
        try { domain = new URL(url).hostname; } catch (e) { }

        // Chain the storage update to ensure sequential execution
        self.logUpdateQueue = self.logUpdateQueue.then(() => {
            return new Promise((resolve) => {
                chrome.storage.local.get(
                    ['hardwareActivityLog', 'hardwareAccessBlocked', 'hardwareAccessByDomain', 'hardwarePermissions'],
                    (res) => {
                        const log = res.hardwareActivityLog || [];
                        const blocked = res.hardwareAccessBlocked || { camera: 0, microphone: 0, location: 0, notifications: 0 };
                        const byDomain = res.hardwareAccessByDomain || {};
                        const globalSettings = res.hardwarePermissions || {
                            camera: { blocked: false },
                            microphone: { blocked: false },
                            location: { blocked: false },
                            notifications: { blocked: false }
                        };

                        // Determine precise status for UI
                        // 'blocked' -> Blocked by Toggle
                        // 'allowed_session' -> Allowed by Session Exception (Global Toggle was ON)
                        // 'detected' -> Allowed because Toggle was OFF
                        let logStatus = action; // default to 'blocked' or 'allowed'

                        if (action === 'allowed') {
                            const isGloballyBlocked = globalSettings[permission] && globalSettings[permission].blocked;
                            if (isGloballyBlocked) {
                                logStatus = 'allowed_session';
                            } else {
                                logStatus = 'detected';
                            }
                        } else if (action === 'blocked') {
                            logStatus = 'blocked';
                        }

                        // Add to Activity Log
                        log.unshift({
                            time: Date.now(),
                            domain,
                            permission,
                            action, // Keep original action for stats
                            logStatus, // New field for UI display
                            tabStatus
                        });
                        if (log.length > 200) log.pop();

                        // Update Blocked Counts & Domain Stats
                        if (action === 'blocked') {
                            // Ensure blocked object structure exists
                            if (typeof blocked === 'number') {
                                // Migration fix if old format exists
                                blocked = { camera: 0, microphone: 0, location: 0, notifications: 0 };
                            }
                            blocked[permission] = (blocked[permission] || 0) + 1;

                            // Record for tracking history chart
                            recordTrackingEvent('hardware');

                            if (!byDomain[domain]) {
                                byDomain[domain] = { blocked: 0, permissions: [] };
                            }
                            byDomain[domain].blocked += 1;
                            if (!byDomain[domain].permissions.includes(permission)) {
                                byDomain[domain].permissions.push(permission);
                            }
                        }

                        chrome.storage.local.set({
                            hardwareActivityLog: log,
                            hardwareAccessBlocked: blocked,
                            hardwareAccessByDomain: byDomain
                        }, resolve);
                    }
                );
            });
        });

        sendResponse({ ok: true });
        return true;
    }
});
