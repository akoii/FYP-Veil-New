/**
 * DNS-over-HTTPS (DoH) Client
 * 
 * Performs DNS resolution via HTTPS using the Cloudflare DoH JSON API.
 * This bypasses the browser's DNS cache and allows the extension to
 * inspect CNAME records that are otherwise invisible to extensions.
 * 
 * Used by CNAME Uncloaker (Tier 2) and Noise Generator (Tier 3).
 * 
 * @module doh-client
 */

/** Default DoH resolver endpoint (Cloudflare JSON API) */
const DEFAULT_DOH_URL = 'https://cloudflare-dns.com/dns-query';

/** Query timeout in milliseconds */
const QUERY_TIMEOUT_MS = 3000;

/** Maximum number of retries on failure */
const MAX_RETRIES = 1;

/**
 * @typedef {Object} DNSRecord
 * @property {string} name - The record name (e.g., "example.com.")
 * @property {number} type - DNS record type (1=A, 5=CNAME, 28=AAAA, etc.)
 * @property {number} TTL - Time to live in seconds
 * @property {string} data - The record value (IP address, CNAME target, etc.)
 */

/**
 * @typedef {Object} DoHResponse
 * @property {number} Status - DNS response code (0=NOERROR, 3=NXDOMAIN)
 * @property {boolean} TC - Truncated flag
 * @property {boolean} RD - Recursion Desired flag
 * @property {boolean} RA - Recursion Available flag
 * @property {boolean} AD - Authenticated Data flag
 * @property {boolean} CD - Checking Disabled flag
 * @property {DNSRecord[]} [Question] - Question section
 * @property {DNSRecord[]} [Answer] - Answer section
 * @property {DNSRecord[]} [Authority] - Authority section
 */

/**
 * DNS record type constants
 */
export const DNS_TYPES = {
    A: 1,
    CNAME: 5,
    AAAA: 28,
    TXT: 16,
    MX: 15
};

/**
 * Resolve a domain name using DNS-over-HTTPS.
 * 
 * @param {string} domain - Domain name to resolve
 * @param {string} [recordType='A'] - DNS record type ('A', 'CNAME', 'AAAA', etc.)
 * @param {Object} [options] - Additional options
 * @param {string} [options.dohUrl] - Custom DoH resolver URL
 * @param {number} [options.timeout] - Timeout in ms (default: 3000)
 * @returns {Promise<DoHResponse>} Parsed DNS response
 * @throws {Error} If resolution fails after retries
 */
export async function resolveDoH(domain, recordType = 'A', options = {}) {
    const dohUrl = options.dohUrl || DEFAULT_DOH_URL;
    const timeout = options.timeout || QUERY_TIMEOUT_MS;

    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const result = await fetchDNS(domain, recordType, dohUrl, timeout);
            return result;
        } catch (error) {
            lastError = error;
            if (attempt < MAX_RETRIES) {
                // Brief delay before retry
                await new Promise(r => setTimeout(r, 200));
            }
        }
    }

    throw new Error(`DoH resolution failed for ${domain} after ${MAX_RETRIES + 1} attempts: ${lastError.message}`);
}

/**
 * Internal: Perform a single DoH fetch request.
 * 
 * @param {string} domain - Domain to query
 * @param {string} recordType - Record type string
 * @param {string} dohUrl - DoH endpoint URL
 * @param {number} timeout - Timeout in ms
 * @returns {Promise<DoHResponse>}
 */
async function fetchDNS(domain, recordType, dohUrl, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const queryUrl = `${dohUrl}?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(recordType)}`;

        const response = await fetch(queryUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/dns-json'
            },
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`DoH HTTP error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Extract all CNAME records from a DoH response.
 * Returns the full CNAME chain in order.
 * 
 * @param {DoHResponse} response - The DoH response object
 * @returns {string[]} Array of CNAME target domains (without trailing dots)
 */
export function extractCNAMEChain(response) {
    if (!response || !response.Answer) {
        return [];
    }

    return response.Answer
        .filter(record => record.type === DNS_TYPES.CNAME)
        .map(record => {
            // Remove trailing dot from DNS names (e.g., "tracker.com." -> "tracker.com")
            let target = record.data || '';
            if (target.endsWith('.')) {
                target = target.slice(0, -1);
            }
            return target.toLowerCase();
        });
}

/**
 * Resolve a domain and walk the full CNAME chain,
 * returning all intermediate and final targets.
 * 
 * @param {string} domain - Domain to resolve
 * @param {Object} [options] - DoH options
 * @returns {Promise<{ cnameChain: string[], finalIPs: string[] }>}
 */
export async function resolveCNAMEChain(domain, options = {}) {
    const cnameChain = [];
    const finalIPs = [];

    try {
        const response = await resolveDoH(domain, 'A', options);

        if (response && response.Answer) {
            for (const record of response.Answer) {
                if (record.type === DNS_TYPES.CNAME) {
                    let target = record.data || '';
                    if (target.endsWith('.')) {
                        target = target.slice(0, -1);
                    }
                    cnameChain.push(target.toLowerCase());
                } else if (record.type === DNS_TYPES.A) {
                    finalIPs.push(record.data);
                }
            }
        }
    } catch (error) {
        console.warn(`[Veil DoH] Failed to resolve CNAME chain for ${domain}:`, error.message);
    }

    return { cnameChain, finalIPs };
}
