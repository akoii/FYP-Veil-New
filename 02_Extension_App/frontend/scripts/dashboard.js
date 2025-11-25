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
  initializeHardwareControls(); // ✅ PHASE 3: Initialize hardware controls
  loadRealStatistics(); // ✅ PHASE 5: Load real statistics from storage
});

function initializeCharts() {
  // Score Breakdown Pie Chart - Navy Family Theme Colors
  const scoreCtx = document.getElementById('scoreChart').getContext('2d');
  new Chart(scoreCtx, {
    type: 'doughnut',
    data: {
      labels: ['Cookies', 'Hardware Access'],
      datasets: [{
        data: [70, 30],
        backgroundColor: [
          '#EBFF3D',  // Cookies - Brand Green
          '#FF8C69'   // Hardware Access - Coral Orange
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
        
        switch(sectionId) {
          case 'cookies-section':
            title = 'Cookies';
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
      
      console.log('[Dashboard] Fetching cookies for:', activeTabUrl);
      allCookies = await CookieManager.fetchCookiesForUrl(activeTabUrl);
    } else {
      console.log('[Dashboard] Fetching all cookies...');
      allCookies = await CookieManager.fetchAllCookies();
    }
    
    console.log(`[Dashboard] Loaded ${allCookies.length} cookies`);
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
    renderAdCookies(displayedCookies);
  }
}

/**
 * Render cookies in Ad Cookies section
 */
function renderAdCookies(cookies) {
  const container = document.getElementById('adCookiesContainer');
  const countElement = document.getElementById('adCookiesCount');
  
  if (!container) {
    console.error('[Dashboard] Ad cookies container not found!');
    return;
  }
  
  // Update count
  if (countElement) {
    countElement.textContent = cookies.length;
  }
  
  // Clear container
  container.innerHTML = '';
  
  // Apply max height for scrolling if > 200 cookies
  if (cookies.length > 200) {
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
  
  console.log(`[Dashboard] Rendered ${cookies.length} cookie cards`);
}

/**
 * Create a cookie card element
 */
function createCookieCard(cookie) {
  const card = document.createElement('div');
  card.className = 'bg-red-500/10 border border-red-500/30 rounded-xl p-4 hover:bg-red-500/15 transition-colors';
  
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
        <span class="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">Ad Cookie</span>
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
 * Show loading state
 */
function showCookieLoading() {
  const container = document.getElementById('adCookiesContainer');
  const countElement = document.getElementById('adCookiesCount');
  
  if (countElement) countElement.textContent = '...';
  
  if (container) {
    container.innerHTML = `
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span class="ml-4 text-white/60">Loading cookies...</span>
      </div>
    `;
  }
}

/**
 * Show empty state
 */
function showCookieEmpty(message) {
  const container = document.getElementById('adCookiesContainer');
  const countElement = document.getElementById('adCookiesCount');
  
  if (countElement) countElement.textContent = '0';
  
  if (container) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <svg class="w-16 h-16 text-white/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
        </svg>
        <p class="text-white/60 text-lg mb-2">No Cookies Found</p>
        <p class="text-white/40 text-sm">${escapeHtml(message)}</p>
      </div>
    `;
  }
}

/**
 * Show error state
 */
function showCookieError(message) {
  const container = document.getElementById('adCookiesContainer');
  const countElement = document.getElementById('adCookiesCount');
  
  if (countElement) countElement.textContent = '0';
  
  if (container) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <svg class="w-16 h-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <p class="text-red-400 text-lg mb-2">Error Loading Cookies</p>
        <p class="text-white/60 text-sm mb-4">${escapeHtml(message)}</p>
        <button 
          id="retryCookiesBtn"
          class="px-4 py-2 bg-primary text-secondary rounded-lg font-semibold hover:bg-[#dffb2f] transition-colors"
        >
          Retry
        </button>
      </div>
    `;
    
    // Add retry handler
    const retryBtn = container.querySelector('#retryCookiesBtn');
    if (retryBtn) {
      retryBtn.addEventListener('click', loadCookies);
    }
  }
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
  
  switch(event.key) {
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
  
  switch(timeframe) {
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

/**
 * ============================================
 * PHASE 3: Hardware Access Control Functions
 * ============================================
 */

/**
 * Initialize hardware controls
 */
function initializeHardwareControls() {
  console.log('[HardwareControls] Initializing...');
  
  // Load hardware statistics
  loadHardwareStats();
  
  // Set up toggle event listeners
  setupHardwareToggles();
  
  // Set up clear log button
  const clearLogBtn = document.getElementById('clearHardwareLog');
  if (clearLogBtn) {
    clearLogBtn.addEventListener('click', clearHardwareLog);
  }
  
  // Refresh stats every 5 seconds
  setInterval(loadHardwareStats, 5000);
}

/**
 * Load hardware statistics from storage via service worker
 */
async function loadHardwareStats() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getHardwareStats' });
    
    if (response) {
      updateHardwareCounters(response.permissions);
      updateHardwareActivityLog(response.activityLog);
      updateHardwareToggles(response.permissions);
    }
  } catch (error) {
    console.error('[HardwareControls] Error loading stats:', error);
  }
}

/**
 * Update hardware counters display
 */
function updateHardwareCounters(permissions) {
  if (!permissions) return;
  
  const counters = {
    camera: document.getElementById('cameraBlockedCount'),
    microphone: document.getElementById('microphoneBlockedCount'),
    location: document.getElementById('locationBlockedCount'),
    notifications: document.getElementById('notificationsBlockedCount')
  };
  
  Object.entries(counters).forEach(([type, element]) => {
    if (element && permissions[type]) {
      const newCount = permissions[type].count || 0;
      if (element.textContent !== newCount.toString()) {
        element.textContent = newCount;
        // Add pulse animation
        element.classList.add('updated');
        setTimeout(() => element.classList.remove('updated'), 500);
      }
    }
  });
}

/**
 * Update hardware activity log display (Phase 4 Enhanced)
 */
function updateHardwareActivityLog(activityLog) {
  const logContainer = document.getElementById('hardwareActivityLog');
  if (!logContainer) return;
  
  if (!activityLog || activityLog.length === 0) {
    logContainer.innerHTML = `
      <div class="text-center py-8 text-white/50">
        <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p>No recent permission requests</p>
      </div>
    `;
    return;
  }
  
  // Generate activity items HTML with Phase 4 enhancements
  const activityHTML = activityLog.slice(0, 10).map(item => {
    const icon = getHardwareIcon(item.type);
    const color = getHardwareColor(item.type);
    const timeAgo = getTimeAgo(item.timestamp);
    
    // Enhanced action badges with detection method
    let actionBadge = '';
    if (item.action === 'blocked') {
      actionBadge = '<span class="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">🛡️ Blocked</span>';
    } else if (item.action.includes('api_call_detected')) {
      actionBadge = '<span class="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">🔍 API Detected</span>';
    } else if (item.action.includes('suspicious')) {
      actionBadge = '<span class="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">⚠️ Suspicious</span>';
    } else if (item.action.includes('requested')) {
      actionBadge = '<span class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">📋 Requested</span>';
    } else {
      actionBadge = '<span class="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">✓ Allowed</span>';
    }
    
    // Display domain or formatted URL
    const displayUrl = item.domain || formatUrl(item.url);
    
    // Detection method badge (Phase 4)
    const detectionMethod = item.detectionMethod || 'Unknown';
    const detectionBadge = `<span class="text-xs text-white/30">${detectionMethod}</span>`;
    
    return `
      <div class="flex items-start gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
        <div class="w-10 h-10 ${color} rounded-lg flex items-center justify-center flex-shrink-0">
          ${icon}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <h4 class="text-white font-medium truncate">${displayUrl}</h4>
            ${actionBadge}
          </div>
          <p class="text-xs text-white/60">Requested ${item.type} access</p>
          <div class="flex items-center gap-3 mt-1 text-xs">
            <span class="text-white/40">${timeAgo}</span>
            <span class="text-white/20">•</span>
            ${detectionBadge}
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  logContainer.innerHTML = activityHTML;
}

/**
 * Get SVG icon for hardware type
 */
function getHardwareIcon(type) {
  const icons = {
    camera: '<svg class="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/></svg>',
    microphone: '<svg class="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd"/></svg>',
    location: '<svg class="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>',
    notifications: '<svg class="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>'
  };
  return icons[type] || icons.camera;
}

/**
 * Get color class for hardware type
 */
function getHardwareColor(type) {
  const colors = {
    camera: 'bg-blue-500/20',
    microphone: 'bg-purple-500/20',
    location: 'bg-green-500/20',
    notifications: 'bg-yellow-500/20'
  };
  return colors[type] || colors.camera;
}

/**
 * Format URL for display
 */
function formatUrl(url) {
  if (!url) return 'Unknown';
  if (url === '<all_urls>') return 'All Websites';
  
  try {
    const urlObj = new URL(url.replace('*://', 'https://'));
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * Get time ago string
 */
function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

/**
 * Setup hardware toggle event listeners
 */
function setupHardwareToggles() {
  const toggles = {
    camera: document.getElementById('cameraToggle'),
    microphone: document.getElementById('microphoneToggle'),
    location: document.getElementById('locationToggle'),
    notifications: document.getElementById('notificationsToggle')
  };
  
  Object.entries(toggles).forEach(([type, element]) => {
    if (element) {
      element.addEventListener('change', (e) => {
        handleHardwareToggle(type, e.target.checked);
      });
    }
  });
}

/**
 * Update toggle states from permissions data
 */
function updateHardwareToggles(permissions) {
  if (!permissions) return;
  
  const toggles = {
    camera: document.getElementById('cameraToggle'),
    microphone: document.getElementById('microphoneToggle'),
    location: document.getElementById('locationToggle'),
    notifications: document.getElementById('notificationsToggle')
  };
  
  Object.entries(toggles).forEach(([type, element]) => {
    if (element && permissions[type]) {
      // Only update if different to avoid triggering change event
      if (element.checked !== permissions[type].blocked) {
        element.checked = permissions[type].blocked;
      }
    }
  });
}

/**
 * Handle hardware permission toggle
 */
async function handleHardwareToggle(permissionType, shouldBlock) {
  try {
    console.log(`[HardwareControls] Toggling ${permissionType} to ${shouldBlock ? 'blocked' : 'allowed'}`);
    
    const response = await chrome.runtime.sendMessage({
      action: 'toggleHardwarePermission',
      permissionType: permissionType,
      shouldBlock: shouldBlock
    });
    
    if (response.success) {
      console.log(`[HardwareControls] Successfully toggled ${permissionType}`);
      
      // Reload stats after a short delay to reflect changes
      setTimeout(loadHardwareStats, 500);
    } else {
      console.error(`[HardwareControls] Failed to toggle ${permissionType}:`, response.error);
      // Revert toggle on error
      const toggle = document.getElementById(`${permissionType}Toggle`);
      if (toggle) {
        toggle.checked = !shouldBlock;
      }
    }
  } catch (error) {
    console.error('[HardwareControls] Error toggling permission:', error);
    // Revert toggle on error
    const toggle = document.getElementById(`${permissionType}Toggle`);
    if (toggle) {
      toggle.checked = !shouldBlock;
    }
  }
}

/**
 * Clear hardware activity log
 */
async function clearHardwareLog() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'clearHardwareLog' });
    
    if (response.success) {
      console.log('[HardwareControls] Activity log cleared');
      // Reload stats immediately
      loadHardwareStats();
    }
  } catch (error) {
    console.error('[HardwareControls] Error clearing log:', error);
  }
}

/**
 * ============================================
 * PHASE 5: Real Statistics Display System
 * ============================================
 */

/**
 * Load and display real statistics from Chrome storage
 */
async function loadRealStatistics() {
  console.log('[Statistics] Loading real statistics from storage...');
  
  try {
    // Get all statistics from service worker
    const response = await chrome.runtime.sendMessage({ action: 'getStats' });
    
    if (response) {
      // Update privacy score
      updatePrivacyScore(response.privacyScore || 0);
      
      // Update blocked items statistics
      updateBlockedItemsStats(response);
      
      // Update score breakdown chart
      updateScoreBreakdownChart(response);
      
      // Set up auto-refresh every 10 seconds
      setInterval(async () => {
        const updatedStats = await chrome.runtime.sendMessage({ action: 'getStats' });
        if (updatedStats) {
          updatePrivacyScore(updatedStats.privacyScore || 0);
          updateBlockedItemsStats(updatedStats);
          updateScoreBreakdownChart(updatedStats);
        }
      }, 10000);
      
      console.log('[Statistics] Real statistics loaded successfully');
    }
  } catch (error) {
    console.error('[Statistics] Error loading statistics:', error);
  }
}

/**
 * Update privacy score display with animation
 */
function updatePrivacyScore(score) {
  const scoreElement = document.getElementById('privacyScoreValue');
  const circleElement = document.getElementById('privacyScoreCircle');
  const messageElement = document.getElementById('privacyScoreMessage');
  
  if (!scoreElement || !circleElement) return;
  
  // Animate score number
  const currentScore = parseInt(scoreElement.textContent) || 0;
  animateValue(scoreElement, currentScore, score, 1000);
  
  // Update circle progress
  const circumference = 2 * Math.PI * 40; // radius = 40
  const offset = circumference - (score / 100) * circumference;
  circleElement.style.strokeDasharray = circumference;
  circleElement.style.strokeDashoffset = offset;
  
  // Update message based on score
  if (messageElement) {
    let message = '';
    let color = '';
    
    if (score >= 80) {
      message = '🎉 Excellent Protection!';
      color = '#EBFF3D'; // Green
      circleElement.style.stroke = '#EBFF3D';
    } else if (score >= 60) {
      message = '✅ Good Protection';
      color = '#4DD4E8'; // Cyan
      circleElement.style.stroke = '#4DD4E8';
    } else if (score >= 40) {
      message = '⚠️ Moderate Protection';
      color = '#FFB366'; // Orange
      circleElement.style.stroke = '#FFB366';
    } else {
      message = '🚨 Weak Protection';
      color = '#FF6B6B'; // Red
      circleElement.style.stroke = '#FF6B6B';
    }
    
    messageElement.textContent = message;
    messageElement.style.color = color;
    scoreElement.style.color = color;
  }
}

/**
 * Animate number value change
 */
function animateValue(element, start, end, duration) {
  const range = end - start;
  const increment = range / (duration / 16); // 60fps
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = Math.round(current);
  }, 16);
}

/**
 * Update blocked items statistics
 */
function updateBlockedItemsStats(stats) {
  // Update Cookies Blocked
  const cookiesEl = document.getElementById('cookiesBlockedStat');
  if (cookiesEl) {
    cookiesEl.textContent = formatNumber(stats.cookiesBlocked || 0);
  }
  
  // Update Hardware Access Blocked
  const hardwareEl = document.getElementById('hardwareBlockedStat');
  if (hardwareEl) {
    hardwareEl.textContent = formatNumber(stats.hardwareAccessBlocked || 0);
  }
  
  console.log('[Statistics] Blocked items updated:', {
    cookies: stats.cookiesBlocked,
    hardware: stats.hardwareAccessBlocked
  });
}

/**
 * Format number with commas for better readability
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Update score breakdown chart with real data
 */
function updateScoreBreakdownChart(stats) {
  const scoreChart = Chart.getChart('scoreChart');
  if (!scoreChart) return;
  
  // Calculate percentages based on actual blocked items
  const total = 
    (stats.cookiesBlocked || 0) +
    (stats.hardwareAccessBlocked || 0);
  
  if (total === 0) {
    // No data yet, show equal distribution
    scoreChart.data.datasets[0].data = [50, 50];
  } else {
    // Calculate percentages
    const cookiesPercent = ((stats.cookiesBlocked || 0) / total) * 100;
    const hardwarePercent = ((stats.hardwareAccessBlocked || 0) / total) * 100;
    
    scoreChart.data.datasets[0].data = [
      cookiesPercent.toFixed(1),
      hardwarePercent.toFixed(1)
    ];
  }
  
  // Update chart with animation
  scoreChart.update('active');
  
  console.log('[Statistics] Score breakdown chart updated');
}

/**
 * Get statistics summary for display
 */
async function getStatisticsSummary() {
  try {
    const stats = await chrome.runtime.sendMessage({ action: 'getStats' });
    
    if (stats) {
      const total = 
        (stats.cookiesBlocked || 0) +
        (stats.hardwareAccessBlocked || 0);
      
      return {
        privacyScore: stats.privacyScore || 0,
        totalBlocked: total,
        cookiesBlocked: stats.cookiesBlocked || 0,
        hardwareBlocked: stats.hardwareAccessBlocked || 0,
        lastUpdated: stats.lastUpdated || Date.now()
      };
    }
    
    return null;
  } catch (error) {
    console.error('[Statistics] Error getting summary:', error);
    return null;
  }
}

/**
 * Export statistics for reporting
 */
async function exportStatistics() {
  try {
    const summary = await getStatisticsSummary();
    
    if (summary) {
      const statsReport = {
        timestamp: new Date().toISOString(),
        privacyScore: summary.privacyScore,
        blockedItems: {
          total: summary.totalBlocked,
          cookies: summary.cookiesBlocked,
          hardware: summary.hardwareBlocked
        }
      };
      
      // Convert to JSON and download
      const dataStr = JSON.stringify(statsReport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `veil-statistics-${Date.now()}.json`;
      link.click();
      
      console.log('[Statistics] Statistics exported successfully');
    }
  } catch (error) {
    console.error('[Statistics] Error exporting statistics:', error);
  }
}

/**
 * Reset all statistics (admin function)
 */
async function resetStatistics() {
  if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'clearStats' });
      
      if (response.success) {
        console.log('[Statistics] Statistics reset successfully');
        // Reload page to reflect changes
        window.location.reload();
      }
    } catch (error) {
      console.error('[Statistics] Error resetting statistics:', error);
    }
  }
}
