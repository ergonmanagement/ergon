-- Add company_name field to customers table for easy querying

set check_function_bodies = off;

-------------------------
-- ADD COMPANY_NAME TO CUSTOMERS
-------------------------

-- Add company_name field to customers table (if it doesn't exist)
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS company_name text;

-- Create index for fast queries by company name (if it doesn't exist)
CREATE INDEX IF NOT EXISTS customers_company_name_idx ON public.customers (company_name);

-------------------------
-- POPULATE COMPANY_NAME FROM COMPANIES TABLE
-------------------------

-- Update existing customers with the company name from companies table
UPDATE public.customers 
SET company_name = companies.name
FROM public.companies
WHERE customers.company_id = companies.id;

-------------------------
-- CREATE TRIGGER TO AUTO-POPULATE COMPANY_NAME
-------------------------

-- Function to automatically set company_name when company_id is set on customers
CREATE OR REPLACE FUNCTION public.set_company_name_on_customers()
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

-- Trigger to auto-populate company_name when inserting or updating customers
DROP TRIGGER IF EXISTS set_company_name_on_customers_trigger ON public.customers;
CREATE TRIGGER set_company_name_on_customers_trigger
  BEFORE INSERT OR UPDATE OF company_id ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_name_on_customers();

-------------------------
-- UPDATE CUSTOMER COMPANY_NAME WHEN COMPANY NAME CHANGES
-------------------------

-- Function to update customer company_name when companies table name changes
CREATE OR REPLACE FUNCTION public.sync_customer_company_names()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Update all customers that reference this company
  UPDATE public.customers 
  SET company_name = NEW.name,
      updated_at = now()
  WHERE company_id = NEW.id;
  
  RETURN NEW;
END;
$function$;

-- Trigger to keep customer company_name in sync when company name changes
DROP TRIGGER IF EXISTS sync_customer_company_names_trigger ON public.companies;
CREATE TRIGGER sync_customer_company_names_trigger
  AFTER UPDATE OF name ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_customer_company_names();
