"""
Bloom Filter Builder for EasyPrivacy Tracker Domains

Builds a compact binary Bloom filter from the EasyPrivacy third-party
domain list for use by the Veil extension's CNAME uncloaking engine.

Output format:
  - Bytes 0-3: filter size in bits (uint32, little-endian)
  - Bytes 4-7: number of hash functions (uint32, little-endian)
  - Bytes 8+:  bit array data

Usage:
  python build_bloom_filter.py [--input domains.txt] [--output tracker_bloom.bin]

If no input file is specified, a built-in list of known tracker domains is used.
"""

import struct
import math
import sys
import os
import hashlib


def murmurhash3_32(key: str, seed: int = 0) -> int:
    """
    Pure-Python MurmurHash3 32-bit implementation.
    Must match the JavaScript version in bloom-filter.js exactly.
    """
    data = key.encode('utf-8')
    h = seed & 0xFFFFFFFF
    length = len(data)
    nblocks = length // 4

    c1 = 0xCC9E2D51
    c2 = 0x1B873593

    # Body
    for i in range(nblocks):
        k = int.from_bytes(data[i*4:(i+1)*4], 'little') & 0xFFFFFFFF

        k = (k * c1) & 0xFFFFFFFF
        k = ((k << 15) | (k >> 17)) & 0xFFFFFFFF
        k = (k * c2) & 0xFFFFFFFF

        h ^= k
        h = ((h << 13) | (h >> 19)) & 0xFFFFFFFF
        h = ((h * 5) + 0xE6546B64) & 0xFFFFFFFF

    # Tail
    tail = data[nblocks * 4:]
    k = 0
    if len(tail) >= 3:
        k ^= tail[2] << 16
    if len(tail) >= 2:
        k ^= tail[1] << 8
    if len(tail) >= 1:
        k ^= tail[0]
        k = (k * c1) & 0xFFFFFFFF
        k = ((k << 15) | (k >> 17)) & 0xFFFFFFFF
        k = (k * c2) & 0xFFFFFFFF
        h ^= k

    # Finalization
    h ^= length
    h ^= (h >> 16)
    h = (h * 0x85EBCA6B) & 0xFFFFFFFF
    h ^= (h >> 13)
    h = (h * 0xC2B2AE35) & 0xFFFFFFFF
    h ^= (h >> 16)

    return h


def calculate_optimal_params(num_items: int, fp_rate: float = 0.001):
    """Calculate optimal Bloom filter size and number of hash functions."""
    size = int(math.ceil(-(num_items * math.log(fp_rate)) / (math.log(2) ** 2)))
    num_hashes = max(1, round((size / num_items) * math.log(2)))
    return size, num_hashes


class BloomFilterBuilder:
    def __init__(self, size: int, num_hashes: int = 7):
        self.size = size
        self.num_hashes = num_hashes
        self.bit_array = bytearray(math.ceil(size / 8))

    def _get_hash_positions(self, key: str):
        h1 = murmurhash3_32(key, 0)
        h2 = murmurhash3_32(key, 1577836800)
        positions = []
        for i in range(self.num_hashes):
            pos = ((h1 + i * h2) & 0xFFFFFFFF) % self.size
            positions.append(pos)
        return positions

    def add(self, domain: str):
        key = domain.lower().lstrip('.')
        for pos in self._get_hash_positions(key):
            byte_index = pos // 8
            bit_offset = pos % 8
            self.bit_array[byte_index] |= (1 << bit_offset)

    def has(self, domain: str) -> bool:
        key = domain.lower().lstrip('.')
        for pos in self._get_hash_positions(key):
            byte_index = pos // 8
            bit_offset = pos % 8
            if not (self.bit_array[byte_index] & (1 << bit_offset)):
                return False
        return True

    def to_bytes(self) -> bytes:
        header = struct.pack('<II', self.size, self.num_hashes)
        return header + bytes(self.bit_array)


# Built-in list of known tracker domains (subset of EasyPrivacy + common trackers)
# In production, this would be generated from the full EasyPrivacy list
BUILTIN_TRACKER_DOMAINS = [
    # -- Major Ad/Tracking Networks --
    "doubleclick.net",
    "googlesyndication.com",
    "google-analytics.com",
    "googletagmanager.com",
    "googleadservices.com",
    "googletagservices.com",
    "googlesyndication.com",
    "2mdn.net",
    "adnxs.com",
    "adsrvr.org",
    "advertising.com",
    "amazon-adsystem.com",
    "analytics.google.com",
    "app-measurement.com",
    "appsflyer.com",
    "atdmt.com",
    "bidswitch.net",
    "bluekai.com",
    "casalemedia.com",
    "chartbeat.com",
    "chartbeat.net",
    "clicktale.net",
    "cloudflareinsights.com",
    "contextweb.com",
    "cpm-ad.com",
    "cpmstar.com",
    "criteo.com",
    "criteo.net",
    "crwdcntrl.net",
    "demdex.net",
    "dotomi.com",
    "doubleverify.com",
    "dpm.demdex.net",
    "eversttech.net",
    "exelator.com",
    "eyeota.net",
    "facebook.net",
    "fbcdn.net",
    "flashtalking.com",
    "fls.doubleclick.net",
    "hotjar.com",
    "hotjar.io",
    "ib-ibi.com",
    "id5-sync.com",
    "igodigital.com",
    "indexww.com",
    "iovation.com",
    "ipredictive.com",
    "krxd.net",
    "lijit.com",
    "liveintent.com",
    "liveramp.com",
    "lotame.com",
    "marketo.com",
    "marketo.net",
    "mathtag.com",
    "media.net",
    "mediamath.com",
    "ml314.com",
    "moatads.com",
    "mookie1.com",
    "myvisualiq.net",
    "narrative.io",
    "nativo.com",
    "newrelic.com",
    "nr-data.net",
    "omtrdc.net",
    "onetag-sys.com",
    "openx.net",
    "outbrain.com",
    "owneriq.net",
    "pardot.com",
    "parsely.com",
    "perimeterx.net",
    "pinterest.com",
    "pippio.com",
    "pubmatic.com",
    "quantcast.com",
    "quantserve.com",
    "rfihub.com",
    "rlcdn.com",
    "rubiconproject.com",
    "samba.tv",
    "scorecardresearch.com",
    "segment.com",
    "segment.io",
    "serving-sys.com",
    "sharethis.com",
    "simpli.fi",
    "sitescout.com",
    "smartadserver.com",
    "snapchat.com",
    "sojern.com",
    "spotxchange.com",
    "taboola.com",
    "tapad.com",
    "teads.tv",
    "tealiumiq.com",
    "thetradedesk.com",
    "tidaltv.com",
    "tiktok.com",
    "tribalfusion.com",
    "turn.com",
    "twitter.com",
    "tynt.com",
    "undertone.com",
    "urbanairship.com",
    "visualiq.com",
    "w55c.net",
    "yieldmo.com",
    "zedo.com",
    # -- CNAME Cloaking Known Targets --
    "omtrdc.net",
    "adobedtm.com",
    "eulerian.net",
    "at-o.net",
    "keyade.com",
    "storetail.io",
    "dnsdelegation.io",
    "tracedock.com",
    "a]kamaized.net",
    "edgekey.net",
    "akadns.net",
    # -- Fingerprinting Services --
    "fingerprintjs.com",
    "fpjs.io",
    "areyouamhuman.com",
    "perimeterx.net",
    "datadome.co",
    "hcaptcha.com",
    "sift.com",
    "siftscience.com",
    "shape.com",
    "distilnetworks.com",
    "imperva.com",
    "kasada.io",
]


def load_domains_from_file(filepath: str):
    """Load domains from a text file (one per line)."""
    domains = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                # Extract domain from various formats
                # Handle EasyList format: ||domain^
                if line.startswith('||') and line.endswith('^'):
                    domain = line[2:-1]
                elif line.startswith('||'):
                    domain = line[2:].split('^')[0].split('/')[0]
                else:
                    domain = line.split('/')[0]

                if domain and '.' in domain:
                    domains.append(domain.lower())
    return domains


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Build Bloom filter for tracker domains')
    parser.add_argument('--input', '-i', help='Input domain list file (one domain per line)')
    parser.add_argument('--output', '-o',
                        default=os.path.join(os.path.dirname(__file__), '..', '..',
                                             '02_Extension_App', 'core', 'data', 'tracker_bloom.bin'),
                        help='Output binary file path')
    parser.add_argument('--fp-rate', type=float, default=0.001,
                        help='Target false positive rate (default: 0.001)')

    args = parser.parse_args()

    # Load domains
    if args.input and os.path.exists(args.input):
        domains = load_domains_from_file(args.input)
        print(f"Loaded {len(domains)} domains from {args.input}")
    else:
        domains = BUILTIN_TRACKER_DOMAINS
        print(f"Using {len(domains)} built-in tracker domains")

    # Remove duplicates
    domains = list(set(domains))
    print(f"Unique domains: {len(domains)}")

    # Calculate optimal parameters
    size, num_hashes = calculate_optimal_params(len(domains), args.fp_rate)
    print(f"Bloom filter parameters: size={size} bits ({size // 8} bytes), k={num_hashes}")

    # Build the filter
    bf = BloomFilterBuilder(size, num_hashes)
    for domain in domains:
        bf.add(domain)

    # Verify all domains are present
    missing = [d for d in domains if not bf.has(d)]
    if missing:
        print(f"ERROR: {len(missing)} domains missing from filter!")
        for d in missing[:5]:
            print(f"  - {d}")
        sys.exit(1)

    # Test false positive rate with random non-tracker domains
    test_domains = [f"test{i}random{i*7}.example{i}.com" for i in range(10000)]
    false_positives = sum(1 for d in test_domains if bf.has(d))
    actual_fp_rate = false_positives / len(test_domains)
    print(f"Estimated false positive rate: {actual_fp_rate:.4f} (target: {args.fp_rate})")

    # Write output
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    data = bf.to_bytes()
    with open(args.output, 'wb') as f:
        f.write(data)

    print(f"Written {len(data)} bytes to {args.output}")
    print("Done!")


if __name__ == '__main__':
    main()
