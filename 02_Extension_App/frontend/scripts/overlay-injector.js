// Overlay Injector - Handles the full-screen dashboard overlay

(function() {
    // Prevent duplicate injection
    if (window.hasVeilOverlay) return;
    window.hasVeilOverlay = true;

    let overlayContainer = null;

    // Listen for messages from the extension
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'toggleDashboardOverlay') {
            toggleOverlay();
            sendResponse({ success: true });
        } else if (request.action === 'closeDashboardOverlay') {
            removeOverlay();
            sendResponse({ success: true });
        }
    });

    function toggleOverlay() {
        if (overlayContainer) {
            removeOverlay();
        } else {
            createOverlay();
        }
    }

    function createOverlay() {
        // Create container
        overlayContainer = document.createElement('div');
        overlayContainer.id = 'veil-dashboard-overlay';
        
        // Style container (Fixed, Full Screen, High Z-Index)
        Object.assign(overlayContainer.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            zIndex: '2147483647', // Max z-index
            backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dim background
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(5px)',
            opacity: '0',
            transition: 'opacity 0.3s ease'
        });

        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = chrome.runtime.getURL('frontend/pages/dashboard.html?mode=overlay');
        
        // Style iframe
        Object.assign(iframe.style, {
            width: '90%',
            height: '90%',
            maxWidth: '1400px',
            maxHeight: '900px',
            border: 'none',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            backgroundColor: '#0f1235' // Match dashboard bg
        });

        // Close on click outside
        overlayContainer.addEventListener('click', (e) => {
            if (e.target === overlayContainer) {
                removeOverlay();
            }
        });

        overlayContainer.appendChild(iframe);
        document.body.appendChild(overlayContainer);

        // Animate in
        requestAnimationFrame(() => {
            overlayContainer.style.opacity = '1';
        });
        
        // Disable body scroll
        document.body.style.overflow = 'hidden';
    }

    function removeOverlay() {
        if (overlayContainer) {
            // Animate out
            overlayContainer.style.opacity = '0';
            
            setTimeout(() => {
                if (overlayContainer && overlayContainer.parentNode) {
                    overlayContainer.parentNode.removeChild(overlayContainer);
                }
                overlayContainer = null;
                // Re-enable body scroll
                document.body.style.overflow = '';
            }, 300);
        }
    }

})();
