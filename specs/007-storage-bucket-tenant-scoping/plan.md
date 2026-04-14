# Implementation Plan: Storage Bucket Tenant Scoping

**Branch**: `main` | **Date**: 2026-04-10 | **Spec**: [spec.md](spec.md)

## Summary

Rewrite Supabase Storage RLS so writes to `boards`, `events`, and the new
`logos` bucket are scoped by an object-key path prefix of the form
`tenants/<tenant_uuid>/<bucket>/...`. Add a SQL helper that parses the
tenant UUID out of an object path, update the upload services to emit
tenant-prefixed keys, and migrate existing legacy objects in place.

## Technical Context

**Language/Version**: TypeScript 5.6, PL/pgSQL for RLS helpers.
**Primary Dependencies**: Supabase Storage, `@supabase/ssr`,
  `tenant_ids_for_current_user()` from Spec 002, services layer from
  Spec 004, brand service from Spec 005.
**Storage**: Supabase Storage (three buckets: `boards`, `events`, `logos`).
**Testing**: Vitest. Extend `tests/tenant-isolation.test.ts` (Spec 002)
  with a `describe('storage isolation')` block that uploads as tenant A,
  reads publicly as anon, and confirms tenant B's upload to A's prefix
  fails with a policy error.
**Target Platform**: Supabase hosted + local.
**Constraints**: Public reads MUST continue to work for all three buckets.
  Legacy URLs that hardcoded `boards/<file>.jpg` should still resolve
  after migration (handled either by in-place rename + page-reference
  update, or by a stable redirect rule).
**Scale/Scope**: 1 new migration (`20260425_storage_tenant_scoping.sql`),
  1 Node-based one-off migration script, 1 new bucket, 3 bucket policy
  rewrites, ~2 service functions touched, 1 `<Logo>` component URL
  resolution tweak.

## Constitution Check

| Principle | Check | Result |
| --------- | ----- | ------ |
| I. Single Responsibility | `path_tenant_id()` is a one-purpose SQL helper; policies are data-access rules only | ✅ |
| II. Open/Closed | New buckets follow the same convention by construction | ✅ |
| III. Liskov | N/A (no service polymorphism here) | ✅ |
| IV. Interface Segregation | Upload services expose narrow `uploadImage(tenantId, bucket, file)` signature | ✅ |
| V. Dependency Inversion | Pages/components never construct Supabase storage clients directly; go through services | ✅ |
| Data Integrity | RLS is the enforcement layer; services prepend the prefix as a convenience, not the only guarantee | ✅ |
| UX & Brand | `logos` bucket unblocks Spec 005's dynamic brand logos | ✅ |
| Tech Stack | No new dependencies | ✅ |

## Project Structure

```text
supabase/migrations/
└── 20260425_storage_tenant_scoping.sql   # NEW: logos bucket, path_tenant_id(), RLS rewrites

scripts/
└── migrate-legacy-storage.ts             # NEW: one-off object rename script

src/
├── services/
│   ├── upload-service.ts                 # UPDATED (or NEW): prepends tenants/<id>/<bucket>/
│   └── brand-service.ts                  # UPDATED: logo upload uses logos bucket
└── components/
    └── brand/
        └── logo.tsx                      # UPDATED (if needed): resolve public URL from logos bucket
tests/
└── tenant-isolation.test.ts              # UPDATED: storage isolation describe block
```

## Implementation Order

1. Write `20260425_storage_tenant_scoping.sql`:
   - `insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict do nothing`.
   - `create or replace function public.path_tenant_id(object_path text) returns uuid` that splits on `/` and returns the UUID at position 2 if the first segment is literally `tenants`, else NULL. Mark `immutable`, `security definer`, `set search_path = public`.
   - Drop the cosmetic `bucket_id = 'boards'` / `= 'events'` policies.
   - Create new `storage.objects` policies for `boards`, `events`, `logos`:
     - `select` → `using (bucket_id in ('boards','events','logos'))` (public reads).
     - `insert` / `update` / `delete` → `using (bucket_id in (...) and path_tenant_id(name) in (select public.tenant_ids_for_current_user()))`.
2. Write `scripts/migrate-legacy-storage.ts`:
   - Uses the service-role key.
   - Looks up the legacy tenant UUID by `slug = 'sarah'`.
   - For each object in `boards` and `events` whose `name` does NOT start with `tenants/`, move it to `tenants/<legacy>/<bucket>/<original-name>` via `storage.from(bucket).move(old, new)`.
   - Idempotent: objects already prefixed are skipped.
3. Update `src/services/upload-service.ts` (create the file if it does
   not yet exist in Spec 004) so every write goes through a single
   helper that prepends `tenants/<tenantId>/<bucket>/` to the caller's
   filename. Export typed signatures: `uploadBoardImage`, `uploadEventImage`, `uploadLogo`.
4. Update `src/services/brand-service.ts` so `updateBrand` calls
   `uploadLogo` for logo changes and writes the resulting public URL to
   the `tenant_brand` row.
5. Audit `src/components/brand/logo.tsx` — if it hardcodes a path under
   `/brand/...`, switch to the stored URL from the tenant brand record.
6. Extend `tests/tenant-isolation.test.ts` with a storage-isolation
   `describe` block. The harness already creates two tenants; the block
   will:
   - Upload as tenant A to the `boards` bucket via the services layer → expect success + correct `tenants/<A>/boards/...` key.
   - Upload as tenant B to an explicit `tenants/<A>/boards/evil.jpg` key (bypassing the service) → expect a policy error.
   - Fetch the public URL of tenant A's upload as an anon client → expect 200.
7. Run the legacy migration script against the local Supabase instance
   and re-run Spec 001 / Spec 005 quickstarts to confirm every existing
   image on the legacy tenant's public site still loads.
8. Run full `npm test`; the new storage-isolation block must pass
   alongside the Spec 002 suite.
9. Document the `tenants/<id>/<bucket>/...` convention in the
   constitution's Technology Stack section in a follow-up amendment PR.
