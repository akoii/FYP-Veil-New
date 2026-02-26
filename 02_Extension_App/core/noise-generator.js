/**
 * Noise Generator — Adaptive Traffic Shaping (Tier 3)
 * 
 * Implements two defense mechanisms:
 *   1. Chaff Injection: Periodic dummy DoH queries for benign domains
 *   2. Burst Smoothing: Injects extra queries during DNS bursts
 * 
 * This obfuscates DNS traffic patterns, making it harder for ISPs or
 * network observers to fingerprint the websites being visited.
 * 
 * @module noise-generator
 */

import { resolveDoH } from './utils/doh-client.js';

// =========================================================================
// Configuration
// =========================================================================

/** Pool of benign "chaff" domains for dummy queries */
const CHAFF_DOMAINS = [
    'wikipedia.org', 'cnn.com', 'bbc.com', 'weather.com',
    'reddit.com', 'stackoverflow.com', 'medium.com', 'github.com',
    'nytimes.com', 'washingtonpost.com', 'reuters.com', 'apnews.com',
    'mozilla.org', 'w3.org', 'ietf.org', 'unicode.org',
    'amazon.com', 'ebay.com', 'walmart.com', 'target.com',
    'spotify.com', 'netflix.com', 'hulu.com', 'twitch.tv',
    'linkedin.com', 'pinterest.com', 'tumblr.com', 'quora.com',
    'archive.org', 'worldbank.org', 'un.org', 'who.int',
    'nasa.gov', 'noaa.gov', 'usgs.gov', 'nih.gov',
    'nature.com', 'sciencedirect.com', 'springer.com', 'wiley.com',
    'coursera.org', 'edx.org', 'khanacademy.org', 'mit.edu',
    'cloudflare.com', 'akamai.com', 'fastly.com', 'jsdelivr.net',
    'npmjs.com', 'pypi.org', 'rubygems.org', 'packagist.org'
];

/** Minimum interval between chaff queries (ms) */
const MIN_CHAFF_INTERVAL_MS = 5000; // 5 seconds

/** Maximum interval between chaff queries (ms) */
const MAX_CHAFF_INTERVAL_MS = 15000; // 15 seconds

/** Burst detection window (ms) */
const BURST_WINDOW_MS = 2000; // 2 seconds

/** Burst threshold: number of DNS queries to trigger smoothing */
const BURST_THRESHOLD = 3;

/** Number of dummy queries to inject during a burst */
const BURST_PADDING_QUERIES = 2;

// =========================================================================
// State
// =========================================================================

let isActive = false;
let chaffAlarmName = 'veil_chaff_timer';
let burstCounter = 0;
let burstWindowStart = 0;
let sessionSeed = 0;
let chaffIndex = 0;

// =========================================================================
// Chaff Injection (DNS-6)
// =========================================================================

/**
 * Start the noise generator. Sets up periodic chaff injection.
 * 
 * @param {number} seed - Session seed for deterministic domain selection
 */
export function startNoiseGenerator(seed) {
    if (isActive) return;

    isActive = true;
    sessionSeed = seed;
    chaffIndex = 0;

    // Use chrome.alarms for MV3-safe periodic execution
    // (setInterval may not survive service worker suspension)
    chrome.alarms.create(chaffAlarmName, {
        delayInMinutes: 0.1, // Start after 6 seconds
        periodInMinutes: 0.15 // ~9 seconds (approximate mid-range)
    });

    console.log('[Veil Noise] Traffic shaping activated');
}

/**
 * Stop the noise generator.
 */
export function stopNoiseGenerator() {
    isActive = false;
    chrome.alarms.clear(chaffAlarmName);
    console.log('[Veil Noise] Traffic shaping deactivated');
}

/**
 * Handle alarm event — send a chaff query.
 * This should be called from the service worker's chrome.alarms.onAlarm listener.
 * 
 * @param {chrome.alarms.Alarm} alarm
 */
export async function handleChaffAlarm(alarm) {
    if (alarm.name !== chaffAlarmName || !isActive) return;

    await sendChaffQuery();
}

/**
 * Send a single dummy DoH query for a benign domain.
 */
async function sendChaffQuery() {
    try {
        // Deterministic domain selection using session seed
        const domainIndex = (sessionSeed + chaffIndex) % CHAFF_DOMAINS.length;
        const domain = CHAFF_DOMAINS[domainIndex];
        chaffIndex++;

        // Fire and forget — we don't care about the result
        await resolveDoH(domain, 'A', { timeout: 2000 });

        // Don't log every query to keep console clean
    } catch (error) {
        // Silently ignore failures for dummy queries
    }
}

// =========================================================================
// Burst Smoothing (DNS-7)
// =========================================================================

/**
 * Record a DNS query event for burst detection.
 * Call this every time the extension observes a real DNS-related request.
 * 
 * If a burst is detected (>3 queries within 2 seconds), inject extra
 * dummy queries to smooth the traffic profile.
 */
export async function recordDNSEvent() {
    if (!isActive) return;

    const now = Date.now();

    // Reset window if expired
    if (now - burstWindowStart > BURST_WINDOW_MS) {
        burstCounter = 0;
        burstWindowStart = now;
    }

    burstCounter++;

    // Check for burst
    if (burstCounter === BURST_THRESHOLD) {
        await injectBurstPadding();
    }
}

/**
 * Inject dummy queries to pad a detected burst.
 * Queries are staggered with small random delays.
 */
async function injectBurstPadding() {
    for (let i = 0; i < BURST_PADDING_QUERIES; i++) {
        // Small staggered delay (100-500ms) between padding queries
        const delay = 100 + Math.floor(Math.random() * 400);

        setTimeout(async () => {
            try {
                const domainIndex = (sessionSeed + chaffIndex + i * 7) % CHAFF_DOMAINS.length;
                const domain = CHAFF_DOMAINS[domainIndex];
                chaffIndex++;

                await resolveDoH(domain, 'A', { timeout: 2000 });
            } catch (e) {
                // Silently ignore
            }
        }, delay);
    }
}

/**
 * Check if the noise generator is currently active.
 * @returns {boolean}
 */
export function isNoiseGeneratorActive() {
    return isActive;
}

/**
 * Get the alarm name for external listener setup.
 * @returns {string}
 */
export function getChaffAlarmName() {
    return chaffAlarmName;
}
