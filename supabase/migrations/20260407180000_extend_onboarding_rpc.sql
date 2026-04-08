-- Extend onboarding RPC with optional company fields per highLevelDesign / lowLevelDesign §4.1

create or replace function public.onboarding_create_company_and_owner(
  p_user_id uuid,
  p_email text,
  p_company_name text,
  p_service_type text,
  p_phone text,
  p_address text default null,
  p_employees_count integer default null,
  p_years_in_business integer default null,
  p_estimated_revenue numeric default null,
  p_referral_source text default null
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

  insert into public.companies (
    name,
    service_type,
    phone,
    address,
    employees_count,
    years_in_business,
    estimated_revenue,
    referral_source
  )
  values (
    p_company_name,
    p_service_type,
    p_phone,
    nullif(trim(p_address), ''),
    p_employees_count,
    p_years_in_business,
    p_estimated_revenue,
    nullif(trim(p_referral_source), '')
  )
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
