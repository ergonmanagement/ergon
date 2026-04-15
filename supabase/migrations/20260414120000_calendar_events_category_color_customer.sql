-- Optional category label, UI color preset, and link to an existing customer.
alter table public.calendar_events
  add column if not exists category text,
  add column if not exists color_key text,
  add column if not exists customer_id uuid references public.customers (id);

alter table public.calendar_events
  drop constraint if exists calendar_events_color_key_chk;

alter table public.calendar_events
  add constraint calendar_events_color_key_chk
  check (
    color_key is null
    or color_key in ('sky', 'emerald', 'amber', 'rose', 'violet', 'slate')
  );
