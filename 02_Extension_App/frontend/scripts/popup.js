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

// Function to get ring color based on score
function getRingColor(score) {
  if (score < 50) {
    return '#FF4444'; // Red for "Privacy at risk"
  } else if (score < 75) {
    return '#FFD700'; // Yellow/Gold for "Room for improvement"
  } else {
    return '#EBFF3D'; // Green (original neon yellow-green) for "You're doing great!"
  }
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

// Function to get smooth color transition based on score
function getSmoothRingColor(score) {
  if (score < 50) {
    // Interpolate from red to yellow as score approaches 50
    const factor = score / 50;
    return interpolateColor('#FF4444', '#FFD700', factor * 0.3); // Subtle transition within red range
  } else if (score < 75) {
    // Interpolate from yellow to green between 50-75
    const factor = (score - 50) / 25;
    return interpolateColor('#FFD700', '#EBFF3D', factor);
  } else {
    // Stay green for scores 75+
    return '#EBFF3D';
  }
}

// Ultra-smooth animated counter function with color transitions
function animateScore(targetScore, duration = 2800) {
  const scoreElement = document.getElementById('scoreValue');
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
      
      // Smooth transition to final message
      messageElement.style.transform = 'scale(0.95)';
      messageElement.style.opacity = '0.7';
      
      setTimeout(() => {
        const msg = targetScore < 50 ? 'Privacy at risk — take action.'
                  : targetScore < 75 ? 'Decent, but room to improve.'
                  : "You're doing great!";
        
        const subtitle = targetScore < 50 ? 'Your privacy needs immediate attention.'
                       : targetScore < 75 ? 'There\'s room for improvement.'
                       : 'Keep it up to stay safe online.';
        
        messageElement.textContent = msg;
        subtitleElement.textContent = subtitle;
        
        messageElement.style.transform = 'scale(1)';
        messageElement.style.opacity = '1';
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

// Start the ultra-smooth animation when page loads
window.addEventListener('load', () => {
  setTimeout(() => {
    animateScore(75); // Animate to 75 with ultra-smooth motion
  }, 300); // Reduced delay for more responsive feel
});

// ====== Button Handlers ======
document.addEventListener('DOMContentLoaded', function() {
  console.log('[popup.js] Initializing button handlers...');
  
  // ====== Details Button - Opens Dashboard ======
  const detailsBtn = document.getElementById('detailsBtn');
  if (detailsBtn) {
    detailsBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('[popup.js] Details button clicked');
      
      // Open dashboard in new tab
      const dashboardUrl = chrome.runtime.getURL('frontend/pages/dashboard.html');
      console.log('[popup.js] Opening dashboard:', dashboardUrl);
      chrome.tabs.create({ url: dashboardUrl });
    });
    console.log('[popup.js] Details button handler attached');
  }
  
  // ====== Go Private Button - Activates Privacy Mode ======
  const goPrivateBtn = document.getElementById('goPrivateBtn');
  if (goPrivateBtn) {
    goPrivateBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      console.log('[popup.js] Go Private button clicked');
      
      try {
        // Visual feedback
        const originalText = goPrivateBtn.textContent;
        goPrivateBtn.textContent = 'Activating...';
        goPrivateBtn.disabled = true;
        
        // Send message to service worker
        chrome.runtime.sendMessage({ action: 'activatePrivacy' }, function(response) {
          if (chrome.runtime.lastError) {
            console.warn('[popup.js] Service worker error:', chrome.runtime.lastError);
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
        
      } catch (error) {
        console.error('[popup.js] Error activating privacy mode:', error);
        goPrivateBtn.textContent = 'Try Again';
        goPrivateBtn.disabled = false;
      }
    });
    console.log('[popup.js] Go Private button handler attached');
  }
});

// Example: setScore(88);

