// Exam Security Module - Anti-cheating measures

let securityEnabled = false;
let tabSwitchCount = 0;
let maxTabSwitches = 3; // Allow a few accidental switches
let blurStartTime = null;
let maxBlurTime = 5000; // 5 seconds max time out of focus
let securityWarnings = [];

// Enable exam security measures
function enableExamSecurity() {
    if (securityEnabled) return;
    securityEnabled = true;
    
    console.log('Exam security enabled');
    
    // Request fullscreen
    requestFullscreen();
    
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

// Request fullscreen mode
function requestFullscreen() {
    const elem = document.documentElement;
    
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
            console.warn('Fullscreen request denied:', err);
            showWarning('Fullscreen mode is recommended for exam security. Please enable it manually.');
        });
    } else if (elem.webkitRequestFullscreen) { // Safari
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE/Edge
        elem.msRequestFullscreen();
    }
}

// Monitor fullscreen changes
function monitorFullscreen() {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
}

function handleFullscreenChange() {
    const isFullscreen = document.fullscreenElement || 
                        document.webkitFullscreenElement || 
                        document.msFullscreenElement;
    
    if (!isFullscreen && securityEnabled) {
        // User exited fullscreen
        tabSwitchCount++;
        showWarning(`You exited fullscreen mode. ${maxTabSwitches - tabSwitchCount} warnings remaining before exam auto-submission.`);
        
        // Request fullscreen again
        setTimeout(() => requestFullscreen(), 500);
        
        // If too many exits, warn about auto-submission
        if (tabSwitchCount >= maxTabSwitches) {
            showCriticalWarning('You have exited fullscreen mode multiple times. The exam will be automatically submitted if you continue.');
            // Could auto-submit here if needed
        }
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
}
