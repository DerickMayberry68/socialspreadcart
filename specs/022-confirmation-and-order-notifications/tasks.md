# Tasks: Customer Quote Confirmation + Order-Created Notification

- [x] T001 Add `replyTo` support to `src/lib/email/mailer.ts`.
- [x] T002 Add `sendQuoteConfirmation()` and `sendOrderNotification()` to `src/services/email-service.ts`.
- [x] T003 Call `sendQuoteConfirmation()` (best-effort, logged) in `src/app/api/quote/route.ts`.
- [x] T004 Call `sendOrderNotification()` at order creation in `OrderService.createCheckout` (both pickup and delivery branches).
- [ ] T005 Type-check (`tsc --noEmit`) and lint.
- [ ] T006 Deploy + manual test: submit a quote (customer gets confirmation, owner gets notification); place an order (owner gets order notification).
