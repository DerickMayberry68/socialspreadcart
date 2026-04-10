---
description: "Task list for Booking Quote Form implementation"
---

# Tasks: Booking Quote Form

**Input**: Design documents from `specs/001-booking-quote-form/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not requested in spec — no test tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation
and testing. The services refactor (Phase 2) is a hard prerequisite for all UI work.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Shared type definitions that all subsequent phases depend on.

- [x] T001 Create `src/types/booking.ts` with `EVENT_TYPES` and `SERVICE_OPTIONS` const tuples, and `EventType` / `ServiceOption` derived types
- [x] T002 Update `QuoteRequest` type in `src/lib/types.ts` to use `EventType` and `ServiceOption[]` instead of plain `string` and `string[]` (depends on T001)

---

## Phase 2: Foundational — Services Layer (Blocking Prerequisite)

**Purpose**: Extract all data-access and email logic out of the API route into dedicated
services. This is a **constitution compliance fix** required before any UI work.

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

- [x] T00x Create `src/services/quote-service.ts` implementing `submitQuote(payload: QuoteRequest)` that: upserts contact by email to `contacts` table, inserts quote linked to contact into `quotes` table, logs `quote_submitted` interaction to `interactions` table; uses the service-role Supabase client from `src/lib/supabase/`
- [x] T00x Create `src/services/email-service.ts` implementing `sendQuoteNotification(payload: QuoteRequest)` that sends owner notification email via Resend using env vars `RESEND_API_KEY`, `RESEND_FROM`, `QUOTE_NOTIFICATION_EMAIL`
- [x] T00x Refactor `src/app/api/quote/route.ts` to call `QuoteService.submitQuote()` and `EmailService.sendQuoteNotification()` — remove all direct `createClient`, `new Resend()`, and inline Supabase/Resend calls (depends on T003, T004)

**Checkpoint**: Foundation complete — `POST /api/quote` works via services; no SDK calls in the route. All user story work can now begin.

---

## Phase 3: User Story 1 — Complete a Quote Request (Priority: P1) 🎯 MVP

**Goal**: A customer can fill in the structured form and successfully submit a quote
request, receiving a confirmation and creating a quote in the admin panel.

**Independent Test**: Submit a complete quote via the form; confirm the success state
appears and the quote appears in `/admin/quotes` with the correct structured values.

- [x] T00x [US1] Update Zod validation schema in `src/app/api/quote/route.ts` to use `z.enum([...EVENT_TYPES])` for `eventType` and `z.array(z.enum([...SERVICE_OPTIONS])).min(1)` for `services` (depends on T001, T005)
- [x] T00x [P] [US1] Add service descriptions map to `src/lib/site.ts` — a `serviceDescriptions` record mapping each `ServiceOption` to a one-line description (e.g., "Charcuterie Boxes" → "Hand-crafted individual boxes for grazing")
- [x] T00x [US1] Replace the free-text `eventType` `<Input>` in `src/components/sections/quote-form.tsx` with a Radix `<Select>` component populated from `EVENT_TYPES`, labelled "Event Type" (depends on T001)
- [x] T00x [US1] Update `eventDate` field in `src/components/sections/quote-form.tsx` to set `min` attribute to today + 2 days using `date-fns` `addDays` and `format(..., 'yyyy-MM-dd')`, enforcing the 48-hour minimum at render time
- [x] T01x [US1] Enhance the services section in `src/components/sections/quote-form.tsx` to render each service option as a card with its description from `serviceDescriptions`, using the existing card checkbox pattern (depends on T007)
- [x] T01x [US1] Add inline field validation state to `src/components/sections/quote-form.tsx`: track touched/error state per field; show red helper text beneath each required field when empty on blur or on submit attempt; disable the submit button while `submitting` is true to prevent double-submission (depends on T008, T009, T010)

**Checkpoint**: User Story 1 fully functional. Customer can complete and submit a structured quote request end-to-end.

---

## Phase 4: User Story 2 — Receive Booking Confirmation (Priority: P2)

**Goal**: After submission, the customer sees a branded confirmation state with clear
next-steps messaging and the option to submit another request.

**Independent Test**: Submit a test quote; confirm the success card renders with the
brand logo, a confirmation heading, next-steps text, and a working "Submit another
inquiry" button that resets the form.

- [x] T01x [US2] Update the success state in `src/components/sections/quote-form.tsx` to display: the circular brand logo from `public/brand/logos/logo-circle.png` (via `<Logo variant="circle">`), a `CheckCircle2` icon in sage, a `font-heading` heading "Thank you", a paragraph confirming the inquiry was received and that the owner will follow up with availability and a tailored quote, and a "Submit another inquiry" button (depends on T011)

**Checkpoint**: User Story 2 complete. The confirmation experience is fully on-brand.

---

## Phase 5: User Story 3 — Admin Receives Structured Quote Data (Priority: P3)

**Goal**: The admin Quotes list and detail view show the structured event type and
service selections exactly as the customer chose them — not raw free-text.

**Independent Test**: After submitting a test quote with event type "Wedding" and
services "Charcuterie Cart" + "Dirty Soda Cart", the admin detail view at
`/admin/quotes/[id]` shows exactly those values.

- [x] T01x [US3] Verify that `src/app/admin/(shell)/quotes/[id]/page.tsx` displays `quote.event_type` and `quote.services` fields from the database record; if the detail page renders these as raw strings with no transformation, no change is needed — document the verification result as a comment in this task

**Checkpoint**: User Story 3 complete. Admin views structured data as submitted.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, mobile UX check, and constitution compliance audit.

- [x] T01x [P] Verify the form layout is fully usable on a 390px-wide (iPhone) viewport — check that the services card grid stacks to a single column, inputs are full-width, and the submit button is easily tappable
- [x] T01x [P] Run `npm run build` to confirm no TypeScript errors from the updated `QuoteRequest` type propagate to any existing callers (admin pages, API route)
- [x] T01x Run the quickstart.md validation checklist (`specs/001-booking-quote-form/quickstart.md`) end-to-end and confirm all 18 checklist items pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001, T002) — **blocks all user stories**
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 3 (T011) — builds on the same component
- **User Story 3 (Phase 5)**: Depends on Phase 2 completion; independent of US1/US2
- **Polish (Phase 6)**: Depends on all user story phases complete

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: Depends on T011 (the form component must exist before enhancing success state)
- **US3 (P3)**: Can start after Phase 2; independent of US1 and US2

### Within Each User Story

- Types before services (T001 → T003, T004)
- Services before route refactor (T003, T004 → T005)
- Route Zod update after refactor (T005 → T006)
- Service descriptions before service card render (T007 → T010)
- All form field updates before inline validation (T008, T009, T010 → T011)
- Full form before success state (T011 → T012)

### Parallel Opportunities

- T003 and T004 can run in parallel (different files)
- T007 and T008/T009 can run in parallel (T007 is in `site.ts`; T008/T009 are in `quote-form.tsx`)
- T014 and T015 can run in parallel (different concerns)
- US3 (T013) can be worked alongside US1/US2 after Phase 2

---

## Parallel Example: Phase 2

```bash
# Launch in parallel after T001/T002:
Task: "Create src/services/quote-service.ts"       # T003
Task: "Create src/services/email-service.ts"       # T004

# Then sequentially:
Task: "Refactor src/app/api/quote/route.ts"        # T005 (needs T003, T004)
```

## Parallel Example: User Story 1

```bash
# Launch in parallel after T005:
Task: "Add serviceDescriptions to src/lib/site.ts"                        # T007
Task: "Replace eventType Input with Select in src/components/..."          # T008
Task: "Update eventDate min attribute in src/components/..."               # T009

# Then sequentially:
Task: "Enhance services section with descriptions"                         # T010 (needs T007)
Task: "Add inline validation state"                                        # T011 (needs T008, T009, T010)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T005) — **CRITICAL, blocks everything**
3. Complete Phase 3: User Story 1 (T006–T011)
4. **STOP and VALIDATE**: Submit a test quote; confirm admin panel shows structured data
5. Ship if ready

### Incremental Delivery

1. Phase 1 + Phase 2 → Services extracted, route refactored ✅
2. Phase 3 (US1) → Structured form submits successfully → MVP deliverable
3. Phase 4 (US2) → Branded confirmation state → Polish
4. Phase 5 (US3) → Admin data verified → Done
5. Phase 6 → Build passes, mobile verified, quickstart complete → Ship

---

## Notes

- `[P]` tasks have no file conflicts with concurrently running tasks
- `[Story]` label maps each task to its user story for traceability
- No test tasks generated (not requested in spec)
- T013 (US3) may be a no-op if the admin detail page already displays raw field values correctly — verify before writing any code
- Commit after each phase checkpoint
