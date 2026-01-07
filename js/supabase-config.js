// Supabase Configuration
// IMPORTANT: Only use the anon key in frontend code
// The service_role key should NEVER be exposed in frontend code

const SUPABASE_URL = 'https://tmyiphpvyflockpkmtrh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteWlwaHB2eWZsb2NrcGttdHJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MDQ5OTksImV4cCI6MjA4MzM4MDk5OX0.rQA41xe9vijkaiszMYTn_BeWcH6PCbLDU9unBaEqX0g';

// Initialize Supabase client
let supabase = null;

// Initialize Supabase when library is loaded
function initSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.warn('Supabase library not loaded yet');
        return false;
    }
    
    if (!supabase) {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase client initialized successfully');
            return true;
        } catch (err) {
            console.error('Error initializing Supabase:', err);
            return false;
        }
    }
    return true;
}

// Try to initialize immediately
if (typeof window.supabase !== 'undefined') {
    initSupabase();
} else {
    // Wait for Supabase library to load
    const checkSupabase = setInterval(function() {
        if (typeof window.supabase !== 'undefined') {
            initSupabase();
            clearInterval(checkSupabase);
        }
    }, 50);
    
    // Stop checking after 5 seconds
    setTimeout(function() {
        clearInterval(checkSupabase);
        if (!supabase) {
            console.warn('Supabase library may not have loaded properly');
        }
    }, 5000);
}

