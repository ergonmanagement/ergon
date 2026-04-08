-- Enable RLS on companies (tenant root row). LLD lists tenant tables by company_id;
-- companies rows are scoped by id = current user's company_id.
-- Webhook and other service_role clients bypass RLS and may update billing fields.
-- Authenticated users may update profile fields only; subscription/trial columns are guarded.

alter table public.companies enable row level security;

create policy "Company row select for tenant members"
  on public.companies
  as permissive
  for select
  to authenticated
  using (id = public.current_user_company_id());

create policy "Company row update for tenant members"
  on public.companies
  as permissive
  for update
  to authenticated
  using (id = public.current_user_company_id())
  with check (id = public.current_user_company_id());

create or replace function public.companies_protect_billing_columns()
returns trigger
language plpgsql
as $function$
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  -- Service role (Stripe webhook, admin) may change billing columns.
  if (auth.jwt() ->> 'role') = 'service_role'
     or coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if new.subscription_status is distinct from old.subscription_status
     or new.trial_started_at is distinct from old.trial_started_at
     or new.trial_ends_at is distinct from old.trial_ends_at
  then
    raise exception 'Cannot modify subscription or trial fields from client context';
  end if;

  return new;
end;
$function$;

drop trigger if exists companies_protect_billing_columns_trigger on public.companies;

create trigger companies_protect_billing_columns_trigger
  before update on public.companies
  for each row
  execute function public.companies_protect_billing_columns();
