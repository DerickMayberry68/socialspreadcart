# Implementation Plan: Admin List Grids

**Branch**: `020-admin-list-grids` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/020-admin-list-grids/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Upgrade the primary admin operational lists from mixed card/list layouts into consistent sortable, paginated grids with visible headers, muted completed/inactive rows, and explicit row actions. The implementation will introduce shared admin grid/query primitives, extend service list functions with tenant-scoped sorting and pagination, then migrate Contacts first and the remaining operational lists incrementally.

## Technical Context

**Language/Version**: TypeScript 5.6, React 19.2, Next.js 15.5 App Router  
**Primary Dependencies**: Supabase SSR/client services, Tailwind CSS 3.4, Radix Dialog patterns, `sonner`, existing Lucide icons  
**Storage**: Existing Supabase/Postgres tables; no schema change planned  
**Testing**: Vitest, React Testing Library, TypeScript `tsc`, Next production build  
**Target Platform**: Vercel-hosted web admin UI  
**Project Type**: Next.js web application with server-rendered admin pages and client-side interactive managers  
**Performance Goals**: Admin list pages remain scannable with 25 records per page; sorting/filtering/paging should avoid loading unbounded result sets for growing operational data  
**Constraints**: Preserve tenant isolation, existing admin permissions, existing search/filter workflows, and no `window.alert`, `window.confirm`, or `window.prompt`  
**Scale/Scope**: Six operational admin list surfaces: Contacts, Quotes, Orders, Reviews, Events, and Menu Items

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Single Responsibility**: Pass. Shared grid components render UI only; list filtering, sorting, and paging logic remains in services or small pure URL/query helpers.
- **Open/Closed**: Pass. Add shared admin grid/query primitives and extend existing services with list options rather than duplicating one-off list tables.
- **Liskov Substitution**: Pass. Existing service return contracts will be extended deliberately with typed paged-result wrappers; callers will receive stable shapes.
- **Interface Segregation**: Pass. Query options and paged results remain narrow and list-focused, not a broad admin mega-service.
- **Dependency Inversion**: Pass. Admin pages continue to depend on service functions; components do not instantiate Supabase clients.
- **UX & Brand Standards**: Pass. Uses existing brand tokens, Radix-based confirmation patterns, `sonner` feedback, and compact operational UI.

## Project Structure

### Documentation (this feature)

```text
specs/020-admin-list-grids/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── admin-list-grid.contract.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/admin/(shell)/
│   ├── contacts/page.tsx
│   ├── quotes/page.tsx
│   ├── orders/page.tsx
│   ├── reviews/page.tsx
│   ├── events/page.tsx
│   └── menu-items/page.tsx
├── components/admin/
│   ├── admin-data-grid.tsx
│   ├── admin-pagination.tsx
│   ├── delete-confirmation-dialog.tsx
│   ├── event-manager.tsx
│   ├── menu-item-manager.tsx
│   ├── order-manager.tsx
│   └── review-manager.tsx
├── lib/admin/
│   └── list-query.ts
├── services/
│   ├── contact-service.ts
│   ├── quote-service.ts
│   ├── order-service.ts
│   ├── review-service.ts
│   ├── event-service.ts
│   └── menu-service.ts
└── lib/types.ts

tests/
├── admin-list-query.test.ts
├── components/admin/
│   ├── admin-data-grid.test.tsx
│   ├── order-manager.test.tsx
│   └── review-manager.test.tsx
└── services/
    ├── contact-service.test.ts
    └── review-service.test.ts
```

**Structure Decision**: Keep the existing single Next.js app structure. Add reusable admin grid and pagination components under `src/components/admin`, pure URL/list helpers under `src/lib/admin`, and extend existing domain services rather than creating a new cross-domain admin service.

## Complexity Tracking

No constitution violations identified.

## Phase 0: Research

See [research.md](./research.md).

## Phase 1: Design And Contracts

See [data-model.md](./data-model.md), [contracts/admin-list-grid.contract.md](./contracts/admin-list-grid.contract.md), and [quickstart.md](./quickstart.md).

## Post-Design Constitution Check

- **Single Responsibility**: Pass. Data-grid rendering, pagination rendering, query parsing, and domain services have separate responsibilities.
- **Open/Closed**: Pass. The shared grid component can be configured by columns/actions; domain-specific behavior stays outside the primitive.
- **Liskov Substitution**: Pass. Paged list services return a common typed envelope without removing existing record shapes.
- **Interface Segregation**: Pass. Each list service receives only its relevant filters and sortable columns.
- **Dependency Inversion**: Pass. Supabase access remains inside services only.
- **UX & Brand Standards**: Pass. Confirmation uses project modal patterns and feedback uses `sonner`; no browser dialogs.
