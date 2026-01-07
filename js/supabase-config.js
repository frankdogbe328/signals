// Supabase Configuration
// IMPORTANT: Only use the anon key in frontend code
// The service_role key should NEVER be exposed in frontend code

const SUPABASE_URL = 'https://tmyiphpvyflockpkmtrh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteWlwaHB2eWZsb2NrcGttdHJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MDQ5OTksImV4cCI6MjA4MzM4MDk5OX0.rQA41xe9vijkaiszMYTn_BeWcH6PCbLDU9unBaEqX0g';

// Initialize Supabase client
let supabase = null;

// Initialize Supabase when library is loaded
function initSupabase() {
    if (typeof window.supabase !== 'undefined' && !supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized');
    }
}

// Try to initialize immediately
if (typeof window.supabase !== 'undefined') {
    initSupabase();
} else {
    // Wait for Supabase library to load
    window.addEventListener('DOMContentLoaded', initSupabase);
    // Also try after a short delay
    setTimeout(initSupabase, 100);
}

