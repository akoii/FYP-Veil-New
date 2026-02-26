// Dashboard Page JavaScript

// ===== COOKIE MANAGEMENT STATE =====
let allCookies = [];
let displayedCookies = [];
let activeTabOnly = false;
let searchQuery = '';
let scoreChartInstance = null;  // Score breakdown chart reference

// ===== TRACKING HISTORY STATE =====
let trackingChartInstance = null;
let currentTimeframe = '30d'; // Default timeframe
const TIMEFRAME_SESSION_KEY = 'veil_tracking_timeframe';

// Initialize charts when page loads
document.addEventListener('DOMContentLoaded', function () {
    initializeCharts();
    animateElements();
    initializeScrollNavigation();
    initializeSidebarNavigation(); // ✅ CSP-compliant sidebar click handlers
    initializeCookieManagement(); // ✅ NEW: Initialize cookie feature
    initializeTimeframeToggle(); // ✅ NEW: Initialize timeframe toggle
    initializeHardwareControls(); // ✅ NEW: Initialize hardware controls
    initializeFingerprintPanel(); // ✅ NEW: Initialize fingerprint panel
    initializeDNSPanel(); // ✅ NEW: Initialize DNS security panel
    loadDashboardStats(); // ✅ Dynamic data loading
    setInterval(loadDashboardStats, 5000); // Auto-refresh every 5s

    // Check if running in overlay mode
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'overlay') {
        setupOverlayMode();
    }
});

function setupOverlayMode() {
    // Change "Back" button to "Close"
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.innerHTML = '✕ Close';
        backBtn.onclick = (e) => {
            e.preventDefault();
            // Send message to content script to close overlay
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'closeDashboardOverlay' });
                } else {
                    // Fallback if we can't find the tab (unlikely in overlay)
                    // Try sending to runtime, hoping content script listens there too?
                    // Actually, since we are in an iframe, we can message the parent window via postMessage
                    // OR use runtime messaging if the content script listens to runtime messages (which it does)
                    chrome.tabs.getCurrent((tab) => {
                        if (tab) {
                            chrome.tabs.sendMessage(tab.id, { action: 'closeDashboardOverlay' });
                        }
                    });
                }
            });
        };

        // Better approach for iframe:
        backBtn.onclick = (e) => {
            e.preventDefault();
            // Send message to background, which forwards to content script
            // OR simply use chrome.tabs.query to find the active tab and message it
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "closeDashboardOverlay" });
                }
            });
        };
    }

    // Adjust styles for overlay
    document.body.style.backgroundColor = 'transparent';
}

function initializeCharts() {
    // Score Breakdown Pie Chart - Navy Family Theme Colors
    const scoreCtx = document.getElementById('scoreChart').getContext('2d');
    scoreChartInstance = new Chart(scoreCtx, {
        type: 'doughnut',
        data: {
            labels: ['Cookies', 'DNS Security', 'Fingerprinting', 'Hardware'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    '#EBFF3D', // Cookies
                    '#4DD4E8', // DNS
                    '#9D7AEA', // Fingerprinting
                    '#FF8C69'  // Hardware
                ],
                borderWidth: 3,
                borderColor: '#10133a' // Segment gaps
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#FFFFFF',
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11 },
                        generateLabels: function (chart) {
                            const data = chart.data;
                            return data.labels.map((label, i) => ({
                                text: `${label}: ${data.datasets[0].data[i]}`,
                                fillStyle: data.datasets[0].backgroundColor[i],
                                strokeStyle: 'transparent',
                                pointStyle: 'circle',
                                index: i
                            }));
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(16, 19, 58, 0.95)',
                    titleColor: '#EBFF3D',
                    bodyColor: 'rgba(255, 255, 255, 0.9)',
                    borderColor: 'rgba(235, 255, 61, 0.3)',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: function (context) {
                            return ` ${context.label}: ${context.parsed}`;
                        }
                    }
                }
            },
            cutout: '75%',
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 800
            }
        }
    });

    // Tracking History Line Chart - Initialize with stored timeframe
    const storedTimeframe = sessionStorage.getItem(TIMEFRAME_SESSION_KEY);
    if (storedTimeframe) {
        currentTimeframe = storedTimeframe;
    }

    const trackingCtx = document.getElementById('trackingChart').getContext('2d');
    trackingChartInstance = new Chart(trackingCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Cookies',
                    data: [],
                    borderColor: '#EBFF3D',
                    backgroundColor: 'rgba(235, 255, 61, 0.15)',
                    borderWidth: 2,
                    fill: 'origin',
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#EBFF3D',
                    pointBorderColor: '#EBFF3D',
                    order: 4
                },
                {
                    label: 'DNS Security',
                    data: [],
                    borderColor: '#4DD4E8',
                    backgroundColor: 'rgba(77, 212, 232, 0.15)',
                    borderWidth: 2,
                    fill: 'origin',
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#4DD4E8',
                    pointBorderColor: '#4DD4E8',
                    order: 3
                },
                {
                    label: 'Fingerprinting',
                    data: [],
                    borderColor: '#9D7AEA',
                    backgroundColor: 'rgba(157, 122, 234, 0.15)',
                    borderWidth: 2,
                    fill: 'origin',
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#9D7AEA',
                    pointBorderColor: '#9D7AEA',
                    order: 2
                },
                {
                    label: 'Hardware',
                    data: [],
                    borderColor: '#FF8C69',
                    backgroundColor: 'rgba(255, 140, 105, 0.15)',
                    borderWidth: 2,
                    fill: 'origin',
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#FF8C69',
                    pointBorderColor: '#FF8C69',
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: 'rgba(255,255,255,0.7)',
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 12,
                        font: { size: 10 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(16, 19, 58, 0.95)',
                    titleColor: '#EBFF3D',
                    bodyColor: 'rgba(255, 255, 255, 0.9)',
                    borderColor: 'rgba(235, 255, 61, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        afterBody: function (items) {
                            const total = items.reduce((sum, item) => sum + (item.parsed.y || 0), 0);
                            return `─────────\nTotal: ${total}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255,255,255,0.6)' }
                },
                y: {
                    stacked: true,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: 'rgba(255,255,255,0.6)' },
                    beginAtZero: true,
                    max: 50
                }
            },
            animation: {
                duration: 300,
                easing: 'easeInOutQuad'
            }
        }
    });
}

/**
 * Load real-time stats from storage and update all dashboard summary elements.
 * Called once at DOMContentLoaded and every 5 seconds thereafter.
 */
function loadDashboardStats() {
    if (typeof chrome === 'undefined' || !chrome.runtime) return;

    chrome.runtime.sendMessage({ action: 'getStats' }, (data) => {
        if (chrome.runtime.lastError) {
            console.warn('[Veil Dashboard] loadDashboardStats:', chrome.runtime.lastError.message);
            return;
        }
        if (!data) return;

        // --- Privacy Score ---
        const score = data.privacyScore || 0;
        const scoreEl = document.getElementById('dashboardScoreValue');
        if (scoreEl) scoreEl.textContent = score;

        // --- Tier Badge ---
        const tier = data.privacyTier || { name: 'Exposed', icon: '🛑', color: '#FF4444' };
        const tierBadge = document.getElementById('tierBadge');
        if (tierBadge) {
            tierBadge.textContent = `${tier.icon} ${tier.name}`;
            tierBadge.style.backgroundColor = tier.color + '20';
            tierBadge.style.color = tier.color;
        }

        // --- Score Ring (color + stroke) ---
        const ring = document.getElementById('scoreRingCircle');
        if (ring) {
            const circumference = 2 * Math.PI * 40; // r=40
            const offset = circumference - (score / 100) * circumference;
            ring.style.strokeDasharray = circumference;
            ring.style.strokeDashoffset = offset;
            ring.setAttribute('stroke', tier.color);
            // Micro-animation: re-trigger ring-score-pop on every score update (Phase 8)
            ring.classList.remove('score-ring-updated');
            void ring.offsetWidth; // reflow
            ring.classList.add('score-ring-updated');
        }

        // --- Sub-Scores ---
        const sub = data.privacySubScores || { cookies: 0, dns: 0, fingerprinting: 0, hardware: 0 };
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        // (Sub-score icon cards and center text removed from UI)

        // --- Blocked Items Summary Cards ---
        const totalDetected = data.totalCookiesDetected || 0;
        const dns = data.dnsRequestsBlocked || 0;
        const fp = data.fingerprintingBlocked || 0;

        let hw = 0;
        if (data.hardwareAccessBlocked && typeof data.hardwareAccessBlocked === 'object') {
            hw = Object.values(data.hardwareAccessBlocked).reduce((a, b) => a + (b || 0), 0);
        }

        const setCount = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val.toLocaleString();
        };

        setCount('blockedCookiesCount', totalDetected);
        setCount('blockedDnsCount', dns);
        setCount('blockedFpCount', fp);
        setCount('blockedHwCount', hw);

        // Total cookies blocked (hero card in cookies section — actual blocked count)
        setCount('totalCookiesBlocked', data.cookiesBlocked || 0);

        // If no stored total yet, do a live count via chrome.cookies API
        if (totalDetected === 0 && typeof chrome !== 'undefined' && chrome.cookies) {
            chrome.cookies.getAll({}, (cookies) => {
                if (cookies && cookies.length > 0) {
                    setCount('blockedCookiesCount', cookies.length);
                }
            });
        }

        // --- Score Breakdown Chart (blocked counts — same data as tracking history) ---
        if (scoreChartInstance) {
            const allZero = totalDetected === 0 && dns === 0 && fp === 0 && hw === 0;
            if (allZero) {
                // Empty state: grey even segments
                scoreChartInstance.data.datasets[0].data = [25, 25, 25, 25];
                scoreChartInstance.data.datasets[0].backgroundColor = [
                    'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.08)',
                    'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.08)'
                ];
            } else {
                scoreChartInstance.data.datasets[0].data = [
                    totalDetected, dns, fp, hw
                ];
                scoreChartInstance.data.datasets[0].backgroundColor = [
                    '#EBFF3D', '#4DD4E8', '#9D7AEA', '#FF8C69'
                ];
            }
            scoreChartInstance.update('none');
        }
    });
}

function animateElements() {
    // Add staggered animations
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach((el, index) => {
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Scroll-based navigation
function initializeScrollNavigation() {
    const mainContent = document.getElementById('main-content');
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.sidebar-item[data-section]');

    // Intersection Observer for scroll highlighting
    const observerOptions = {
        root: mainContent,
        rootMargin: '-45% 0px -45% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove active class from all nav items
                navItems.forEach(item => {
                    item.classList.remove('active');
                    item.classList.add('text-white/70');
                    item.classList.remove('text-primary');
                });

                // Add active class to current section's nav item
                const activeNavItem = document.querySelector(`[data-section="${entry.target.id}"]`);
                if (activeNavItem) {
                    activeNavItem.classList.add('active');
                    activeNavItem.classList.remove('text-white/70');
                    activeNavItem.classList.add('text-primary');
                }
            }
        });
    }, observerOptions);

    // Observe all sections
    sections.forEach(section => observer.observe(section));
}

// ===== CSP-COMPLIANT SIDEBAR NAVIGATION =====
// Replaces inline onclick handlers with addEventListener (required for Chrome Extension CSP)
function initializeSidebarNavigation() {
    // Sidebar nav links — use data-section attribute to determine target
    document.querySelectorAll('.sidebar-item[data-section]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            if (sectionId) scrollToSection(sectionId);
        });
    });

    // Back button in header
    const backBtn = document.getElementById('backBtn');
    if (backBtn && !backBtn.hasAttribute('data-handler-attached')) {
        backBtn.setAttribute('data-handler-attached', 'true');
        backBtn.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = '../index.html';
        });
    }
}

// Smooth scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    const mainContent = document.getElementById('main-content');

    if (section && mainContent) {
        const offsetTop = section.offsetTop - 80; // Account for header padding
        mainContent.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }

    // Prevent default link behavior
    return false;
}

// Update header title based on current section
function updateHeaderTitle() {
    const sections = document.querySelectorAll('section[id]');
    const header = document.querySelector('header h1');
    const mainContent = document.getElementById('main-content');

    const observerOptions = {
        root: mainContent,
        rootMargin: '-45% 0px -45% 0px',
        threshold: 0
    };

    const titleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                let title = 'Dashboard';

                switch (sectionId) {
                    case 'cookies-section':
                        title = 'Cookies';
                        break;
                    case 'dns-section':
                        title = 'DNS';
                        break;
                    case 'fingerprinting-section':
                        title = 'Fingerprinting';
                        break;
                    case 'hardware-section':
                        title = 'Hardware Access';
                        break;
                }

                if (header) {
                    header.textContent = title;
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => titleObserver.observe(section));
}

// Initialize header title updates
document.addEventListener('DOMContentLoaded', function () {
    updateHeaderTitle();
});

// ===== COOKIE MANAGEMENT FUNCTIONS =====

/**
 * Initialize cookie management feature
 */
async function initializeCookieManagement() {
    console.log('[Dashboard] Initializing cookie management...');

    // Check if CookieManager is loaded
    if (typeof CookieManager === 'undefined') {
        console.error('[Dashboard] CookieManager not loaded!');
        showCookieError('Cookie manager failed to load. Please reload the extension.');
        return;
    }

    // Setup event listeners
    setupCookieEventListeners();

    // Load cookies
    await loadCookies();
}

/**
 * Setup event listeners for cookie controls
 */
function setupCookieEventListeners() {
    const viewToggle = document.getElementById('cookieViewToggle');
    const searchInput = document.getElementById('cookieSearchInput');
    const refreshBtn = document.getElementById('refreshCookiesBtn');

    // View toggle (All Cookies vs Active Tab)
    if (viewToggle) {
        viewToggle.addEventListener('change', async function (e) {
            activeTabOnly = e.target.checked;
            console.log('[Dashboard] View mode:', activeTabOnly ? 'Active Tab' : 'All Cookies');

            // Mutual Exclusivity: If Active Tab is checked, disable search
            if (activeTabOnly) {
                if (searchInput) {
                    searchInput.value = '';
                    searchInput.disabled = true;
                    searchInput.placeholder = "Disabled in Active Tab mode";
                    searchInput.classList.add('opacity-50', 'cursor-not-allowed');
                    searchQuery = '';
                }
            } else {
                if (searchInput) {
                    searchInput.disabled = false;
                    searchInput.placeholder = "Search by name or domain...";
                    searchInput.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }

            // Show/hide site info banner
            const siteInfo = document.getElementById('currentSiteInfo');
            if (siteInfo) {
                siteInfo.classList.toggle('hidden', !activeTabOnly);
            }

            await loadCookies();
        });
    }

    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            searchQuery = e.target.value;
            console.log('[Dashboard] Search query:', searchQuery);

            // Mutual Exclusivity: If searching, disable Active Tab toggle
            if (searchQuery.length > 0) {
                if (viewToggle) {
                    viewToggle.checked = false;
                    viewToggle.disabled = true;
                    viewToggle.parentElement.classList.add('opacity-50', 'cursor-not-allowed');

                    // If we were in active tab mode, switch out of it
                    if (activeTabOnly) {
                        activeTabOnly = false;
                        const siteInfo = document.getElementById('currentSiteInfo');
                        if (siteInfo) siteInfo.classList.add('hidden');
                        // We need to reload all cookies because we were filtering by tab
                        loadCookies();
                        return; // loadCookies will trigger render
                    }
                }
            } else {
                if (viewToggle) {
                    viewToggle.disabled = false;
                    viewToggle.parentElement.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }

            filterAndRenderCookies();
        });
    }

    // Refresh button
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function () {
            console.log('[Dashboard] Refreshing cookies...');
            await loadCookies();
        });
    }

    // 🆕 Blocked Cookies Accordion Toggle
    const blockedHeader = document.getElementById('blockedCookiesHeader');
    const blockedContent = document.getElementById('blockedCookiesContent');
    const blockedChevron = document.getElementById('blockedCookiesChevron');

    if (blockedHeader && blockedContent && blockedChevron) {
        blockedHeader.addEventListener('click', () => {
            const isHidden = blockedContent.classList.contains('hidden');
            if (isHidden) {
                blockedContent.classList.remove('hidden');
                blockedChevron.style.transform = 'rotate(180deg)';
            } else {
                blockedContent.classList.add('hidden');
                blockedChevron.style.transform = 'rotate(0deg)';
            }
        });
    }
}

/**
 * Load cookies based on current view mode
 */
async function loadCookies() {
    showCookieLoading();
    let activeHostname = null;

    try {
        if (activeTabOnly) {
            const activeTabUrl = await CookieManager.getActiveTabUrl();

            if (!activeTabUrl) {
                showCookieError('Unable to get active tab URL. Make sure a tab is active.');
                return;
            }

            // Filter out chrome:// and extension:// URLs
            if (activeTabUrl.startsWith('chrome://') || activeTabUrl.startsWith('chrome-extension://')) {
                showCookieEmpty('Chrome internal pages do not have cookies.');
                return;
            }

            // Update site info display
            const siteUrlElement = document.getElementById('currentSiteUrl');
            if (siteUrlElement) {
                try {
                    const url = new URL(activeTabUrl);
                    activeHostname = url.hostname;
                    siteUrlElement.textContent = activeHostname;
                } catch {
                    siteUrlElement.textContent = activeTabUrl;
                }
            }

            console.log('[Dashboard] Fetching cookies for:', activeTabUrl);
            allCookies = await CookieManager.fetchCookiesForUrl(activeTabUrl);
        } else {
            console.log('[Dashboard] Fetching all cookies...');
            allCookies = await CookieManager.fetchAllCookies();
        }

        console.log(`[Dashboard] Loaded ${allCookies.length} cookies`);

        // 🆕 FETCH BLOCKED COOKIES AND MERGE
        let blockedCookies = await CookieManager.getBlockedCookies();

        // Filter blocked cookies if active tab only
        if (activeTabOnly && activeHostname) {
            console.log(`[Dashboard] Filtering blocked cookies for hostname: ${activeHostname}`);
            blockedCookies = blockedCookies.filter(bc => {
                // Remove leading dot for comparison
                const cleanCookieDomain = bc.domain.startsWith('.') ? bc.domain.substring(1) : bc.domain;
                // Check if hostname ends with cookie domain (e.g. www.google.com ends with google.com)
                // or if cookie domain is exactly the hostname
                return activeHostname.endsWith(cleanCookieDomain) || activeHostname === cleanCookieDomain;
            });
        }

        if (blockedCookies.length > 0) {
            console.log(`[Dashboard] Found ${blockedCookies.length} blocked cookies`);

            // 1. Mark existing cookies as blocked if they are in the list (Persistent Block)
            allCookies = allCookies.map(c => {
                const isBlocked = blockedCookies.some(bc => bc.name === c.name && bc.domain === c.domain);
                return isBlocked ? { ...c, isBlocked: true } : c;
            });

            // 2. Add missing blocked cookies (Ghost Cookies)
            blockedCookies.forEach(bc => {
                const exists = allCookies.some(c => c.name === bc.name && c.domain === bc.domain);
                if (!exists) {
                    // Ensure ghost cookies have the blocked flag
                    allCookies.push({ ...bc, isBlocked: true });
                }
            });
        }

        // 🆕 CLASSIFY COOKIES USING SERVERLESS API
        if (allCookies.length > 0 && typeof CookieClassifier !== 'undefined') {
            console.log(`[Dashboard] Classifying ${allCookies.length} cookies with AI model (this may take a moment for large batches)...`);

            // Show loading indicator
            showCookieLoading();

            const cookieNames = allCookies.map(c => c.name);

            // Use progress callback to update UI
            const classifications = await CookieClassifier.classifyCookiesBatch(cookieNames, (processed, total) => {
                updateCookieLoadingProgress(processed, total);
            });

            // Merge classification data with cookie objects
            allCookies = allCookies.map((cookie, idx) => {
                const classification = classifications[idx];
                // Only log if classification is missing or weird to reduce noise
                if (!classification || !classification.category) {
                    // console.log(`[Dashboard] Cookie "${cookie.name}" classified as:`, classification?.category);
                }
                return {
                    ...cookie,
                    classification: classification
                };
            });

            // Filter out cookies that failed API classification
            const beforeFilter = allCookies.length;
            allCookies = allCookies.filter(cookie => {
                const hasValidClassification = cookie.classification?.class_id !== null && cookie.classification?.class_id !== undefined;
                if (!hasValidClassification) {
                    console.warn(`[Dashboard] Removing cookie "${cookie.name}" - API classification failed`);
                }
                return hasValidClassification;
            });
            console.log(`[Dashboard] Filtered cookies: ${beforeFilter} total → ${allCookies.length} with valid API classifications (${beforeFilter - allCookies.length} removed)`);

            // Log statistics
            const stats = CookieClassifier.getStatistics(classifications);
            console.log('[Dashboard] Classification stats:', stats);

            // Persist cookie totals to storage so the dashboard summary can read them
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.set({
                    totalCookiesDetected: allCookies.length,
                    cookiesByCategory: stats
                });
            }
        } else {
            console.warn('[Dashboard] CookieClassifier not available or no cookies to classify');
        }

        filterAndRenderCookies();

    } catch (error) {
        console.error('[Dashboard] Error loading cookies:', error);
        showCookieError('Failed to load cookies. Check extension permissions.');
    }
}

/**
 * Filter cookies by search query and render
 */
function filterAndRenderCookies() {
    if (searchQuery) {
        displayedCookies = CookieManager.filterCookies(allCookies, searchQuery);
    } else {
        displayedCookies = allCookies;
    }

    console.log(`[Dashboard] Displaying ${displayedCookies.length} cookies (${allCookies.length} total)`);

    if (displayedCookies.length === 0) {
        if (allCookies.length === 0) {
            showCookieEmpty('No cookies found.');
        } else {
            showCookieEmpty(`No cookies match "${searchQuery}"`);
        }
    } else {
        renderCookiesByCategory(displayedCookies);
    }
}

/**
 * Render cookies separated by category into their respective sections
 */
function renderCookiesByCategory(cookies) {
    // 🆕 1. Filter and Sort Blocked Cookies
    const blockedCookies = cookies.filter(c => c.isBlocked);
    blockedCookies.sort((a, b) => a.domain.localeCompare(b.domain)); // Ascending by domain

    // Render Blocked Section (Grouped by Domain)
    renderBlockedCookiesGrouped(blockedCookies);
    updateBlockAllButton('blockedCookies', blockedCookies, 'Blocked Cookies', -1);

    // Separate cookies by classification
    const categorizedCookies = {
        0: [], // Strictly Necessary
        1: [], // Functionality
        2: [], // Analytics
        3: [] // Advertising/Tracking
    };

    cookies.forEach(cookie => {
        // Optional: Skip blocked cookies in other sections if desired. 
        // For now, we keep them so users see them in their categories too.
        // if (cookie.isBlocked) return; 

        const classId = cookie.classification?.class_id;

        // Skip cookies that failed classification or have no API result
        if (classId === null || classId === undefined) {
            console.warn(`[Dashboard] Cookie "${cookie.name}" has NO valid API classification - skipping display`);
            return;
        }

        if (categorizedCookies[classId] !== undefined) {
            categorizedCookies[classId].push(cookie);
        } else {
            console.error(`[Dashboard] Invalid class_id ${classId} for cookie "${cookie.name}" - skipping`);
        }
    });

    console.log('[Dashboard] ✅ Categorized cookies by API classification:', {
        'Blocked': blockedCookies.length,
        'Strictly Necessary (0)': categorizedCookies[0].length,
        'Functionality (1)': categorizedCookies[1].length,
        'Analytics (2)': categorizedCookies[2].length,
        'Advertising/Tracking (3)': categorizedCookies[3].length,
        'Total': cookies.length
    });

    // Render each category
    renderCookiesInSection('strictlyNecessaryCookies', categorizedCookies[0]);
    updateBlockAllButton('strictlyNecessaryCookies', categorizedCookies[0], 'Strictly Necessary', 0);

    renderCookiesInSection('functionalityCookies', categorizedCookies[1]);
    updateBlockAllButton('functionalityCookies', categorizedCookies[1], 'Functionality', 1);

    renderCookiesInSection('analyticsCookies', categorizedCookies[2]);
    updateBlockAllButton('analyticsCookies', categorizedCookies[2], 'Analytics', 2);

    renderCookiesInSection('advertisingTrackingCookies', categorizedCookies[3]);
    updateBlockAllButton('advertisingTrackingCookies', categorizedCookies[3], 'Advertising/Tracking', 3);
}

/**
 * Update the "Block All" / "Unblock All" button for a category
 */
function updateBlockAllButton(sectionId, cookies, categoryName, categoryId) {
    const container = document.getElementById(`${sectionId}BlockAll`);
    if (!container) return;

    const unblockedCookies = cookies.filter(c => !c.isBlocked);
    const blockedCookies = cookies.filter(c => c.isBlocked);

    container.classList.remove('hidden');
    container.innerHTML = '';

    if (unblockedCookies.length > 0) {
        // Show "Block All" if there are any unblocked cookies
        container.innerHTML = `
            <button class="block-all-btn px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 border border-red-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Block All
            </button>
        `;
        const btn = container.querySelector('.block-all-btn');
        btn.addEventListener('click', () => handleBlockAll(unblockedCookies, categoryName, categoryId));

    } else if (blockedCookies.length > 0) {
        // Show "Unblock All" if all cookies are blocked
        container.innerHTML = `
            <button class="unblock-all-btn px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 border border-green-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Unblock All
            </button>
        `;
        const btn = container.querySelector('.unblock-all-btn');
        btn.addEventListener('click', () => handleUnblockAll(blockedCookies, categoryName));
    } else {
        container.classList.add('hidden');
    }
}

/**
 * Handle "Block All" action with safety checks
 */
async function handleBlockAll(cookies, categoryName, categoryId) {
    const count = cookies.length;
    let confirmed = false;

    // Safety Warning for Sensitive Categories (0: Necessary, 1: Functionality)
    if (categoryId === 0 || categoryId === 1) {
        const warningMsg = categoryId === 0 ?
            "CRITICAL WARNING: You are about to block Strictly Necessary cookies.\n\nThis WILL break the website. You may not be able to log in, use the cart, or navigate.\n\nAre you absolutely sure?" :
            "WARNING: Blocking Functionality cookies may reset your preferences and break some site features.\n\nDo you want to proceed?";

        confirmed = confirm(`${warningMsg}\n\nBlocking ${count} cookies.`);
    } else {
        // Standard confirmation for Analytics/Ads
        confirmed = confirm(`Block all ${count} "${categoryName}" cookies?\n\nThey will be deleted and prevented from returning.`);
    }

    if (!confirmed) return;

    // Optimistic UI - Mark all as blocked immediately
    cookies.forEach(cookie => {
        cookie.isBlocked = true;
        updateAllCookieCards(cookie);
    });

    refreshBlockedSection();

    // Process in background
    console.log(`[Dashboard] Bulk blocking ${count} cookies for ${categoryName}...`);

    // Process in parallel
    const promises = cookies.map(cookie => CookieManager.blockCookie(cookie));
    await Promise.all(promises);

    console.log(`[Dashboard] Bulk block complete.`);

    // Refresh UI to update button visibility
    filterAndRenderCookies();
}

/**
 * Handle "Unblock All" action
 */
async function handleUnblockAll(cookies, categoryName) {
    const count = cookies.length;

    if (!confirm(`Unblock all ${count} "${categoryName}" cookies?`)) return;

    // Optimistic UI
    cookies.forEach(cookie => {
        cookie.isBlocked = false;
        updateAllCookieCards(cookie);
    });

    refreshBlockedSection();

    console.log(`[Dashboard] Bulk unblocking ${count} cookies for ${categoryName}...`);

    // Process in parallel
    const promises = cookies.map(cookie => CookieManager.unblockCookie(cookie));
    await Promise.all(promises);

    console.log(`[Dashboard] Bulk unblock complete.`);

    // Refresh UI to update button visibility
    filterAndRenderCookies();
}

/**
 * Render cookies in a specific category section
 */
function renderCookiesInSection(sectionId, cookies) {
    const container = document.getElementById(`${sectionId}Container`);
    const countElement = document.getElementById(`${sectionId}Count`);

    if (!container) {
        console.error(`[Dashboard] ${sectionId} container not found!`);
        return;
    }

    // Update count
    if (countElement) {
        countElement.textContent = cookies.length;
    }

    // Clear container
    container.innerHTML = '';

    // If no cookies in this category, show empty message
    if (cookies.length === 0) {
        container.innerHTML = `
      <div class="text-center py-8 text-white/40">
        <p>No cookies in this category</p>
      </div>
    `;
        return;
    }

    // Render each cookie
    cookies.forEach(cookie => {
        const cookieCard = createCookieCard(cookie);
        container.appendChild(cookieCard);
    });

    console.log(`[Dashboard] Rendered ${cookies.length} cookies in ${sectionId}`);
}

/**
 * Create a cookie card element
 */
function createCookieCard(cookie) {
    // Get API classification - if missing, cookie shouldn't be displayed
    const classification = cookie.classification;

    const card = document.createElement('div');
    // 🆕 Add identifier for syncing multiple cards
    const cookieId = `${encodeURIComponent(cookie.name)}|${encodeURIComponent(cookie.domain)}`;
    card.setAttribute('data-cookie-id', cookieId);

    // 🆕 Use dynamic colors based on classification
    card.className = `${classification.bgColor} border ${classification.borderColor} rounded-xl p-4 transition-all duration-300`;

    // Security badges
    const badges = [];
    if (cookie.httpOnly) badges.push('<span class="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs">HttpOnly</span>');
    if (cookie.secure) badges.push('<span class="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-xs">Secure</span>');
    if (cookie.partitioned) badges.push('<span class="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-xs">Partitioned</span>');
    if (cookie.session) badges.push('<span class="px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded text-xs">Session</span>');

    // SameSite badge
    const sameSiteColors = {
        'strict': 'green',
        'lax': 'yellow',
        'no_restriction': 'red',
        'unspecified': 'gray'
    };
    const sameSiteColor = sameSiteColors[cookie.sameSite] || 'gray';
    badges.push(`<span class="px-2 py-1 bg-${sameSiteColor}-500/10 text-${sameSiteColor}-400 border border-${sameSiteColor}-500/20 rounded text-xs">SameSite: ${cookie.sameSite}</span>`);

    // 🆕 Create classification badge (Confidence score removed)
    const confidenceBadge = '';

    card.innerHTML = `
    <div class="flex justify-between items-start mb-3">
      <div class="flex-1">
        <h4 class="text-white font-medium mb-1">${escapeHtml(cookie.name)}</h4>
        <p class="text-white/60 text-sm mb-2">${escapeHtml(cookie.domain)} • ${escapeHtml(cookie.path)}</p>
        <div class="flex flex-wrap gap-2 mb-3">
          ${badges.join('')}
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="px-3 py-1 ${classification.bgColor} ${classification.textColor} rounded-lg text-xs font-medium border ${classification.borderColor}">
          ${classification.icon} ${escapeHtml(classification.name)}${confidenceBadge}
        </span>
      </div>
    </div>
    
    <div class="grid grid-cols-2 gap-2 text-xs text-white/50 mb-3">
      <div><strong>Expires:</strong> ${escapeHtml(cookie.expires)}</div>
      <div><strong>Size:</strong> ${cookie.size} bytes</div>
    </div>
    
    <div class="mt-3 pt-3 border-t border-white/5">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-white/50">Value:</span>
        <button 
          class="toggle-value-btn text-xs text-[#EBFF3D] hover:text-white transition-colors font-medium"
          data-cookie-name="${escapeHtml(cookie.name)}"
          data-cookie-domain="${escapeHtml(cookie.domain)}"
        >
          Show
        </button>
      </div>
      <div class="mt-2 font-mono text-sm text-white/70 break-all mb-3">
        <span class="cookie-value-display" data-value="${escapeHtml(cookie.value)}">••••••••</span>
      </div>

      <!-- 🆕 Block/Unblock Controls -->
      <div class="flex gap-2 mt-2">
        ${cookie.isBlocked ? `
            <button class="unblock-btn flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-xs py-2 rounded transition-colors flex items-center justify-center gap-1 hover:shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                Unblock
            </button>
        ` : `
            <button class="block-btn flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs py-2 rounded transition-colors flex items-center justify-center gap-1 hover:shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Block
            </button>
        `}
      </div>
    </div>
  `;

    // Add event listener for Show/Hide toggle
    const toggleBtn = card.querySelector('.toggle-value-btn');
    const valueDisplay = card.querySelector('.cookie-value-display');

    if (toggleBtn && valueDisplay) {
        toggleBtn.addEventListener('click', function () {
            const isHidden = valueDisplay.textContent === '••••••••';

            if (isHidden) {
                // Show value
                const actualValue = valueDisplay.getAttribute('data-value');
                valueDisplay.textContent = actualValue || '(empty)';
                toggleBtn.textContent = 'Hide';
            } else {
                // Hide value
                valueDisplay.textContent = '••••••••';
                toggleBtn.textContent = 'Show';
            }
        });
    }

    // 🆕 Add Block/Unblock Listeners
    const blockBtn = card.querySelector('.block-btn');
    const unblockBtn = card.querySelector('.unblock-btn');

    if (blockBtn) {
        blockBtn.addEventListener('click', async () => {
            if (confirm(`Are you sure you want to block "${cookie.name}"? It will be deleted immediately and prevented from returning.`)) {
                // 1. Optimistic UI Update (Real-time feel)
                cookie.isBlocked = true;

                // Update ALL instances of this card (in Blocked section AND Category section)
                updateAllCookieCards(cookie);

                // 2. Refresh Blocked Section (Real-time sync)
                refreshBlockedSection();

                // 3. Background Action
                await CookieManager.blockCookie(cookie);
            }
        });
    }

    if (unblockBtn) {
        unblockBtn.addEventListener('click', async () => {
            // 1. Optimistic UI Update (Real-time feel)
            cookie.isBlocked = false;

            // Update ALL instances of this card
            updateAllCookieCards(cookie);

            // 2. Refresh Blocked Section (Real-time sync)
            refreshBlockedSection();

            // 3. Background Action
            await CookieManager.unblockCookie(cookie);
        });
    }

    return card;
}

/**
 * Helper to update all DOM instances of a specific cookie card
 */
function updateAllCookieCards(cookie) {
    const cookieId = `${encodeURIComponent(cookie.name)}|${encodeURIComponent(cookie.domain)}`;
    const cards = document.querySelectorAll(`[data-cookie-id="${cookieId}"]`);

    cards.forEach(oldCard => {
        // Don't replace if it's inside the blocked container and we are unblocking
        // (because refreshBlockedSection will handle removal)
        // But actually, replacing it is fine, refreshBlockedSection will just nuke it a millisecond later.
        // However, to be safe and avoid flickering or errors if the parent is gone:
        if (document.body.contains(oldCard)) {
            const newCard = createCookieCard(cookie);
            oldCard.replaceWith(newCard);
        }
    });
}

/**
 * Helper to refresh just the blocked section
 */
function refreshBlockedSection() {
    const blockedCookies = allCookies.filter(c => c.isBlocked);
    blockedCookies.sort((a, b) => a.domain.localeCompare(b.domain));
    renderBlockedCookiesGrouped(blockedCookies);
    updateBlockAllButton('blockedCookies', blockedCookies, 'Blocked Cookies', -1);
}

/**
 * Render blocked cookies grouped by domain
 */
function renderBlockedCookiesGrouped(cookies) {
    const container = document.getElementById('blockedCookiesContainer');
    const countElement = document.getElementById('blockedCookiesCount');

    if (!container) return;

    // Update count
    if (countElement) {
        countElement.textContent = cookies.length;
    }

    // Clear container
    container.innerHTML = '';

    // If no blocked cookies
    if (cookies.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-white/40">
                <p>No blocked cookies</p>
            </div>
        `;
        return;
    }

    // Group by domain
    const domains = {};
    cookies.forEach(cookie => {
        if (!domains[cookie.domain]) {
            domains[cookie.domain] = [];
        }
        domains[cookie.domain].push(cookie);
    });

    // Sort domains by cookie count (Descending: Highest first)
    const sortedDomains = Object.keys(domains).sort((a, b) => {
        return domains[b].length - domains[a].length;
    });

    // Render each domain group
    sortedDomains.forEach(domain => {
        const domainCookies = domains[domain];
        const domainId = `domain-${domain.replace(/[^a-zA-Z0-9]/g, '-')}`;

        const domainGroup = document.createElement('div');
        domainGroup.className = 'bg-[#10133a]/50 rounded-xl overflow-hidden border border-[#EBFF3D]/10 hover:border-[#EBFF3D]/30 transition-all duration-300';

        // ⚠️ Removed inline onclick handlers to comply with CSP and ensure functionality
        domainGroup.innerHTML = `
            <div class="domain-header flex items-center justify-between p-4 cursor-pointer hover:bg-[#EBFF3D]/5 transition-colors">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center text-red-400 font-bold text-xs border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                        ${domainCookies.length}
                    </div>
                    <div>
                        <h4 class="text-white font-medium">${escapeHtml(domain)}</h4>
                        <p class="text-xs text-white/50">${domainCookies.length} blocked cookie${domainCookies.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button class="unblock-domain-btn px-2 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs rounded transition-colors border border-green-500/20 hover:shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                        Unblock Domain
                    </button>
                    <svg id="chevron-${domainId}" class="w-5 h-5 text-white/40 transform transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            <div id="${domainId}" class="hidden border-t border-white/5 bg-[#0B0E14]/30">
                <div class="p-3 space-y-2">
                    <!-- Cookies will be inserted here -->
                </div>
            </div>
        `;

        // 1. Add Toggle Listener (Programmatic)
        const header = domainGroup.querySelector('.domain-header');
        header.addEventListener('click', () => toggleDomainGroup(domainId));

        // Add Unblock Domain listener
        const unblockBtn = domainGroup.querySelector('.unblock-domain-btn');
        unblockBtn.addEventListener('click', async (e) => {
            e.stopPropagation(); // Prevent toggle
            if (confirm(`Unblock all ${domainCookies.length} cookies for "${domain}"?`)) {
                // Optimistic UI
                domainCookies.forEach(c => {
                    c.isBlocked = false;
                    updateAllCookieCards(c);
                });
                refreshBlockedSection();

                // Background action
                await Promise.all(domainCookies.map(c => CookieManager.unblockCookie(c)));
            }
        });

        // Insert cookies into the group
        const cookiesContainer = domainGroup.querySelector(`#${domainId} > div`);
        domainCookies.forEach(cookie => {
            const card = createCookieCard(cookie);
            // Adjust card style for nested view if needed (optional)
            card.classList.remove('rounded-xl');
            card.classList.add('rounded-lg');
            cookiesContainer.appendChild(card);
        });

        container.appendChild(domainGroup);
    });

    // Restore expanded state if any
    if (window.expandedDomains) {
        window.expandedDomains.forEach(id => {
            const content = document.getElementById(id);
            const chevron = document.getElementById(`chevron-${id}`);
            if (content && chevron) {
                content.classList.remove('hidden');
                chevron.style.transform = 'rotate(180deg)';
            }
        });
    }
}

/**
 * Toggle domain group visibility
 */
function toggleDomainGroup(domainId) {
    const content = document.getElementById(domainId);
    const chevron = document.getElementById(`chevron-${domainId}`);

    if (content && chevron) {
        const isHidden = content.classList.contains('hidden');

        // Track expanded state
        if (!window.expandedDomains) window.expandedDomains = new Set();

        if (isHidden) {
            content.classList.remove('hidden');
            chevron.style.transform = 'rotate(180deg)';
            window.expandedDomains.add(domainId);
        } else {
            content.classList.add('hidden');
            chevron.style.transform = 'rotate(0deg)';
            window.expandedDomains.delete(domainId);
        }
    }
}

/**
 * Show loading state in all sections
 */
function showCookieLoading() {
    const sections = [
        'blockedCookies', // 🆕 Added
        'strictlyNecessaryCookies',
        'functionalityCookies',
        'analyticsCookies',
        'advertisingTrackingCookies'
    ];

    sections.forEach(sectionId => {
        const container = document.getElementById(`${sectionId}Container`);
        const countElement = document.getElementById(`${sectionId}Count`);

        if (countElement) countElement.textContent = '...';

        if (container) {
            container.innerHTML = `
        <div class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span class="ml-3 text-white/60 text-sm">Loading...</span>
        </div>
      `;
        }
    });
}

/**
 * Update loading progress
 */
function updateCookieLoadingProgress(processed, total) {
    const sections = [
        'blockedCookies',
        'strictlyNecessaryCookies',
        'functionalityCookies',
        'analyticsCookies',
        'advertisingTrackingCookies'
    ];

    const percentage = Math.round((processed / total) * 100);

    sections.forEach(sectionId => {
        const container = document.getElementById(`${sectionId}Container`);
        if (container) {
            const loadingText = container.querySelector('span.text-white\\/60');
            if (loadingText) {
                loadingText.textContent = `Classifying... ${processed}/${total} (${percentage}%)`;
            }
        }
    });
}

/**
 * Show empty state in all sections
 */
function showCookieEmpty(message) {
    const sections = [
        'blockedCookies', // 🆕 Added
        'strictlyNecessaryCookies',
        'functionalityCookies',
        'analyticsCookies',
        'advertisingTrackingCookies'
    ];

    sections.forEach(sectionId => {
        const container = document.getElementById(`${sectionId}Container`);
        const countElement = document.getElementById(`${sectionId}Count`);

        if (countElement) countElement.textContent = '0';

        if (container) {
            container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-8 text-center">
          <svg class="w-12 h-12 text-white/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
          </svg>
          <p class="text-white/60 text-sm mb-1">No Cookies Found</p>
          <p class="text-white/40 text-xs">${escapeHtml(message)}</p>
        </div>
      `;
        }
    });
}

/**
 * Show error state in all sections
 */
function showCookieError(message) {
    const sections = [
        'blockedCookies', // 🆕 Added
        'strictlyNecessaryCookies',
        'functionalityCookies',
        'analyticsCookies',
        'advertisingTrackingCookies'
    ];

    sections.forEach(sectionId => {
        const container = document.getElementById(`${sectionId}Container`);
        const countElement = document.getElementById(`${sectionId}Count`);

        if (countElement) countElement.textContent = '0';

        if (container) {
            container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-8 text-center">
          <svg class="w-12 h-12 text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <p class="text-red-400 text-sm mb-2">Error Loading Cookies</p>
          <p class="text-white/60 text-xs mb-3">${escapeHtml(message)}</p>
          <button 
            class="retryCookiesBtn px-3 py-1.5 bg-[#EBFF3D] text-[#10133a] rounded-lg text-xs font-semibold hover:bg-[#dffb2f] transition-colors"
          >
            Retry
          </button>
        </div>
      `;
            // Attach event listener programmatically (CSP-compliant)
            const retryBtn = container.querySelector('.retryCookiesBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => loadCookies());
            }
        }
    });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== TIMEFRAME TOGGLE FUNCTIONALITY =====

/**
 * Initialize the timeframe toggle control
 */
function initializeTimeframeToggle() {
    const buttons = document.querySelectorAll('.timeframe-btn');

    // Set initial active state based on stored or default timeframe
    buttons.forEach(btn => {
        const timeframe = btn.getAttribute('data-timeframe');
        if (timeframe === currentTimeframe) {
            setActiveButton(btn);
        }
    });

    // Position slider on initial active button
    const activeButton = document.querySelector('.timeframe-btn.active');
    if (activeButton) {
        updateSliderPosition(activeButton);
    }

    // Add click handlers
    buttons.forEach(btn => {
        btn.addEventListener('click', () => handleTimeframeChange(btn));
    });

    // Add keyboard navigation
    const toggleContainer = document.querySelector('.timeframe-toggle');
    toggleContainer.addEventListener('keydown', handleTimeframeKeyboard);

    // Initial data load
    updateTrackingHistory(currentTimeframe);
}

/**
 * Handle timeframe selection change
 */
function handleTimeframeChange(selectedButton) {
    const timeframe = selectedButton.getAttribute('data-timeframe');

    // Don't reload if already selected
    if (timeframe === currentTimeframe) return;

    // Update slider position
    updateSliderPosition(selectedButton);

    // Update active state
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
    });

    setActiveButton(selectedButton);

    // Store selection for session persistence
    currentTimeframe = timeframe;
    sessionStorage.setItem(TIMEFRAME_SESSION_KEY, timeframe);

    // Update the chart
    updateTrackingHistory(timeframe);
}

/**
 * Set active state on a button
 */
function setActiveButton(button) {
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
}

/**
 * Update the sliding background position to match the active button
 */
function updateSliderPosition(button) {
    const slider = document.querySelector('.timeframe-slider');
    if (!slider || !button) return;

    const toggleContainer = document.querySelector('.timeframe-toggle');
    const buttonRect = button.getBoundingClientRect();
    const containerRect = toggleContainer.getBoundingClientRect();

    // Calculate position relative to container
    const left = buttonRect.left - containerRect.left;
    const width = buttonRect.width;

    // Update slider position and width
    slider.style.width = `${width}px`;
    slider.style.transform = `translateX(${left}px)`;
}

/**
 * Handle keyboard navigation for timeframe toggle
 */
function handleTimeframeKeyboard(event) {
    const buttons = Array.from(document.querySelectorAll('.timeframe-btn'));
    const currentIndex = buttons.findIndex(btn => btn === document.activeElement);

    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
            event.preventDefault();
            nextIndex = (currentIndex + 1) % buttons.length;
            break;
        case 'ArrowLeft':
        case 'ArrowUp':
            event.preventDefault();
            nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
            break;
        case 'Enter':
        case ' ':
            event.preventDefault();
            handleTimeframeChange(buttons[currentIndex]);
            return;
        default:
            return;
    }

    buttons[nextIndex].focus();
}

/**
 * Calculate date range based on timeframe
 */
function calculateDateRange(timeframe) {
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let startDate;

    console.log(`[Timeframe] Selected: ${timeframe}`);
    console.log(`[Timeframe] End date (today): ${endDate.toISOString()}`);

    switch (timeframe) {
        case '7d':
            // Last 7 days: today minus 6 days through today
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            console.log(`[Timeframe] Calculation: today - 6 days = ${startDate.toISOString()}`);
            break;

        case '30d':
            // Last 30 days: today minus 29 days through today
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 29);
            startDate.setHours(0, 0, 0, 0);
            console.log(`[Timeframe] Calculation: today - 29 days = ${startDate.toISOString()}`);
            break;

        case '3m':
            // Last 3 months: 3 calendar months back + 1 day through today
            startDate = new Date(endDate);
            startDate.setMonth(startDate.getMonth() - 3);
            startDate.setDate(startDate.getDate() + 1);
            startDate.setHours(0, 0, 0, 0);
            console.log(`[Timeframe] Calculation: 3 months back + 1 day = ${startDate.toISOString()}`);
            break;

        default:
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 29);
            startDate.setHours(0, 0, 0, 0);
    }

    console.log(`[Timeframe] Final range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    return { startDate, endDate };
}

/**
 * Format date range for display
 */
function formatDateRange(startDate, endDate) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const start = startDate.toLocaleDateString('en-US', options);
    const end = endDate.toLocaleDateString('en-US', options);

    // If same year, omit year from start date
    if (startDate.getFullYear() === endDate.getFullYear()) {
        const startNoYear = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${startNoYear}–${end}`;
    }

    return `${start}–${end}`;
}

/**
 * Update tracking history chart with new timeframe data
 */
async function updateTrackingHistory(timeframe) {
    const { startDate, endDate } = calculateDateRange(timeframe);
    const dateRangeText = formatDateRange(startDate, endDate);

    // Update date range display
    const dateRangeElement = document.getElementById('trackingDateRange');
    if (dateRangeElement) {
        dateRangeElement.textContent = dateRangeText;
    }

    // Show loading state
    showChartLoading(true);
    hideChartError();
    hideChartNotice();

    try {
        // Fetch data for the selected timeframe
        const data = await fetchTrackingData(startDate, endDate, timeframe);

        // Check if we have insufficient data
        if (data.actualDataPoints < data.expectedDataPoints) {
            showChartNotice(`Only ${data.actualDataPoints} days of data available`);
        }

        // Update chart
        updateChart(data.labels, data.datasets, timeframe);

    } catch (error) {
        console.error('[Timeframe] Error fetching data:', error);
        showChartError(error.message || 'Failed to load tracking data');
    } finally {
        showChartLoading(false);
    }
}

/**
 * Map a tracking event type to its chart module
 */
function mapTypeToModule(type) {
    switch (type) {
        case 'cookie': return 'cookies';
        case 'dns':
        case 'dga':
        case 'cname': return 'dns';
        case 'fingerprint': return 'fingerprint';
        case 'hardware': return 'hardware';
        default: return 'cookies'; // fallback
    }
}

/**
 * Fetch tracking data from storage, split into per-module daily counts.
 */
async function fetchTrackingData(startDate, endDate, timeframe) {
    const data = await new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['trackingHistory'], (res) => resolve(res));
        } else {
            resolve({ trackingHistory: [] });
        }
    });

    const history = data.trackingHistory || [];
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const startMs = startDate.getTime();
    const endMs = endDate.getTime() + 86400000; // include full end day

    // Build per-module date→count maps
    const modules = { cookies: {}, dns: {}, fingerprint: {}, hardware: {} };

    history.forEach(entry => {
        const ts = entry.timestamp || entry.time || entry.date;
        if (!ts) return;
        const entryMs = typeof ts === 'number' ? ts : new Date(ts).getTime();
        if (isNaN(entryMs) || entryMs < startMs || entryMs >= endMs) return;

        const key = new Date(entryMs).toISOString().split('T')[0];
        const mod = mapTypeToModule(entry.type);
        modules[mod][key] = (modules[mod][key] || 0) + (entry.count || 1);
    });

    const labels = [];
    const datasets = { cookies: [], dns: [], fingerprint: [], hardware: [] };
    let actualDataPoints = 0;

    for (let i = 0; i < daysDiff; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const key = date.toISOString().split('T')[0];

        // Format label based on timeframe
        let label;
        if (timeframe === '7d') {
            label = date.toLocaleDateString('en-US', { weekday: 'short' });
        } else if (timeframe === '30d') {
            label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else if (timeframe === '3m') {
            if (i % 7 === 0 || i === daysDiff - 1) {
                label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else {
                label = '';
            }
        } else {
            label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        labels.push(label);

        const c = modules.cookies[key] || 0;
        const d = modules.dns[key] || 0;
        const f = modules.fingerprint[key] || 0;
        const h = modules.hardware[key] || 0;

        datasets.cookies.push(c);
        datasets.dns.push(d);
        datasets.fingerprint.push(f);
        datasets.hardware.push(h);

        if (c + d + f + h > 0) actualDataPoints++;
    }

    return {
        labels,
        datasets,
        actualDataPoints,
        expectedDataPoints: daysDiff
    };
}

/**
 * Update the chart with per-module datasets
 */
function updateChart(labels, datasets, timeframe) {
    if (!trackingChartInstance) return;

    // Calculate max from stacked totals
    let maxStacked = 0;
    for (let i = 0; i < labels.length; i++) {
        const dayTotal = (datasets.cookies[i] || 0) + (datasets.dns[i] || 0) +
            (datasets.fingerprint[i] || 0) + (datasets.hardware[i] || 0);
        if (dayTotal > maxStacked) maxStacked = dayTotal;
    }
    const yAxisMax = Math.max(10, Math.ceil(maxStacked * 1.2 / 10) * 10);

    // Point radius based on data density
    let pointRadius = 4;
    if (labels.length > 30) pointRadius = 2;
    if (labels.length > 60) pointRadius = 0;

    // Update all 4 datasets
    trackingChartInstance.data.labels = labels;
    trackingChartInstance.data.datasets[0].data = datasets.cookies;
    trackingChartInstance.data.datasets[1].data = datasets.dns;
    trackingChartInstance.data.datasets[2].data = datasets.fingerprint;
    trackingChartInstance.data.datasets[3].data = datasets.hardware;

    trackingChartInstance.data.datasets.forEach(ds => {
        ds.pointRadius = pointRadius;
    });

    trackingChartInstance.options.scales.y.max = yAxisMax;
    trackingChartInstance.update('active');
}

/**
 * Show/hide loading state
 */
function showChartLoading(show) {
    const loadingElement = document.getElementById('trackingChartLoading');
    if (loadingElement) {
        loadingElement.classList.toggle('hidden', !show);
    }
}

/**
 * Show error state
 */
function showChartError(message) {
    const errorElement = document.getElementById('trackingChartError');
    const errorMessageElement = document.getElementById('trackingChartErrorMessage');

    if (errorElement) {
        errorElement.classList.remove('hidden');
    }

    if (errorMessageElement) {
        errorMessageElement.textContent = message;
    }
}

/**
 * Hide error state
 */
function hideChartError() {
    const errorElement = document.getElementById('trackingChartError');
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
}

/**
 * Show notice message
 */
function showChartNotice(message) {
    const noticeElement = document.getElementById('trackingChartNotice');
    const noticeMessageElement = document.getElementById('trackingChartNoticeMessage');

    if (noticeElement) {
        noticeElement.classList.remove('hidden');
    }

    if (noticeMessageElement) {
        noticeMessageElement.textContent = message;
    }
}

/**
 * Hide notice message
 */
function hideChartNotice() {
    const noticeElement = document.getElementById('trackingChartNotice');
    if (noticeElement) {
        noticeElement.classList.add('hidden');
    }
}

// ===== HARDWARE ACCESS CONTROL (Phase 3) =====

let currentHardwareSettings = {
    camera: { blocked: false },
    microphone: { blocked: false },
    location: { blocked: false },
    notifications: { blocked: false }
};

let currentActivityLog = []; // Store log for filtering

function initializeHardwareControls() {
    // Initial Load
    refreshHardwareData();

    // Set up event listeners for toggles
    const toggles = ['camera', 'microphone', 'location', 'notifications'];

    toggles.forEach(type => {
        const toggle = document.getElementById(`${type}Toggle`);
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                // Update local state
                if (currentHardwareSettings[type]) {
                    currentHardwareSettings[type].blocked = e.target.checked;
                    // Save to background
                    saveHardwareSettings();
                    // Update UI immediately
                    updateToggleUI(type, e.target.checked);
                }
            });
        }
    });

    // Activity Log Filters
    const filterSelect = document.getElementById('activityFilter');
    const searchInput = document.getElementById('activitySearch');

    if (filterSelect) {
        filterSelect.addEventListener('change', () => updateRecentActivity(currentActivityLog));
    }
    if (searchInput) {
        searchInput.addEventListener('input', () => updateRecentActivity(currentActivityLog));
    }

    // Refresh stats periodically
    setInterval(refreshHardwareData, 5000);
}

function refreshHardwareData() {
    // 1. Get Settings
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
        if (chrome.runtime.lastError) {
            console.warn('[Veil Dashboard] refreshHardwareData get_settings:', chrome.runtime.lastError.message);
            return;
        }
        if (response && response.settings) {
            currentHardwareSettings = response.settings;
            updateAllToggles();
        }
    });

    // 2. Get Stats
    chrome.runtime.sendMessage({ action: 'getStats' }, (data) => {
        if (chrome.runtime.lastError) {
            console.warn('[Veil Dashboard] refreshHardwareData get_stats:', chrome.runtime.lastError.message);
            return;
        }
        if (data) {
            // Update Counts
            updateBlockedCounts(data.hardwareAccessBlocked);

            // Store and update log
            currentActivityLog = data.hardwareActivityLog || [];

            // Update Lists
            updateTopIntruders(data.hardwareAccessByDomain);

            updateRecentActivity(currentActivityLog);
        }
    });
}

function saveHardwareSettings() {
    chrome.runtime.sendMessage({
        action: 'setSettings',
        settings: currentHardwareSettings
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.warn('[Veil Dashboard] saveHardwareSettings:', chrome.runtime.lastError.message);
            return;
        }
        if (response && response.success) {
            console.log('[Dashboard] Settings saved successfully');
        }
    });
}

function updateAllToggles() {
    Object.keys(currentHardwareSettings).forEach(type => {
        const setting = currentHardwareSettings[type];
        const toggle = document.getElementById(`${type}Toggle`);

        if (toggle && document.activeElement !== toggle) {
            toggle.checked = setting.blocked;
            updateToggleUI(type, setting.blocked);
        }
    });
}

function updateToggleUI(type, isBlocked) {
    const statusElement = document.getElementById(`${type}Status`);

    if (statusElement) {
        statusElement.textContent = isBlocked ? 'Blocked' : 'Active';

        // Define colors based on type
        let colorClass = '';
        let bgClass = '';
        let borderClass = '';

        if (type === 'camera') {
            colorClass = isBlocked ? 'text-red-400' : 'text-blue-400';
            bgClass = isBlocked ? 'bg-red-500/10' : 'bg-blue-500/10';
            borderClass = isBlocked ? 'border-red-500/20' : 'border-blue-500/20';
        } else if (type === 'microphone') {
            colorClass = isBlocked ? 'text-red-400' : 'text-purple-400';
            bgClass = isBlocked ? 'bg-red-500/10' : 'bg-purple-500/10';
            borderClass = isBlocked ? 'border-red-500/20' : 'border-purple-500/20';
        } else if (type === 'location') {
            colorClass = isBlocked ? 'text-red-400' : 'text-green-400';
            bgClass = isBlocked ? 'bg-red-500/10' : 'bg-green-500/10';
            borderClass = isBlocked ? 'border-red-500/20' : 'border-green-500/20';
        } else if (type === 'notifications') {
            colorClass = isBlocked ? 'text-red-400' : 'text-yellow-400';
            bgClass = isBlocked ? 'bg-red-500/10' : 'bg-yellow-500/10';
            borderClass = isBlocked ? 'border-red-500/20' : 'border-yellow-500/20';
        }

        statusElement.className = `text-xs font-medium ${colorClass} ${bgClass} px-2 py-1 rounded border ${borderClass}`;
    }
}

function updateBlockedCounts(blockedStats) {
    if (!blockedStats) return;

    // Handle both old (number) and new (object) formats safely
    const stats = typeof blockedStats === 'number' ?
        { camera: 0, microphone: 0, location: 0, notifications: 0 } : blockedStats;

    const types = ['camera', 'microphone', 'location', 'notifications'];
    let total = 0;

    types.forEach(type => {
        const count = stats[type] || 0;
        total += count;
        const el = document.getElementById(`${type}BlockedCount`);
        if (el) el.textContent = count.toLocaleString();
    });

    const totalEl = document.getElementById('totalHardwareBlocked');
    if (totalEl) totalEl.textContent = total.toLocaleString();
}

function updateTopIntruders(domainStats) {
    const listElement = document.getElementById('topIntrudersList');
    if (!listElement) return;

    if (!domainStats || Object.keys(domainStats).length === 0) {
        listElement.innerHTML = '<div class="text-center text-white/30 py-4">No data available yet</div>';
        return;
    }

    // Capture currently expanded domains to restore state after refresh
    const expandedDomains = Array.from(document.querySelectorAll('[id^="details-"]:not(.hidden)'))
        .map(el => el.id.replace('details-', ''));

    // Convert to array and sort by BLOCKED attempts (descending)
    const sortedDomains = Object.entries(domainStats)
        .map(([domain, stats]) => ({ domain, ...stats }))
        .filter(item => item.blocked > 0) // Only show actual intruders (blocked > 0)
        .sort((a, b) => b.blocked - a.blocked)
        .slice(0, 5); // Top 5

    if (sortedDomains.length === 0) {
        listElement.innerHTML = '<div class="text-center text-white/30 py-4">No blocked intrusions detected</div>';
        return;
    }

    // Header Row
    const headerHtml = `
        <div class="flex items-center justify-between px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1">
            <div class="flex items-center gap-3 flex-1 min-w-0">
                <span class="w-6 text-center shrink-0">Rank</span>
                <span class="ml-2">Domain</span>
            </div>
            <div class="flex items-center gap-4 shrink-0 mr-8">
                <span>Hardware</span>
                <span class="w-[60px] text-right">Blocked</span>
            </div>
        </div>
    `;

    const listHtml = sortedDomains.map((item, index) => {
        const permissions = Array.isArray(item.permissions) ? item.permissions : [item.permissions || 'Unknown'];

        // Hardware chips
        const chips = permissions.map(p => {
            let icon = '';
            let color = '';
            // Use SVG icons for better look
            if (p === 'camera') {
                icon = '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/></svg>';
                color = 'bg-blue-500/20 text-blue-300';
            }
            else if (p === 'microphone') {
                icon = '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd"/></svg>';
                color = 'bg-purple-500/20 text-purple-300';
            }
            else if (p === 'location') {
                icon = '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>';
                color = 'bg-green-500/20 text-green-300';
            }
            else if (p === 'notifications') {
                icon = '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>';
                color = 'bg-yellow-500/20 text-yellow-300';
            }
            else {
                icon = '?';
                color = 'bg-gray-500/20 text-gray-300';
            }

            return `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full ${color}" title="${p}">${icon}</span>`;
        }).join('');

        // Rank color
        let rankColor = 'text-white/30';
        if (index === 0) rankColor = 'text-yellow-400';
        if (index === 1) rankColor = 'text-gray-300';
        if (index === 2) rankColor = 'text-orange-400';

        return `
            <div class="bg-white/5 rounded-lg border border-white/5 overflow-hidden mb-2 transition-all duration-200 hover:bg-white/10">
                <div class="flex items-center justify-between p-3 cursor-pointer intruder-row" data-domain="${item.domain}">
                    <div class="flex items-center gap-3 flex-1 min-w-0 mr-4">
                        <span class="text-sm font-bold ${rankColor} w-6 text-center shrink-0">#${index + 1}</span>
                        <div class="flex items-center gap-2 min-w-0 overflow-hidden flex-1">
                            <img src="https://www.google.com/s2/favicons?domain=${item.domain}&sz=32" class="w-4 h-4 rounded-sm opacity-70 shrink-0" onerror="this.style.display='none'">
                            <p class="text-sm font-medium text-white truncate" title="${item.domain}">${item.domain}</p>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-4 shrink-0">
                        <div class="flex gap-2">
                            ${chips}
                        </div>
                        <div class="text-right w-[60px]">
                            <p class="text-sm font-bold text-red-400">${item.blocked}</p>
                        </div>
                        <svg id="chevron-${item.domain}" class="w-4 h-4 text-white/30 transform transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
                
                <!-- Details Section -->
                <div id="details-${item.domain}" class="hidden bg-black/20 border-t border-white/5">
                    <div class="p-3 space-y-2">
                        <p class="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">Recent Blocked Attempts</p>
                        <div id="logs-${item.domain}" class="space-y-1 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    listElement.innerHTML = headerHtml + listHtml;

    // Add event listeners
    const rows = document.querySelectorAll('.intruder-row');
    rows.forEach(row => {
        row.addEventListener('click', function (e) {
            e.stopPropagation(); // Prevent bubbling
            const domain = this.getAttribute('data-domain');
            if (typeof toggleIntruderDetails === 'function') {
                toggleIntruderDetails(domain);
            }
        });
    });

    // Restore expanded state
    if (expandedDomains.length > 0) {
        expandedDomains.forEach(domain => {
            // We need to force show it, because toggleIntruderDetails toggles visibility
            // But since we just rendered it as hidden, calling toggleIntruderDetails will show it.
            // However, we should check if it exists in the new list
            const details = document.getElementById(`details-${domain}`);
            if (details) {
                toggleIntruderDetails(domain);
            }
        });
    }
}

// Toggle function for intruder details
function toggleIntruderDetails(domain) {
    const details = document.getElementById(`details-${domain}`);
    const chevron = document.getElementById(`chevron-${domain}`);
    const logsContainer = document.getElementById(`logs-${domain}`);

    if (!details || !logsContainer) return;

    const isHidden = details.classList.contains('hidden');

    if (isHidden) {
        details.classList.remove('hidden');
        if (chevron) chevron.classList.add('rotate-180');

        // Populate logs - Check if empty (or just whitespace)
        if (!logsContainer.hasChildNodes() || logsContainer.innerHTML.trim() === '') {
            // Filter logs for this domain and blocked status
            // Use safe access to currentActivityLog
            const logs = (typeof currentActivityLog !== 'undefined' ? currentActivityLog : []).filter(log =>
                log.domain === domain &&
                (log.action === 'blocked' || log.logStatus === 'blocked')
            ).sort((a, b) => (b.time || b.timestamp) - (a.time || a.timestamp)).slice(0, 20);

            if (logs.length === 0) {
                logsContainer.innerHTML = '<p class="text-xs text-white/30 italic pl-2">No recent detailed logs available.</p>';
            } else {
                logsContainer.innerHTML = logs.map(log => {
                    const dateObj = new Date(log.time || log.timestamp);
                    const date = dateObj.toLocaleDateString();
                    const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    // Hardware Icon
                    let hwIcon = '';
                    if (log.permission === 'camera') hwIcon = '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/></svg>';
                    else if (log.permission === 'microphone') hwIcon = '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd"/></svg>';
                    else if (log.permission === 'location') hwIcon = '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>';
                    else hwIcon = '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>';

                    return `
                        <div class="flex justify-between items-center p-2 hover:bg-white/5 rounded-md transition-colors border-b border-white/5 last:border-0">
                            <div class="flex items-center gap-3">
                                <span class="text-xs text-white/40 font-mono w-10 shrink-0">${time}</span>
                                <span class="text-xs text-white/60">${date}</span>
                            </div>
                            
                            <div class="flex items-center gap-2">
                                <span class="text-white/60 w-4 flex justify-center" title="${log.permission}">${hwIcon}</span>
                                <span class="text-red-400 font-medium capitalize bg-red-500/10 px-2 py-0.5 rounded text-[10px] border border-red-500/20 w-[70px] text-center">${log.permission}</span>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    } else {
        details.classList.add('hidden');
        if (chevron) chevron.classList.remove('rotate-180');
    }
}

function updateRecentActivity(activityLog) {
    const listElement = document.getElementById('recentActivityList');
    if (!listElement) return;

    // 1. Filter Data
    const filterSelect = document.getElementById('activityFilter');
    const searchInput = document.getElementById('activitySearch');

    const filterValue = filterSelect ? filterSelect.value : 'all';
    const searchValue = searchInput ? searchInput.value.toLowerCase() : '';

    let filteredLog = activityLog || [];

    if (filterValue !== 'all') {
        filteredLog = filteredLog.filter(log => {
            // Hardware Type Filters
            if (filterValue === 'camera') return log.permission === 'camera';
            if (filterValue === 'microphone') return log.permission === 'microphone';
            if (filterValue === 'location') return log.permission === 'location';
            if (filterValue === 'notifications') return log.permission === 'notifications';

            // Status Filters
            // Check logStatus first (new system), fallback to action (old system)
            if (filterValue === 'blocked') return log.logStatus === 'blocked' || (!log.logStatus && log.action === 'blocked');
            if (filterValue === 'allowed') return log.logStatus === 'allowed_session' || (!log.logStatus && log.action === 'allowed');
            if (filterValue === 'detected') return log.logStatus === 'detected';

            return true;
        });
    }

    if (searchValue) {
        filteredLog = filteredLog.filter(log => log.domain.toLowerCase().includes(searchValue));
    }

    if (!filteredLog || filteredLog.length === 0) {
        listElement.innerHTML = '<div class="text-center text-white/30 py-4">No matching activity found</div>';
        return;
    }

    // 2. Group by Date
    const groups = {};
    const today = new Date().toLocaleDateString();
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

    filteredLog.forEach(log => {
        const date = new Date(log.time || log.timestamp).toLocaleDateString();
        let label = date;
        if (date === today) label = 'Today';
        else if (date === yesterday) label = 'Yesterday';

        if (!groups[label]) groups[label] = [];
        groups[label].push(log);
    });

    // 3. Render Groups
    listElement.innerHTML = Object.keys(groups).map(label => {
        const items = groups[label].map(log => {
            const time = new Date(log.time || log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const isBlocked = log.action === 'blocked';
            const isBackground = log.tabStatus === 'BACKGROUND' || log.tabStatus === 'BACKGROUND_TAB';

            // Status Logic
            let statusText = 'Detected';
            let statusColor = 'text-green-400';
            let statusBg = 'bg-green-500/10';
            let statusBorder = 'border-green-500/20';

            if (log.logStatus) {
                if (log.logStatus === 'blocked') {
                    statusText = 'Blocked';
                    statusColor = 'text-red-400';
                    statusBg = 'bg-red-500/10';
                    statusBorder = 'border-red-500/20';
                } else if (log.logStatus === 'allowed_session') {
                    statusText = 'Allowed';
                    statusColor = 'text-green-400';
                    statusBg = 'bg-green-500/10';
                    statusBorder = 'border-green-500/20';
                } else if (log.logStatus === 'detected') {
                    statusText = 'Detected';
                    statusColor = 'text-blue-400'; // Distinct color for detected
                    statusBg = 'bg-blue-500/10';
                    statusBorder = 'border-blue-500/20';
                }
            } else {
                // Fallback
                if (isBlocked) {
                    statusText = 'Blocked';
                    statusColor = 'text-red-400';
                    statusBg = 'bg-red-500/10';
                    statusBorder = 'border-red-500/20';
                }
            }

            // Hardware Icon
            let hwIcon = '';
            if (log.permission === 'camera') hwIcon = '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/></svg>';
            else if (log.permission === 'microphone') hwIcon = '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd"/></svg>';
            else if (log.permission === 'location') hwIcon = '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>';
            else hwIcon = '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>';

            return `
                <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-md transition-colors group">
                    <div class="flex items-center gap-3 min-w-0 flex-1 mr-4">
                        <span class="text-xs text-white/40 font-mono w-10 shrink-0">${time}</span>
                        
                        <div class="flex items-center gap-2 min-w-0 overflow-hidden">
                            <img src="https://www.google.com/s2/favicons?domain=${log.domain}&sz=32" class="w-4 h-4 rounded-sm opacity-70" onerror="this.style.display='none'">
                            <span class="text-sm text-white/90 truncate" title="${log.domain}">${log.domain}</span>
                            
                            <!-- Tab Context Badge (Moved next to domain for better alignment) -->
                            ${isBackground ?
                    `<span class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 text-white/40 border border-white/5 shrink-0">Background</span>` :
                    ``
                }
                        </div>
                    </div>

                    <div class="flex items-center gap-3 shrink-0">
                        <!-- Hardware Icon (Fixed width container) -->
                        <span class="text-white/60 w-6 flex justify-center" title="${log.permission}">${hwIcon}</span>

                        <!-- Status Badge (Fixed width container) -->
                        <span class="px-2 py-0.5 rounded text-[10px] font-medium ${statusBg} ${statusColor} border ${statusBorder} w-[70px] text-center flex justify-center">
                            ${statusText}
                        </span>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="mb-4 last:mb-0">
                <h4 class="text-xs font-bold text-white/30 uppercase tracking-wider mb-2 px-2">${label}</h4>
                <div class="space-y-1">
                    ${items}
                </div>
            </div>
        `;
    }).join('');
}

// ===== FINGERPRINT PROTECTION PANEL (SHARED-2) =====

let fpApiChartInstance = null;

function initializeFingerprintPanel() {
    refreshFingerprintData();
    initializeFpApiChart();
    setInterval(refreshFingerprintData, 5000);
}

function refreshFingerprintData() {
    chrome.runtime.sendMessage({ action: 'getStats' }, (data) => {
        if (chrome.runtime.lastError) {
            console.warn('[Veil Dashboard] refreshFingerprintData:', chrome.runtime.lastError.message);
            return;
        }
        if (!data) return;

        // Update blocked counter
        const fpBlocked = data.fingerprintingBlocked || 0;
        const fpCounter = document.getElementById('fpBlockedCounter');
        if (fpCounter) fpCounter.textContent = fpBlocked.toLocaleString();

        // Update events list
        const fpEvents = data.fingerprintEvents || [];
        renderFingerprintEvents(fpEvents);

        // Update CLAM chart data
        const clamApiCounts = data.clamApiCounts || {};
        updateFpApiChart(clamApiCounts);
    });
}

function renderFingerprintEvents(events) {
    const listEl = document.getElementById('fpEventsList');
    if (!listEl) return;

    if (!events || events.length === 0) {
        listEl.innerHTML = `
            <div class="text-center text-white/30 py-8 flex flex-col items-center">
                <svg class="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                No fingerprint blocks recorded yet
            </div>`;
        return;
    }

    // Show most recent events first, max 50
    const sorted = events.slice().sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 50);

    listEl.innerHTML = sorted.map(ev => {
        const time = new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const date = new Date(ev.timestamp).toLocaleDateString();
        const apiType = ev.apiType || ev.type || 'unknown';
        const domain = ev.domain || ev.scriptDomain || 'unknown';

        // Color per API type
        let typeColor = 'text-orange-400 bg-orange-500/10 border-orange-500/20';
        if (apiType.toLowerCase().includes('audio')) {
            typeColor = 'text-violet-400 bg-violet-500/10 border-violet-500/20';
        } else if (apiType.toLowerCase().includes('webgl') || apiType.toLowerCase().includes('gl')) {
            typeColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
        }

        return `
            <div class="flex items-center justify-between p-2.5 hover:bg-white/5 rounded-lg transition-colors border-b border-white/5 last:border-0">
                <div class="flex items-center gap-3 min-w-0 flex-1 mr-4">
                    <span class="text-xs text-white/40 font-mono w-10 shrink-0">${time}</span>
                    <div class="flex items-center gap-2 min-w-0 overflow-hidden">
                        <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" class="w-4 h-4 rounded-sm opacity-70" onerror="this.style.display='none'">
                        <span class="text-sm text-white/90 truncate" title="${domain}">${domain}</span>
                    </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <span class="px-2 py-0.5 rounded text-[10px] font-medium ${typeColor} border w-[70px] text-center">${apiType}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 w-[60px] text-center">Blocked</span>
                </div>
            </div>`;
    }).join('');
}

function initializeFpApiChart() {
    const canvas = document.getElementById('fpApiChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    fpApiChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Canvas', 'Audio', 'WebGL'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(249, 115, 22, 0.8)',  // orange
                    'rgba(139, 92, 246, 0.8)',  // violet
                    'rgba(6, 182, 212, 0.8)'    // cyan
                ],
                borderColor: [
                    'rgba(249, 115, 22, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(6, 182, 212, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#FFFFFF',
                        usePointStyle: true,
                        padding: 16,
                        font: { size: 11, weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(16, 19, 58, 0.95)',
                    titleColor: '#fff',
                    bodyColor: 'rgba(255,255,255,0.8)',
                    borderColor: 'rgba(139, 92, 246, 0.3)',
                    borderWidth: 1,
                    padding: 10
                }
            }
        }
    });
}

function updateFpApiChart(clamApiCounts) {
    if (!fpApiChartInstance) return;
    const canvas = clamApiCounts.canvas || 0;
    const audio = clamApiCounts.audio || 0;
    const webgl = clamApiCounts.webgl || 0;

    fpApiChartInstance.data.datasets[0].data = [canvas, audio, webgl];
    fpApiChartInstance.update('none');
}

// ===== DNS SECURITY PANEL (SHARED-2) =====

function initializeDNSPanel() {
    refreshDNSData();
    setupNoiseToggle();
    setInterval(refreshDNSData, 5000);
}

function refreshDNSData() {
    chrome.runtime.sendMessage({ action: 'getStats' }, (data) => {
        if (chrome.runtime.lastError) {
            console.warn('[Veil Dashboard] refreshDNSData:', chrome.runtime.lastError.message);
            return;
        }
        if (!data) return;

        // Counters
        const dnsBlocked = data.dnsRequestsBlocked || 0;
        const cnameUncloaked = data.cnameUncloaked || 0;
        const dgaDetected = data.dgaDetected || 0;

        const dnsEl = document.getElementById('dnsBlockedCounter');
        if (dnsEl) dnsEl.textContent = dnsBlocked.toLocaleString();

        const cnameEl = document.getElementById('cnameUncloakedCounter');
        if (cnameEl) cnameEl.textContent = cnameUncloaked.toLocaleString();

        const dgaEl = document.getElementById('dgaDetectedCounter');
        if (dgaEl) dgaEl.textContent = dgaDetected.toLocaleString();

        // Event lists
        renderUncloakedDomains(data.uncloakedDomains || []);
        renderDGADetections(data.dgaDomains || []);
    });
}

function renderUncloakedDomains(domains) {
    const listEl = document.getElementById('uncloakedList');
    if (!listEl) return;

    if (!domains || domains.length === 0) {
        listEl.innerHTML = `
            <div class="text-center text-white/30 py-8 flex flex-col items-center">
                <svg class="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                No CNAME cloaking detected yet
            </div>`;
        return;
    }

    const sorted = domains.slice().sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 30);

    listEl.innerHTML = sorted.map(d => {
        const time = new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const original = d.original || d.hostname || '—';
        const target = d.target || d.cname || '—';

        return `
            <div class="flex items-center justify-between p-2.5 hover:bg-white/5 rounded-lg transition-colors border-b border-white/5 last:border-0">
                <div class="flex items-center gap-3 min-w-0 flex-1 mr-3">
                    <span class="text-xs text-white/40 font-mono w-10 shrink-0">${time}</span>
                    <div class="min-w-0 overflow-hidden">
                        <p class="text-sm text-white/90 truncate" title="${original}">${original}</p>
                        <p class="text-[10px] text-amber-400/70 truncate" title="→ ${target}">→ ${target}</p>
                    </div>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 shrink-0">Uncloaked</span>
            </div>`;
    }).join('');
}

function renderDGADetections(domains) {
    const listEl = document.getElementById('dgaList');
    if (!listEl) return;

    if (!domains || domains.length === 0) {
        listEl.innerHTML = `
            <div class="text-center text-white/30 py-8 flex flex-col items-center">
                <svg class="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                No DGA domains detected yet
            </div>`;
        return;
    }

    const sorted = domains.slice().sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 30);

    listEl.innerHTML = sorted.map(d => {
        const time = new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const domain = d.domain || d.hostname || '—';
        const score = d.klScore != null ? d.klScore.toFixed(2) : '—';

        return `
            <div class="flex items-center justify-between p-2.5 hover:bg-white/5 rounded-lg transition-colors border-b border-white/5 last:border-0">
                <div class="flex items-center gap-3 min-w-0 flex-1 mr-3">
                    <span class="text-xs text-white/40 font-mono w-10 shrink-0">${time}</span>
                    <div class="min-w-0 overflow-hidden">
                        <p class="text-sm text-white/90 truncate font-mono" title="${domain}">${domain}</p>
                        <p class="text-[10px] text-rose-400/70">KL divergence: ${score}</p>
                    </div>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 shrink-0">DGA</span>
            </div>`;
    }).join('');
}

function setupNoiseToggle() {
    const toggle = document.getElementById('noiseToggle');
    const indicator = document.getElementById('noiseIndicator');
    const label = document.getElementById('noiseStatusLabel');

    if (!toggle) return;

    toggle.addEventListener('change', (e) => {
        const enabled = e.target.checked;
        chrome.runtime.sendMessage({
            action: enabled ? 'startNoiseGenerator' : 'stopNoiseGenerator'
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn('[Veil Dashboard] noiseToggle:', chrome.runtime.lastError.message);
                return;
            }
            console.log('[Dashboard] Noise generator', enabled ? 'started' : 'stopped', response);
        });

        if (indicator) {
            indicator.className = enabled
                ? 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse'
                : 'w-2.5 h-2.5 rounded-full bg-white/20';
        }
        if (label) {
            label.textContent = enabled ? 'Active' : 'Paused';
            label.className = enabled
                ? 'text-sm font-bold text-emerald-400'
                : 'text-sm font-bold text-white/40';
        }
    });
}
