begin;

alter table public.payment_records
  add column if not exists amount_subtotal_cents integer check (amount_subtotal_cents is null or amount_subtotal_cents >= 0),
  add column if not exists amount_tax_cents integer check (amount_tax_cents is null or amount_tax_cents >= 0),
  add column if not exists amount_fee_cents integer check (amount_fee_cents is null or amount_fee_cents >= 0),
  add column if not exists tax_calculation_id text;

commit;
