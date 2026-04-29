# SocialSpreadCart Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-29

## Active Technologies
- TypeScript 5.6 (strict), React 19.2 + Next.js 15.5 (App Router, Server Components, (012-admin-editable-hero-and-cards)
- Supabase Postgres — three new tenant-scoped tables (012-admin-editable-hero-and-cards)
- TypeScript 5.6.3, React 19.2.4, Next.js 15.5.14 App Router + Next.js Server Components/Server Actions, Supabase SSR/client libraries, Zod 4.3.6, Tailwind CSS 3.4.17, Radix UI, sonner, Stripe server SDK to be added for payment sessions and webhook verification (017-guest-ordering-payment)
- Supabase Postgres tables for guest orders, order items, and payment records; existing `menu_items` table remains the source for orderable items (017-guest-ordering-payment)
- TypeScript 5.6.3, React 19.2.4, Next.js 15.5.14 App Router + Next.js Server Components/Server Actions, Supabase SSR/client libraries, Zod 4.3.6, Tailwind CSS 3.4.17, Radix UI, sonner, Stripe server SDK 22.1.0, Stripe Checkout, Stripe Tax Calculation (fix/admin-event-schema-cache)
- Supabase Postgres tables for guest orders, order items, and payment records; existing `menu_items` table remains the source for orderable items; guest orders must persist `subtotal_cents`, `tax_cents`, `fee_cents`, and `total_cents` as separate values (fix/admin-event-schema-cache)

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
- fix/admin-event-schema-cache: Added TypeScript 5.6.3, React 19.2.4, Next.js 15.5.14 App Router + Next.js Server Components/Server Actions, Supabase SSR/client libraries, Zod 4.3.6, Tailwind CSS 3.4.17, Radix UI, sonner, Stripe server SDK 22.1.0, Stripe Checkout, Stripe Tax Calculation
- 017-guest-ordering-payment: Added TypeScript 5.6.3, React 19.2.4, Next.js 15.5.14 App Router + Next.js Server Components/Server Actions, Supabase SSR/client libraries, Zod 4.3.6, Tailwind CSS 3.4.17, Radix UI, sonner, Stripe server SDK to be added for payment sessions and webhook verification
- 012-admin-editable-hero-and-cards: Added TypeScript 5.6 (strict), React 19.2 + Next.js 15.5 (App Router, Server Components,


<!-- MANUAL ADDITIONS START -->
SocialSpreadCart is a shared multi-tenant platform. New clients should be modeled as new tenant-scoped records in the existing database, never as separate databases.
Admin-editable public content (site configuration, hero, pathway cards) is accessed exclusively through `SiteContentService` in `src/services/site-content-service.ts`. Do not read `site_configuration`, `hero_content`, or `pathway_cards` tables from pages/components directly; use the service so DB fallbacks, caching, and `revalidateTag` are consistent. Cache tag format: `site-content:<tenant_id>`.
Admin API routes under `src/app/api/admin/site-content/**` must start by calling `requireTenantAdmin()` and short-circuit on `'error' in guard`.
Do not bypass Spec Kit for admin workflows, data model/schema behavior, tenant behavior, public content behavior, or non-trivial production bug fixes unless the user explicitly confirms it is a hotfix and should proceed outside the spec flow. Default to asking and using Spec Kit.
<!-- MANUAL ADDITIONS END -->
