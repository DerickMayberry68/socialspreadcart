# Implementation Plan: Contact Close → Cascade Close Related Quotes

**Branch**: `023-contact-close-cascade` (developed on `main` per owner) | **Date**: 2026-06-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/023-contact-close-cascade/spec.md`

## Summary

Add the forward cascade that the codebase is missing: when an admin closes a contact, every open quote linked to that contact is closed too, in one atomic operation, gated behind a confirmation prompt that names the count. The reverse direction (quote → contact) already lives in `quoteService.updateQuoteStatus` and is left untouched.

Closing is intentional "cut ties": reopening a contact does not reopen quotes.

## Technical Context

**Language/Version**: TypeScript 5.6, React 19.2, Next.js 15.5 App Router
**Primary Dependencies**: Supabase SSR/client services, Tailwind 3.4, Radix Dialog (`ConfirmDialog`), `sonner`, Lucide icons
**Storage**: Existing Supabase/Postgres `contacts`, `quotes`, `interactions` tables. One additive migration: a tenant-scoped Postgres function `close_contact_cascade` for atomicity. No table/column changes.
**Testing**: Vitest (`npm test`), `next lint`
**Target Platform**: Vercel-hosted admin UI
**Constraints**: Preserve tenant isolation; no `window.confirm`/`alert`/`prompt` (use `ConfirmDialog`); keep status logic in the services layer; do not change the existing reverse cascade.
**Scale/Scope**: One write path (`ContactService.updateContactStatus`) and one UI control (`ContactStatusSelect` on the contact detail page).

## Constitution Check

- **Single Responsibility**: Pass. The cascade is one named DB function; the service decides *when* to call it; the UI only gates with a confirmation. Rendering holds no business logic.
- **Open/Closed**: Pass. `updateContactStatus` is extended with a `closed` branch; the existing non-closed path and the reverse cascade are unchanged.
- **Liskov / Interface Segregation**: Pass. `updateContactStatus` keeps its signature; an optional returned `closedQuotes` count is additive. `ContactStatusSelect` gains one optional prop (`openQuotesCount`).
- **Dependency Inversion**: Pass. Supabase access stays inside the service; the component calls the existing status API route.
- **DRY**: Pass. Atomic multi-row/multi-table logic is encapsulated once in `close_contact_cascade` rather than duplicated across sequential client writes.
- **UX & Brand Standards**: Pass. Reuses `ConfirmDialog` and `sonner`; no browser dialogs.

## Project Structure

### Documentation (this feature)

```text
specs/023-contact-close-cascade/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
supabase/migrations/
└── 20260608_contact_close_cascade.sql        # new: close_contact_cascade() function

src/
├── services/contact-service.ts               # updateContactStatus: closed → rpc cascade
├── app/api/admin/contacts/[id]/status/route.ts  # surface closedQuotes count in response
├── components/admin/contact-status-select.tsx   # confirmation gate + toast on close
└── app/admin/(shell)/contacts/[id]/page.tsx     # pass openQuotesCount to the control

tests/
└── services/contact-service.test.ts          # new: cascade-on-close behavior
```

**Structure Decision**: No new architectural surface. Encapsulate atomicity in a Postgres function (the one new artifact), extend the existing service write path, and add a confirmation gate to the existing status control.

## Complexity Tracking

One deliberate deviation from the existing `updateQuoteStatus` precedent: that sibling performs sequential, non-atomic multi-table writes. This feature uses a Postgres function instead, because FR-003 requires all-or-nothing across N quotes + the contact + audit rows, which sequential client writes cannot guarantee. Documented in [research.md](./research.md).

## Phase 0: Research

See [research.md](./research.md).

## Phase 1: Design

See [data-model.md](./data-model.md) and [quickstart.md](./quickstart.md).

## Post-Design Constitution Check

Re-checked after design: still Pass on all principles. The single new function keeps the cascade DRY and tenant-scoped; the UI remains presentation-only.
