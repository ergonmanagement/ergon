-- Test the onboarding RPC function directly in Supabase SQL Editor
-- This will help us see if the function itself works

-- First, let's see what auth.uid() returns (should be null in SQL editor)
SELECT auth.uid() as current_auth_uid;

-- Test the RPC function with dummy data
-- Note: This will likely fail because we don't have a real auth context
-- but we'll see the specific error message
SELECT public.onboarding_create_company_and_owner(
  'test-user-id'::uuid,
  'test@example.com',
  'Test Company Direct',
  'testing',
  '555-123-4567'
);
