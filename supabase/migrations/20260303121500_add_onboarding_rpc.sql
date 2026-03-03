-- Onboarding helper RPC to create a company and owner user in one transaction.
-- Uses existing companies and users tables.

create or replace function public.onboarding_create_company_and_owner(
  p_user_id uuid,
  p_email text,
  p_company_name text,
  p_service_type text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_company_id uuid;
  v_company_row public.companies;
  v_user_row public.users;
begin
  if p_user_id is null or p_email is null then
    raise exception 'User id and email are required';
  end if;

  insert into public.companies (name, service_type, phone)
  values (p_company_name, p_service_type, p_phone)
  returning * into v_company_row;

  insert into public.users (id, company_id, email)
  values (p_user_id, v_company_row.id, p_email)
  on conflict (id) do update
    set company_id = excluded.company_id,
        email = excluded.email,
        updated_at = timezone('utc'::text, now())
  returning * into v_user_row;

  return jsonb_build_object(
    'company', jsonb_build_object(
      'id', v_company_row.id,
      'name', v_company_row.name,
      'subscription_status', v_company_row.subscription_status,
      'trial_ends_at', v_company_row.trial_ends_at
    ),
    'user', jsonb_build_object(
      'id', v_user_row.id,
      'company_id', v_user_row.company_id,
      'email', v_user_row.email,
      'role', v_user_row.role
    )
  );
end;
$function$;

