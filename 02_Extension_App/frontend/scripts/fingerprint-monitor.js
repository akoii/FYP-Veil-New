/**
 * Fingerprint Event Monitor — ISOLATED World Content Script
 * 
 * Bridges fingerprint events from the MAIN-world interceptor to the
 * background service worker. Listens for postMessage events from
 * fingerprint-interceptor.js and forwards them via chrome.runtime.sendMessage.
 * 
 * This is necessary because MAIN-world scripts cannot call Chrome APIs.
 * 
 * @module fingerprint-monitor
 */

(function () {
    'use strict';

    // Prevent double-injection
    if (window.__veilFingerprintMonitorLoaded) return;
    window.__veilFingerprintMonitorLoaded = true;

    const EVENT_TYPE = 'VEIL_FINGERPRINT_EVENT';

    // Rate limiting: max N events per second to prevent flooding
    const RATE_LIMIT = 20; // max events per second
    let eventCount = 0;
    let lastResetTime = Date.now();

    /**
     * Validate the format of a fingerprint event payload.
     * 
     * @param {Object} payload
     * @returns {boolean}
     */
    function isValidPayload(payload) {
        return (
            payload &&
            typeof payload.api === 'string' &&
            typeof payload.entropy === 'number' &&
            typeof payload.timestamp === 'number' &&
            payload.initiator &&
            typeof payload.initiator.scriptUrl === 'string'
        );
    }

    /**
     * Check rate limit.
     * @returns {boolean} true if within limit
     */
    function checkRateLimit() {
        const now = Date.now();
        if (now - lastResetTime > 1000) {
            eventCount = 0;
            lastResetTime = now;
        }
        eventCount++;
        return eventCount <= RATE_LIMIT;
    }

    /**
     * Listen for fingerprint events from the MAIN world interceptor.
     */
    window.addEventListener('message', (event) => {
        // Only accept messages from the same window
        if (event.source !== window) return;

        // Check event type
        if (!event.data || event.data.type !== EVENT_TYPE) return;

        const payload = event.data.payload;

        // Validate payload
        if (!isValidPayload(payload)) {
            console.warn('[Veil FP Monitor] Invalid event payload received');
            return;
        }

        // Rate limit check
        if (!checkRateLimit()) return;

        // Forward to background service worker
        try {
            chrome.runtime.sendMessage({
                action: 'fingerprintEvent',
                data: {
                    api: payload.api,
                    entropy: payload.entropy,
                    initiator: {
                        scriptUrl: payload.initiator.scriptUrl,
                        line: payload.initiator.line || 0,
                        col: payload.initiator.col || 0
                    },
                    timestamp: payload.timestamp,
                    pageUrl: payload.url || window.location.href,
                    tabUrl: window.location.href
                }
            }).catch(() => {
                // Service worker may not be running; ignore
            });
        } catch (e) {
            // Extension context may be invalidated; ignore
        }
    });

    // Notify the service worker that the monitor is active on this page
    try {
        chrome.runtime.sendMessage({
            action: 'fingerprintMonitorActive',
            url: window.location.href
        }).catch(() => { });
    } catch (e) { /* Ignore */ }

})();
