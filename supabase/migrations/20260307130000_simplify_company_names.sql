-- Simplify jobs table - just add company_name for easy querying
-- Remove the complex customer_company relationships and keep it simple

set check_function_bodies = off;

-------------------------
-- DROP CUSTOMER COMPANY COMPLEXITY
-------------------------

-- Drop existing triggers that depend on customer_company fields on jobs table
DROP TRIGGER IF EXISTS set_customer_company_name_on_jobs_link ON public.jobs;
DROP TRIGGER IF EXISTS set_customer_company_name_on_jobs_trigger ON public.jobs;

-- Drop existing triggers that depend on customer_company fields on customers table
DROP TRIGGER IF EXISTS set_customer_company_name_on_customers_link ON public.customers;
DROP TRIGGER IF EXISTS set_customer_company_name_on_customers_trigger ON public.customers;

-- Drop related functions
DROP FUNCTION IF EXISTS public.set_customer_company_name_on_jobs();
DROP FUNCTION IF EXISTS public.set_customer_company_name_on_customers();

-- Drop the customer_companies table and related fields
DROP TABLE IF EXISTS public.customer_companies CASCADE;

-- Remove customer_company fields from jobs table
ALTER TABLE public.jobs DROP COLUMN IF EXISTS customer_company_id;
ALTER TABLE public.jobs DROP COLUMN IF EXISTS customer_company_name;

-- Remove customer_company fields from customers table  
ALTER TABLE public.customers DROP COLUMN IF EXISTS customer_company_id;
ALTER TABLE public.customers DROP COLUMN IF EXISTS customer_company_name;

-------------------------
-- ADD SIMPLE COMPANY_NAME TO JOBS
-------------------------

-- Add company_name field to jobs table for easy querying
ALTER TABLE public.jobs ADD COLUMN company_name text;

-- Create index for fast queries by company name
CREATE INDEX jobs_company_name_idx ON public.jobs (company_name);

-------------------------
-- POPULATE COMPANY_NAME FROM COMPANIES TABLE
-------------------------

-- Update existing jobs with the company name from companies table
UPDATE public.jobs 
SET company_name = companies.name
FROM public.companies
WHERE jobs.company_id = companies.id;

-------------------------
-- CREATE TRIGGER TO AUTO-POPULATE COMPANY_NAME
-------------------------

-- Function to automatically set company_name when company_id is set
CREATE OR REPLACE FUNCTION public.set_company_name_on_jobs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- If company_id is being set, automatically populate company_name
  IF NEW.company_id IS NOT NULL THEN
    SELECT name INTO NEW.company_name
    FROM public.companies
    WHERE id = NEW.company_id;
  ELSE
    NEW.company_name = NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Trigger to auto-populate company_name when inserting or updating jobs
CREATE TRIGGER set_company_name_on_jobs_trigger
  BEFORE INSERT OR UPDATE OF company_id ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_name_on_jobs();

-------------------------
-- UPDATE COMPANY_NAME WHEN COMPANY NAME CHANGES
-------------------------

-- Function to update job company_name when companies table name changes
CREATE OR REPLACE FUNCTION public.sync_job_company_names()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Update all jobs that reference this company
  UPDATE public.jobs 
  SET company_name = NEW.name,
      updated_at = now()
  WHERE company_id = NEW.id;
  
  RETURN NEW;
END;
$function$;

-- Trigger to keep job company_name in sync when company name changes
CREATE TRIGGER sync_job_company_names_trigger
  AFTER UPDATE OF name ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_job_company_names();
