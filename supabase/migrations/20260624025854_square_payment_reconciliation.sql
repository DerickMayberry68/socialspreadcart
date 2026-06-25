begin;

alter table public.payment_records
  add column if not exists provider_order_id text,
  add column if not exists provider_checkout_id text,
  add column if not exists provider_refund_id text,
  add column if not exists refunded_amount_cents integer not null default 0
    check (refunded_amount_cents >= 0),
  add column if not exists checkout_expires_at timestamptz,
  add column if not exists superseded_at timestamptz;

alter table public.payment_records
  drop constraint if exists payment_records_refunded_amount_valid;

alter table public.payment_records
  add constraint payment_records_refunded_amount_valid
  check (refunded_amount_cents <= amount_cents);

create unique index if not exists payment_records_provider_order_uidx
  on public.payment_records (provider, provider_order_id)
  where provider_order_id is not null;

create unique index if not exists payment_records_provider_checkout_uidx
  on public.payment_records (provider, provider_checkout_id)
  where provider_checkout_id is not null;

create unique index if not exists payment_records_active_order_provider_uidx
  on public.payment_records (tenant_id, order_id, provider)
  where superseded_at is null;

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  tenant_id uuid references public.tenants(id) on delete cascade,
  order_id uuid references public.guest_orders(id) on delete cascade,
  payment_record_id uuid references public.payment_records(id) on delete set null,
  processing_status text not null default 'received'
    check (processing_status in ('received', 'processed', 'ignored', 'failed')),
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, event_id)
);

create index if not exists payment_webhook_events_tenant_received_idx
  on public.payment_webhook_events (tenant_id, received_at desc);

create index if not exists payment_webhook_events_order_idx
  on public.payment_webhook_events (tenant_id, order_id, received_at desc)
  where order_id is not null;

alter table public.payment_webhook_events enable row level security;

grant select on table public.payment_webhook_events to authenticated;
grant all on table public.payment_webhook_events to service_role;

drop policy if exists "Tenant admins can read payment webhook events"
  on public.payment_webhook_events;

create policy "Tenant admins can read payment webhook events"
  on public.payment_webhook_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tenant_users tu
      where tu.tenant_id = payment_webhook_events.tenant_id
        and tu.user_id = (select auth.uid())
        and tu.role in ('owner', 'admin')
    )
  );

commit;
