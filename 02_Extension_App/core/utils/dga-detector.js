/**
 * Entropy-Based DGA (Domain Generation Algorithm) Detector
 * 
 * Detects algorithmically-generated subdomains (e.g., "xy7-z9a.tracker.com")
 * using Kullback-Leibler divergence against natural English character
 * frequency distribution. Optimized for web latencies — much lighter
 * than malware-focused DGA classifiers.
 * 
 * @module dga-detector
 */

/**
 * English character frequency distribution (lowercase a-z).
 * Source: letter frequency analysis of large English corpora.
 * Used as the reference distribution Q in KL divergence.
 */
const ENGLISH_FREQ = {
    'a': 0.0817, 'b': 0.0150, 'c': 0.0278, 'd': 0.0425,
    'e': 0.1270, 'f': 0.0223, 'g': 0.0202, 'h': 0.0609,
    'i': 0.0697, 'j': 0.0015, 'k': 0.0077, 'l': 0.0403,
    'm': 0.0241, 'n': 0.0675, 'o': 0.0751, 'p': 0.0193,
    'q': 0.0010, 'r': 0.0599, 's': 0.0633, 't': 0.0906,
    'u': 0.0276, 'v': 0.0098, 'w': 0.0236, 'x': 0.0015,
    'y': 0.0197, 'z': 0.0007
};

/** Set of vowels for vowel-consonant ratio check */
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/**
 * Compute the character frequency distribution of a string.
 * Only considers lowercase a-z characters; digits and symbols are counted
 * separately for feature extraction.
 * 
 * @param {string} str - Input string (will be lowercased)
 * @returns {{ charFreq: Object, digitCount: number, alphaCount: number, totalCount: number }}
 */
function analyzeCharacterDistribution(str) {
    const lower = str.toLowerCase();
    const charFreq = {};
    let digitCount = 0;
    let alphaCount = 0;

    for (const char of lower) {
        if (char >= 'a' && char <= 'z') {
            charFreq[char] = (charFreq[char] || 0) + 1;
            alphaCount++;
        } else if (char >= '0' && char <= '9') {
            digitCount++;
        }
        // Ignore hyphens, dots, and other symbols
    }

    return {
        charFreq,
        digitCount,
        alphaCount,
        totalCount: alphaCount + digitCount
    };
}

/**
 * Calculate Kullback-Leibler divergence: D_KL(P || Q)
 * where P is the observed character distribution and Q is English.
 * 
 * Uses Laplace smoothing to avoid log(0).
 * 
 * @param {Object} observedFreq - Character frequency counts
 * @param {number} totalAlpha - Total alphabetic characters
 * @returns {number} KL divergence (higher = more random / less English-like)
 */
function klDivergence(observedFreq, totalAlpha) {
    if (totalAlpha === 0) return 0;

    const smoothingFactor = 0.001; // Laplace smoothing
    const alphabet = Object.keys(ENGLISH_FREQ);
    let divergence = 0;

    for (const char of alphabet) {
        // Observed probability P(x) with smoothing
        const observedCount = (observedFreq[char] || 0) + smoothingFactor;
        const p = observedCount / (totalAlpha + smoothingFactor * alphabet.length);

        // Reference probability Q(x)
        const q = ENGLISH_FREQ[char];

        if (p > 0 && q > 0) {
            divergence += p * Math.log2(p / q);
        }
    }

    return divergence;
}

/**
 * Calculate vowel-to-consonant ratio.
 * 
 * @param {string} str - Input string (lowercased)
 * @returns {number} Ratio (0-1), or 0 if no alpha characters
 */
function vowelConsonantRatio(str) {
    let vowelCount = 0;
    let consonantCount = 0;

    for (const char of str.toLowerCase()) {
        if (char >= 'a' && char <= 'z') {
            if (VOWELS.has(char)) {
                vowelCount++;
            } else {
                consonantCount++;
            }
        }
    }

    const total = vowelCount + consonantCount;
    return total > 0 ? vowelCount / total : 0;
}

/**
 * Detect whether a subdomain label is likely DGA-generated.
 * 
 * Heuristics applied:
 *   1. KL divergence against English frequency > threshold (~2.5)
 *   2. Subdomain length > 12 characters
 *   3. Vowel-to-consonant ratio < 0.3
 *   4. Digit ratio > 0.3
 * 
 * A domain is flagged if KL divergence exceeds the threshold AND
 * at least one secondary heuristic matches.
 * 
 * @param {string} subdomain - The subdomain label to analyze
 *   (e.g., "xy7-z9a" from "xy7-z9a.tracker.com")
 * @param {Object} [options] - Tuning options
 * @param {number} [options.klThreshold=2.5] - KL divergence threshold
 * @param {number} [options.minLength=6] - Minimum length to consider
 * @param {number} [options.vowelRatioThreshold=0.3] - Max vowel ratio for DGA
 * @param {number} [options.digitRatioThreshold=0.3] - Min digit ratio for DGA
 * @returns {{ isDGA: boolean, score: number, reasons: string[] }}
 */
export function isDGA(subdomain, options = {}) {
    const {
        klThreshold = 2.5,
        minLength = 6,
        vowelRatioThreshold = 0.3,
        digitRatioThreshold = 0.3
    } = options;

    const reasons = [];

    // Skip very short subdomains (e.g., "www", "api")
    if (!subdomain || subdomain.length < minLength) {
        return { isDGA: false, score: 0, reasons: ['too_short'] };
    }

    // Analyze character distribution
    const { charFreq, digitCount, alphaCount, totalCount } = analyzeCharacterDistribution(subdomain);

    if (totalCount === 0) {
        return { isDGA: false, score: 0, reasons: ['no_chars'] };
    }

    // 1. KL Divergence
    const klScore = klDivergence(charFreq, alphaCount);
    const klFlagged = klScore > klThreshold;
    if (klFlagged) reasons.push('high_kl_divergence');

    // 2. Length check
    const lengthFlagged = subdomain.length > 12;
    if (lengthFlagged) reasons.push('long_subdomain');

    // 3. Vowel-consonant ratio
    const vcRatio = vowelConsonantRatio(subdomain);
    const vcFlagged = vcRatio < vowelRatioThreshold && alphaCount > 0;
    if (vcFlagged) reasons.push('low_vowel_ratio');

    // 4. Digit ratio
    const digitRatio = totalCount > 0 ? digitCount / totalCount : 0;
    const digitFlagged = digitRatio > digitRatioThreshold;
    if (digitFlagged) reasons.push('high_digit_ratio');

    // Decision: KL divergence must be high AND at least one secondary heuristic
    const secondaryFlags = [lengthFlagged, vcFlagged, digitFlagged].filter(Boolean).length;
    const isDGAResult = klFlagged && secondaryFlags >= 1;

    return {
        isDGA: isDGAResult,
        score: klScore,
        reasons
    };
}

/**
 * Extract subdomain labels from a hostname for DGA analysis.
 * Returns only the labels that are candidates for DGA (excludes
 * the registered domain and TLD).
 * 
 * @param {string} hostname - Full hostname (e.g., "xy7-z9a.sub.tracker.com")
 * @returns {string[]} Subdomain labels to check (e.g., ["xy7-z9a", "sub"])
 */
export function extractSubdomainLabels(hostname) {
    const parts = hostname.toLowerCase().split('.');

    // Need at least 3 parts to have a subdomain (sub.domain.tld)
    if (parts.length < 3) {
        return [];
    }

    // Remove the last 2 parts (domain + TLD) — simplified assumption
    // For more complex TLDs (e.g., co.uk), a public suffix list would be needed
    const subdomainParts = parts.slice(0, -2);

    // Filter out common benign prefixes
    const benignPrefixes = new Set(['www', 'mail', 'ftp', 'api', 'cdn', 'img', 'static', 'assets', 'ns1', 'ns2']);

    return subdomainParts.filter(label => !benignPrefixes.has(label) && label.length > 0);
}
