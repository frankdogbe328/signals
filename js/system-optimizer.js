// System Optimizer - Prevents jamming and optimizes overall system performance
// Handles caching, request batching, memory management, and UI optimization

(function() {
    'use strict';
    
    // ========== REQUEST BATCHING & DEBOUNCING ==========
    
    const requestQueue = new Map();
    const activeRequests = new Set();
    
    /**
     * Batch multiple similar requests together
     */
    function batchRequest(key, requestFn, delay = 50) {
        if (!requestQueue.has(key)) {
            requestQueue.set(key, []);
        }
        
        return new Promise((resolve, reject) => {
            requestQueue.get(key).push({ resolve, reject });
            
            if (!activeRequests.has(key)) {
                activeRequests.add(key);
                
                setTimeout(async () => {
                    const queue = requestQueue.get(key);
                    requestQueue.delete(key);
                    activeRequests.delete(key);
                    
                    try {
                        const result = await requestFn();
                        queue.forEach(item => item.resolve(result));
                    } catch (error) {
                        queue.forEach(item => item.reject(error));
                    }
                }, delay);
            }
        });
    }
    
    // ========== DUPLICATE REQUEST PREVENTION ==========
    
    const pendingRequests = new Map();
    const MAX_CACHE_AGE = 30000; // 30 seconds
    
    /**
     * Prevent duplicate requests - reuse pending requests
     */
    function deduplicateRequest(key, requestFn, cacheTime = 5000) {
        // Check if request is already pending
        if (pendingRequests.has(key)) {
            const cached = pendingRequests.get(key);
            if (Date.now() - cached.timestamp < cacheTime) {
                return cached.promise;
            }
        }
        
        // Create new request
        const promise = requestFn().finally(() => {
            // Remove from cache after completion
            setTimeout(() => {
                pendingRequests.delete(key);
            }, cacheTime);
        });
        
        pendingRequests.set(key, {
            promise,
            timestamp: Date.now()
        });
        
        return promise;
    }
    
    // ========== MEMORY LEAK PREVENTION ==========
    
    let eventListeners = new WeakMap();
    let intervalTimers = new Set();
    
    /**
     * Track event listeners to prevent leaks
     */
    function safeAddEventListener(element, event, handler, options) {
        // Remove existing listener if any
        if (eventListeners.has(element)) {
            const existing = eventListeners.get(element);
            existing.forEach(({ event: e, handler: h }) => {
                element.removeEventListener(e, h);
            });
        }
        
        element.addEventListener(event, handler, options);
        
        if (!eventListeners.has(element)) {
            eventListeners.set(element, []);
        }
        eventListeners.get(element).push({ event, handler });
    }
    
    /**
     * Track intervals for cleanup
     */
    function safeSetInterval(callback, delay) {
        const id = setInterval(callback, delay);
        intervalTimers.add(id);
        return id;
    }
    
    /**
     * Cleanup function to prevent memory leaks
     */
    function cleanup() {
        // Clear intervals
        intervalTimers.forEach(id => clearInterval(id));
        intervalTimers.clear();
        
        // Clear pending requests older than MAX_CACHE_AGE
        const now = Date.now();
        for (const [key, value] of pendingRequests.entries()) {
            if (now - value.timestamp > MAX_CACHE_AGE) {
                pendingRequests.delete(key);
            }
        }
        
        // Force garbage collection hint (browser may ignore)
        if (window.gc) {
            window.gc();
        }
    }
    
    // ========== UI RESPONSIVENESS - PREVENT JAMMING ==========
    
    let isProcessing = false;
    const taskQueue = [];
    
    /**
     * Queue tasks to prevent UI blocking
     */
    function queueTask(task, priority = 0) {
        taskQueue.push({ task, priority, timestamp: Date.now() });
        taskQueue.sort((a, b) => b.priority - a.priority);
        
        if (!isProcessing) {
            processQueue();
        }
    }
    
    /**
     * Process queue without blocking UI
     */
    async function processQueue() {
        if (isProcessing || taskQueue.length === 0) return;
        
        isProcessing = true;
        
        while (taskQueue.length > 0) {
            const { task } = taskQueue.shift();
            
            try {
                if (typeof task === 'function') {
                    await task();
                } else if (task.then) {
                    await task;
                }
            } catch (error) {
                console.error('Task queue error:', error);
            }
            
            // Yield to browser between tasks
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        isProcessing = false;
    }
    
    // ========== RESOURCE CACHING ==========
    
    const resourceCache = new Map();
    const MAX_CACHE_SIZE = 100;
    
    /**
     * Cache resources with LRU eviction
     */
    function cacheResource(key, value, ttl = 60000) {
        // Remove oldest if cache is full
        if (resourceCache.size >= MAX_CACHE_SIZE) {
            const firstKey = resourceCache.keys().next().value;
            resourceCache.delete(firstKey);
        }
        
        resourceCache.set(key, {
            value,
            timestamp: Date.now(),
            ttl
        });
    }
    
    /**
     * Get cached resource
     */
    function getCachedResource(key) {
        const cached = resourceCache.get(key);
        if (!cached) return null;
        
        // Check if expired
        if (Date.now() - cached.timestamp > cached.ttl) {
            resourceCache.delete(key);
            return null;
        }
        
        return cached.value;
    }
    
    /**
     * Clear expired cache entries
     */
    function clearExpiredCache() {
        const now = Date.now();
        for (const [key, cached] of resourceCache.entries()) {
            if (now - cached.timestamp > cached.ttl) {
                resourceCache.delete(key);
            }
        }
    }
    
    // ========== DOM OPERATION OPTIMIZATION ==========
    
    /**
     * Batch DOM updates to prevent reflows
     */
    function batchDOMUpdates(callback) {
        requestAnimationFrame(() => {
            const fragment = document.createDocumentFragment();
            const result = callback(fragment);
            
            if (result && result.nodeType) {
                requestAnimationFrame(() => {
                    const target = document.body;
                    if (target && result.parentNode !== target) {
                        target.appendChild(result);
                    }
                });
            }
        });
    }
    
    /**
     * Debounce DOM-heavy operations
     */
    let domUpdateTimer;
    function debounceDOMUpdate(callback, delay = 16) {
        clearTimeout(domUpdateTimer);
        domUpdateTimer = setTimeout(() => {
            requestAnimationFrame(callback);
        }, delay);
    }
    
    // ========== NETWORK OPTIMIZATION ==========
    
    /**
     * Connection pooling for Supabase
     */
    const connectionPool = {
        maxConnections: 5,
        active: 0,
        queue: [],
        
        async execute(fn) {
            if (this.active < this.maxConnections) {
                this.active++;
                try {
                    return await fn();
                } finally {
                    this.active--;
                    this.processQueue();
                }
            } else {
                return new Promise((resolve, reject) => {
                    this.queue.push({ fn, resolve, reject });
                });
            }
        },
        
        processQueue() {
            if (this.queue.length > 0 && this.active < this.maxConnections) {
                const { fn, resolve, reject } = this.queue.shift();
                this.active++;
                fn().then(resolve).catch(reject).finally(() => {
                    this.active--;
                    this.processQueue();
                });
            }
        }
    };
    
    // ========== PERFORMANCE MONITORING ==========
    
    let performanceMetrics = {
        taskQueueLength: 0,
        pendingRequests: 0,
        cacheSize: 0,
        activeConnections: 0
    };
    
    function updateMetrics() {
        performanceMetrics = {
            taskQueueLength: taskQueue.length,
            pendingRequests: pendingRequests.size,
            cacheSize: resourceCache.size,
            activeConnections: connectionPool.active
        };
        
        // Warn if system is getting overloaded
        if (taskQueue.length > 50) {
            console.warn('⚠️ Task queue is large:', taskQueue.length);
        }
        
        if (pendingRequests.size > 20) {
            console.warn('⚠️ Many pending requests:', pendingRequests.size);
        }
    }
    
    // ========== INITIALIZATION ==========
    
    // Cleanup expired cache every minute
    setInterval(clearExpiredCache, 60000);
    
    // Update metrics every 5 seconds
    setInterval(updateMetrics, 5000);
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
    
    // Cleanup periodically
    safeSetInterval(cleanup, 600000); // Every 10 minutes
    
    // Export for use in other modules
    window.SystemOptimizer = {
        // Request management
        batchRequest,
        deduplicateRequest,
        
        // Memory management
        safeAddEventListener,
        safeSetInterval,
        cleanup,
        
        // UI optimization
        queueTask,
        processQueue,
        batchDOMUpdates,
        debounceDOMUpdate,
        
        // Caching
        cacheResource,
        getCachedResource,
        clearExpiredCache,
        
        // Network
        connectionPool,
        
        // Metrics
        getMetrics: () => ({ ...performanceMetrics }),
        
        // Utility
        cleanup
    };
    
    console.log('✅ System Optimizer initialized');
})();
