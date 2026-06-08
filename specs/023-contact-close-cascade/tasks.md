# Tasks: Contact Close → Cascade Close Related Quotes

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)
`[P]` = can run in parallel (different files, no ordering dependency).

## Phase 1: Data layer (atomic cascade)

- [ ] **T001** Create migration `supabase/migrations/20260608_contact_close_cascade.sql` defining `close_contact_cascade(p_tenant_id uuid, p_contact_id uuid, p_previous_status text default null) returns integer`: in one transaction, close non-terminal quotes for the contact, log a `status_change` interaction per closed quote, close the contact, log its status change, and return the count of quotes closed. `security invoker`, `search_path = public`. (FR-003, FR-006, FR-008, FR-009)
- [ ] **T002** Apply the migration to the target database (local `supabase db push`, or remote with explicit owner confirmation). (Quickstart)

## Phase 2: Service layer

- [ ] **T003** In `src/services/contact-service.ts`, extend `updateContactStatus`: when `status === "closed"`, call `supabase.rpc("close_contact_cascade", { p_tenant_id, p_contact_id, p_previous_status })`, throw on error, and return the closed-quote count. Keep the existing non-closed path (single update + interaction) unchanged. Adjust the return type to surface the count (additive). (FR-003, FR-005, FR-007, FR-010)

## Phase 3: API surface

- [ ] **T004** In `src/app/api/admin/contacts/[id]/status/route.ts`, include the closed-quote count in the success response (e.g. `{ ok: true, closedQuotes }`) so the UI can report it. Behavior for non-closed statuses unchanged.

## Phase 4: UI confirmation gate

- [ ] **T005** In `src/app/admin/(shell)/contacts/[id]/page.tsx`, compute the count of non-terminal linked quotes and pass it to `ContactStatusSelect` as `openQuotesCount`. (FR-002)
- [ ] **T006** In `src/components/admin/contact-status-select.tsx`, when the chosen status is `closed` **and** `openQuotesCount > 0`, open `ConfirmDialog` stating how many open quotes will also close; only PATCH on confirm. Close directly when `openQuotesCount === 0` or the status is not `closed`. On success of a cascade, show a `sonner` toast reporting the count, then `router.refresh()`. No `window.confirm`. (FR-001, FR-002, FR-004, FR-005)

## Phase 5: Tests & verification

- [ ] **T007** [P] Add `tests/services/contact-service.test.ts`: closing a contact invokes the cascade RPC with the right args; non-closed statuses use the plain update path and never call the RPC. (SC-001, SC-003)
- [ ] **T008** Run `npm run lint` and `npm test`; fix any issues. (SC-001–SC-003)
- [ ] **T009** Manual smoke per [quickstart.md](./quickstart.md): prompt shows count, cancel is a no-op, confirm cascades, no-prompt path, reopen does not reopen quotes.

## Dependencies

- T001 → T002 → T003 → T004 → (T005, T006) → T008/T009.
- T007 depends on T003.
