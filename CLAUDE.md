# SocialSpreadCart Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-09

## Active Technologies

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

- main: Added TypeScript 5.6 + Next.js 15.5 (App Router), React 19, Tailwind CSS 3.4,

<!-- MANUAL ADDITIONS START -->
- SocialSpreadCart is a shared multi-tenant platform. New clients should be modeled as new tenant-scoped records in the existing database, never as separate databases.
- Self-serve tenant signup inside SocialSpreadCart is not the current delivery priority. Future client onboarding is expected to be agency-managed through Studio X (`studioxconsulting.com`) and should go through the SpecKit process before implementation.
- Future work around agency-managed tenant provisioning, launch workflow, and custom-domain mapping is documented in `specs/010-agency-managed-tenant-provisioning/`.
<!-- MANUAL ADDITIONS END -->
