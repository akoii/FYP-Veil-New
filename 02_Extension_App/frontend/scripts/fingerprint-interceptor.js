/**
 * Fingerprint Interceptor — MAIN World Content Script
 * 
 * Hooks high-entropy browser APIs (Canvas, Audio, WebGL) to:
 *   1. Spoof fingerprints with session-consistent noise (PriVaricator)
 *   2. Detect fingerprinting attempts via entropy analysis
 *   3. Tag the initiating script for CLAM correlation
 * 
 * Runs in MAIN world so it can override native prototypes before page
 * scripts access them. Communicates with fingerprint-monitor.js (ISOLATED
 * world) via window.postMessage.
 * 
 * @module fingerprint-interceptor
 */

(function () {
    'use strict';

    // Prevent double-injection
    if (window.__veilFingerprintInterceptorLoaded) return;
    window.__veilFingerprintInterceptorLoaded = true;

    // =========================================================================
    // Configuration
    // =========================================================================

    const CONFIG = {
        ENTROPY_THRESHOLD: 6.5,    // bits/byte — above this = high entropy
        PIXEL_NOISE_PERCENT: 0.05, // 5% of pixels get noise
        MAX_PIXEL_DELTA: 1,        // ±1 per RGB channel
        AUDIO_NOISE_AMPLITUDE: 0.0001, // Tiny gain offset for audio samples
        EVENT_TYPE: 'VEIL_FINGERPRINT_EVENT',
        DEBUG: false
    };

    // =========================================================================
    // Inline Utilities (can't import modules in MAIN world)
    // =========================================================================

    /** Shannon entropy (bits per byte) */
    function calculateShannonEntropy(dataString) {
        if (!dataString || dataString.length === 0) return 0;
        const freq = {};
        const len = dataString.length;
        for (let i = 0; i < len; i++) {
            const c = dataString[i];
            freq[c] = (freq[c] || 0) + 1;
        }
        let entropy = 0;
        for (const c in freq) {
            const p = freq[c] / len;
            if (p > 0) entropy -= p * Math.log2(p);
        }
        return entropy;
    }

    /** Capture calling script URL from stack trace */
    function captureInitiator(skipFrames = 2) {
        const stack = new Error().stack || '';
        const lines = stack.split('\n');
        const idx = 1 + skipFrames;
        if (idx >= lines.length) return { scriptUrl: 'unknown', line: 0, col: 0 };

        const frame = lines[idx].trim();
        const m = frame.match(/at\s+(?:.*?\s+\()?((?:https?|chrome-extension):\/\/[^:)]+):(\d+):(\d+)\)?/);
        if (m) return { scriptUrl: m[1], line: +m[2], col: +m[3] };

        const um = frame.match(/((?:https?|chrome-extension):\/\/[^\s:)]+)/);
        return { scriptUrl: um ? um[1] : 'unknown', line: 0, col: 0 };
    }

    /** Mulberry32 PRNG */
    function mulberry32(seed) {
        return function () {
            seed |= 0;
            seed = (seed + 0x6D2B79F5) | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /** Get deterministic random for (seed, index) */
    function seededRandom(seed, index) {
        const rng = mulberry32(seed ^ Math.imul(index, 2654435761));
        return rng();
    }

    /** Pixel delta: map [0,1) → {-1, 0, +1} */
    function pixelDelta(seed, pixelIndex, maxDelta = 1) {
        const val = seededRandom(seed, pixelIndex);
        const range = 2 * maxDelta + 1;
        return Math.floor(val * range) - maxDelta;
    }

    // =========================================================================
    // Session Seed Management (in-page)
    // =========================================================================

    let sessionSeed = null;

    /** Generate or retrieve the session seed */
    function getSessionSeed() {
        if (sessionSeed !== null) return sessionSeed;

        // Try to load from sessionStorage (shared across MAIN world in same tab)
        try {
            const stored = sessionStorage.getItem('__veil_fp_seed');
            if (stored) {
                sessionSeed = parseInt(stored, 10);
                return sessionSeed;
            }
        } catch (e) { /* Ignore if sessionStorage is blocked */ }

        // Generate new seed
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        sessionSeed = arr[0];

        try {
            sessionStorage.setItem('__veil_fp_seed', sessionSeed.toString());
        } catch (e) { /* Ignore */ }

        return sessionSeed;
    }

    // =========================================================================
    // Event Dispatch (MAIN → ISOLATED via postMessage)
    // =========================================================================

    function dispatchFingerprintEvent(api, entropy, initiator) {
        // Security: use explicit target origin instead of '*' to prevent leaking
        // fingerprint event payloads to cross-origin iframes on the same page.
        // Falls back to '*' only for opaque origins (e.g. sandboxed iframes) where
        // the monitor's event.source !== window guard is the sole protection.
        const targetOrigin = (window.location.origin && window.location.origin !== 'null')
            ? window.location.origin
            : '*';
        window.postMessage({
            type: CONFIG.EVENT_TYPE,
            payload: {
                api: api,
                entropy: entropy,
                initiator: initiator,
                timestamp: Date.now(),
                url: window.location.href
            }
        }, targetOrigin);

        if (CONFIG.DEBUG) {
            console.log(`[Veil FP] Detected ${api} call | entropy=${entropy.toFixed(2)} | from=${initiator.scriptUrl}`);
        }
    }

    // =========================================================================
    // CANVAS SPOOFING (FP-4)
    // =========================================================================

    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

    /**
     * Apply noise to canvas ImageData.
     * Modifies ~5% of pixels by ±1 in R/G/B channels.
     */
    function applyCanvasNoise(canvas) {
        try {
            const ctx = canvas.getContext('2d');
            if (!ctx) return false;

            const width = canvas.width;
            const height = canvas.height;
            if (width === 0 || height === 0) return false;

            const imageData = originalGetImageData.call(ctx, 0, 0, width, height);
            const data = imageData.data; // Uint8ClampedArray [R,G,B,A, R,G,B,A, ...]
            const seed = getSessionSeed();
            const totalPixels = width * height;
            const pixelsToModify = Math.max(1, Math.floor(totalPixels * CONFIG.PIXEL_NOISE_PERCENT));

            for (let i = 0; i < pixelsToModify; i++) {
                // Deterministic pixel selection
                const pixelIndex = Math.floor(seededRandom(seed, i) * totalPixels);
                const baseIdx = pixelIndex * 4;

                // Apply delta to R, G, B channels (skip Alpha)
                for (let ch = 0; ch < 3; ch++) {
                    const delta = pixelDelta(seed, pixelIndex * 3 + ch, CONFIG.MAX_PIXEL_DELTA);
                    // Uint8ClampedArray auto-clamps to [0, 255]
                    data[baseIdx + ch] = data[baseIdx + ch] + delta;
                }
            }

            ctx.putImageData(imageData, 0, 0);
            return true;
        } catch (e) {
            if (CONFIG.DEBUG) console.warn('[Veil FP] Canvas noise failed:', e);
            return false;
        }
    }

    // Hook: toDataURL
    HTMLCanvasElement.prototype.toDataURL = function (...args) {
        const initiator = captureInitiator(2);

        // Apply noise before extracting data
        applyCanvasNoise(this);

        const result = originalToDataURL.apply(this, args);

        // Calculate entropy and report
        const entropy = calculateShannonEntropy(result);
        if (entropy >= CONFIG.ENTROPY_THRESHOLD) {
            dispatchFingerprintEvent('canvas.toDataURL', entropy, initiator);
        }

        return result;
    };

    // Hook: toBlob
    HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
        const initiator = captureInitiator(2);

        // Apply noise
        applyCanvasNoise(this);

        // Wrap callback to check entropy
        const wrappedCallback = (blob) => {
            if (blob) {
                dispatchFingerprintEvent('canvas.toBlob', 7.0, initiator); // Assume high entropy for blobs
            }
            if (callback) callback(blob);
        };

        return originalToBlob.call(this, wrappedCallback, ...args);
    };

    // =========================================================================
    // AUDIO FINGERPRINT SPOOFING (FP-5)
    // =========================================================================

    // Hook: OfflineAudioContext.startRendering
    if (typeof OfflineAudioContext !== 'undefined') {
        const originalStartRendering = OfflineAudioContext.prototype.startRendering;

        OfflineAudioContext.prototype.startRendering = function () {
            const initiator = captureInitiator(2);

            const resultPromise = originalStartRendering.apply(this, arguments);

            return resultPromise.then(audioBuffer => {
                try {
                    const seed = getSessionSeed();
                    const numChannels = audioBuffer.numberOfChannels;

                    for (let ch = 0; ch < numChannels; ch++) {
                        const channelData = audioBuffer.getChannelData(ch);

                        // Apply tiny noise to a subset of samples
                        const samplesToModify = Math.max(1, Math.floor(channelData.length * 0.1));
                        for (let i = 0; i < samplesToModify; i++) {
                            const sampleIdx = Math.floor(seededRandom(seed, i + ch * 10000) * channelData.length);
                            const delta = (seededRandom(seed, sampleIdx + 50000) - 0.5) * CONFIG.AUDIO_NOISE_AMPLITUDE * 2;
                            channelData[sampleIdx] += delta;
                        }
                    }

                    // Calculate entropy from first channel samples
                    const samples = audioBuffer.getChannelData(0);
                    const sampleStr = Array.from(samples.slice(0, 100)).map(s => s.toFixed(6)).join('');
                    const entropy = calculateShannonEntropy(sampleStr);

                    if (entropy >= CONFIG.ENTROPY_THRESHOLD) {
                        dispatchFingerprintEvent('audio.startRendering', entropy, initiator);
                    }
                } catch (e) {
                    if (CONFIG.DEBUG) console.warn('[Veil FP] Audio noise failed:', e);
                }

                return audioBuffer;
            });
        };
    }

    // Hook: AudioContext.createOscillator (detection only — tagging)
    if (typeof AudioContext !== 'undefined') {
        const originalCreateOscillator = AudioContext.prototype.createOscillator;

        AudioContext.prototype.createOscillator = function () {
            const initiator = captureInitiator(2);

            // Flag oscillator creation (common in audio fingerprinting)
            dispatchFingerprintEvent('audio.createOscillator', 5.0, initiator);

            return originalCreateOscillator.apply(this, arguments);
        };
    }

    // =========================================================================
    // WEBGL FINGERPRINT SPOOFING (FP-6)
    // =========================================================================

    /** Pool of common GPU renderer strings for spoofing */
    const GPU_RENDERER_POOL = [
        'ANGLE (Intel, Intel(R) UHD Graphics 630, OpenGL 4.5)',
        'ANGLE (Intel, Intel(R) HD Graphics 620, OpenGL 4.5)',
        'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060, OpenGL 4.5)',
        'ANGLE (AMD, AMD Radeon RX 580, OpenGL 4.5)',
        'ANGLE (Intel, Intel(R) Iris Plus Graphics 640, OpenGL 4.5)'
    ];

    const GPU_VENDOR_POOL = [
        'Google Inc. (Intel)',
        'Google Inc. (NVIDIA)',
        'Google Inc. (AMD)'
    ];

    // WebGL parameters that leak hardware info
    const SPOOFED_PARAMS = new Set([
        0x1F00, // gl.VENDOR
        0x1F01, // gl.RENDERER
        0x1F02, // gl.VERSION
        0x8B8C, // gl.SHADING_LANGUAGE_VERSION
    ]);

    const NUMERIC_PARAMS = new Set([
        0x0D33, // gl.MAX_TEXTURE_SIZE
        0x851C, // gl.MAX_CUBE_MAP_TEXTURE_SIZE
        0x8869, // gl.MAX_VERTEX_ATTRIBS
        0x8DFB, // gl.MAX_VARYING_VECTORS
        0x8872, // gl.MAX_VERTEX_UNIFORM_VECTORS
        0x8DFC, // gl.MAX_FRAGMENT_UNIFORM_VECTORS
    ]);

    function hookWebGLGetParameter(proto, contextName) {
        if (!proto || !proto.getParameter) return;

        const originalGetParameter = proto.getParameter;

        proto.getParameter = function (pname) {
            const initiator = captureInitiator(2);
            const result = originalGetParameter.call(this, pname);
            const seed = getSessionSeed();

            // Spoof string parameters
            if (pname === 0x1F01) { // RENDERER
                const idx = seed % GPU_RENDERER_POOL.length;
                dispatchFingerprintEvent(`${contextName}.getParameter(RENDERER)`, 7.0, initiator);
                return GPU_RENDERER_POOL[idx];
            }

            if (pname === 0x1F00) { // VENDOR
                const idx = seed % GPU_VENDOR_POOL.length;
                dispatchFingerprintEvent(`${contextName}.getParameter(VENDOR)`, 6.0, initiator);
                return GPU_VENDOR_POOL[idx];
            }

            if (SPOOFED_PARAMS.has(pname)) {
                dispatchFingerprintEvent(`${contextName}.getParameter(${pname})`, 6.0, initiator);
            }

            // Spoof numeric parameters with ±1 delta
            if (NUMERIC_PARAMS.has(pname) && typeof result === 'number') {
                const delta = pixelDelta(seed, pname, 1);
                dispatchFingerprintEvent(`${contextName}.getParameter(${pname})`, 5.0, initiator);
                return result + delta;
            }

            return result;
        };
    }

    // Hook extensions that reveal hardware RENDERER/VENDOR
    function hookWebGLExtensions(proto, contextName) {
        if (!proto || !proto.getExtension) return;

        const originalGetExtension = proto.getExtension;

        proto.getExtension = function (name) {
            const ext = originalGetExtension.call(this, name);

            // WEBGL_debug_renderer_info provides UNMASKED_RENDERER/VENDOR
            if (name === 'WEBGL_debug_renderer_info' && ext) {
                const initiator = captureInitiator(2);
                dispatchFingerprintEvent(`${contextName}.getExtension(WEBGL_debug_renderer_info)`, 7.5, initiator);

                // Return a proxy that spoofs the unmasked values
                return new Proxy(ext, {
                    get(target, prop) {
                        return Reflect.get(target, prop);
                    }
                });
            }

            return ext;
        };
    }

    // Apply WebGL hooks
    if (typeof WebGLRenderingContext !== 'undefined') {
        hookWebGLGetParameter(WebGLRenderingContext.prototype, 'webgl');
        hookWebGLExtensions(WebGLRenderingContext.prototype, 'webgl');
    }
    if (typeof WebGL2RenderingContext !== 'undefined') {
        hookWebGLGetParameter(WebGL2RenderingContext.prototype, 'webgl2');
        hookWebGLExtensions(WebGL2RenderingContext.prototype, 'webgl2');
    }

    // =========================================================================
    // Navigator Properties Spoofing (bonus, minimal cost)
    // =========================================================================

    // Spoof navigator.hardwareConcurrency with a common value
    try {
        const seed = getSessionSeed();
        const commonCores = [2, 4, 8];
        const spoofedCores = commonCores[seed % commonCores.length];

        Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => spoofedCores,
            configurable: true
        });
    } catch (e) { /* May fail if already defined */ }

    // =========================================================================
    // Initialization Log
    // =========================================================================

    if (CONFIG.DEBUG) {
        console.log('[Veil FP] Fingerprint interceptor loaded — canvas, audio, WebGL hooks active');
    }

})();
