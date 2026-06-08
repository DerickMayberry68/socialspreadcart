# Implementation Plan: Reliable Quote Request Owner Notification

**Branch**: `021-quote-notification-fix` | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/021-quote-notification-fix/spec.md`

## Summary

Quote-request owner notifications are unreliable: the send is gated entirely on Resend env vars and fails silently, can be addressed to the customer instead of the owner, and a send error throws after the quote is already persisted. The operator has decided to send through **Microsoft 365 via the Microsoft Graph API using app-only (client-credentials) auth**, removing Resend.

Approach: introduce a single shared Graph email primitive used by both existing email functions (quote notification and tenant invitation), fix the recipient fallback, make sending never throw to the caller, and log a distinct outcome (sent / skipped / failed) for every attempt.

## Technical Context

**Language/Version**: TypeScript 5.6.3, Next.js 15.5 (App Router, Route Handlers), React 19.2
**Primary Dependencies**: Microsoft Graph REST (`/oauth2/v2.0/token` + `/v1.0/users/{sender}/sendMail`) called via built-in `fetch` — **no new npm dependency**. Removes `resend`.
**Storage**: None changed. Quotes/contacts/interactions persistence (`submitQuote`) is untouched.
**Testing**: vitest (`npm test`), `npm run lint`, `npm run build`
**Target Platform**: Vercel (Node server runtime for the route handler)
**Project Type**: Web application (single Next.js app)
**Performance Goals**: Quote submissions are low-volume; per-send token acquisition is acceptable. A lightweight in-memory token cache avoids redundant token calls within a process.
**Constraints**: Notification send MUST NOT block or fail the customer submission; MUST NOT email the requester by default.
**Scale/Scope**: Single-tenant recipient via env for this iteration.

## Constitution / Project-Rule Check

- **DRY / SOLID**: A single `sendGraphMail` primitive is the only place that talks to Graph; both `sendQuoteNotification` and `sendTenantInvitationEmail` delegate to it. No duplicated token/transport logic. PASS.
- **Follow existing style**: Config presence helpers mirror `src/lib/supabase/env.ts` (`hasGraphMailEnv()`); services stay in `src/services`, low-level transport in `src/lib/email`. PASS.
- **Tenant model**: No new tables; no per-tenant data. Single global recipient via env is an explicit, documented deferral (see spec Assumptions). Multi-tenant recipient sourcing recorded as future work. PASS (noted).
- **Spec Kit**: Public-content/quote behavior change is going through the spec flow. PASS.

## Project Structure

### Documentation (this feature)

```text
specs/021-quote-notification-fix/
├── spec.md
├── plan.md              # this file
├── research.md          # provider/auth decision + rejected alternatives
├── quickstart.md        # Azure (Entra) setup + env vars + verification steps
├── checklists/
│   └── requirements.md
└── tasks.md             # produced by the tasks step
```

No `data-model.md` (no schema change) and no `contracts/` (no new external API; the route contract for `POST /api/quote` is unchanged from the caller's perspective).

### Source Code (repository root)

```text
src/
├── lib/
│   ├── email/
│   │   ├── graph-client.ts     # NEW: token acquisition + sendMail over fetch; in-memory token cache
│   │   └── env.ts              # NEW: hasGraphMailEnv(), getGraphMailConfig()
│   └── supabase/env.ts         # existing pattern referenced for style
├── services/
│   └── email-service.ts        # MODIFIED: both senders delegate to graph-client; recipient fix; never throws; returns outcome
└── app/
    └── api/quote/route.ts      # MODIFIED: defensive call + log; submission success independent of notification
```

**Structure Decision**: Low-level Graph transport lives in `src/lib/email` (infrastructure), business email composition stays in `src/services/email-service.ts` (domain). This keeps the service layer free of transport details and makes the Graph client independently testable/reusable.

## Phases

- **Phase 0 — Research**: Confirm Graph app-only over SMTP and over user-delegated auth; document env contract. See `research.md`.
- **Phase 1 — Design**: Define `GraphMailConfig`, `SendMailResult` (`sent | skipped | failed`), and the message shape. Write `quickstart.md` with the exact Entra/Azure steps and env vars for Derick.
- **Phase 2 — Tasks**: Enumerated in `tasks.md`.

## Complexity Tracking

No constitution violations requiring justification.
