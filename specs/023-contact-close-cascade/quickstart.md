# Quickstart: Contact Close → Cascade Close Related Quotes

## Apply the migration

The feature depends on the `close_contact_cascade` Postgres function.

```bash
# local stack
supabase db push        # or: supabase migration up

# or apply 20260608_contact_close_cascade.sql to the target project
```

Until the migration is applied, closing a contact will error (the RPC won't exist).

## Manual verification

1. Open a contact that has 2+ quotes in `new`/`in_progress`/`booked` (Admin → Contacts → a contact with linked quotes).
2. Click **Closed** in the status control.
   - Expect a confirmation dialog stating how many open quotes will also close.
3. **Cancel** → nothing changes (contact and quotes unchanged).
4. **Closed** again → **Confirm**.
   - Contact becomes `closed`; all open quotes for it become `closed`; a toast reports how many quotes were closed.
   - The contact's "Linked quotes" panel shows them closed; the Timeline shows the status-change entries.
5. Close a contact that already has only `closed`/`lost` quotes (or none) → it closes with **no** prompt; terminal quotes are untouched.
6. Set a contact to `contacted`/`booked` → no quote is affected.
7. Reopen a closed contact (set to `contacted`) → quotes stay `closed`.

## Automated checks

```bash
npm test        # includes tests/services/contact-service.test.ts cascade cases
npm run lint
```
