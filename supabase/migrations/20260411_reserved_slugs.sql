-- ============================================================
-- Feature 003: Reserved slug check constraint on public.tenants
-- ------------------------------------------------------------
-- Adds a DB-level constraint preventing reserved slugs from
-- ever being used as tenant identifiers.
--
-- Belt-and-suspenders: middleware also rejects these at the
-- request layer. Both layers enforce the rule independently.
-- ============================================================

alter table public.tenants
  drop constraint if exists tenants_slug_not_reserved;

alter table public.tenants
  add constraint tenants_slug_not_reserved
  check (slug not in (
    'app', 'api', 'www', 'admin', 'auth',
    'status', 'docs', 'staging', 'cdn', 'mail'
  ));
