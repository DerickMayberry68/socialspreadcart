# Implementation Plan: Booking Quote Form

**Branch**: `main` | **Date**: 2026-04-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-booking-quote-form/spec.md`

## Summary

Replace the current free-text, unstructured quote form at `/contact` with a guided,
structured booking form. Customers select an event date (48-hour minimum enforced),
choose an event type from a predefined list, select one or more services with
descriptions, and provide contact details before submitting. The implementation also
brings the quote submission path into constitution compliance by extracting all
Supabase and Resend logic into dedicated services.

## Technical Context

**Language/Version**: TypeScript 5.6  
**Primary Dependencies**: Next.js 15.5 (App Router), React 19, Tailwind CSS 3.4,
`@supabase/supabase-js` 2.x + `@supabase/ssr`, Zod 4, Radix UI (`@radix-ui/react-select`,
`@radix-ui/react-checkbox`), `date-fns` 4, Resend 6  
**Storage**: Supabase (PostgreSQL) — existing `quotes`, `contacts`, `interactions` tables;
no schema changes required  
**Testing**: Manual QA per `quickstart.md`; no automated tests in scope  
**Target Platform**: Web — desktop and mobile browsers  
**Project Type**: Web application (Next.js full-stack)  
**Performance Goals**: Form submission completes in < 3 seconds under normal conditions  
**Constraints**: No database migrations; no new npm dependencies; constitution
compliance mandatory  
**Scale/Scope**: Low-volume public form (< 100 submissions/month); 1 new page component,
2 new services, 1 updated API route, 1 updated type file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Check | Result |
| --------- | ----- | ------ |
| I. Single Responsibility | `QuoteForm` renders only; services handle data/email | ✅ Plan compliant (requires refactor of existing route) |
| II. Open/Closed | Service options extended via `SERVICE_OPTIONS` const; event types via `EVENT_TYPES` const — no component forks | ✅ |
| III. Liskov Substitution | `QuoteService.submitQuote()` return type contract enforced by Zod + TypeScript | ✅ |
| IV. Interface Segregation | Separate `QuoteService` (data) and `EmailService` (notifications); narrow interfaces | ✅ |
| V. Dependency Inversion | API route calls services only; no direct `createClient` or `new Resend()` in route or component | ✅ Requires refactor of `src/app/api/quote/route.ts` |
| UX & Brand | Brand tokens (sage, gold, cream), `font-heading`/`font-sans`, `sonner` for toasts, `framer-motion` if animation needed | ✅ |
| Tech Stack | All existing pinned versions; no new dependencies | ✅ |
| Services Mandate | All data access via `src/services/` | ✅ Requires extraction from current route |

**Pre-implementation action required**: The current `src/app/api/quote/route.ts`
violates Principles I and V. A services refactor MUST be the first implementation
task before any UI changes.

## Project Structure

### Documentation (this feature)

```text
specs/001-booking-quote-form/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 decisions
├── data-model.md        # Entity definitions and type contracts
├── quickstart.md        # Validation checklist
├── contracts/
│   └── quote-submission.md   # POST /api/quote contract
└── checklists/
    └── requirements.md       # Spec quality checklist
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (site)/
│   │   └── contact/
│   │       └── page.tsx          # No change needed
│   └── api/
│       └── quote/
│           └── route.ts          # REFACTOR: remove direct SDK calls; call services
├── components/
│   └── sections/
│       └── quote-form.tsx        # ENHANCE: structured event type, service descriptions,
│                                 #          date min constraint, inline validation
├── services/
│   ├── quote-service.ts          # NEW: upsert contact, insert quote, log interaction
│   └── email-service.ts          # NEW: send notification email via Resend
└── types/
    └── booking.ts                # NEW: EventType, ServiceOption const tuples + types
                                  # (QuoteRequest updated to use constrained types)
```

**Structure Decision**: Existing Next.js App Router structure. Services extracted to
`src/services/` per constitution mandate. New shared types in `src/types/booking.ts`.
The existing `src/lib/types.ts` `QuoteRequest` type is updated (or superseded) to use
the new constrained `EventType` and `ServiceOption` types.

## Complexity Tracking

> No constitution violations requiring justification. All deviations from the
> current implementation are corrections toward compliance, not new complexity.

## Phase 0: Research

See [research.md](research.md) — all decisions resolved. Key findings:

- **No new dependencies** required. Native date input with `min` attribute handles
  date constraint. Radix `Select` (already installed) handles event type dropdown.
- **No schema migration** required. Zod enum enforces event type at app layer.
- **Constitution refactor is blocking** — services must be extracted before UI work.

## Phase 1: Design & Contracts

See:

- [data-model.md](data-model.md) — entity fields, TypeScript types, validation rules
- [contracts/quote-submission.md](contracts/quote-submission.md) — POST /api/quote contract
- [quickstart.md](quickstart.md) — end-to-end validation checklist

### Post-Design Constitution Re-check

✅ All principles satisfied by the design. The plan introduces no new complexity,
no additional SDK boundaries, and no prop drilling. The two services have narrow,
single-purpose interfaces.

## Implementation Order

1. **Create `src/types/booking.ts`** — `EVENT_TYPES`, `SERVICE_OPTIONS` const tuples
   and derived `EventType`, `ServiceOption` types. Update `QuoteRequest` in
   `src/lib/types.ts` to reference these constrained types.

2. **Create `src/services/quote-service.ts`** — `submitQuote(payload: QuoteRequest)`:
   upserts Contact, inserts Quote, logs Interaction. Uses service-role Supabase
   client from `src/lib/supabase/`.

3. **Create `src/services/email-service.ts`** — `sendQuoteNotification(payload: QuoteRequest)`:
   sends notification email via Resend.

4. **Refactor `src/app/api/quote/route.ts`** — remove all direct SDK calls; call
   `QuoteService.submitQuote()` and `EmailService.sendQuoteNotification()`.

5. **Enhance `src/components/sections/quote-form.tsx`** — structured event type
   dropdown (Radix Select), service options with descriptions, date `min` attribute,
   inline field validation errors, guest count as number input.
