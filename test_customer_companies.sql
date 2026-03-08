-- Test data for customer companies
-- This adds some sample customer companies for testing

INSERT INTO public.customer_companies (company_id, name, service_type, phone, email, address, notes)
SELECT 
  u.company_id,
  'ABC Landscaping',
  'Landscaping Services',
  '(555) 123-4567',
  'contact@abclandscaping.com',
  '123 Garden St, Green Valley, CA 90210',
  'Specializes in residential lawn maintenance and landscape design'
FROM public.users u
WHERE u.id = auth.uid()
LIMIT 1;

INSERT INTO public.customer_companies (company_id, name, service_type, phone, email, address, notes)
SELECT 
  u.company_id,
  'Smith Construction Co',
  'General Contracting',
  '(555) 987-6543',
  'info@smithconstruction.com',
  '456 Builder Ave, Construction City, CA 90211',
  'Residential and commercial construction projects'
FROM public.users u
WHERE u.id = auth.uid()
LIMIT 1;

INSERT INTO public.customer_companies (company_id, name, service_type, phone, email, address, notes)
SELECT 
  u.company_id,
  'Downtown Office Complex',
  'Commercial Property',
  '(555) 456-7890',
  'maintenance@downtownoffice.com',
  '789 Business Blvd, Metro City, CA 90212',
  'Large commercial client with regular service needs'
FROM public.users u
WHERE u.id = auth.uid()
LIMIT 1;
