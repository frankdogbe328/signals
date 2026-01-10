// Performance Optimization Utilities
// Image lazy loading, compression, and performance monitoring

// ========== LAZY LOADING IMAGES ==========

/**
 * Initialize lazy loading for all images
 */
function initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        img.classList.add('lazy-loaded');
                    }
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px' // Start loading 50px before image enters viewport
        });

        // Observe all images with data-src attribute
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        // Fallback for browsers without IntersectionObserver
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }
}

/**
 * Convert image to lazy-loaded format
 * Usage: <img data-src="image.jpg" src="placeholder.jpg" class="lazy-load">
 */
function convertImagesToLazy() {
    document.querySelectorAll('img:not([data-src]):not(.no-lazy)').forEach(img => {
        const src = img.src;
        if (src && !src.startsWith('data:')) {
            // Create a tiny transparent placeholder
            const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
            img.dataset.src = src;
            img.src = placeholder;
            img.classList.add('lazy-load');
        }
    });
}

// ========== IMAGE COMPRESSION ==========

/**
 * Compress image before upload
 * @param {File} file - Image file to compress
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} maxHeight - Maximum height in pixels
 * @param {number} quality - JPEG quality (0.1 to 1.0)
 * @returns {Promise<File>} - Compressed image file
 */
async function compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
    return new Promise((resolve, reject) => {
        // Only compress image files
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = width * ratio;
                    height = height * ratio;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now()
                            });
                            resolve(compressedFile);
                        } else {
                            reject(new Error('Image compression failed'));
                        }
                    },
                    file.type,
                    quality
                );
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// ========== PERFORMANCE MONITORING ==========

/**
 * Monitor page load performance
 */
function monitorPerformance() {
    if ('performance' in window && 'PerformanceObserver' in window) {
        // Monitor Largest Contentful Paint (LCP)
        try {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
                
                // Log to error monitoring if LCP is too slow (> 2.5s)
                if (lastEntry.renderTime > 2500 || lastEntry.loadTime > 2500) {
                    logPerformanceMetric('LCP', lastEntry.renderTime || lastEntry.loadTime);
                }
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
            console.warn('LCP monitoring not supported:', e);
        }

        // Monitor First Input Delay (FID)
        try {
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    console.log('FID:', entry.processingStart - entry.startTime);
                    
                    // Log if FID is too slow (> 100ms)
                    if (entry.processingStart - entry.startTime > 100) {
                        logPerformanceMetric('FID', entry.processingStart - entry.startTime);
                    }
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (e) {
            console.warn('FID monitoring not supported:', e);
        }
    }

    // Monitor page load time
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log('Page Load Time:', pageLoadTime, 'ms');
            
            if (pageLoadTime > 3000) {
                logPerformanceMetric('PageLoadTime', pageLoadTime);
            }
        }, 0);
    });
}

/**
 * Log performance metric to error monitoring
 */
function logPerformanceMetric(metric, value) {
    if (typeof ErrorMonitoring !== 'undefined' && ErrorMonitoring.captureMessage) {
        ErrorMonitoring.captureMessage(`Performance: ${metric} = ${value}ms`, {
            level: 'warning',
            tags: { type: 'performance', metric: metric },
            extra: { value: value }
        });
    } else {
        console.warn(`Performance metric: ${metric} = ${value}ms`);
    }
}

// ========== DEBOUNCE AND THROTTLE ==========

/**
 * Debounce function calls
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function calls
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ========== INITIALIZATION ==========

// Auto-initialize on DOM ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeLazyLoading();
            monitorPerformance();
        });
    } else {
        initializeLazyLoading();
        monitorPerformance();
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.PerformanceUtils = {
        initializeLazyLoading,
        convertImagesToLazy,
        compressImage,
        monitorPerformance,
        debounce,
        throttle
    };
}
