-- Simple database check - run each query separately if needed

-- 1. Check if the onboarding RPC function exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.routines 
  WHERE routine_name = 'onboarding_create_company_and_owner' 
    AND routine_schema = 'public'
) as "onboarding_function_exists";

-- 2. Check if companies table exists  
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'companies' 
    AND table_schema = 'public'
) as "companies_table_exists";

-- 3. Check if users table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'users' 
    AND table_schema = 'public'
) as "users_table_exists";
