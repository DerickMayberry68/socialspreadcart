begin;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'guest_order_status') then
    create type public.guest_order_status as enum (
      'draft',
      'payment_pending',
      'paid',
      'payment_failed',
      'cancelled',
      'preparing',
      'fulfilled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'guest_payment_status') then
    create type public.guest_payment_status as enum (
      'not_started',
      'pending',
      'paid',
      'failed',
      'cancelled',
      'refunded'
    );
  end if;
end;
$$;

create table if not exists public.guest_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  guest_name text not null,
  guest_email text,
  guest_phone text,
  fulfillment_type text not null default 'pickup',
  fulfillment_requested_at timestamptz,
  fulfillment_notes text,
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  fee_cents integer not null default 0 check (fee_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  currency text not null default 'usd',
  status public.guest_order_status not null default 'payment_pending',
  payment_status public.guest_payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guest_orders_contact_required check (
    nullif(btrim(coalesce(guest_email, '')), '') is not null
    or nullif(btrim(coalesce(guest_phone, '')), '') is not null
  ),
  constraint guest_orders_total_matches check (
    total_cents = subtotal_cents + tax_cents + fee_cents
  )
);

create table if not exists public.guest_order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.guest_orders(id) on delete cascade,
  menu_item_id text not null,
  name text not null,
  slug text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0),
  line_total_cents integer not null check (line_total_cents >= 0),
  notes text,
  options jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint guest_order_items_line_total check (
    line_total_cents = unit_price_cents * quantity
  )
);

create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.guest_orders(id) on delete cascade,
  provider text not null default 'stripe',
  provider_session_id text,
  provider_payment_intent_id text,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  status public.guest_payment_status not null default 'pending',
  raw_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_session_id),
  unique (provider, provider_payment_intent_id)
);

create index if not exists guest_orders_tenant_created_idx
  on public.guest_orders (tenant_id, created_at desc);

create index if not exists guest_orders_tenant_status_idx
  on public.guest_orders (tenant_id, status, payment_status);

create index if not exists guest_order_items_order_idx
  on public.guest_order_items (tenant_id, order_id);

create index if not exists payment_records_order_idx
  on public.payment_records (tenant_id, order_id);

create index if not exists payment_records_session_idx
  on public.payment_records (provider_session_id)
  where provider_session_id is not null;

alter table public.guest_orders enable row level security;
alter table public.guest_order_items enable row level security;
alter table public.payment_records enable row level security;

drop policy if exists "Tenant admins can read guest orders" on public.guest_orders;
create policy "Tenant admins can read guest orders"
  on public.guest_orders
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tenant_users tu
      where tu.tenant_id = guest_orders.tenant_id
        and tu.user_id = auth.uid()
        and tu.role in ('owner', 'admin')
    )
  );

drop policy if exists "Tenant admins can update guest orders" on public.guest_orders;
create policy "Tenant admins can update guest orders"
  on public.guest_orders
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.tenant_users tu
      where tu.tenant_id = guest_orders.tenant_id
        and tu.user_id = auth.uid()
        and tu.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.tenant_users tu
      where tu.tenant_id = guest_orders.tenant_id
        and tu.user_id = auth.uid()
        and tu.role in ('owner', 'admin')
    )
  );

drop policy if exists "Tenant admins can read guest order items" on public.guest_order_items;
create policy "Tenant admins can read guest order items"
  on public.guest_order_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tenant_users tu
      where tu.tenant_id = guest_order_items.tenant_id
        and tu.user_id = auth.uid()
        and tu.role in ('owner', 'admin')
    )
  );

drop policy if exists "Tenant admins can read payment records" on public.payment_records;
create policy "Tenant admins can read payment records"
  on public.payment_records
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tenant_users tu
      where tu.tenant_id = payment_records.tenant_id
        and tu.user_id = auth.uid()
        and tu.role in ('owner', 'admin')
    )
  );

commit;
