// Dashboard Page JavaScript

// ===== COOKIE MANAGEMENT STATE =====
let allCookies = [];
let displayedCookies = [];
let activeTabOnly = false;
let searchQuery = '';

// ===== TRACKING HISTORY STATE =====
let trackingChartInstance = null;
let currentTimeframe = '30d'; // Default timeframe
const TIMEFRAME_SESSION_KEY = 'veil_tracking_timeframe';

// Initialize charts when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    animateElements();
    initializeScrollNavigation();
    initializeCookieManagement(); // ✅ NEW: Initialize cookie feature
    initializeTimeframeToggle(); // ✅ NEW: Initialize timeframe toggle
});

function initializeCharts() {
    // Score Breakdown Pie Chart - Navy Family Theme Colors
    const scoreCtx = document.getElementById('scoreChart').getContext('2d');
    new Chart(scoreCtx, {
        type: 'doughnut',
        data: {
            labels: ['Cookies', 'DNS Requests', 'Fingerprinting', 'Hardware Access'],
            datasets: [{
                data: [58.8, 23.5, 11.8, 5.9],
                backgroundColor: [
                    '#EBFF3D', // Cookies - Brand Green
                    '#4DD4E8', // DNS Requests - Bright Cyan
                    '#9D7AEA', // Fingerprinting - Soft Purple
                    '#FF8C69' // Hardware Access - Coral Orange
                ],
                borderWidth: 0
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
                        padding: 20,
                        font: { size: 12 }
                    }
                }
            },
            cutout: '82%'
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
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                data: [20, 25, 22, 28, 25, 32, 48],
                borderColor: '#EBFF3D',
                backgroundColor: 'rgba(235, 255, 61, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#EBFF3D',
                pointBorderColor: '#EBFF3D',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30, 35, 102, 0.95)',
                    titleColor: '#EBFF3D',
                    bodyColor: 'rgba(255, 255, 255, 0.9)',
                    borderColor: 'rgba(235, 255, 61, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255,255,255,0.6)' }
                },
                y: {
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
        root: null,
        rootMargin: '-20% 0px -70% 0px',
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

    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
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
document.addEventListener('DOMContentLoaded', function() {
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
    // View toggle (All Cookies vs Active Tab)
    const viewToggle = document.getElementById('cookieViewToggle');
    if (viewToggle) {
        viewToggle.addEventListener('change', async function(e) {
            activeTabOnly = e.target.checked;
            console.log('[Dashboard] View mode:', activeTabOnly ? 'Active Tab' : 'All Cookies');

            // Show/hide site info banner
            const siteInfo = document.getElementById('currentSiteInfo');
            if (siteInfo) {
                siteInfo.classList.toggle('hidden', !activeTabOnly);
            }

            await loadCookies();
        });
    }

    // Search input
    const searchInput = document.getElementById('cookieSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchQuery = e.target.value;
            console.log('[Dashboard] Search query:', searchQuery);
            filterAndRenderCookies();
        });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshCookiesBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function() {
            console.log('[Dashboard] Refreshing cookies...');
            await loadCookies();
        });
    }
}

/**
 * Load cookies based on current view mode
 */
async function loadCookies() {
    showCookieLoading();

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
                    siteUrlElement.textContent = url.hostname;
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

        // 🆕 CLASSIFY COOKIES USING SERVERLESS API
        if (allCookies.length > 0 && typeof CookieClassifier !== 'undefined') {
            console.log(`[Dashboard] Classifying ${allCookies.length} cookies with AI model (this may take a moment for large batches)...`);

            // Show loading indicator
            showCookieLoading();

            const cookieNames = allCookies.map(c => c.name);
            const classifications = await CookieClassifier.classifyCookiesBatch(cookieNames);

            // Merge classification data with cookie objects
            allCookies = allCookies.map((cookie, idx) => {
                const classification = classifications[idx];
                console.log(`[Dashboard] Cookie "${cookie.name}" classified as:`, classification ? .category, `(class_id: ${classification?.class_id})`);
                return {
                    ...cookie,
                    classification: classification
                };
            });

            // Filter out cookies that failed API classification
            const beforeFilter = allCookies.length;
            allCookies = allCookies.filter(cookie => {
                const hasValidClassification = cookie.classification ? .class_id !== null && cookie.classification ? .class_id !== undefined;
                if (!hasValidClassification) {
                    console.warn(`[Dashboard] Removing cookie "${cookie.name}" - API classification failed`);
                }
                return hasValidClassification;
            });
            console.log(`[Dashboard] Filtered cookies: ${beforeFilter} total → ${allCookies.length} with valid API classifications (${beforeFilter - allCookies.length} removed)`);

            // Log statistics
            const stats = CookieClassifier.getStatistics(classifications);
            console.log('[Dashboard] Classification stats:', stats);
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
    // Separate cookies by classification
    const categorizedCookies = {
        0: [], // Strictly Necessary
        1: [], // Functionality
        2: [], // Analytics
        3: [] // Advertising/Tracking
    };

    cookies.forEach(cookie => {
        const classId = cookie.classification ? .class_id;

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
        'Strictly Necessary (0)': categorizedCookies[0].length,
        'Functionality (1)': categorizedCookies[1].length,
        'Analytics (2)': categorizedCookies[2].length,
        'Advertising/Tracking (3)': categorizedCookies[3].length,
        'Total': cookies.length
    });

    // Render each category
    renderCookiesInSection('strictlyNecessaryCookies', categorizedCookies[0]);
    renderCookiesInSection('functionalityCookies', categorizedCookies[1]);
    renderCookiesInSection('analyticsCookies', categorizedCookies[2]);
    renderCookiesInSection('advertisingTrackingCookies', categorizedCookies[3]);
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

    // Apply max height for scrolling if > 50 cookies per section
    if (cookies.length > 50) {
        container.style.maxHeight = '600px';
        container.style.overflowY = 'auto';
    } else {
        container.style.maxHeight = '';
        container.style.overflowY = '';
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
    // 🆕 Use dynamic colors based on classification
    card.className = `${classification.bgColor} border ${classification.borderColor} rounded-xl p-4 hover:opacity-90 transition-all`;

    // Security badges
    const badges = [];
    if (cookie.httpOnly) badges.push('<span class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">HttpOnly</span>');
    if (cookie.secure) badges.push('<span class="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Secure</span>');
    if (cookie.partitioned) badges.push('<span class="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">Partitioned</span>');
    if (cookie.session) badges.push('<span class="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">Session</span>');

    // SameSite badge
    const sameSiteColors = {
        'strict': 'green',
        'lax': 'yellow',
        'no_restriction': 'red',
        'unspecified': 'gray'
    };
    const sameSiteColor = sameSiteColors[cookie.sameSite] || 'gray';
    badges.push(`<span class="px-2 py-1 bg-${sameSiteColor}-500/20 text-${sameSiteColor}-400 rounded text-xs">SameSite: ${cookie.sameSite}</span>`);

    // 🆕 Create classification badge with confidence
    const confidenceBadge = classification.confidence ?
        ` <span class="text-xs opacity-75">(${Math.round(classification.confidence * 100)}%)</span>` :
        '';

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
          ${classification.icon} ${escapeHtml(classification.category)}${confidenceBadge}
        </span>
      </div>
    </div>
    
    <div class="grid grid-cols-2 gap-2 text-xs text-white/50 mb-3">
      <div><strong>Expires:</strong> ${escapeHtml(cookie.expires)}</div>
      <div><strong>Size:</strong> ${cookie.size} bytes</div>
    </div>
    
    <div class="mt-3 pt-3 border-t border-white/10">
      <div class="flex items-center justify-between">
        <span class="text-xs text-white/50">Value:</span>
        <button 
          class="toggle-value-btn text-xs text-primary hover:text-[#dffb2f] transition-colors"
          data-cookie-name="${escapeHtml(cookie.name)}"
          data-cookie-domain="${escapeHtml(cookie.domain)}"
        >
          Show
        </button>
      </div>
      <div class="mt-2 font-mono text-sm text-white/70 break-all">
        <span class="cookie-value-display" data-value="${escapeHtml(cookie.value)}">••••••••</span>
      </div>
    </div>
  `;

    // Add event listener for Show/Hide toggle
    const toggleBtn = card.querySelector('.toggle-value-btn');
    const valueDisplay = card.querySelector('.cookie-value-display');

    if (toggleBtn && valueDisplay) {
        toggleBtn.addEventListener('click', function() {
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

    return card;
}

/**
 * Show loading state in all sections
 */
function showCookieLoading() {
    const sections = [
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
 * Show empty state in all sections
 */
function showCookieEmpty(message) {
    const sections = [
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
            class="retryCookiesBtn px-3 py-1.5 bg-primary text-secondary rounded-lg text-xs font-semibold hover:bg-[#dffb2f] transition-colors"
            onclick="loadCookies()"
          >
            Retry
          </button>
        </div>
      `;
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
        updateChart(data.labels, data.values, timeframe);

    } catch (error) {
        console.error('[Timeframe] Error fetching data:', error);
        showChartError(error.message || 'Failed to load tracking data');
    } finally {
        showChartLoading(false);
    }
}

/**
 * Fetch tracking data from storage/API for the specified date range
 * This is a mock implementation - replace with actual data fetching logic
 */
async function fetchTrackingData(startDate, endDate, timeframe) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Generate mock data based on timeframe
    const labels = [];
    const values = [];

    for (let i = 0; i < daysDiff; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);

        // Format label based on timeframe
        let label;
        if (timeframe === '7d') {
            label = date.toLocaleDateString('en-US', { weekday: 'short' });
        } else if (timeframe === '30d') {
            label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else if (timeframe === '3m') {
            // Show weekly labels for 3 months
            if (i % 7 === 0 || i === daysDiff - 1) {
                label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else {
                label = '';
            }
        } else {
            // Default to daily labels
            label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        labels.push(label);

        // Generate realistic mock data with some variation
        const baseValue = 25;
        const variation = Math.sin(i / 3) * 10 + Math.random() * 10;
        values.push(Math.max(5, Math.round(baseValue + variation)));
    }

    return {
        labels,
        values,
        actualDataPoints: daysDiff,
        expectedDataPoints: daysDiff
    };
}

/**
 * Update the chart with new data
 */
function updateChart(labels, values, timeframe) {
    if (!trackingChartInstance) return;

    // Calculate appropriate max value for y-axis
    const maxValue = Math.max(...values);
    const yAxisMax = Math.ceil(maxValue * 1.2 / 10) * 10;

    // Determine point radius based on data density
    let pointRadius = 4;
    if (labels.length > 30) {
        pointRadius = 2;
    } else if (labels.length > 60) {
        pointRadius = 0;
    }

    // Update chart data
    trackingChartInstance.data.labels = labels;
    trackingChartInstance.data.datasets[0].data = values;
    trackingChartInstance.data.datasets[0].pointRadius = pointRadius;
    trackingChartInstance.options.scales.y.max = yAxisMax;

    // Update with animation
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