# Tasks: Reliable Quote Request Owner Notification

**Input**: Design documents from `specs/021-quote-notification-fix/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (owner notified), US2 (failure never breaks submission), US3 (observability)

## Phase 1: Infrastructure (shared Graph transport)

- [ ] T001 Add `src/lib/email/env.ts` with `hasGraphMailEnv()` and `getGraphMailConfig()` (tenant/client/secret/sender), mirroring the style of `src/lib/supabase/env.ts`.
- [ ] T002 Add `src/lib/email/graph-client.ts`: `sendGraphMail({ to, subject, text })` that acquires an app-only token (client-credentials) with a module-level token cache, calls Graph `users/{sender}/sendMail`, and returns `SendMailResult = "sent" | "skipped" | "failed"`. Never throws to callers; logs `[email]` outcome lines. Skips (no throw) when `hasGraphMailEnv()` is false.

## Phase 2: Service layer

- [ ] T003 [US1][US2] Refactor `src/services/email-service.ts` `sendQuoteNotification` to compose the message and delegate to `sendGraphMail`. Recipient = `QUOTE_NOTIFICATION_EMAIL` only; if unset, skip (do NOT fall back to `payload.email`). Return the `SendMailResult`.
- [ ] T004 [US1] Migrate `sendTenantInvitationEmail` in the same file to delegate to `sendGraphMail` (recipient is the invitee — legitimate, not a fallback). Remove all Resend usage from the file.
- [ ] T005 Remove the `resend` dependency from `package.json` and delete the import; confirm no other references remain.

## Phase 3: Route resilience & observability

- [ ] T006 [US2][US3] In `src/app/api/quote/route.ts`, ensure the notification call cannot affect the customer response: the success response is returned based on `submitQuote` success; the notification outcome is logged. (Service already swallows errors; route stays defensive.)

## Phase 4: Verification

- [ ] T007 Run `npm run lint` and `npm run build`; fix any issues.
- [ ] T008 Manual/logic verification of the three paths per `quickstart.md` §4 (sent / skipped / failed) — failed and skipped paths must still return submission success.
- [ ] T009 Update `README.md` env section: replace `RESEND_*` with the `MS_GRAPH_*` + `QUOTE_NOTIFICATION_EMAIL` variables.

## Dependencies

- T001, T002 before T003/T004.
- T003/T004 before T005.
- T005 before T007.
