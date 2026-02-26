/**
 * Shannon Entropy Calculator
 * 
 * Computes the Shannon entropy (bits per byte) of any input string.
 * Used by CLAM to determine if API return values are high-entropy
 * (unique identifiers) vs. low-entropy (generic data).
 * 
 * @module entropy
 */

/**
 * Calculate Shannon entropy of a data string.
 * Returns a value in range [0, 8] (bits per byte).
 * 
 * - 0 = perfectly uniform (e.g., all same character)
 * - ~4.5-6 = natural language text
 * - >6.5 = high-entropy (likely unique identifier / fingerprint)
 * - 8.0 = maximum (perfectly random byte distribution)
 * 
 * @param {string} dataString - The input data to analyze
 * @returns {number} Shannon entropy in bits per byte
 */
export function calculateShannonEntropy(dataString) {
    if (!dataString || dataString.length === 0) {
        return 0;
    }

    // Build character frequency histogram
    const frequencyMap = new Map();
    const len = dataString.length;

    for (let i = 0; i < len; i++) {
        const char = dataString[i];
        frequencyMap.set(char, (frequencyMap.get(char) || 0) + 1);
    }

    // Calculate Shannon entropy: H = -Σ p(x) * log2(p(x))
    let entropy = 0;
    for (const count of frequencyMap.values()) {
        const probability = count / len;
        if (probability > 0) {
            entropy -= probability * Math.log2(probability);
        }
    }

    return entropy;
}

/**
 * Check if data exceeds the high-entropy threshold.
 * 
 * @param {string} dataString - The data to check
 * @param {number} [threshold=6.5] - Entropy threshold (bits/byte)
 * @returns {{ isHighEntropy: boolean, entropy: number }}
 */
export function isHighEntropy(dataString, threshold = 6.5) {
    const entropy = calculateShannonEntropy(dataString);
    return {
        isHighEntropy: entropy >= threshold,
        entropy
    };
}
