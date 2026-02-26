// Popup Page JavaScript - Privacy Score Animation

// Enhanced easing functions for ultra-smooth animation
const easing = {
  // Ultra smooth easing curve
  easeOutQuint: t => 1 - Math.pow(1 - t, 5),
  // Even smoother with gentle acceleration
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  // Fluid spring-like effect
  easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
};

// Function to get ring color based on score (5-tier gamification)
function getRingColor(score) {
  if (score < 20) return '#FF4444'; // Exposed
  if (score < 40) return '#FF8C42'; // Vulnerable
  if (score < 60) return '#FFD700'; // Guarded
  if (score < 80) return '#7BEA4D'; // Protected
  return '#EBFF3D'; // Fortified
}

// Function to smoothly interpolate between colors
function interpolateColor(color1, color2, factor) {
  // Convert hex to RGB
  const hex2rgb = hex => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  const rgb2hex = (r, g, b) => {
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
  };

  const rgb1 = hex2rgb(color1);
  const rgb2 = hex2rgb(color2);

  const r = rgb1[0] + (rgb2[0] - rgb1[0]) * factor;
  const g = rgb1[1] + (rgb2[1] - rgb1[1]) * factor;
  const b = rgb1[2] + (rgb2[2] - rgb1[2]) * factor;

  return rgb2hex(r, g, b);
}

// Function to get smooth color transition based on score (5-tier)
function getSmoothRingColor(score) {
  if (score < 20) {
    const factor = score / 20;
    return interpolateColor('#FF4444', '#FF8C42', factor * 0.3);
  } else if (score < 40) {
    const factor = (score - 20) / 20;
    return interpolateColor('#FF8C42', '#FFD700', factor);
  } else if (score < 60) {
    const factor = (score - 40) / 20;
    return interpolateColor('#FFD700', '#7BEA4D', factor);
  } else if (score < 80) {
    const factor = (score - 60) / 20;
    return interpolateColor('#7BEA4D', '#EBFF3D', factor);
  } else {
    return '#EBFF3D';
  }
}

// Ultra-smooth animated counter function with color transitions
function animateScore(targetScore, duration = 2800) {
  // Hide the loading indicator when animation starts (Phase 8)
  hideScoreLoading();

  const scoreElement = document.getElementById('scoreValue');
  // Apply pop-in animation for initial reveal
  scoreElement.classList.remove('score-pop');
  void scoreElement.offsetWidth; // reflow to restart animation
  scoreElement.classList.add('score-pop');

  // Trigger ring glow effect
  const ringWrapper = document.getElementById('scoreRingWrapper');
  if (ringWrapper) {
    ringWrapper.classList.remove('score-ring-loaded');
    void ringWrapper.offsetWidth;
    ringWrapper.classList.add('score-ring-loaded');
    ringWrapper.setAttribute('aria-label', `Privacy score: ${targetScore}`);
  }

  const messageElement = document.getElementById('scoreMessage');
  const subtitleElement = messageElement.nextElementSibling;
  const startTime = performance.now();
  const startScore = 0;
  let lastUpdate = 0;
  let hasUpdatedMessage = false;

  function updateScore(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Use ultra-smooth easing with gentle start and smooth finish
    const easedProgress = easing.easeInOutCubic(progress);
    const rawScore = startScore + (targetScore - startScore) * easedProgress;

    // Smooth number updates - only update when there's a meaningful change
    const currentScore = Math.round(rawScore);

    // Throttle updates for ultra-smooth performance
    if (currentTime - lastUpdate > 16) { // ~60fps cap
      // Update the ring progress with sub-pixel precision
      document.documentElement.style.setProperty('--score', rawScore);

      // Update ring color based on current score with smooth transitions
      const ringColor = getSmoothRingColor(rawScore);
      document.documentElement.style.setProperty('--ring-color', ringColor);

      // Update the number display
      scoreElement.textContent = currentScore;

      lastUpdate = currentTime;
    }

    // Only update message when animation is complete (professional approach)
    if (progress >= 1 && !hasUpdatedMessage) {
      hasUpdatedMessage = true;

      // Smooth transition to final message — use CSS class instead of raw style.opacity (Phase 8)
      messageElement.classList.add('msg-fading');

      setTimeout(() => {
        // 5-tier gamification messages
        let msg, subtitle;
        if (targetScore < 20) {
          msg = '🛑 You\'re Exposed';
          subtitle = 'Enable protections to start leveling up!';
        } else if (targetScore < 40) {
          msg = '⚠️ Vulnerable';
          subtitle = 'Threats are slipping through — keep blocking.';
        } else if (targetScore < 60) {
          msg = '🛡️ Guarded';
          subtitle = 'Good start! Block more to reach Protected.';
        } else if (targetScore < 80) {
          msg = '✅ Protected';
          subtitle = 'Strong defenses active. Almost Fortified!';
        } else {
          msg = '🏆 Fortified!';
          subtitle = 'Maximum privacy — keep it up!';
        }

        messageElement.textContent = msg;
        subtitleElement.textContent = subtitle;

        messageElement.classList.remove('msg-fading');
      }, 150);
    }

    if (progress < 1) {
      requestAnimationFrame(updateScore);
    } else {
      // Ensure final values are set precisely
      document.documentElement.style.setProperty('--score', targetScore);
      document.documentElement.style.setProperty('--ring-color', getSmoothRingColor(targetScore));
      scoreElement.textContent = targetScore;
    }
  }

  requestAnimationFrame(updateScore);
}

// Optional helper: update score anywhere in your app
function setScore(val) {
  const score = Math.max(0, Math.min(100, Number(val) || 0));
  animateScore(score);
}

/**
 * Show the loading state on the score ring (bouncing dots + skeleton text).
 * Called immediately on popup load while waiting for storage data.
 */
function showScoreLoading() {
  const dots = document.getElementById('scoreLoadingDots');
  const scoreEl = document.getElementById('scoreValue');
  if (dots) dots.style.display = 'flex';
  if (scoreEl) scoreEl.classList.add('score-loading-skeleton');
}

/**
 * Hide the loading state — called at the start of animateScore().
 */
function hideScoreLoading() {
  const dots = document.getElementById('scoreLoadingDots');
  const scoreEl = document.getElementById('scoreValue');
  if (dots) dots.style.display = 'none';
  if (scoreEl) scoreEl.classList.remove('score-loading-skeleton');
}

// Start the ultra-smooth animation when page loads
window.addEventListener('load', () => {
  showScoreLoading(); // Phase 8: show skeleton before data arrives
  setTimeout(() => {
    updateStats();
  }, 300); // Reduced delay for more responsive feel
});

// Function to update quick stats
function updateStats() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get([
      'privacyScore',
      'privacyTier'
    ], (data) => {
      const score = data.privacyScore || 0;
      animateScore(score);
    });
  } else {
    animateScore(0);
  }
}

// Example: setScore(88);

// ====== Button Handlers ======
(function () {
  'use strict';

  console.log('[popup.js] Initializing button handlers...');

  document.addEventListener('DOMContentLoaded', function () {

    // ====== Details Button - Opens Dashboard ======
    const detailsBtn = document.getElementById('detailsBtn');
    if (detailsBtn && !detailsBtn.hasAttribute('data-handler-attached')) {
      detailsBtn.setAttribute('data-handler-attached', 'true');
      detailsBtn.addEventListener('click', function (e) {
        e.preventDefault();
        console.log('[popup.js] Details button clicked');

        // Check if we're in extension context
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          // Try to toggle the in-page overlay first
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (currentTab && currentTab.id) {
              // Send message to content script to toggle overlay
              chrome.tabs.sendMessage(currentTab.id, { action: 'toggleDashboardOverlay' }, (response) => {
                // If error (e.g. no content script on this page like chrome:// URLs), fallback to new tab
                if (chrome.runtime.lastError) {
                  console.log('Overlay injection failed, opening new tab:', chrome.runtime.lastError);
                  const dashboardUrl = chrome.runtime.getURL('frontend/pages/dashboard.html');
                  chrome.tabs.create({ url: dashboardUrl });
                }
                window.close();
              });
            } else {
              // Fallback: Open in new tab
              const dashboardUrl = chrome.runtime.getURL('frontend/pages/dashboard.html');
              chrome.tabs.create({ url: dashboardUrl });
              window.close();
            }
          });
        } else {
          // Regular web context - navigate normally
          console.log('[popup.js] Navigating to dashboard.html');
          window.location.href = 'dashboard.html';
        }
      });
      console.log('[popup.js] Details button handler attached');
    }

    // ====== Detection Notifications Toggle ======
    const detectionToggle = document.getElementById('detectionToggle');
    if (detectionToggle) {
      // Load saved state
      chrome.storage.local.get(['hardwareDetectionNotifications'], (res) => {
        // Default to true if not set
        detectionToggle.checked = res.hardwareDetectionNotifications !== false;
      });

      // Save state on change
      detectionToggle.addEventListener('change', (e) => {
        chrome.storage.local.set({ hardwareDetectionNotifications: e.target.checked });
      });
    }

    // ====== Go Private Button - Activates Privacy Mode ======
    const goPrivateBtn = document.getElementById('goPrivateBtn');
    if (goPrivateBtn && !goPrivateBtn.hasAttribute('data-handler-attached')) {
      goPrivateBtn.setAttribute('data-handler-attached', 'true');
      goPrivateBtn.addEventListener('click', async function (e) {
        e.preventDefault();
        console.log('[popup.js] Go Private button clicked');

        try {
          // Visual feedback
          const originalText = goPrivateBtn.textContent;
          goPrivateBtn.textContent = 'Activating...';
          goPrivateBtn.disabled = true;

          // Check if we're in extension context
          if (typeof chrome !== 'undefined' && chrome.runtime) {
            // Send message to service worker
            chrome.runtime.sendMessage({ action: 'activatePrivacy' }, function (response) {
              if (chrome.runtime.lastError) {
                console.warn('[popup.js] Service worker error:', chrome.runtime.lastError);
                applyPrivacySettingsFallback();
              } else {
                console.log('[popup.js] Privacy mode activated:', response);
              }

              // Update button
              goPrivateBtn.textContent = 'Privacy Active!';
              goPrivateBtn.classList.add('opacity-75');

              // Reset after delay
              setTimeout(() => {
                goPrivateBtn.textContent = originalText;
                goPrivateBtn.disabled = false;
                goPrivateBtn.classList.remove('opacity-75');
              }, 2000);
            });
          } else {
            // Fallback for non-extension context
            console.log('[popup.js] Non-extension context, using fallback');
            applyPrivacySettingsFallback();

            goPrivateBtn.textContent = 'Privacy Active!';
            setTimeout(() => {
              goPrivateBtn.textContent = originalText;
              goPrivateBtn.disabled = false;
            }, 2000);
          }

        } catch (error) {
          console.error('[popup.js] Error activating privacy mode:', error);
          goPrivateBtn.textContent = 'Try Again';
          goPrivateBtn.disabled = false;
        }
      });
      console.log('[popup.js] Go Private button handler attached');
    }

    // ====== Helper Functions ======
    function applyPrivacySettingsFallback() {
      console.log('[popup.js] Applying privacy settings (fallback)...');

      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ privacyScore: 90, privacyModeActive: true }, function () {
          console.log('[popup.js] Privacy score updated to 90');

          // Update UI if animateScore is available
          if (typeof animateScore === 'function') {
            animateScore(90);
          }
        });
      }
    }

    console.log('[popup.js] All handlers initialized');
  });

})();
