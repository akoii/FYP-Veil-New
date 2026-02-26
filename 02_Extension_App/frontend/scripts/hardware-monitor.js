// hardware-monitor.js (Isolated World)
// Bridge between Interceptor (Main World) and Background (Extension)

(function() {
    // 1. Listen for events from Interceptor (Page -> Background)
    const lastEvents = {}; // Deduplication cache

    // Store current settings locally to make decisions in event listeners
    let currentSettings = {
        camera: { blocked: false },
        microphone: { blocked: false },
        location: { blocked: false },
        notifications: { blocked: false }
    };
    
    // Store global settings separately to distinguish between "Allowed for Session" and "Globally Allowed"
    // Initialize to NULL to indicate not loaded yet
    let globalSettings = null;
    
    // Race Condition Fix: Queue events until settings are loaded
    let settingsLoaded = false;
    const pendingEvents = [];

    function handleHardwareEvent(detail) {
        const { type, payload } = detail || {};
        
        // Deduplication Logic
        // Prevent sending identical events within 2 seconds (Increased from 1s)
        const eventKey = `${payload.permission}-${payload.action}-${payload.details ? payload.details.reason : ''}`;
        const now = Date.now();
        if (lastEvents[eventKey] && (now - lastEvents[eventKey] < 2000)) {
            return; // Skip duplicate
        }
        lastEvents[eventKey] = now;

        // Forward to Background
        // We map 'type' to 'action' to match service worker conventions
        chrome.runtime.sendMessage({
            action: type, 
            payload: payload,
            url: window.location.href
        });

        // UI Logic
        const permissionType = payload.permission || 'Device';
        const isSilent = payload.details && payload.details.silent;

        if (isSilent) return;

        if (payload.action === 'blocked') {
            // Add to queue if not already in queue (prevent duplicates)
            if (!promptQueue.some(item => item.type === permissionType && item.mode === 'blocked')) {
                promptQueue.push({ type: permissionType, mode: 'blocked' });
                processPromptQueue();
            }
        } else if (payload.action === 'allowed') {
            // Check if this hardware is globally blocked (Toggle ON)
            // If it is blocked globally, but allowed here, it means we are in an "Allowed for Session" state.
            // In this case, we should NOT show the "Detected" toast.
            
            // Use globalSettings to check the actual toggle state, not the effective state
            // If globalSettings is null (shouldn't happen due to queue), assume false (safe default)
            const isGloballyBlocked = globalSettings && globalSettings[permissionType] && globalSettings[permissionType].blocked;

            if (isGloballyBlocked) {
                // User allowed this session, so don't annoy them with "Detected" popup
                return;
            }

            // Add to queue for informational popup
            if (!promptQueue.some(item => item.type === permissionType && item.mode === 'allowed')) {
                promptQueue.push({ type: permissionType, mode: 'allowed' });
                processPromptQueue();
            }
        }
    }

    document.addEventListener('veil-hardware-event', (e) => {
        if (!settingsLoaded) {
            pendingEvents.push(e.detail);
            return;
        }
        handleHardwareEvent(e.detail);
    });    // 2. Listen for messages from Background (Background -> Page)
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'hardware_settings') {
            // Update local cache
            if (message.settings) {
                currentSettings = message.settings;
            }
            if (message.globalSettings) {
                globalSettings = message.globalSettings;
            }

            // Dispatch to Page Script via CustomEvent
            document.dispatchEvent(new CustomEvent('veil-hardware-settings-updated', {
                detail: { settings: message.settings }
            }));
            
            // Also dispatch via postMessage as a backup (more robust across worlds)
            window.postMessage({
                type: 'VEIL_HARDWARE_SETTINGS_UPDATE',
                settings: message.settings
            }, '*');

            // Flush pending events if any
            if (!settingsLoaded) {
                settingsLoaded = true;
                while (pendingEvents.length > 0) {
                    handleHardwareEvent(pendingEvents.shift());
                }
            }
        }
    });

    // 3. INITIALIZATION: Fetch current settings immediately on load
    // This ensures new tabs get the correct blocking rules right away
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
        if (response && response.settings) {
            currentSettings = response.settings; // Update local cache
            if (response.globalSettings) {
                globalSettings = response.globalSettings;
            }
            document.dispatchEvent(new CustomEvent('veil-hardware-settings-updated', {
                detail: { settings: response.settings }
            }));
            
            // Flush pending events
            settingsLoaded = true;
            while (pendingEvents.length > 0) {
                handleHardwareEvent(pendingEvents.shift());
            }
        }
    });    console.log('[Veil] Hardware Monitor Bridge Phase 2 Active');

    // 4. BLOCKING PROMPT UI

    // Queue system for sequential popups
    const promptQueue = [];
    let isPromptShowing = false;
    const recentlyShown = new Map(); // Key -> Timestamp to prevent spam

    function processPromptQueue() {
        if (isPromptShowing || promptQueue.length === 0) return;

        const nextItem = promptQueue[0]; // Peek first

        // Check if this specific popup was shown recently (within 5 seconds)
        const key = `${nextItem.type}-${nextItem.mode}`;
        const now = Date.now();

        if (recentlyShown.has(key) && (now - recentlyShown.get(key) < 5000)) {
            // Skip this item as it's a duplicate/spam
            promptQueue.shift(); // Remove it
            processPromptQueue(); // Try next
            return;
        }

        // Process it
        promptQueue.shift(); // Remove from queue
        recentlyShown.set(key, now);

        if (nextItem.mode === 'blocked') {
            showBlockingPrompt(nextItem.type);
        } else if (nextItem.mode === 'allowed') {
            showDetectionToast(nextItem.type);
        }
    }

    function showDetectionToast(type) {
        // Check if user has disabled detection notifications
        chrome.storage.local.get(['hardwareDetectionNotifications'], (res) => {
            // Default to TRUE if not set
            const notificationsEnabled = res.hardwareDetectionNotifications !== false;

            if (!notificationsEnabled) {
                // Skip showing toast, but process next item in queue
                isPromptShowing = false;
                setTimeout(processPromptQueue, 100);
                return;
            }

            isPromptShowing = true;

            const toast = document.createElement('div');
            const shadow = toast.attachShadow({ mode: 'open' });

            // Auto-dismiss after 5 seconds (Increased from 3s)
            const autoDismissTimer = setTimeout(() => {
                closeToast();
            }, 5000);

            const closeToast = () => {
                if (toast.isConnected) {
                    toast.remove();
                    isPromptShowing = false;
                    clearTimeout(autoDismissTimer);
                    // Increased delay between popups for better UX (1s)
                    setTimeout(processPromptQueue, 1000);
                }
            };

            const disableNotifications = () => {
                chrome.storage.local.set({ hardwareDetectionNotifications: false }, () => {
                    console.log('[Veil] Hardware detection notifications disabled');
                    closeToast();
                });
            };

            shadow.innerHTML = `
                <style>
                    .veil-info-toast {
                        position: fixed;
                        top: 24px; /* Moved to Top Right */
                        right: 24px;
                        z-index: 2147483647;
                        background: rgba(16, 19, 58, 0.95);
                        color: #fff;
                        padding: 12px 16px;
                        border-radius: 12px;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        box-shadow: 0 8px 16px rgba(0,0,0,0.3);
                        font-family: 'Inter', system-ui, sans-serif;
                        font-size: 13px;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                        max-width: 320px;
                    }
                    
                    .icon-box {
                        width: 32px;
                        height: 32px;
                        background: rgba(235, 255, 61, 0.1);
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #EBFF3D;
                        flex-shrink: 0;
                    }

                    .content {
                        flex: 1;
                    }

                    .title {
                        font-weight: 600;
                        margin-bottom: 2px;
                        color: #EBFF3D;
                    }

                    .desc {
                        color: #94a3b8;
                        font-size: 11px;
                    }

                    .actions {
                        display: flex;
                        gap: 8px;
                        margin-top: 4px;
                    }

                    .action-link {
                        background: none;
                        border: none;
                        color: #64748b;
                        font-size: 10px;
                        padding: 0;
                        cursor: pointer;
                        text-decoration: underline;
                    }
                    .action-link:hover {
                        color: #fff;
                    }

                    .close-btn {
                        background: none;
                        border: none;
                        color: #64748b;
                        cursor: pointer;
                        padding: 4px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 4px;
                        align-self: flex-start;
                    }
                    .close-btn:hover {
                        background: rgba(255,255,255,0.1);
                        color: #fff;
                    }

                    @keyframes slideDown {
                        from { transform: translateY(-20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                </style>
                <div class="veil-info-toast">
                    <div class="icon-box">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    </div>
                    <div class="content">
                        <div class="title">${type.charAt(0).toUpperCase() + type.slice(1)} Detected</div>
                        <div class="desc">Veil is monitoring this access. Toggle ON to block.</div>
                        <div class="actions">
                            <button class="action-link" id="disable-notifs">Don't show again</button>
                        </div>
                    </div>
                    <button class="close-btn" id="close-toast">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            `;

            document.body.appendChild(toast);
            shadow.getElementById('close-toast').onclick = closeToast;
            shadow.getElementById('disable-notifs').onclick = disableNotifications;
        });
    }

    function showBlockingPrompt(type) {
        isPromptShowing = true;

        // Icons mapping
        const icons = {
            camera: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>',
            microphone: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>',
            location: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
            notifications: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
            default: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>'
        };

        const iconSvg = icons[type] || icons.default;
        const titleType = type.charAt(0).toUpperCase() + type.slice(1);

        const prompt = document.createElement('div');
        prompt.id = 'veil-blocking-prompt';

        // Using Shadow DOM to isolate styles from the page
        const shadow = prompt.attachShadow({ mode: 'open' });

        const container = document.createElement('div');
        container.className = 'veil-popup';

        container.innerHTML = `
            <style>
                .veil-popup {
                    position: fixed;
                    top: 24px;
                    right: 24px;
                    z-index: 2147483647;
                    width: 340px;
                    background: rgba(16, 19, 58, 0.95); /* Deep Blue from Dashboard */
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(235, 255, 61, 0.2); /* Neon Yellow Border */
                    border-radius: 16px;
                    box-shadow: 
                        0 4px 6px -1px rgba(0, 0, 0, 0.2),
                        0 2px 4px -1px rgba(0, 0, 0, 0.1),
                        0 20px 25px -5px rgba(0, 0, 0, 0.6);
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    color: #fff;
                    overflow: hidden;
                    animation: veilSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    box-sizing: border-box;
                }

                .veil-header {
                    display: flex;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    background: linear-gradient(to right, rgba(235, 255, 61, 0.05), transparent);
                }

                .veil-icon-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: rgba(239, 68, 68, 0.2); /* Red tint for Blocked state */
                    color: #ef4444; /* Red 500 */
                    margin-right: 12px;
                }

                .veil-title-group {
                    flex: 1;
                }

                .veil-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #fff;
                    margin: 0;
                    line-height: 1.2;
                }

                .veil-subtitle {
                    font-size: 11px;
                    color: #94a3b8; /* Slate 400 */
                    margin-top: 2px;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .veil-close-btn {
                    background: transparent;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .veil-close-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }

                .veil-content {
                    padding: 16px 20px;
                }

                .veil-message {
                    font-size: 13px;
                    line-height: 1.5;
                    color: #cbd5e1; /* Slate 300 */
                    margin: 0 0 16px 0;
                }

                .veil-actions {
                    display: flex;
                    gap: 10px;
                }

                .veil-btn {
                    flex: 1;
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                    outline: none;
                }

                .veil-btn-primary {
                    background: #EBFF3D; /* Neon Yellow */
                    color: #10133a; /* Dark Blue Text */
                    box-shadow: 0 2px 4px rgba(235, 255, 61, 0.2);
                }

                .veil-btn-primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(235, 255, 61, 0.4);
                    filter: brightness(1.05);
                }

                .veil-btn-primary:active {
                    transform: translateY(0);
                }

                @keyframes veilSlideIn {
                    from {
                        opacity: 0;
                        transform: translateX(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }
            </style>

            <div class="veil-header">
                <div class="veil-icon-wrapper">
                    ${iconSvg}
                </div>
                <div class="veil-title-group">
                    <div class="veil-title">Access Blocked</div>
                    <div class="veil-subtitle">Veil Privacy Shield</div>
                </div>
                <button class="veil-close-btn" id="veil-close">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div class="veil-content">
                <p class="veil-message">
                    Veil prevented this website from accessing your <strong>${titleType}</strong> to protect your digital privacy.
                </p>
                <div class="veil-actions">
                    <button class="veil-btn veil-btn-primary" id="veil-allow">
                        Allow for this Session
                    </button>
                </div>
            </div>
        `;

        shadow.appendChild(container);
        document.body.appendChild(prompt);

        const closePopup = () => {
            prompt.remove();
            isPromptShowing = false;
            // Process next item in queue after a short delay
            setTimeout(processPromptQueue, 1000);
        };

        shadow.getElementById('veil-close').onclick = closePopup;

        shadow.getElementById('veil-allow').onclick = () => {
            prompt.remove();
            isPromptShowing = false;

            // Send message to background to allow this session
            chrome.runtime.sendMessage({
                action: 'allowSession',
                type: type,
                domain: window.location.hostname
            }, (response) => {
                if (response && response.success) {
                    // Show success toast
                    showSuccessToast(type);
                }
            });

            // Process next item in queue
            setTimeout(processPromptQueue, 1000);
        };
    }

    function showSuccessToast(type) {
        const toast = document.createElement('div');
        const shadow = toast.attachShadow({ mode: 'open' });

        shadow.innerHTML = `
            <style>
                .veil-toast {
                    position: fixed;
                    top: 24px;
                    right: 24px;
                    z-index: 2147483647;
                    background: #10b981; /* Emerald 500 */
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    font-family: 'Inter', system-ui, sans-serif;
                    font-size: 14px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    animation: veilToastIn 0.3s ease, veilToastOut 0.3s ease 2.7s forwards;
                }
                @keyframes veilToastIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes veilToastOut {
                    to { opacity: 0; transform: translateY(-10px); }
                }
            </style>
            <div class="veil-toast">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>${type.charAt(0).toUpperCase() + type.slice(1)} allowed for this session</span>
            </div>
        `;

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3100);
    }

    // Listen for 'blocked' events to trigger the prompt
    // Note: This listener is now redundant as logic is moved to handleHardwareEvent
    // But we keep it for backward compatibility if other scripts dispatch it directly
    // document.addEventListener('veil-hardware-event', ...); 
    // (Already handled above with the new listener that calls handleHardwareEvent)
})();
