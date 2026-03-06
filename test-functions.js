// Temporary debugging script to test Edge Functions
// Run with: node test-functions.js

const SUPABASE_URL = 'https://loyxmnbczhbovqllvwus.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxveXhtbmJjemhib3ZxbGx2d3VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3NTIyMTcsImV4cCI6MjA0OTMyODIxN30.BSvO_LJOsw7T1lL_Hv3DqCxEBXRRf3d3JG5hCgEGwvs';

async function testFunction(functionName, method = 'GET', body = null) {
    try {
        console.log(`\n🧪 Testing ${functionName}...`);

        const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        console.log(`Status: ${response.status}`);

        const responseText = await response.text();
        console.log(`Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);

        if (response.ok) {
            console.log('✅ Success');
        } else {
            console.log('❌ Failed');
        }

    } catch (error) {
        console.log('💥 Error:', error.message);
    }
}

async function runTests() {
    console.log('🚀 Testing Edge Functions...\n');

    // Test main functions
    await testFunction('dashboard');
    await testFunction('customers');
    await testFunction('jobs');
    await testFunction('schedule');
    await testFunction('marketing');
    await testFunction('finance');

    console.log('\n✨ Testing complete!');
}

// Only run if called directly (not in browser)
if (typeof window === 'undefined') {
    runTests().catch(console.error);
}
