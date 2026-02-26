/**
 * CNAME Uncloaking Engine
 * 
 * Performs parallel DNS-over-HTTPS lookups to uncover CNAME cloaking.
 * When a subdomain CNAMEs to a known tracker domain (checked via Bloom
 * filter), the request is flagged for blocking.
 * 
 * Example: metrics.news-site.com → CNAME → tracker.com (blocked!)
 * 
 * @module cname-uncloaker
 */

import { resolveCNAMEChain } from './utils/doh-client.js';
import { BloomFilter } from './utils/bloom-filter.js';

/** Cache for DNS lookups to avoid redundant queries */
const dnsCache = new Map(); // hostname → { result, timestamp }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Reference to the loaded Bloom filter */
let trackerBloomFilter = null;

/**
 * Initialize the CNAME uncloaker by loading the Bloom filter.
 * Call this once at service worker startup.
 * 
 * @returns {Promise<boolean>} True if initialization succeeded
 */
export async function initCNAMEUncloaker() {
    try {
        const response = await fetch(chrome.runtime.getURL('core/data/tracker_bloom.bin'));
        const buffer = await response.arrayBuffer();
        trackerBloomFilter = BloomFilter.loadFromBuffer(buffer);
        console.log('[Veil CNAME] Bloom filter loaded successfully');
        return true;
    } catch (error) {
        console.error('[Veil CNAME] Failed to load Bloom filter:', error);
        return false;
    }
}

/**
 * Check if a hostname is a suspicious subdomain that warrants CNAME checking.
 * 
 * @param {string} hostname - The hostname to check
 * @param {string} [pageHostname] - The top-level page hostname for first/third party check
 * @returns {boolean}
 */
export function isSuspiciousSubdomain(hostname, pageHostname = '') {
    const parts = hostname.split('.');

    // Need at least 3 parts (sub.domain.tld)
    if (parts.length < 3) return false;

    // Common suspicious subdomain patterns
    const suspiciousKeywords = [
        'metrics', 'analytics', 'track', 'pixel', 'tag', 'beacon',
        'collect', 'telemetry', 'stat', 'measure', 'log', 'data',
        'insight', 'monitor', 'report', 'event', 'click', 'imp'
    ];

    const subdomain = parts.slice(0, -2).join('.').toLowerCase();

    // Check if any subdomain part contains suspicious keywords
    for (const keyword of suspiciousKeywords) {
        if (subdomain.includes(keyword)) return true;
    }

    // Third-party check: if the subdomain's registered domain differs from the page
    if (pageHostname) {
        const hostParts = hostname.split('.');
        const pageParts = pageHostname.split('.');
        const hostDomain = hostParts.slice(-2).join('.');
        const pageDomain = pageParts.slice(-2).join('.');

        if (hostDomain !== pageDomain) return true;
    }

    return false;
}

/**
 * Perform CNAME uncloaking on a hostname.
 * 
 * Resolves the hostname via DoH and checks if any CNAME in the chain
 * points to a known tracker domain.
 * 
 * @param {string} hostname - The hostname to check
 * @returns {Promise<{ isCloaked: boolean, original: string, uncloaked: string|null, chain: string[] }>}
 */
export async function uncloakHostname(hostname) {
    const result = {
        isCloaked: false,
        original: hostname,
        uncloaked: null,
        chain: []
    };

    // Check cache first
    const cached = dnsCache.get(hostname);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
        return cached.result;
    }

    // Bloom filter must be loaded
    if (!trackerBloomFilter) {
        return result;
    }

    try {
        const { cnameChain } = await resolveCNAMEChain(hostname);
        result.chain = cnameChain;

        // Check each CNAME target against the tracker Bloom filter
        for (const cname of cnameChain) {
            // Check the full CNAME and its registered domain
            const cnameRegistered = extractRegisteredDomain(cname);

            if (trackerBloomFilter.has(cname) || trackerBloomFilter.has(cnameRegistered)) {
                result.isCloaked = true;
                result.uncloaked = cname;
                break;
            }
        }
    } catch (error) {
        console.warn(`[Veil CNAME] Resolution failed for ${hostname}:`, error.message);
    }

    // Cache the result
    dnsCache.set(hostname, { result, timestamp: Date.now() });

    // Prune old cache entries
    if (dnsCache.size > 500) {
        pruneCache();
    }

    return result;
}

/**
 * Extract the registered domain (domain + TLD) from a hostname.
 * Simplified version — for complex TLDs (co.uk etc.) a public suffix
 * list would be needed.
 * 
 * @param {string} hostname
 * @returns {string}
 */
function extractRegisteredDomain(hostname) {
    const parts = hostname.split('.');
    if (parts.length <= 2) return hostname;
    return parts.slice(-2).join('.');
}

/**
 * Prune expired entries from the DNS cache.
 */
function pruneCache() {
    const now = Date.now();
    for (const [key, value] of dnsCache.entries()) {
        if (now - value.timestamp > CACHE_TTL_MS) {
            dnsCache.delete(key);
        }
    }
}

/**
 * Clear the entire DNS cache.
 */
export function clearDNSCache() {
    dnsCache.clear();
}

/**
 * Get cache statistics for debugging.
 * @returns {{ size: number, bloomLoaded: boolean }}
 */
export function getCacheStats() {
    return {
        size: dnsCache.size,
        bloomLoaded: trackerBloomFilter !== null
    };
}
