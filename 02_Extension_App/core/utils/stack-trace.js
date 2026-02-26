/**
 * Stack Trace Capture Utility
 * 
 * Parses Error.stack to extract the calling script URL and location.
 * Used by CLAM to tag which script triggered a fingerprinting API call.
 * 
 * @module stack-trace
 */

/**
 * Capture the initiator (calling script) from the current stack trace.
 * Skips internal frames (this module and the API hook wrapper) to find
 * the actual caller.
 * 
 * @param {number} [skipFrames=2] - Number of stack frames to skip
 *   (default skips this function + the API hook wrapper)
 * @returns {{ scriptUrl: string, line: number, col: number, rawFrame: string }}
 */
export function captureInitiator(skipFrames = 2) {
    const error = new Error();
    const stack = error.stack || '';

    const result = {
        scriptUrl: 'unknown',
        line: 0,
        col: 0,
        rawFrame: ''
    };

    const lines = stack.split('\n');

    // Chrome stack format:
    //   Error
    //     at functionName (https://example.com/script.js:10:5)
    //     at https://example.com/script.js:20:3
    //
    // Skip the "Error" line + skipFrames
    const targetIndex = 1 + skipFrames;

    if (targetIndex >= lines.length) {
        return result;
    }

    const frame = lines[targetIndex].trim();
    result.rawFrame = frame;

    // Parse Chrome-style stack frames
    // Pattern 1: "at functionName (url:line:col)"
    // Pattern 2: "at url:line:col"
    const chromePattern = /at\s+(?:.*?\s+\()?((?:https?|chrome-extension):\/\/[^:)]+):(\d+):(\d+)\)?/;
    const match = frame.match(chromePattern);

    if (match) {
        result.scriptUrl = match[1];
        result.line = parseInt(match[2], 10);
        result.col = parseInt(match[3], 10);
    } else {
        // Fallback: try to extract any URL-like pattern
        const urlPattern = /((?:https?|chrome-extension):\/\/[^\s:)]+)/;
        const urlMatch = frame.match(urlPattern);
        if (urlMatch) {
            result.scriptUrl = urlMatch[1];
        }
    }

    return result;
}

/**
 * Extract the domain from a script URL.
 * 
 * @param {string} scriptUrl - Full script URL
 * @returns {string} Domain or 'unknown'
 */
export function getScriptDomain(scriptUrl) {
    try {
        const url = new URL(scriptUrl);
        return url.hostname;
    } catch {
        return 'unknown';
    }
}
