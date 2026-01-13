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
    
    // Re-enable copy/paste
    document.removeEventListener('copy', preventCopy);
    document.removeEventListener('paste', preventPaste);
    document.removeEventListener('cut', preventCut);
    document.removeEventListener('keydown', preventCopyPasteKeys);
    
    // Re-enable right-click
    document.removeEventListener('contextmenu', preventRightClick);
    
    // Remove blur/focus listeners
    window.removeEventListener('blur', handleWindowBlur);
    window.removeEventListener('focus', handleWindowFocus);
    
    // Remove beforeunload warning (but keep it for a moment in case of navigation)
    
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
        
        if (elem.requestFullscreen) {
            elem.requestFullscreen()
                .then(() => resolve())
                .catch(err => {
                    console.warn('Fullscreen request denied:', err);
                    reject(err);
                });
        } else if (elem.webkitRequestFullscreen) { // Safari
            elem.webkitRequestFullscreen();
            // Safari doesn't return promise, check after short delay
            setTimeout(() => {
                if (isFullscreenActive()) {
                    resolve();
                } else {
                    reject(new Error('Fullscreen not supported or denied'));
                }
            }, 100);
        } else if (elem.msRequestFullscreen) { // IE/Edge
            elem.msRequestFullscreen();
            setTimeout(() => {
                if (isFullscreenActive()) {
                    resolve();
                } else {
                    reject(new Error('Fullscreen not supported or denied'));
                }
            }, 100);
        } else {
            reject(new Error('Fullscreen API not supported in this browser'));
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
    // Remove existing modal if any
    const existing = document.getElementById('fullscreenRequirementModal');
    if (existing) {
        existing.remove();
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
        <div style="text-align: center; max-width: 600px; padding: 40px; background: #1a1a1a; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <div style="font-size: 64px; margin-bottom: 20px;">🔒</div>
            <h2 style="color: #ff9800; margin-bottom: 20px; font-size: 28px;">Fullscreen Mode Required</h2>
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
            <div style="display: flex; gap: 15px; justify-content: center;">
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
                ">Cancel</button>
            </div>
            <p id="fullscreenStatus" style="margin-top: 20px; color: #ff9800; font-size: 14px;"></p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Button handlers
    document.getElementById('enableFullscreenBtn').addEventListener('click', () => {
        requestFullscreen()
            .then(() => {
                hideFullscreenRequirement();
                if (onSuccess) onSuccess();
            })
            .catch(() => {
                document.getElementById('fullscreenStatus').textContent = 
                    'Fullscreen request was denied. Please enable fullscreen manually (F11) or use browser menu.';
            });
    });
    
    document.getElementById('cancelExamBtn').addEventListener('click', () => {
        hideFullscreenRequirement();
        if (onCancel) onCancel();
        // Go back to exams list
        if (typeof goBackToExams === 'function') {
            goBackToExams();
        }
    });
    
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
    // Prevent copy
    document.addEventListener('copy', preventCopy);
    
    // Prevent paste
    document.addEventListener('paste', preventPaste);
    
    // Prevent cut
    document.addEventListener('cut', preventCut);
    
    // Prevent keyboard shortcuts
    document.addEventListener('keydown', preventCopyPasteKeys, true);
    
    // Prevent text selection (optional - can be annoying, so commented out)
    // document.addEventListener('selectstart', preventSelect);
}

function preventCopy(e) {
    e.preventDefault();
    e.stopPropagation();
    showWarning('Copy is disabled during the exam.');
    return false;
}

function preventPaste(e) {
    e.preventDefault();
    e.stopPropagation();
    showWarning('Paste is disabled during the exam.');
    return false;
}

function preventCut(e) {
    e.preventDefault();
    e.stopPropagation();
    showWarning('Cut is disabled during the exam.');
    return false;
}

function preventCopyPasteKeys(e) {
    // Check for Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A (Windows/Linux)
    // Check for Cmd+C, Cmd+V, Cmd+X, Cmd+A (Mac)
    if ((e.ctrlKey || e.metaKey) && (
        e.key === 'c' || e.key === 'C' ||
        e.key === 'v' || e.key === 'V' ||
        e.key === 'x' || e.key === 'X' ||
        e.key === 'a' || e.key === 'A' ||
        e.key === 's' || e.key === 'S' // Also disable save
    )) {
        e.preventDefault();
        e.stopPropagation();
        showWarning('This keyboard shortcut is disabled during the exam.');
        return false;
    }
    
    // Disable F12 (Developer Tools)
    if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        showWarning('Developer tools are disabled during the exam.');
        return false;
    }
    
    // Disable Ctrl+Shift+I (Developer Tools)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        e.stopPropagation();
        showWarning('Developer tools are disabled during the exam.');
        return false;
    }
    
    // Disable Ctrl+Shift+C (Element Inspector)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        showWarning('Developer tools are disabled during the exam.');
        return false;
    }
    
    // Disable Ctrl+Shift+J (Console)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
        e.preventDefault();
        e.stopPropagation();
        showWarning('Developer tools are disabled during the exam.');
        return false;
    }
}

function preventSelect(e) {
    // Optional: prevent text selection
    // e.preventDefault();
    // return false;
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
    
    // Also detect visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
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
    
    // Prevent back button
    window.addEventListener('popstate', function(e) {
        if (securityEnabled) {
            window.history.pushState(null, null, window.location.href);
            showWarning('Navigating back is not allowed during the exam.');
        }
    });
    
    // Push state to prevent back navigation
    window.history.pushState(null, null, window.location.href);
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
