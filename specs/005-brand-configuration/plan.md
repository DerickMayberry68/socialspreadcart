# Implementation Plan: Brand Configuration from Tenant Record

**Branch**: `main` | **Date**: 2026-04-10 | **Spec**: [spec.md](spec.md)

## Summary

Introduce a `tenant_brand` table, a `BrandService`, and a CSS-variable-based
theming system. Every tenant-facing page reads brand values from the current
tenant's brand record and injects them as CSS variables at the root layout.
Tailwind color tokens become CSS variables; `siteConfig` is relegated to a
platform-level fallback.

## Technical Context

**Language/Version**: TypeScript 5.6
**Primary Dependencies**: Next.js 15.5, Tailwind CSS 3.4, Zod 4,
  `src/lib/tenant/` from Spec 003, services layer from Spec 004.
**Storage**: Supabase — one new table (`tenant_brand`), one insert trigger
  on `tenants`, one new service.
**Testing**: Vitest. Add tests covering the BrandService contract and the
  allowlist Zod validation.
**Target Platform**: Next.js full-stack app.
**Constraints**: CSS variables only — no runtime Tailwind classes. Must
  not regress Feature 001 visuals for the legacy tenant.
**Scale/Scope**: 1 new migration, 1 new service, 1 tailwind.config.ts
  refactor, 1 root layout update, 1 globals.css update, ~5 components
  touched to remove hardcoded tokens.

## Constitution Check

| Principle | Check | Result |
| --------- | ----- | ------ |
| I. Single Responsibility | BrandService owns brand data access only | ✅ |
| II. Open/Closed | New brand fields added by column; consumers read typed brand object | ✅ |
| III. Liskov | Zod schema enforces brand contract at boundary | ✅ |
| IV. Interface Segregation | BrandService is narrow; does not touch quotes or contacts | ✅ |
| V. Dependency Inversion | Services layer (Spec 004) is the only caller | ✅ |
| UX & Brand | This feature IS the brand standards system — core constitution section | ✅ |
| Tech Stack | No new dependencies; `next/font` already in use | ✅ |

## Project Structure

```text
supabase/migrations/
└── 20260415_tenant_brand.sql      # NEW: tenant_brand table + insert trigger

src/
├── services/
│   └── brand-service.ts           # NEW: getBrand(tenantId), updateBrand(tenantId, patch)
├── lib/
│   └── tenant/
│       ├── default-brand.ts       # NEW: platform fallback brand constant
│       └── brand-schema.ts        # NEW: Zod schema + font allowlist
├── app/
│   ├── layout.tsx                 # UPDATED: inject CSS variables from current tenant brand
│   └── globals.css                # UPDATED: define CSS variable names
├── components/
│   ├── brand/
│   │   └── logo.tsx               # UPDATED: accept brand prop or fall back to getCurrentBrand()
│   └── ui/*                       # UPDATED: remove any remaining hardcoded hex values
tailwind.config.ts                 # UPDATED: color tokens reference CSS variables
tests/
└── brand-service.test.ts          # NEW
```

## Implementation Order

1. Write the `20260415_tenant_brand.sql` migration with the table, the
   platform-default seed row for the legacy tenant, and the insert trigger.
2. Add `src/lib/tenant/brand-schema.ts` (Zod) and
   `src/lib/tenant/default-brand.ts` (typed constant).
3. Create `src/services/brand-service.ts` with `getBrand(tenantId)` and
   `updateBrand(tenantId, patch)`.
4. Refactor `tailwind.config.ts` so every brand color token references a
   CSS variable: `sage: 'rgb(var(--color-sage) / <alpha-value>)'`.
5. Update `src/app/globals.css` to define `:root { --color-sage: ... }`
   with the default brand values.
6. Update `src/app/layout.tsx` to call `getCurrentTenant()` + `getBrand()`
   server-side and emit a `<style>` tag that overrides the CSS variables
   with the tenant's values.
7. Update `<Logo>` to read from a request-cached `getCurrentBrand()`.
8. Audit `src/components/` and `src/app/` for hardcoded hex values; replace
   with Tailwind brand classes or CSS variable references.
9. Run Feature 001 quickstart against the legacy tenant; confirm zero
   visual regressions.
10. Run `npm test`; Spec 002 + Spec 004 tests still pass; new brand tests
    pass.
