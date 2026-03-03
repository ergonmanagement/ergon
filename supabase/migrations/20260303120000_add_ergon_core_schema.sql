-- Ergon Management core multi-tenant schema
-- Follows docs/lowLevelDesign.md (tables, enums, RLS) and docs/highLevelDesign.md.
-- All tenant tables include company_id and are RLS-protected by company scope.

set check_function_bodies = off;

-------------------------
-- ENUM TYPES
-------------------------

create type public.subscription_status as enum ('trial', 'active', 'canceled');

create type public.user_role as enum ('owner', 'staff');

create type public.customer_type as enum ('customer', 'prospect');

create type public.job_status as enum ('lead', 'scheduled', 'completed', 'paid');

create type public.calendar_event_type as enum ('event', 'task');

create type public.finance_entry_type as enum ('revenue', 'expense');

create type public.marketing_channel as enum ('social_post', 'email', 'sms', 'flyer');


-------------------------
-- HELPER FUNCTION: current_user_company_id
-------------------------
-- Returns the company_id for the authenticated user (auth.uid()).
-- Used by RLS policies to enforce company scoping.

create or replace function public.current_user_company_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $function$
  select company_id
  from public.users
  where id = auth.uid()
  limit 1;
$function$;


-------------------------
-- COMPANIES
-------------------------
-- Holds one row per company (tenant).

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  service_type text not null,
  phone text not null,
  address text,
  employees_count integer,
  years_in_business integer,
  estimated_revenue numeric,
  referral_source text,
  subscription_status public.subscription_status not null default 'trial',
  trial_started_at timestamptz not null default timezone('utc'::text, now()),
  trial_ends_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index companies_subscription_status_idx
  on public.companies (subscription_status);


-------------------------
-- USERS
-------------------------
-- Application users linked 1:1 with auth.users.

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete restrict,
  email text not null unique,
  role public.user_role not null default 'owner',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index users_company_id_idx
  on public.users (company_id);


-------------------------
-- SHARED COLUMN CONTRACT
-------------------------
-- All tenant tables include:
--   id, company_id, created_at, updated_at, created_by, updated_by


-------------------------
-- CUSTOMERS
-------------------------

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),

  type public.customer_type not null,
  name text not null,
  email text,
  phone text,
  address text,
  notes text,
  source text
);

create index customers_company_created_at_idx
  on public.customers (company_id, created_at desc);

create index customers_company_name_idx
  on public.customers (company_id, name);


-------------------------
-- JOBS
-------------------------

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),

  customer_id uuid references public.customers(id),
  customer_name text not null,
  service_type text not null,
  status public.job_status not null default 'lead',
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  address text,
  price numeric,
  notes text,
  source text
);

create index jobs_company_scheduled_start_idx
  on public.jobs (company_id, scheduled_start);

create index jobs_company_status_idx
  on public.jobs (company_id, status);

create index jobs_company_created_at_idx
  on public.jobs (company_id, created_at desc);


-------------------------
-- JOB PHOTOS
-------------------------

create table public.job_photos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),

  job_id uuid not null references public.jobs(id) on delete cascade,
  storage_path text not null,
  caption text
);

create index job_photos_company_job_idx
  on public.job_photos (company_id, job_id);

-- Private storage bucket for job photos (access via signed URLs only).
insert into storage.buckets (id, name, public)
values ('job_photos', 'job_photos', false)
on conflict (id) do nothing;


-------------------------
-- CALENDAR EVENTS
-------------------------

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),

  type public.calendar_event_type not null,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  location text,
  notes text
);

create index calendar_events_company_start_at_idx
  on public.calendar_events (company_id, start_at);


-------------------------
-- FINANCE ENTRIES
-------------------------

create table public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),

  type public.finance_entry_type not null,
  job_id uuid references public.jobs(id),
  title text not null,
  category text,
  amount numeric not null,
  entry_date date not null,
  notes text
);

create index finance_entries_company_entry_date_idx
  on public.finance_entries (company_id, entry_date);

create index finance_entries_company_type_idx
  on public.finance_entries (company_id, type);


-------------------------
-- MARKETING ASSETS
-------------------------

create table public.marketing_assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),

  channel public.marketing_channel not null,
  context text,
  content text not null,
  status text not null default 'draft',
  deleted_at timestamptz
);

create index marketing_assets_company_created_at_idx
  on public.marketing_assets (company_id, created_at desc);

create index marketing_assets_company_channel_idx
  on public.marketing_assets (company_id, channel);


-------------------------
-- RLS ENABLEMENT
-------------------------

alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.jobs enable row level security;
alter table public.job_photos enable row level security;
alter table public.calendar_events enable row level security;
alter table public.finance_entries enable row level security;
alter table public.marketing_assets enable row level security;


-------------------------
-- RLS POLICIES
-------------------------
-- All tenant tables enforce: row.company_id = current_user_company_id()

-- USERS: user can see and update only their own row.

create policy "Users can view their own user row"
  on public.users
  as permissive
  for select
  to authenticated
  using (id = auth.uid());

create policy "Users can update their own user row"
  on public.users
  as permissive
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());


-- CUSTOMERS

create policy "Company access on customers (select)"
  on public.customers
  as permissive
  for select
  to authenticated
  using (company_id = public.current_user_company_id());

create policy "Company access on customers (insert)"
  on public.customers
  as permissive
  for insert
  to authenticated
  with check (company_id = public.current_user_company_id());

create policy "Company access on customers (update)"
  on public.customers
  as permissive
  for update
  to authenticated
  using (company_id = public.current_user_company_id())
  with check (company_id = public.current_user_company_id());

create policy "Company access on customers (delete)"
  on public.customers
  as permissive
  for delete
  to authenticated
  using (company_id = public.current_user_company_id());


-- JOBS

create policy "Company access on jobs (select)"
  on public.jobs
  as permissive
  for select
  to authenticated
  using (company_id = public.current_user_company_id());

create policy "Company access on jobs (insert)"
  on public.jobs
  as permissive
  for insert
  to authenticated
  with check (company_id = public.current_user_company_id());

create policy "Company access on jobs (update)"
  on public.jobs
  as permissive
  for update
  to authenticated
  using (company_id = public.current_user_company_id())
  with check (company_id = public.current_user_company_id());

create policy "Company access on jobs (delete)"
  on public.jobs
  as permissive
  for delete
  to authenticated
  using (company_id = public.current_user_company_id());


-- JOB PHOTOS

create policy "Company access on job_photos (select)"
  on public.job_photos
  as permissive
  for select
  to authenticated
  using (company_id = public.current_user_company_id());

create policy "Company access on job_photos (insert)"
  on public.job_photos
  as permissive
  for insert
  to authenticated
  with check (company_id = public.current_user_company_id());

create policy "Company access on job_photos (update)"
  on public.job_photos
  as permissive
  for update
  to authenticated
  using (company_id = public.current_user_company_id())
  with check (company_id = public.current_user_company_id());

create policy "Company access on job_photos (delete)"
  on public.job_photos
  as permissive
  for delete
  to authenticated
  using (company_id = public.current_user_company_id());


-- CALENDAR EVENTS

create policy "Company access on calendar_events (select)"
  on public.calendar_events
  as permissive
  for select
  to authenticated
  using (company_id = public.current_user_company_id());

create policy "Company access on calendar_events (insert)"
  on public.calendar_events
  as permissive
  for insert
  to authenticated
  with check (company_id = public.current_user_company_id());

create policy "Company access on calendar_events (update)"
  on public.calendar_events
  as permissive
  for update
  to authenticated
  using (company_id = public.current_user_company_id())
  with check (company_id = public.current_user_company_id());

create policy "Company access on calendar_events (delete)"
  on public.calendar_events
  as permissive
  for delete
  to authenticated
  using (company_id = public.current_user_company_id());


-- FINANCE ENTRIES

create policy "Company access on finance_entries (select)"
  on public.finance_entries
  as permissive
  for select
  to authenticated
  using (company_id = public.current_user_company_id());

create policy "Company access on finance_entries (insert)"
  on public.finance_entries
  as permissive
  for insert
  to authenticated
  with check (company_id = public.current_user_company_id());

create policy "Company access on finance_entries (update)"
  on public.finance_entries
  as permissive
  for update
  to authenticated
  using (company_id = public.current_user_company_id())
  with check (company_id = public.current_user_company_id());

create policy "Company access on finance_entries (delete)"
  on public.finance_entries
  as permissive
  for delete
  to authenticated
  using (company_id = public.current_user_company_id());


-- MARKETING ASSETS

create policy "Company access on marketing_assets (select)"
  on public.marketing_assets
  as permissive
  for select
  to authenticated
  using (company_id = public.current_user_company_id());

create policy "Company access on marketing_assets (insert)"
  on public.marketing_assets
  as permissive
  for insert
  to authenticated
  with check (company_id = public.current_user_company_id());

create policy "Company access on marketing_assets (update)"
  on public.marketing_assets
  as permissive
  for update
  to authenticated
  using (company_id = public.current_user_company_id())
  with check (company_id = public.current_user_company_id());

create policy "Company access on marketing_assets (delete)"
  on public.marketing_assets
  as permissive
  for delete
  to authenticated
  using (company_id = public.current_user_company_id());


-------------------------
-- TRIGGERS: updated_at
-------------------------
-- Reuse public.update_updated_at_column() from earlier migration, if present.

do $$
begin
  if exists (
    select 1
    from pg_proc
    where proname = 'update_updated_at_column'
      and pronamespace = 'public'::regnamespace
  ) then
    create trigger companies_set_updated_at
      before update on public.companies
      for each row
      execute function public.update_updated_at_column();

    create trigger users_set_updated_at
      before update on public.users
      for each row
      execute function public.update_updated_at_column();

    create trigger customers_set_updated_at
      before update on public.customers
      for each row
      execute function public.update_updated_at_column();

    create trigger jobs_set_updated_at
      before update on public.jobs
      for each row
      execute function public.update_updated_at_column();

    create trigger job_photos_set_updated_at
      before update on public.job_photos
      for each row
      execute function public.update_updated_at_column();

    create trigger calendar_events_set_updated_at
      before update on public.calendar_events
      for each row
      execute function public.update_updated_at_column();

    create trigger finance_entries_set_updated_at
      before update on public.finance_entries
      for each row
      execute function public.update_updated_at_column();

    create trigger marketing_assets_set_updated_at
      before update on public.marketing_assets
      for each row
      execute function public.update_updated_at_column();
  end if;
end;
$$;

