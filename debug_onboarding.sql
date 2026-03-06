-- Test if the onboarding RPC function exists and works
-- Run this in your Supabase SQL editor to test

-- 1. First check if the function exists
SELECT proname, prokind 
FROM pg_proc 
WHERE proname = 'onboarding_create_company_and_owner';

-- 2. Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('companies', 'users');

-- 3. Test the RPC function (replace with actual user ID and email)
-- SELECT public.onboarding_create_company_and_owner(
--   'your-user-id-here'::uuid,
--   'test@example.com',
--   'Test Company',
--   'Auto Detailing',
--   '555-1234'
-- );
