-- Add customer companies table and proper relationships
-- This migration adds:
-- 1. customer_companies table for businesses that are your customers
-- 2. Links customers to customer_companies 
-- 3. Links jobs to customer_companies
-- 4. Denormalized company names for performance

set check_function_bodies = off;

-------------------------
-- CUSTOMER COMPANIES TABLE
-------------------------
-- Represents the businesses/companies that are your customers
-- (This is separate from the "companies" table which represents service provider companies)

create table public.customer_companies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict, -- Your company (service provider)
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),

  name text not null, -- "ABC Landscaping", "Smith Construction"
  service_type text,
  phone text,
  email text,
  address text,
  notes text
);

create index customer_companies_company_name_idx
  on public.customer_companies (company_id, name);

create index customer_companies_company_created_at_idx
  on public.customer_companies (company_id, created_at desc);

-------------------------
-- ADD CUSTOMER COMPANY RELATIONSHIPS
-------------------------

-- Add customer_company_id to customers table
alter table public.customers 
add column customer_company_id uuid references public.customer_companies(id);

-- Add denormalized customer_company_name for quick display
alter table public.customers 
add column customer_company_name text;

-- Add customer_company_id to jobs table  
alter table public.jobs
add column customer_company_id uuid references public.customer_companies(id);

-- Add denormalized customer_company_name for quick display
alter table public.jobs
add column customer_company_name text;

-------------------------
-- INDEXES FOR PERFORMANCE
-------------------------

create index customers_customer_company_idx
  on public.customers (customer_company_id);

create index jobs_customer_company_idx
  on public.jobs (customer_company_id);

create index jobs_company_customer_company_scheduled_idx
  on public.jobs (company_id, customer_company_id, scheduled_start);

-------------------------
-- RLS POLICIES FOR CUSTOMER COMPANIES
-------------------------

alter table public.customer_companies enable row level security;

create policy "Users can access customer_companies in their company"
  on public.customer_companies for all
  using (company_id = public.current_user_company_id())
  with check (company_id = public.current_user_company_id());

-------------------------
-- UPDATE TRIGGERS FOR DENORMALIZED DATA
-------------------------

-- Function to sync customer_company_name when customer_companies.name changes
create or replace function public.sync_customer_company_names()
returns trigger
language plpgsql
security definer
as $function$
begin
  -- Update customers table
  update public.customers 
  set customer_company_name = new.name,
      updated_at = now()
  where customer_company_id = new.id;
  
  -- Update jobs table
  update public.jobs 
  set customer_company_name = new.name,
      updated_at = now()
  where customer_company_id = new.id;
  
  return new;
end;
$function$;

-- Trigger to keep denormalized names in sync
create trigger sync_customer_company_names_trigger
  after update of name on public.customer_companies
  for each row
  execute function public.sync_customer_company_names();

-- Function to set customer_company_name when linking customers/jobs to customer companies
create or replace function public.set_customer_company_name_on_link()
returns trigger
language plpgsql
security definer
as $function$
begin
  if new.customer_company_id is not null then
    select name into new.customer_company_name
    from public.customer_companies
    where id = new.customer_company_id;
  end if;
  
  return new;
end;
$function$;

-- Triggers to auto-populate customer_company_name when linking
create trigger set_customer_company_name_on_customers_link
  before insert or update of customer_company_id on public.customers
  for each row
  execute function public.set_customer_company_name_on_link();

create trigger set_customer_company_name_on_jobs_link
  before insert or update of customer_company_id on public.jobs
  for each row
  execute function public.set_customer_company_name_on_link();
