// hardware-interceptor.js (Main World)
// Injected directly into the page to wrap native APIs.
// NO access to chrome.* APIs here.

(function() {
    // 1. State Management
    // Default to ALLOWED. We do NOT use sessionStorage anymore to avoid stale blocking.
    let VEIL_HW_SETTINGS = {
        camera: { blocked: false },
        microphone: { blocked: false },
        location: { blocked: false },
        notifications: { blocked: false }
    };

    // Promise to wait for fresh settings from Background
    let settingsResolver;
    const settingsReady = new Promise(resolve => settingsResolver = resolve);
    let hasReceivedFreshSettings = false;

    // --- ACTIVE STREAM TRACKING (Real-time Blocking) ---
    const ACTIVE_STREAMS = new Set();

    function trackStream(stream) {
        ACTIVE_STREAMS.add(stream);
        // Clean up when stream ends naturally
        stream.getTracks().forEach(track => {
            track.addEventListener('ended', () => {
                if (stream.active === false) {
                    ACTIVE_STREAMS.delete(stream);
                }
            });
        });
    }

    function enforceBlockingOnActiveStreams() {
        const camBlocked = VEIL_HW_SETTINGS.camera && VEIL_HW_SETTINGS.camera.blocked;
        const micBlocked = VEIL_HW_SETTINGS.microphone && VEIL_HW_SETTINGS.microphone.blocked;

        if (!camBlocked && !micBlocked) return;

        ACTIVE_STREAMS.forEach(stream => {
            if (!stream.active) {
                ACTIVE_STREAMS.delete(stream);
                return;
            }

            if (camBlocked) {
                const videoTracks = stream.getVideoTracks();
                if (videoTracks.length > 0) {
                    console.warn('[Veil] Killing active camera stream due to settings change.');
                    videoTracks.forEach(track => track.stop());
                    reportAccess('camera', false, { reason: 'realtime_kill' });
                }
            }

            if (micBlocked) {
                const audioTracks = stream.getAudioTracks();
                if (audioTracks.length > 0) {
                    console.warn('[Veil] Killing active microphone stream due to settings change.');
                    audioTracks.forEach(track => track.stop());
                    reportAccess('microphone', false, { reason: 'realtime_kill' });
                }
            }
        });
    }

    // 2. Listen for updates from the Content Script (hardware-monitor.js)
    document.addEventListener('veil-hardware-settings-updated', (e) => {
        if (e.detail && e.detail.settings) {
            VEIL_HW_SETTINGS = e.detail.settings;
            hasReceivedFreshSettings = true;

            // Unblock any waiting API calls
            if (settingsResolver) settingsResolver();

            // Enforce new settings on existing streams immediately
            enforceBlockingOnActiveStreams();
        }
    });

    // 3. Helper to report events
    function reportAccess(type, allowed, details = {}) {
        document.dispatchEvent(new CustomEvent('veil-hardware-event', {
            detail: {
                type: 'hardware_event',
                payload: {
                    timestamp: Date.now(),
                    permission: type, // FIXED: Changed 'type' to 'permission' to match Service Worker
                    action: allowed ? 'allowed' : 'blocked',
                    details: details
                }
            }
        }));
    }

    // Throttled reporter for permission queries to avoid spam
    const lastLogTime = {};

    function throttledReport(type, allowed, details) {
        const now = Date.now();
        const key = `${type}-${allowed}-${details.reason}`;
        if (lastLogTime[key] && (now - lastLogTime[key] < 5000)) {
            return; // Skip
        }
        lastLogTime[key] = now;
        reportAccess(type, allowed, details);
    }

    // 4. API Wrappers

    // --- Permissions API (Detects checks before getUserMedia is called) ---
    if (navigator.permissions && navigator.permissions.query) {
        const originalQuery = navigator.permissions.query.bind(navigator.permissions);

        navigator.permissions.query = async function(descriptor) {
            try {
                // Wait for settings if needed (optional, but good for accuracy)
                if (!hasReceivedFreshSettings) {
                    const timeout = new Promise(r => setTimeout(r, 500));
                    await Promise.race([settingsReady, timeout]);
                }

                const status = await originalQuery(descriptor);
                const name = descriptor.name;

                // Map permission names to Veil types
                let veilType = null;
                if (name === 'camera') veilType = 'camera';
                if (name === 'microphone') veilType = 'microphone';
                if (name === 'geolocation') veilType = 'location';
                if (name === 'notifications') veilType = 'notifications';

                if (veilType) {
                    // Check if Veil is blocking this type
                    const isVeilBlocking = VEIL_HW_SETTINGS[veilType] && VEIL_HW_SETTINGS[veilType].blocked;

                    // If the browser says 'denied' AND Veil is blocking, it's likely due to Veil
                    if (status.state === 'denied' && isVeilBlocking) {
                        throttledReport(veilType, false, { reason: 'permission_query_check' });
                    }
                }
                return status;
            } catch (err) {
                throw err;
            }
        };
    }

    // --- Camera & Microphone (navigator.mediaDevices.getUserMedia) ---
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const originalGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

        navigator.mediaDevices.getUserMedia = async function(constraints) {
            // Wait for fresh settings if we haven't received them yet
            // This prevents race conditions where we block based on stale cache
            if (!hasReceivedFreshSettings) {
                // console.log('[Veil] Waiting for settings...');
                const timeout = new Promise(r => setTimeout(r, 4000)); // Increased to 4s to allow SW wake-up
                await Promise.race([settingsReady, timeout]);
                if (!hasReceivedFreshSettings) {
                    console.warn('[Veil] Settings fetch timed out. Defaulting to ALLOW.');
                }
            }

            const requestingVideo = !!(constraints && (constraints.video || constraints.video === true));
            const requestingAudio = !!(constraints && (constraints.audio || constraints.audio === true));

            // Check blocking
            const camBlocked = VEIL_HW_SETTINGS.camera && VEIL_HW_SETTINGS.camera.blocked;
            const micBlocked = VEIL_HW_SETTINGS.microphone && VEIL_HW_SETTINGS.microphone.blocked;

            let isBlocked = false;

            if (requestingVideo && camBlocked) {
                console.warn('[Veil] Blocking Camera Access');
                reportAccess('camera', false, { origin: window.location.origin, reason: 'veil_blocked' });
                isBlocked = true;
            }
            if (requestingAudio && micBlocked) {
                console.warn('[Veil] Blocking Microphone Access');
                reportAccess('microphone', false, { origin: window.location.origin, reason: 'veil_blocked' });
                isBlocked = true;
            }

            if (isBlocked) {
                return Promise.reject(new DOMException('Permission denied by Veil', 'NotAllowedError'));
            }

            // If allowed by Veil, proceed to Browser/User check
            try {
                const stream = await originalGUM(constraints);

                // Track this stream for real-time blocking
                trackStream(stream);

                // Log 'Allowed' (which user interprets as 'Detected' when toggle is OFF)
                if (requestingVideo) reportAccess('camera', true);
                if (requestingAudio) reportAccess('microphone', true);
                return stream;
            } catch (err) {
                // If the BROWSER or USER denied it, we should still log it!
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    if (requestingVideo) reportAccess('camera', false, { reason: 'browser_denied' });
                    if (requestingAudio) reportAccess('microphone', false, { reason: 'browser_denied' });
                }
                throw err;
            }
        };
    }

    // --- Geolocation ---
    if (navigator.geolocation) {
        const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
        const originalWatchPosition = navigator.geolocation.watchPosition.bind(navigator.geolocation);

        navigator.geolocation.getCurrentPosition = function(success, error, options) {
            // Note: Geolocation is callback-based, so we can't easily await the settings promise here
            // without changing the function signature. We rely on the cache or default for now.
            // However, we can check if settings are fresh enough? 
            // For now, we'll just use what we have.

            const locBlocked = VEIL_HW_SETTINGS.location && VEIL_HW_SETTINGS.location.blocked;

            if (locBlocked) {
                reportAccess('location', false, { reason: 'veil_blocked' });
                if (error) {
                    error({ code: 1, message: 'User denied Geolocation (Veil)' });
                }
                return;
            }

            // Wrap callbacks to detect browser denial
            const wrappedError = (err) => {
                if (err.code === 1) { // PERMISSION_DENIED
                    reportAccess('location', false, { reason: 'browser_denied' });
                }
                if (error) error(err);
            };

            const wrappedSuccess = (pos) => {
                reportAccess('location', true);
                if (success) success(pos);
            };

            return originalGetCurrentPosition(wrappedSuccess, wrappedError, options);
        };

        navigator.geolocation.watchPosition = function(success, error, options) {
            const locBlocked = VEIL_HW_SETTINGS.location && VEIL_HW_SETTINGS.location.blocked;

            if (locBlocked) {
                reportAccess('location', false, { reason: 'veil_blocked' });
                if (error) {
                    error({ code: 1, message: 'User denied Geolocation (Veil)' });
                }
                return 0; // Dummy ID
            }

            const wrappedError = (err) => {
                if (err.code === 1) reportAccess('location', false, { reason: 'browser_denied' });
                if (error) error(err);
            };

            const wrappedSuccess = (pos) => {
                reportAccess('location', true);
                if (success) success(pos);
            };

            return originalWatchPosition(wrappedSuccess, wrappedError, options);
        };
    }

    // --- Notifications ---
    if (window.Notification) {
        const originalRequestPermission = window.Notification.requestPermission.bind(window.Notification);

        window.Notification.requestPermission = function(callback) {
            const notifBlocked = VEIL_HW_SETTINGS.notifications && VEIL_HW_SETTINGS.notifications.blocked;

            if (notifBlocked) {
                reportAccess('notifications', false, { reason: 'veil_blocked' });
                const result = 'denied';
                if (callback) callback(result);
                return Promise.resolve(result);
            }

            return originalRequestPermission().then(permission => {
                const granted = permission === 'granted';
                reportAccess('notifications', granted, { reason: granted ? 'allowed' : 'browser_denied' });
                if (callback) callback(permission);
                return permission;
            });
        };
    }

    console.log('[Veil] Hardware Interceptor Active (Main World)');

})();
