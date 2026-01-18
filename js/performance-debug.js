// Performance Debugging Tool - Tracks intervals, timeouts, and DOM operations
// Use this to identify performance bottlenecks
(function() {
    'use strict';
    
    // Track all intervals and timeouts
    const trackedIntervals = new Map();
    const trackedTimeouts = new Map();
    const performanceMetrics = {
        intervals: 0,
        timeouts: 0,
        domQueries: 0,
        domModifications: 0,
        startTime: Date.now()
    };
    
    // Track intervals
    const originalSetInterval = window.setInterval;
    window.setInterval = function(fn, delay) {
        const id = originalSetInterval(fn, delay);
        const stack = new Error().stack;
        trackedIntervals.set(id, {
            delay: delay,
            stack: stack,
            created: Date.now(),
            executions: 0
        });
        performanceMetrics.intervals++;
        
        // Warn about aggressive intervals (less than 1 second)
        if (delay < 1000) {
            console.warn(`⚠️ Aggressive interval detected: ${delay}ms`, {
                id: id,
                stack: stack.split('\n').slice(1, 3).join('\n')
            });
        }
        
        return id;
    };
    
    // Track timeouts
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function(fn, delay) {
        const id = originalSetTimeout(fn, delay);
        trackedTimeouts.set(id, {
            delay: delay,
            created: Date.now()
        });
        performanceMetrics.timeouts++;
        return id;
    };
    
    // Track DOM queries (querySelector, querySelectorAll, getElementById)
    const originalQuerySelector = Document.prototype.querySelector;
    Document.prototype.querySelector = function(selector) {
        performanceMetrics.domQueries++;
        return originalQuerySelector.call(this, selector);
    };
    
    const originalQuerySelectorAll = Document.prototype.querySelectorAll;
    Document.prototype.querySelectorAll = function(selector) {
        performanceMetrics.domQueries++;
        return originalQuerySelectorAll.call(this, selector);
    };
    
    // Export performance debugging functions
    window.PerformanceDebug = {
        getMetrics: function() {
            return {
                ...performanceMetrics,
                uptime: Date.now() - performanceMetrics.startTime,
                activeIntervals: trackedIntervals.size,
                activeTimeouts: trackedTimeouts.size
            };
        },
        
        getActiveIntervals: function() {
            const intervals = [];
            trackedIntervals.forEach((info, id) => {
                intervals.push({
                    id: id,
                    delay: info.delay,
                    age: Date.now() - info.created,
                    aggressive: info.delay < 1000
                });
            });
            return intervals.sort((a, b) => a.delay - b.delay); // Sort by delay
        },
        
        logMetrics: function() {
            const metrics = this.getMetrics();
            const intervals = this.getActiveIntervals();
            const aggressiveIntervals = intervals.filter(i => i.aggressive);
            
            console.group('🔍 Performance Metrics');
            console.log('Uptime:', Math.round(metrics.uptime / 1000), 'seconds');
            console.log('Active Intervals:', metrics.activeIntervals);
            console.log('Active Timeouts:', metrics.activeTimeouts);
            console.log('Total DOM Queries:', metrics.domQueries);
            console.log('Total DOM Modifications:', metrics.domModifications);
            
            if (aggressiveIntervals.length > 0) {
                console.warn('⚠️ Aggressive Intervals (< 1 second):', aggressiveIntervals.length);
                aggressiveIntervals.forEach(i => {
                    console.warn(`  - Interval ${i.id}: ${i.delay}ms (age: ${Math.round(i.age/1000)}s)`);
                });
            }
            
            console.log('All Intervals:');
            intervals.forEach(i => {
                console.log(`  - Interval ${i.id}: ${i.delay}ms ${i.aggressive ? '⚠️ AGGRESSIVE' : ''}`);
            });
            
            console.groupEnd();
        },
        
        // Check for performance issues
        checkPerformance: function() {
            const metrics = this.getMetrics();
            const intervals = this.getActiveIntervals();
            const aggressiveCount = intervals.filter(i => i.aggressive).length;
            
            const issues = [];
            
            if (aggressiveCount > 2) {
                issues.push(`Too many aggressive intervals (${aggressiveCount}). Consider reducing frequency.`);
            }
            
            if (metrics.domQueries > 1000) {
                issues.push(`High DOM query count (${metrics.domQueries}). May indicate inefficient code.`);
            }
            
            if (intervals.length > 10) {
                issues.push(`Many active intervals (${intervals.length}). May cause lag.`);
            }
            
            if (issues.length > 0) {
                console.warn('⚠️ Performance Issues Detected:');
                issues.forEach(issue => console.warn('  -', issue));
                return issues;
            } else {
                console.log('✅ No obvious performance issues detected.');
                return [];
            }
        }
    };
    
    // Auto-log metrics every 30 seconds (only if debug mode)
    if (window.location.search.includes('debug=perf')) {
        setInterval(function() {
            window.PerformanceDebug.logMetrics();
        }, 30000);
        
        // Initial log after 5 seconds
        setTimeout(function() {
            console.log('🔍 Performance Debugging Enabled. Type PerformanceDebug.logMetrics() to see metrics.');
            window.PerformanceDebug.logMetrics();
        }, 5000);
    }
    
    console.log('✅ Performance Debugging Tool loaded. Add ?debug=perf to URL to enable auto-logging.');
})();