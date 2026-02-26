/**
 * Bloom Filter for Tracker Domain Lookup
 * 
 * A space-efficient probabilistic data structure for checking whether
 * a domain exists in the EasyPrivacy tracker domain list. Uses MurmurHash3
 * with k=7 hash functions for a target false positive rate < 0.1%.
 * 
 * The filter is pre-built offline (via build_bloom_filter.py) and shipped
 * as a binary blob. At runtime it's loaded into memory in the service worker.
 * 
 * @module bloom-filter
 */

/**
 * MurmurHash3 — 32-bit implementation.
 * Fast, non-cryptographic hash with excellent distribution.
 * 
 * @param {string} key - Input string to hash
 * @param {number} [seed=0] - Hash seed
 * @returns {number} 32-bit unsigned integer hash
 */
function murmurhash3(key, seed = 0) {
    let h = seed >>> 0;
    const len = key.length;
    let i = 0;

    while (i + 4 <= len) {
        let k =
            (key.charCodeAt(i) & 0xff) |
            ((key.charCodeAt(i + 1) & 0xff) << 8) |
            ((key.charCodeAt(i + 2) & 0xff) << 16) |
            ((key.charCodeAt(i + 3) & 0xff) << 24);

        k = Math.imul(k, 0xcc9e2d51);
        k = (k << 15) | (k >>> 17);
        k = Math.imul(k, 0x1b873593);

        h ^= k;
        h = (h << 13) | (h >>> 19);
        h = (Math.imul(h, 5) + 0xe6546b64) | 0;

        i += 4;
    }

    // Tail
    let k = 0;
    switch (len & 3) {
        case 3: k ^= (key.charCodeAt(i + 2) & 0xff) << 16;
        // falls through
        case 2: k ^= (key.charCodeAt(i + 1) & 0xff) << 8;
        // falls through
        case 1:
            k ^= key.charCodeAt(i) & 0xff;
            k = Math.imul(k, 0xcc9e2d51);
            k = (k << 15) | (k >>> 17);
            k = Math.imul(k, 0x1b873593);
            h ^= k;
    }

    // Finalization
    h ^= len;
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;

    return h >>> 0;
}

/**
 * Bloom Filter class.
 */
export class BloomFilter {
    /**
     * @param {number} size - Number of bits in the filter
     * @param {number} [numHashes=7] - Number of hash functions (k)
     */
    constructor(size, numHashes = 7) {
        this.size = size;
        this.numHashes = numHashes;
        this.bitArray = new Uint8Array(Math.ceil(size / 8));
    }

    /**
     * Get the bit at position `index`.
     * @param {number} index
     * @returns {boolean}
     */
    _getBit(index) {
        const byteIndex = Math.floor(index / 8);
        const bitOffset = index % 8;
        return (this.bitArray[byteIndex] & (1 << bitOffset)) !== 0;
    }

    /**
     * Set the bit at position `index`.
     * @param {number} index
     */
    _setBit(index) {
        const byteIndex = Math.floor(index / 8);
        const bitOffset = index % 8;
        this.bitArray[byteIndex] |= (1 << bitOffset);
    }

    /**
     * Generate k hash positions for a given key using double hashing.
     * h_i(key) = (h1(key) + i * h2(key)) mod size
     * 
     * @param {string} key
     * @returns {number[]} Array of k bit positions
     */
    _getHashPositions(key) {
        const h1 = murmurhash3(key, 0);
        const h2 = murmurhash3(key, 1577836800); // different seed
        const positions = [];

        for (let i = 0; i < this.numHashes; i++) {
            const pos = ((h1 + i * h2) >>> 0) % this.size;
            positions.push(pos);
        }

        return positions;
    }

    /**
     * Add a domain to the filter.
     * @param {string} domain - Domain to add (will be lowercased)
     */
    add(domain) {
        const key = domain.toLowerCase().replace(/^\./, '');
        const positions = this._getHashPositions(key);
        for (const pos of positions) {
            this._setBit(pos);
        }
    }

    /**
     * Check if a domain might be in the filter.
     * 
     * @param {string} domain - Domain to check
     * @returns {boolean} true if possibly present, false if definitely not
     */
    has(domain) {
        const key = domain.toLowerCase().replace(/^\./, '');
        const positions = this._getHashPositions(key);
        for (const pos of positions) {
            if (!this._getBit(pos)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Load a pre-built Bloom filter from a binary ArrayBuffer.
     * The buffer format is:
     *   - Bytes 0-3: size (uint32, little-endian)
     *   - Bytes 4-7: numHashes (uint32, little-endian)
     *   - Bytes 8+: bit array data
     * 
     * @param {ArrayBuffer} buffer - The binary data
     * @returns {BloomFilter} Loaded filter instance
     */
    static loadFromBuffer(buffer) {
        const view = new DataView(buffer);
        const size = view.getUint32(0, true);  // little-endian
        const numHashes = view.getUint32(4, true);

        const filter = new BloomFilter(size, numHashes);
        const data = new Uint8Array(buffer, 8);
        filter.bitArray.set(data.subarray(0, filter.bitArray.length));

        return filter;
    }

    /**
     * Export the filter to an ArrayBuffer for serialization.
     * @returns {ArrayBuffer}
     */
    toBuffer() {
        const headerSize = 8; // 2x uint32
        const buffer = new ArrayBuffer(headerSize + this.bitArray.length);
        const view = new DataView(buffer);

        view.setUint32(0, this.size, true);
        view.setUint32(4, this.numHashes, true);

        const dataView = new Uint8Array(buffer, headerSize);
        dataView.set(this.bitArray);

        return buffer;
    }
}

/**
 * Calculate optimal Bloom filter size for given parameters.
 * 
 * @param {number} numItems - Expected number of items
 * @param {number} falsePositiveRate - Desired false positive rate (e.g., 0.001)
 * @returns {{ size: number, numHashes: number }}
 */
export function calculateOptimalParams(numItems, falsePositiveRate = 0.001) {
    // m = -(n * ln(p)) / (ln(2))^2
    const size = Math.ceil(-(numItems * Math.log(falsePositiveRate)) / (Math.log(2) ** 2));
    // k = (m / n) * ln(2)
    const numHashes = Math.round((size / numItems) * Math.log(2));

    return { size, numHashes: Math.max(1, numHashes) };
}
