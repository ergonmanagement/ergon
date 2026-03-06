// Test script to debug onboarding issues
// Run with: node debug-onboarding.js

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing environment variables:');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? 'Set' : 'Missing');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Set' : 'Missing');
    process.exit(1);
}

async function testOnboardingFunction() {
    try {
        console.log('Testing onboarding Edge Function...');
        console.log('Supabase URL:', SUPABASE_URL);

        const response = await fetch(`${SUPABASE_URL}/functions/v1/onboarding`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                company_name: 'Test Company',
                industry: 'testing',
                phone: '555-123-4567',
                address: '123 Test St',
                city: 'Test City',
                state: 'TS',
                zip: '12345'
            })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('Response body:', responseText);

        if (!response.ok) {
            console.error('Edge Function error. Response details above.');
        }

    } catch (error) {
        console.error('Request failed:', error);
    }
}

testOnboardingFunction();
