// Debug script to check authentication state
// Run with: node debug-auth.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://loyxmnbczhbovqllvwus.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxveXhtbmJjemhib3ZxbGx2d3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3NTIyMTcsImV4cCI6MjA0OTMyODIxN30.BSvO_LJOsw7T1lL_Hv3DqCxEBXRRf3d3JG5hCgEGwvs';

async function checkAuth() {
    console.log('🔍 Checking Supabase connection...\n');

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    try {
        // Test basic connection
        console.log('1. Testing basic connection...');
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.log('❌ Auth error:', error.message);
            return;
        }

        console.log('✅ Connection successful');
        console.log('Session:', data.session ? 'User logged in' : 'No active session');

        if (data.session) {
            console.log('User ID:', data.session.user?.id);
            console.log('Email:', data.session.user?.email);
            console.log('Token expires:', new Date(data.session.expires_at * 1000).toISOString());
        }

        // Test Edge Function call with proper auth
        if (data.session) {
            console.log('\n2. Testing Edge Function call...');
            const { data: funcData, error: funcError } = await supabase.functions.invoke('dashboard');

            if (funcError) {
                console.log('❌ Function call error:', funcError);
            } else {
                console.log('✅ Function call successful');
                console.log('Response:', JSON.stringify(funcData, null, 2).substring(0, 200) + '...');
            }
        } else {
            console.log('\n⚠️  No active session - cannot test function calls');
            console.log('User needs to be logged in through the browser first');
        }

    } catch (err) {
        console.log('💥 Unexpected error:', err.message);
    }
}

checkAuth();
