/**
 * Session-Consistent Pseudo-Random Number Generator
 * 
 * Provides deterministic random numbers seeded by a per-session ID.
 * Ensures fingerprint spoofing returns identical results within the same
 * session (PriVaricator method) to avoid the "Lie Paradox" — where
 * inconsistency reveals the presence of a spoofer.
 * 
 * @module session-prng
 */

/**
 * Mulberry32 — a fast 32-bit PRNG with good statistical properties.
 * Given the same seed and index, always returns the same value.
 * 
 * @param {number} seed - 32-bit integer seed
 * @returns {function(): number} A function that returns the next random
 *   float in [0, 1) each time it's called
 */
export function mulberry32(seed) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Get or create the session seed. The seed is generated once per browser
 * session using crypto.getRandomValues and persisted in chrome.storage.session.
 * 
 * Must be called from a context with access to chrome.storage.session
 * (service worker or ISOLATED-world content script).
 * 
 * @returns {Promise<number>} The 32-bit integer session seed
 */
export async function getSessionSeed() {
    const KEY = 'veil_session_seed';

    try {
        const stored = await chrome.storage.session.get(KEY);
        if (stored[KEY] !== undefined) {
            return stored[KEY];
        }
    } catch {
        // storage.session may not be available in MAIN world — fall back
    }

    // Generate a new seed
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const seed = array[0];

    try {
        await chrome.storage.session.set({ [KEY]: seed });
    } catch {
        // If we can't persist, the seed lives only in memory for this execution
    }

    return seed;
}

/**
 * Create a session-seeded PRNG instance.
 * 
 * Usage:
 *   const rng = await createSessionRNG();
 *   const val1 = rng(); // deterministic per session
 *   const val2 = rng();
 * 
 * @returns {Promise<function(): number>} Seeded PRNG function
 */
export async function createSessionRNG() {
    const seed = await getSessionSeed();
    return mulberry32(seed);
}

/**
 * Get a deterministic random value for a given (seed, index) pair.
 * Useful when you need the i-th random value without calling the RNG
 * sequentially.
 * 
 * @param {number} seed - The session seed
 * @param {number} index - The index of the desired random value
 * @returns {number} A deterministic float in [0, 1)
 */
export function seededRandom(seed, index) {
    // Advance the RNG to the desired position
    const rng = mulberry32(seed ^ (index * 2654435761)); // mix index into seed
    return rng();
}

/**
 * Generate a deterministic integer delta in range [-maxDelta, +maxDelta]
 * for pixel noise injection.
 * 
 * @param {number} seed - The session seed
 * @param {number} pixelIndex - The pixel/channel index
 * @param {number} [maxDelta=1] - Maximum absolute delta
 * @returns {number} Integer in [-maxDelta, +maxDelta]
 */
export function pixelDelta(seed, pixelIndex, maxDelta = 1) {
    const val = seededRandom(seed, pixelIndex);
    // Map [0, 1) to [-maxDelta, +maxDelta] integer
    const range = 2 * maxDelta + 1; // e.g., 3 for maxDelta=1: {-1, 0, 1}
    return Math.floor(val * range) - maxDelta;
}
