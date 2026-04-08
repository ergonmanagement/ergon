-- Demo seed data for Ergon.
-- Populates realistic module data for up to two existing tenant accounts.
--
-- Usage:
--   supabase db reset
-- or run this SQL in the SQL editor on a non-production environment.

set check_function_bodies = off;

do $$
declare
  tenant record;
  v_customer_1 uuid;
  v_customer_2 uuid;
  v_customer_3 uuid;
  v_job_1 uuid;
  v_job_2 uuid;
  v_job_3 uuid;
begin
  -- Seed up to two tenant accounts that already exist in public.users.
  for tenant in
    select distinct
      u.company_id,
      u.id as user_id,
      c.name as company_name
    from public.users u
    inner join public.companies c on c.id = u.company_id
    order by c.created_at asc
    limit 2
  loop
    -- Remove old demo records so reruns stay clean and deterministic.
    delete from public.marketing_assets
    where company_id = tenant.company_id
      and context = '[seed-demo]';

    delete from public.finance_entries
    where company_id = tenant.company_id
      and notes like '[seed-demo]%';

    delete from public.calendar_events
    where company_id = tenant.company_id
      and notes like '[seed-demo]%';

    delete from public.jobs
    where company_id = tenant.company_id
      and source = 'seed-demo';

    delete from public.customers
    where company_id = tenant.company_id
      and source = 'seed-demo';

    -- Customers + prospects
    insert into public.customers (
      company_id, created_by, updated_by, type, name, email, phone, address, notes, source
    )
    values (
      tenant.company_id,
      tenant.user_id,
      tenant.user_id,
      'customer',
      'Sarah Mitchell',
      'sarah.mitchell@example.com',
      '(555) 201-4011',
      '1842 Palm Ave, Tampa, FL',
      'Repeat monthly customer. Prefers weekday mornings.',
      'seed-demo'
    )
    returning id into v_customer_1;

    insert into public.customers (
      company_id, created_by, updated_by, type, name, email, phone, address, notes, source
    )
    values (
      tenant.company_id,
      tenant.user_id,
      tenant.user_id,
      'customer',
      'Atlas Property Group',
      'ops@atlaspg.example.com',
      '(555) 339-8841',
      '990 Harbor Blvd, Clearwater, FL',
      'Commercial account. Needs photo updates for each completed job.',
      'seed-demo'
    )
    returning id into v_customer_2;

    insert into public.customers (
      company_id, created_by, updated_by, type, name, email, phone, address, notes, source
    )
    values (
      tenant.company_id,
      tenant.user_id,
      tenant.user_id,
      'prospect',
      'David Chen',
      'david.chen@example.com',
      '(555) 778-1200',
      '77 Lake View Dr, St. Petersburg, FL',
      'Requested quote via website form.',
      'seed-demo'
    )
    returning id into v_customer_3;

    -- Jobs (lead -> scheduled -> completed)
    insert into public.jobs (
      company_id, created_by, updated_by, customer_id, customer_name, service_type,
      status, scheduled_start, scheduled_end, address, price, notes, source
    )
    values (
      tenant.company_id,
      tenant.user_id,
      tenant.user_id,
      v_customer_3,
      'David Chen',
      'Exterior Detail Package',
      'lead',
      null,
      null,
      '77 Lake View Dr, St. Petersburg, FL',
      220.00,
      'Waiting for customer confirmation on scope.',
      'seed-demo'
    )
    returning id into v_job_1;

    insert into public.jobs (
      company_id, created_by, updated_by, customer_id, customer_name, service_type,
      status, scheduled_start, scheduled_end, address, price, notes, source
    )
    values (
      tenant.company_id,
      tenant.user_id,
      tenant.user_id,
      v_customer_1,
      'Sarah Mitchell',
      'Maintenance Wash + Interior Refresh',
      'scheduled',
      timezone('utc', now()) + interval '1 day' + interval '10 hours',
      timezone('utc', now()) + interval '1 day' + interval '12 hours',
      '1842 Palm Ave, Tampa, FL',
      165.00,
      'Bring pet hair remover tools.',
      'seed-demo'
    )
    returning id into v_job_2;

    insert into public.jobs (
      company_id, created_by, updated_by, customer_id, customer_name, service_type,
      status, scheduled_start, scheduled_end, address, price, notes, source
    )
    values (
      tenant.company_id,
      tenant.user_id,
      tenant.user_id,
      v_customer_2,
      'Atlas Property Group',
      'Fleet Window Cleaning',
      'completed',
      timezone('utc', now()) - interval '3 days' + interval '9 hours',
      timezone('utc', now()) - interval '3 days' + interval '13 hours',
      '990 Harbor Blvd, Clearwater, FL',
      480.00,
      'Completed all 6 vehicles. Photos uploaded to report.',
      'seed-demo'
    )
    returning id into v_job_3;

    -- Schedule/events
    insert into public.calendar_events (
      company_id, created_by, updated_by, type, title, start_at, end_at, location, notes
    )
    values
      (
        tenant.company_id,
        tenant.user_id,
        tenant.user_id,
        'event',
        'Supplier pickup: microfiber stock',
        timezone('utc', now()) + interval '2 days' + interval '8 hours',
        timezone('utc', now()) + interval '2 days' + interval '9 hours',
        'Detail Depot Warehouse',
        '[seed-demo] Inventory replenishment run.'
      ),
      (
        tenant.company_id,
        tenant.user_id,
        tenant.user_id,
        'task',
        'Follow up with David Chen quote',
        timezone('utc', now()) + interval '4 hours',
        timezone('utc', now()) + interval '5 hours',
        null,
        '[seed-demo] Send final quote and availability.'
      );

    -- Finance entries
    insert into public.finance_entries (
      company_id, created_by, updated_by, type, job_id, title, category, amount, entry_date, notes
    )
    values
      (
        tenant.company_id,
        tenant.user_id,
        tenant.user_id,
        'revenue',
        v_job_3,
        'Fleet window cleaning invoice',
        'Service Income',
        480.00,
        current_date - 3,
        '[seed-demo] Paid same day by card.'
      ),
      (
        tenant.company_id,
        tenant.user_id,
        tenant.user_id,
        'expense',
        null,
        'Chemicals and supplies restock',
        'Supplies',
        142.35,
        current_date - 2,
        '[seed-demo] Monthly consumables restock.'
      ),
      (
        tenant.company_id,
        tenant.user_id,
        tenant.user_id,
        'revenue',
        v_job_2,
        'Scheduled maintenance prepayment',
        'Service Income',
        100.00,
        current_date,
        '[seed-demo] Deposit received.'
      );

    -- Marketing history samples
    insert into public.marketing_assets (
      company_id, created_by, updated_by, channel, context, content, status
    )
    values
      (
        tenant.company_id,
        tenant.user_id,
        tenant.user_id,
        'social_post',
        '[seed-demo]',
        'Spring is here. Keep your vehicle looking its best with our maintenance detail packages. Book this week to reserve your preferred time slot.',
        'draft'
      ),
      (
        tenant.company_id,
        tenant.user_id,
        tenant.user_id,
        'email',
        '[seed-demo]',
        'Subject: Keep your fleet spotless this month\n\nHi there,\n\nWe just opened new commercial service slots for recurring exterior and window cleaning. If your team wants a predictable schedule and quick turnaround, reply to this email and we''ll set up a tailored plan.\n\nBest,\nErgon Demo Team',
        'draft'
      ),
      (
        tenant.company_id,
        tenant.user_id,
        tenant.user_id,
        'sms',
        '[seed-demo]',
        'We have 2 opening slots this week for detail service. Reply YES for times.',
        'draft'
      );
  end loop;

  if not exists (select 1 from public.users) then
    raise notice 'Seed skipped: no rows in public.users yet. Create at least one account first.';
  end if;
end
$$;
