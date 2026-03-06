-- Run this query in your Supabase SQL Editor to check if the onboarding function exists
-- Go to: https://supabase.com/dashboard/project/loyxmnbczhbovqllvwus/sql

-- Check if the RPC function exists
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'onboarding_create_company_and_owner' 
  AND routine_schema = 'public';

-- Check if the companies table exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'companies' 
  AND table_schema = 'public';

-- Check if the users table exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'users' 
  AND table_schema = 'public';

-- Check current migration status (simplified)
SELECT version 
FROM supabase_migrations.schema_migrations 
ORDER BY version DESC 
LIMIT 10;
