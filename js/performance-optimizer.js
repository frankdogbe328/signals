// Performance Optimizer for LMS System
// Prevents system jams during concurrent access and exam results checking

class PerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.activeRequests = new Set();
        this.debounceTimers = new Map();
        
        // Cache TTL (Time To Live) in milliseconds
        this.cacheTTL = {
            results: 30000,      // 30 seconds for exam results
            students: 60000,     // 1 minute for student list
            exams: 120000,       // 2 minutes for exam list
            statistics: 60000    // 1 minute for statistics
        };
        
        // Rate limiting
        this.maxConcurrentRequests = 5;
        this.requestDelay = 100; // 100ms delay between requests
    }
    
    /**
     * Debounce function calls to prevent excessive API calls
     */
    debounce(key, func, delay = 300) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }
        
        const timer = setTimeout(() => {
            func();
            this.debounceTimers.delete(key);
        }, delay);
        
        this.debounceTimers.set(key, timer);
    }
    
    /**
     * Cache data with TTL
     */
    setCache(key, data, ttl = 30000) {
        const expiry = Date.now() + ttl;
        this.cache.set(key, { data, expiry });
    }
    
    /**
     * Get cached data if not expired
     */
    getCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() > cached.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    /**
     * Clear expired cache entries
     */
    clearExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now > value.expiry) {
                this.cache.delete(key);
            }
        }
    }
    
    /**
     * Queue request to prevent overwhelming the database
     */
    async queueRequest(requestFn, priority = 'normal') {
        return new Promise((resolve, reject) => {
            const request = {
                fn: requestFn,
                priority,
                resolve,
                reject,
                timestamp: Date.now()
            };
            
            // Add to queue based on priority
            if (priority === 'high') {
                this.requestQueue.unshift(request);
            } else {
                this.requestQueue.push(request);
            }
            
            this.processQueue();
        });
    }
    
    /**
     * Process queued requests with rate limiting
     */
    async processQueue() {
        if (this.isProcessingQueue) return;
        if (this.requestQueue.length === 0) return;
        if (this.activeRequests.size >= this.maxConcurrentRequests) return;
        
        this.isProcessingQueue = true;
        
        while (this.requestQueue.length > 0 && this.activeRequests.size < this.maxConcurrentRequests) {
            const request = this.requestQueue.shift();
            const requestId = `req_${Date.now()}_${Math.random()}`;
            
            this.activeRequests.add(requestId);
            
            // Execute request
            request.fn()
                .then(result => {
                    request.resolve(result);
                })
                .catch(error => {
                    request.reject(error);
                })
                .finally(() => {
                    this.activeRequests.delete(requestId);
                    
                    // Add delay before processing next request
                    setTimeout(() => {
                        this.processQueue();
                    }, this.requestDelay);
                });
        }
        
        this.isProcessingQueue = false;
    }
    
    /**
     * Optimized Supabase query with caching and rate limiting
     */
    async optimizedQuery(queryFn, cacheKey, ttl = 30000) {
        // Check cache first
        const cached = this.getCache(cacheKey);
        if (cached !== null) {
            return cached;
        }
        
        // Check if same request is already in progress
        if (this.activeRequests.has(cacheKey)) {
            // Wait for existing request
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    const cached = this.getCache(cacheKey);
                    if (cached !== null) {
                        clearInterval(checkInterval);
                        resolve(cached);
                    }
                }, 100);
                
                // Timeout after 5 seconds
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve(null);
                }, 5000);
            });
        }
        
        // Queue the request
        return this.queueRequest(async () => {
            try {
                const result = await queryFn();
                this.setCache(cacheKey, result, ttl);
                return result;
            } catch (error) {
                console.error('Query error:', error);
                throw error;
            }
        });
    }
    
    /**
     * Paginated query helper
     */
    async paginatedQuery(queryFn, page = 1, pageSize = 50) {
        const offset = (page - 1) * pageSize;
        return queryFn().range(offset, offset + pageSize - 1);
    }
    
    /**
     * Batch multiple queries
     */
    async batchQueries(queries, maxConcurrent = 3) {
        const results = [];
        for (let i = 0; i < queries.length; i += maxConcurrent) {
            const batch = queries.slice(i, i + maxConcurrent);
            const batchResults = await Promise.all(batch.map(q => q()));
            results.push(...batchResults);
        }
        return results;
    }
}

// Create global instance
window.PerformanceOptimizer = new PerformanceOptimizer();

// Clear expired cache every minute
setInterval(() => {
    window.PerformanceOptimizer.clearExpiredCache();
}, 60000);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}
