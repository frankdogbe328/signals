// Supabase Configuration
// IMPORTANT: Only use the anon key in frontend code
// The service_role key should NEVER be exposed in frontend code

const SUPABASE_URL = 'https://tmyiphpvyflockpkmtrh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteWlwaHB2eWZsb2NrcGttdHJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MDQ5OTksImV4cCI6MjA4MzM4MDk5OX0.rQA41xe9vijkaiszMYTn_BeWcH6PCbLDU9unBaEqX0g';

// Initialize Supabase client - make it globally accessible
window.supabaseClient = null;

// Initialize Supabase when library is loaded
function initSupabase() {
    // Check if Supabase library is loaded
    if (typeof window.supabase === 'undefined') {
        console.warn('Supabase library not loaded yet');
        return false;
    }
    
    // Check if createClient method exists
    if (typeof window.supabase.createClient !== 'function') {
        console.error('Supabase createClient method not available');
        return false;
    }
    
    // Initialize if not already done
    if (!window.supabaseClient) {
        try {
            window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            // Verify the client was created properly
            if (window.supabaseClient && typeof window.supabaseClient.from === 'function') {
                console.log('Supabase client initialized successfully');
                return true;
            } else {
                console.error('Supabase client created but missing from method');
                window.supabaseClient = null;
                return false;
            }
        } catch (err) {
            console.error('Error initializing Supabase:', err);
            window.supabaseClient = null;
            return false;
        }
    }
    return true;
}

// Make initSupabase globally available
window.initSupabase = initSupabase;

// Initialize immediately when script loads (don't wait for window.load)
(function initializeSupabaseNow() {
    // Check if Supabase library is loaded
    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
        initSupabase();
    } else {
        // Wait a bit and try again (library might still be loading)
        let attempts = 0;
        const maxAttempts = 50; // Try for 5 seconds (50 * 100ms)
        const checkInterval = setInterval(function() {
            attempts++;
            if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
                initSupabase();
                clearInterval(checkInterval);
            } else if (attempts >= maxAttempts) {
                console.error('Supabase library failed to load after 5 seconds');
                clearInterval(checkInterval);
            }
        }, 100);
    }
})();

// Also try on DOMContentLoaded (faster than window.load)
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
        initSupabase();
    }
});

// Also try on window.load as backup
window.addEventListener('load', function() {
    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
        initSupabase();
    }
});
