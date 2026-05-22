begin;

alter type public.guest_order_status add value if not exists 'delivery_requested';
alter type public.guest_order_status add value if not exists 'delivery_approved_payment_needed';
alter type public.guest_order_status add value if not exists 'delivery_declined';
alter type public.guest_order_status add value if not exists 'pickup_offered';
alter type public.guest_order_status add value if not exists 'approval_withdrawn';
alter type public.guest_order_status add value if not exists 'expired';

alter table public.guest_orders
  add column if not exists fulfillment_address jsonb,
  add column if not exists delivery_status text not null default 'not_required',
  add column if not exists delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0),
  add column if not exists approved_total_cents integer check (approved_total_cents is null or approved_total_cents >= 0),
  add column if not exists delivery_decision_note text,
  add column if not exists delivery_approved_at timestamptz,
  add column if not exists delivery_approval_expires_at timestamptz,
  add column if not exists delivery_decided_by uuid references auth.users(id);

alter table public.guest_orders
  drop constraint if exists guest_orders_total_matches;

alter table public.guest_orders
  add constraint guest_orders_total_matches check (
    total_cents = subtotal_cents + tax_cents + fee_cents + delivery_fee_cents
  );

alter table public.guest_orders
  drop constraint if exists guest_orders_delivery_status_valid;

alter table public.guest_orders
  add constraint guest_orders_delivery_status_valid check (
    delivery_status in (
      'not_required',
      'requested',
      'approved_payment_needed',
      'declined',
      'pickup_offered',
      'approval_withdrawn',
      'expired',
      'paid'
    )
  );

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.guest_orders(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  note text,
  customer_visible boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists guest_orders_tenant_delivery_status_idx
  on public.guest_orders (tenant_id, delivery_status, created_at desc);

create index if not exists order_status_history_order_idx
  on public.order_status_history (tenant_id, order_id, created_at desc);

alter table public.order_status_history enable row level security;

drop policy if exists "Tenant admins can read order status history" on public.order_status_history;
create policy "Tenant admins can read order status history"
  on public.order_status_history
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tenant_users tu
      where tu.tenant_id = order_status_history.tenant_id
        and tu.user_id = auth.uid()
        and tu.role in ('owner', 'admin')
    )
  );

commit;
