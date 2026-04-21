# SocialSpreadCart Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-21

## Active Technologies
- TypeScript 5.6 (strict), React 19.2 + Next.js 15.5 (App Router, Server Components, (012-admin-editable-hero-and-cards)
- Supabase Postgres — three new tenant-scoped tables (012-admin-editable-hero-and-cards)

- TypeScript 5.6 + Next.js 15.5 (App Router), React 19, Tailwind CSS 3.4, (main)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.6: Follow standard conventions

## Recent Changes
- 012-admin-editable-hero-and-cards: Added TypeScript 5.6 (strict), React 19.2 + Next.js 15.5 (App Router, Server Components,

- main: Added TypeScript 5.6 + Next.js 15.5 (App Router), React 19, Tailwind CSS 3.4,

<!-- MANUAL ADDITIONS START -->
- SocialSpreadCart is a shared multi-tenant platform. New clients should be modeled as new tenant-scoped records in the existing database, never as separate databases.
- Admin-editable public content (site configuration, hero, pathway cards) is accessed exclusively through `SiteContentService` in `src/services/site-content-service.ts`. Do not read `site_configuration`, `hero_content`, or `pathway_cards` tables from pages/components directly; use the service so DB fallbacks, caching, and `revalidateTag` are consistent. Cache tag format: `site-content:<tenant_id>`.
- Admin API routes under `src/app/api/admin/site-content/**` must start by calling `requireTenantAdmin()` and short-circuit on `'error' in guard`.
<!-- MANUAL ADDITIONS END -->
