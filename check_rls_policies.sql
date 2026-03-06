-- Check RLS policies that might be blocking the onboarding function
-- Run this in Supabase SQL Editor

-- Check if RLS is enabled on companies table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('companies', 'users') 
  AND schemaname = 'public';

-- Check RLS policies on companies table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'companies' 
  AND schemaname = 'public';

-- Check RLS policies on users table  
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' 
  AND schemaname = 'public';
