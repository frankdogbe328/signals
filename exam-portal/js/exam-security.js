// Exam Security Module - Anti-cheating measures

let securityEnabled = false;
let tabSwitchCount = 0;
let maxTabSwitches = 3; // Allow a few accidental switches
let blurStartTime = null;
let maxBlurTime = 5000; // 5 seconds max time out of focus
let securityWarnings = [];

// Enable exam security measures - requires fullscreen first
async function enableExamSecurity() {
    if (securityEnabled) return;
    
    console.log('Enabling exam security...');
    
    // REQUIRE FULLSCREEN FIRST
    try {
        await requireFullscreen();
    } catch (error) {
        console.error('Fullscreen requirement failed:', error);
        showError('Fullscreen mode is required to start the exam. Please enable fullscreen and try again.', 'Fullscreen Required');
        return false; // Return false to indicate security not enabled
    }
    
    securityEnabled = true;
    console.log('Exam security enabled');
    
    // Disable copy, paste, cut
    disableCopyPaste();
    
    // Disable right-click
    disableRightClick();
    
    // Monitor tab switching and window blur
    monitorTabSwitching();
    
    // Prevent navigation away from page
    preventNavigation();
    
    // Monitor fullscreen changes
    monitorFullscreen();
    
    // Show security notice
    showSecurityNotice();
    
    return true; // Security successfully enabled
}

// Disable exam security measures
function disableExamSecurity() {
    securityEnabled = false;
    tabSwitchCount = 0;
    securityWarnings = [];
    
    // Clear long-press timer
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
    
    // Re-enable copy/paste
    document.removeEventListener('copy', preventCopy, true);
    window.removeEventListener('copy', preventCopy, true);
    document.removeEventListener('paste', preventPaste, true);
    window.removeEventListener('paste', preventPaste, true);
    document.removeEventListener('cut', preventCut, true);
    window.removeEventListener('cut', preventCut, true);
    document.removeEventListener('keydown', preventCopyPasteKeys, true);
    window.removeEventListener('keydown', preventCopyPasteKeys, true);
    
    // Re-enable text selection
    document.removeEventListener('selectstart', preventSelect, true);
    document.removeEventListener('selectionchange', preventSelect, true);
    document.removeEventListener('contextmenu', preventContextMenu, true);
    document.removeEventListener('touchstart', preventLongPress);
    document.removeEventListener('touchmove', preventLongPress);
    document.removeEventListener('touchend', preventLongPress);
    
    // Restore text selection CSS
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    document.body.style.mozUserSelect = '';
    document.body.style.msUserSelect = '';
    
    // Re-enable right-click
    document.removeEventListener('contextmenu', preventRightClick);
    
    // Remove blur/focus listeners
    window.removeEventListener('blur', handleWindowBlur);
    window.removeEventListener('focus', handleWindowFocus);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    
    // Remove beforeunload warning
    window.removeEventListener('beforeunload', handleBeforeUnload);
    
    console.log('Exam security disabled');
}

// Check if fullscreen is currently active
function isFullscreenActive() {
    return !!(document.fullscreenElement || 
              document.webkitFullscreenElement || 
              document.msFullscreenElement ||
              document.mozFullScreenElement);
}

// Request fullscreen mode - returns promise
function requestFullscreen() {
    return new Promise((resolve, reject) => {
        const elem = document.documentElement;
        
        // MOBILE-SPECIFIC: Check if device is mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (elem.requestFullscreen) {
            // Standard fullscreen API
            elem.requestFullscreen()
                .then(() => resolve())
                .catch(err => {
                    console.warn('Fullscreen request denied:', err);
                    // On mobile, fullscreen might not be available, but we still want to proceed
                    if (isMobile) {
                        console.log('Mobile device detected - fullscreen may not be available, but security will still be enforced');
                        resolve(); // Allow exam to proceed on mobile even if fullscreen fails
                    } else {
                        reject(err);
                    }
                });
        } else if (elem.webkitRequestFullscreen) { // Safari
            elem.webkitRequestFullscreen();
            // Safari doesn't return promise, check after short delay
            setTimeout(() => {
                if (isFullscreenActive()) {
                    resolve();
                } else {
                    if (isMobile) {
                        console.log('Mobile Safari - fullscreen may not be available, but security will still be enforced');
                        resolve(); // Allow exam to proceed on mobile Safari
                    } else {
                        reject(new Error('Fullscreen not supported or denied'));
                    }
                }
            }, 100);
        } else if (elem.msRequestFullscreen) { // IE/Edge
            elem.msRequestFullscreen();
            setTimeout(() => {
                if (isFullscreenActive()) {
                    resolve();
                } else {
                    if (isMobile) {
                        resolve(); // Allow exam to proceed on mobile
                    } else {
                        reject(new Error('Fullscreen not supported or denied'));
                    }
                }
            }, 100);
        } else if (elem.webkitEnterFullscreen) { // iOS Safari
            // iOS Safari has different fullscreen API
            elem.webkitEnterFullscreen();
            setTimeout(() => {
                if (isFullscreenActive()) {
                    resolve();
                } else {
                    // On iOS, fullscreen might not work, but allow exam to proceed
                    console.log('iOS device detected - fullscreen may not be available');
                    resolve();
                }
            }, 100);
        } else {
            // No fullscreen support
            if (isMobile) {
                console.log('Mobile device without fullscreen support - security will still be enforced');
                resolve(); // Allow exam to proceed on mobile devices
            } else {
                reject(new Error('Fullscreen API not supported in this browser'));
            }
        }
    });
}

// Require fullscreen before exam can proceed
function requireFullscreen() {
    return new Promise((resolve, reject) => {
        // Check if already in fullscreen
        if (isFullscreenActive()) {
            resolve();
            return;
        }
        
        // Show blocking fullscreen requirement message
        showFullscreenRequirement(resolve, reject);
        
        // Request fullscreen
        requestFullscreen()
            .then(() => {
                hideFullscreenRequirement();
                resolve();
            })
            .catch(() => {
                // Fullscreen request failed, but user can enable manually
                // The modal will stay until they enable fullscreen
            });
    });
}

// Show blocking fullscreen requirement modal
function showFullscreenRequirement(onSuccess, onCancel) {
    console.log('Showing fullscreen requirement modal');
    
    // Remove existing modal if any
    const existing = document.getElementById('fullscreenRequirementModal');
    if (existing) {
        existing.remove();
    }
    
    // Ensure body exists
    if (!document.body) {
        console.error('Document body not ready');
        setTimeout(() => showFullscreenRequirement(onSuccess, onCancel), 100);
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'fullscreenRequirementModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 99999;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        color: white;
        font-family: Arial, sans-serif;
    `;
    
    modal.innerHTML = `
        <div style="text-align: center; max-width: 600px; padding: 40px 20px; background: #1a1a1a; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); width: 95%; margin: 0 auto;">
            <div style="font-size: 64px; margin-bottom: 20px;">🔒</div>
            <h2 style="color: #ff9800; margin-bottom: 20px; font-size: 28px; line-height: 1.3;">Fullscreen Mode Required</h2>
            <p style="font-size: 18px; line-height: 1.6; margin-bottom: 30px; color: #e0e0e0;">
                For exam security and integrity, you must enable fullscreen mode before you can start the exam.
            </p>
            <div style="background: #2a2a2a; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: left;">
                <p style="margin: 10px 0; font-size: 16px;"><strong>How to enable fullscreen:</strong></p>
                <ol style="margin: 10px 0; padding-left: 20px; line-height: 2;">
                    <li>Click the button below to enable fullscreen</li>
                    <li>Or press <kbd style="background: #3a3a3a; padding: 5px 10px; border-radius: 4px;">F11</kbd> on your keyboard</li>
                    <li>Or use your browser's fullscreen option</li>
                </ol>
            </div>
            <div id="fullscreenButtons" style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <button id="enableFullscreenBtn" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 15px 40px;
                    font-size: 18px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: background 0.3s;
                    min-height: 52px;
                    min-width: 200px;
                    -webkit-tap-highlight-color: transparent;
                    touch-action: manipulation;
                ">Enable Fullscreen</button>
                <button id="cancelExamBtn" style="
                    background: #f44336;
                    color: white;
                    border: none;
                    padding: 15px 40px;
                    font-size: 18px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: background 0.3s;
                    min-height: 52px;
                    min-width: 200px;
                    -webkit-tap-highlight-color: transparent;
                    touch-action: manipulation;
                ">Cancel</button>
            </div>
            <p id="fullscreenStatus" style="margin-top: 20px; color: #ff9800; font-size: 14px; word-wrap: break-word;"></p>
        </div>
        <style>
            @media (max-width: 768px) {
                #fullscreenRequirementModal > div {
                    padding: 30px 15px !important;
                    width: 98% !important;
                }
                #fullscreenRequirementModal h2 {
                    font-size: 22px !important;
                }
                #fullscreenRequirementModal p {
                    font-size: 16px !important;
                }
                #fullscreenButtons {
                    flex-direction: column !important;
                    width: 100% !important;
                }
                #enableFullscreenBtn,
                #cancelExamBtn {
                    width: 100% !important;
                    min-width: 100% !important;
                    padding: 16px 20px !important;
                    font-size: 16px !important;
                }
                #enableFullscreenBtn:active,
                #cancelExamBtn:active {
                    transform: scale(0.98);
                    opacity: 0.9;
                }
            }
            @media (max-width: 480px) {
                #fullscreenRequirementModal > div {
                    padding: 25px 12px !important;
                }
                #fullscreenRequirementModal h2 {
                    font-size: 20px !important;
                }
                #fullscreenRequirementModal p {
                    font-size: 15px !important;
                }
                #fullscreenRequirementModal div[style*="font-size: 64px"] {
                    font-size: 48px !important;
                }
            }
        </style>
    `;
    
    document.body.appendChild(modal);
    console.log('Fullscreen modal added to DOM');
    
    // Button handlers - wait for DOM to be ready
    setTimeout(() => {
        console.log('Setting up button handlers');
        const enableBtn = document.getElementById('enableFullscreenBtn');
        const cancelBtn = document.getElementById('cancelExamBtn');
        
        if (enableBtn) {
            enableBtn.addEventListener('click', () => {
                requestFullscreen()
                    .then(() => {
                        hideFullscreenRequirement();
                        if (onSuccess) onSuccess();
                    })
                    .catch(() => {
                        const statusEl = document.getElementById('fullscreenStatus');
                        if (statusEl) {
                            statusEl.textContent = 
                                'Fullscreen request was denied. Please enable fullscreen manually (F11) or use browser menu.';
                        }
                    });
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                hideFullscreenRequirement();
                if (onCancel) onCancel();
                // Go back to exams list
                if (typeof goBackToExams === 'function') {
                    goBackToExams();
                }
            });
        }
    }, 100);
    
    // Monitor fullscreen changes
    const checkFullscreen = setInterval(() => {
        if (isFullscreenActive()) {
            clearInterval(checkFullscreen);
            hideFullscreenRequirement();
            if (onSuccess) onSuccess();
        }
    }, 500);
    
    // Clean up interval if modal is removed
    modal.addEventListener('remove', () => {
        clearInterval(checkFullscreen);
    });
}

function hideFullscreenRequirement() {
    const modal = document.getElementById('fullscreenRequirementModal');
    if (modal) {
        modal.remove();
    }
}

// Monitor fullscreen changes
function monitorFullscreen() {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
}

function handleFullscreenChange() {
    const isFullscreen = isFullscreenActive();
    
    if (!isFullscreen && securityEnabled) {
        // User exited fullscreen - BLOCK EXAM VIEW
        tabSwitchCount++;
        showWarning(`You exited fullscreen mode. ${maxTabSwitches - tabSwitchCount} warnings remaining before exam auto-submission.`);
        
        // Hide exam content
        hideExamContent();
        
        // Show fullscreen requirement again
        requireFullscreen()
            .then(() => {
                // Fullscreen restored, show exam content
                showExamContent();
            })
            .catch(() => {
                // Fullscreen not enabled, keep exam hidden
            });
        
        // If too many exits, warn about auto-submission
        if (tabSwitchCount >= maxTabSwitches) {
            showCriticalWarning('You have exited fullscreen mode multiple times. The exam will be automatically submitted if you continue.');
            // Could auto-submit here if needed
        }
    } else if (isFullscreen && securityEnabled) {
        // Fullscreen restored, show exam content
        showExamContent();
    }
}

// Hide exam content when fullscreen is exited
function hideExamContent() {
    const examView = document.getElementById('examTakingView');
    if (examView) {
        examView.style.display = 'none';
    }
    
    // Show blocking overlay
    showFullscreenRequirement(() => {
        showExamContent();
    });
}

// Show exam content when fullscreen is active
function showExamContent() {
    const examView = document.getElementById('examTakingView');
    if (examView && isFullscreenActive()) {
        examView.style.display = 'block';
    }
}

// Disable copy, paste, and cut
function disableCopyPaste() {
    // Prevent copy - use capture phase to catch early
    document.addEventListener('copy', preventCopy, true);
    window.addEventListener('copy', preventCopy, true);
    
    // Prevent paste - use capture phase
    document.addEventListener('paste', preventPaste, true);
    window.addEventListener('paste', preventPaste, true);
    
    // Prevent cut - use capture phase
    document.addEventListener('cut', preventCut, true);
    window.addEventListener('cut', preventCut, true);
    
    // Prevent keyboard shortcuts - use capture phase with high priority
    document.addEventListener('keydown', preventCopyPasteKeys, true);
    window.addEventListener('keydown', preventCopyPasteKeys, true);
    
    // Also prevent on input elements directly
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            preventCopyPasteKeys(e);
        }
    }, true);
    
    // MOBILE-SPECIFIC: Prevent text selection on mobile devices
    document.addEventListener('selectstart', preventSelect, true);
    document.addEventListener('selectionchange', preventSelect, true);
    
    // MOBILE-SPECIFIC: Prevent long-press context menu (mobile copy/paste)
    document.addEventListener('contextmenu', preventContextMenu, true);
    document.addEventListener('touchstart', preventLongPress, { passive: false });
    document.addEventListener('touchmove', preventLongPress, { passive: false });
    document.addEventListener('touchend', preventLongPress, { passive: false });
    
    // MOBILE-SPECIFIC: Prevent text selection via CSS
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.mozUserSelect = 'none';
    document.body.style.msUserSelect = 'none';
    
    // Allow selection in input/textarea fields only
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.style.userSelect = 'text';
        input.style.webkitUserSelect = 'text';
    });
}

function preventCopy(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    showWarning('Copy is disabled during the exam.');
    return false;
}

function preventPaste(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    showWarning('Paste is disabled during the exam.');
    return false;
}

function preventCut(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    showWarning('Cut is disabled during the exam.');
    return false;
}

function preventCopyPasteKeys(e) {
    // Check for Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A (Windows/Linux)
    // Check for Cmd+C, Cmd+V, Cmd+X, Cmd+A (Mac)
    const key = e.key.toLowerCase();
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    
    if (isCtrlOrCmd && (
        key === 'c' ||
        key === 'v' ||
        key === 'x' ||
        key === 'a' ||
        key === 's' // Also disable save
    )) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showWarning('This keyboard shortcut (Copy/Paste/Cut) is disabled during the exam.');
        return false;
    }
    
    // Disable F12 (Developer Tools)
    if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showWarning('Developer tools are disabled during the exam.');
        return false;
    }
    
    // Disable Ctrl+Shift+I (Developer Tools)
    if (isCtrlOrCmd && e.shiftKey && (key === 'i')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showWarning('Developer tools are disabled during the exam.');
        return false;
    }
    
    // Disable Ctrl+Shift+C (Element Inspector)
    if (isCtrlOrCmd && e.shiftKey && (key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showWarning('Developer tools are disabled during the exam.');
        return false;
    }
    
    // Disable Ctrl+Shift+J (Console)
    if (isCtrlOrCmd && e.shiftKey && (key === 'j')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showWarning('Developer tools are disabled during the exam.');
        return false;
    }
    
    // Disable Ctrl+U (View Source)
    if (isCtrlOrCmd && (key === 'u')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showWarning('View source is disabled during the exam.');
        return false;
    }
}

function preventSelect(e) {
    // Prevent text selection on non-input elements
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    }
}

// MOBILE-SPECIFIC: Prevent long-press context menu
let longPressTimer = null;
function preventLongPress(e) {
    // Clear any existing timer
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
    
    // Prevent long-press on non-input elements
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
        if (e.type === 'touchstart') {
            // Set timer for long-press detection
            longPressTimer = setTimeout(() => {
                showWarning('Long-press is disabled during the exam.');
                e.preventDefault();
                e.stopPropagation();
            }, 500); // 500ms threshold for long-press
        } else if (e.type === 'touchmove' || e.type === 'touchend') {
            // Clear timer if user moves finger or lifts it
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }
    }
}

function preventContextMenu(e) {
    // Allow context menu only in input/textarea fields
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showWarning('Context menu is disabled during the exam.');
        return false;
    }
}

// Disable right-click
function disableRightClick() {
    document.addEventListener('contextmenu', preventRightClick);
    
    // Also disable common right-click alternatives
    document.addEventListener('mousedown', function(e) {
        if (e.button === 2) { // Right mouse button
            e.preventDefault();
            e.stopPropagation();
            showWarning('Right-click is disabled during the exam.');
            return false;
        }
    });
}

function preventRightClick(e) {
    e.preventDefault();
    e.stopPropagation();
    showWarning('Right-click is disabled during the exam.');
    return false;
}

// Monitor tab switching and window blur
function monitorTabSwitching() {
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    
    // Also detect visibility changes (works on mobile too)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // MOBILE-SPECIFIC: Detect app switching on mobile devices
    // Page Visibility API works for mobile app switching
    // Additional check for mobile browsers
    if (typeof document.hidden !== 'undefined') {
        // Already handled by visibilitychange
    }
    
    // MOBILE-SPECIFIC: Detect when page loses focus (app switching, home button, etc.)
    window.addEventListener('pagehide', function(e) {
        if (securityEnabled) {
            handleWindowBlur();
            // Log security event
            const timestamp = new Date().toISOString();
            securityWarnings.push({
                timestamp,
                type: 'mobile_app_switch',
                details: 'User switched to another app or pressed home button'
            });
            console.log('Security Event: Mobile app switch detected');
        }
    });
    
    // MOBILE-SPECIFIC: Detect when page regains focus
    window.addEventListener('pageshow', function(e) {
        if (securityEnabled && e.persisted) {
            // Page was restored from cache (back button or app switch)
            handleWindowFocus();
            showWarning('Page was restored. Your activity has been logged.');
        }
    });
}

function handleWindowBlur() {
    if (!securityEnabled) return;
    
    blurStartTime = Date.now();
    tabSwitchCount++;
    
    showWarning(`You switched away from the exam window. ${maxTabSwitches - tabSwitchCount} warnings remaining.`);
    
    if (tabSwitchCount >= maxTabSwitches) {
        showCriticalWarning('You have switched away from the exam multiple times. Your exam may be flagged for review.');
        // Could auto-submit here if needed
    }
}

function handleWindowFocus() {
    if (!securityEnabled) return;
    
    if (blurStartTime) {
        const blurDuration = Date.now() - blurStartTime;
        
        if (blurDuration > maxBlurTime) {
            showCriticalWarning(`You were away from the exam for ${Math.round(blurDuration / 1000)} seconds. This activity will be logged.`);
        }
        
        blurStartTime = null;
    }
}

function handleVisibilityChange() {
    if (!securityEnabled) return;
    
    if (document.hidden) {
        // Page is hidden (tab switched or minimized)
        handleWindowBlur();
    } else {
        // Page is visible again
        handleWindowFocus();
    }
}

// Prevent navigation away from page
function preventNavigation() {
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Enhanced back button prevention with warning and auto-submit
    let backButtonAttempts = 0;
    window.addEventListener('popstate', function(e) {
        if (securityEnabled) {
            backButtonAttempts++;
            
            if (backButtonAttempts === 1) {
                // First attempt: Show warning
                e.preventDefault();
                window.history.pushState(null, null, window.location.href);
                
                if (typeof showError === 'function') {
                    showError('⚠️ WARNING: Going back will auto-submit your exam!\n\nIf you go back again, your exam will be automatically submitted with your current answers.\n\nStay on this page to continue your exam.', 'Back Button Warning');
                } else {
                    alert('⚠️ WARNING: Going back will auto-submit your exam!\n\nIf you go back again, your exam will be automatically submitted with your current answers.');
                }
            } else if (backButtonAttempts >= 2) {
                // Second attempt: Auto-submit exam
                e.preventDefault();
                window.history.pushState(null, null, window.location.href);
                
                if (typeof showError === 'function') {
                    showError('Exam auto-submitted due to back button usage. Your answers have been saved.', 'Exam Auto-Submitted');
                }
                
                // Auto-submit the exam
                if (typeof finalizeExam === 'function') {
                    finalizeExam('auto_submitted');
                } else if (typeof submitExam === 'function') {
                    submitExam();
                }
                
                // Reset counter
                backButtonAttempts = 0;
            }
        }
    });
    
    // Push state to prevent back navigation
    window.history.pushState(null, null, window.location.href);
    
    // Reset back button attempts counter when exam ends
    if (typeof window !== 'undefined') {
        window.resetBackButtonAttempts = function() {
            backButtonAttempts = 0;
        };
    }
}

function handleBeforeUnload(e) {
    if (securityEnabled) {
        const message = 'Are you sure you want to leave? Your exam progress will be saved, but you cannot return to this exam once you leave.';
        e.preventDefault();
        e.returnValue = message;
        return message;
    }
}

// Show security warnings
function showWarning(message) {
    console.warn('Security Warning:', message);
    
    // Create or update warning element
    let warningEl = document.getElementById('securityWarning');
    if (!warningEl) {
        warningEl = document.createElement('div');
        warningEl.id = 'securityWarning';
        warningEl.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff9800;
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: bold;
            max-width: 90%;
            text-align: center;
        `;
        document.body.appendChild(warningEl);
    }
    
    warningEl.textContent = `⚠️ ${message}`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (warningEl && warningEl.parentNode) {
            warningEl.style.opacity = '0';
            warningEl.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                if (warningEl && warningEl.parentNode) {
                    warningEl.parentNode.removeChild(warningEl);
                }
            }, 500);
        }
    }, 5000);
    
    // Log warning
    securityWarnings.push({
        message: message,
        timestamp: new Date().toISOString(),
        tabSwitches: tabSwitchCount
    });
}

function showCriticalWarning(message) {
    console.error('CRITICAL Security Warning:', message);
    
    let warningEl = document.getElementById('securityCriticalWarning');
    if (!warningEl) {
        warningEl = document.createElement('div');
        warningEl.id = 'securityCriticalWarning';
        warningEl.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: #dc3545;
            color: white;
            padding: 20px 30px;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            z-index: 10001;
            font-weight: bold;
            max-width: 90%;
            text-align: center;
            font-size: 16px;
        `;
        document.body.appendChild(warningEl);
    }
    
    warningEl.textContent = `🚨 ${message}`;
    
    // Don't auto-hide critical warnings
}

// Show security notice when exam starts
function showSecurityNotice() {
    const notice = `
        <div style="position: fixed; bottom: 20px; right: 20px; background: #2196F3; color: white; padding: 15px 20px; border-radius: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); z-index: 9999; max-width: 300px; font-size: 14px;">
            <strong>🔒 Exam Security Active</strong><br>
            • Copy/Paste Disabled<br>
            • Right-click Disabled<br>
            • Tab Switching Monitored<br>
            • Fullscreen Required
        </div>
    `;
    
    // Remove existing notice if any
    const existingNotice = document.getElementById('securityNotice');
    if (existingNotice) {
        existingNotice.remove();
    }
    
    // Add notice
    const noticeDiv = document.createElement('div');
    noticeDiv.id = 'securityNotice';
    noticeDiv.innerHTML = notice;
    document.body.appendChild(noticeDiv);
}

// Get security log (for reporting)
function getSecurityLog() {
    return {
        warnings: securityWarnings,
        tabSwitchCount: tabSwitchCount,
        enabled: securityEnabled
    };
}

// Export functions
if (typeof window !== 'undefined') {
    window.enableExamSecurity = enableExamSecurity;
    window.disableExamSecurity = disableExamSecurity;
    window.getSecurityLog = getSecurityLog;
    window.requireFullscreen = requireFullscreen;
    window.isFullscreenActive = isFullscreenActive;
}
