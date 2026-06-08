# Research: Microsoft 365 Email Delivery for Quote Notifications

**Feature**: 021-quote-notification-fix | **Date**: 2026-06-07

## Decision: Microsoft Graph API, app-only (client credentials)

Send notification email through Microsoft Graph `POST /v1.0/users/{sender}/sendMail`, authenticating with the OAuth2 client-credentials grant against `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token` (scope `https://graph.microsoft.com/.default`).

### Rationale

- The tenant owner (Shayley) uses Microsoft 365, so mail should originate from her own tenant/mailbox rather than a third party.
- App-only auth is server-to-server: no interactive user sign-in, no refresh-token storage, suitable for a Vercel route handler.
- Implementable with built-in `fetch` — no SDK dependency, keeping the bundle and dependency surface small.

### Alternatives considered

| Option | Why rejected |
|--------|--------------|
| Resend (current) | Owner is on Microsoft 365; mail should send from her tenant. Also the existing integration is the source of the reliability bugs. |
| SMTP `smtp.office365.com` (basic auth) | Microsoft is deprecating basic SMTP AUTH; frequently disabled by tenant policy. Would also add `nodemailer`. |
| SMTP with OAuth2 (XOAUTH2) | More moving parts than Graph for no benefit; still SMTP-transport fragility. |
| Graph delegated (user) auth | Requires interactive sign-in / token refresh; wrong fit for unattended server sends. |
| Azure Communication Services Email | Separate service to provision and bill; unnecessary when the M365 tenant can send directly. |

## Authentication & permissions

- Entra ID (Azure AD) **app registration** in Shayley's tenant.
- **Application** permission `Mail.Send` (Graph), with **admin consent** granted.
- A **client secret** (the "key") — store as `MS_GRAPH_CLIENT_SECRET`.
- A licensed **sender mailbox** to send as (`MS_GRAPH_SENDER`).
- Recommended hardening: an **ApplicationAccessPolicy** (Exchange Online PowerShell) restricting the app so it can only send as the intended mailbox(es), since app-only `Mail.Send` is otherwise tenant-wide.

## Token handling

- Client-credentials tokens are valid ~60–90 min. Cache the token in module memory with an expiry margin to avoid a token request on every send. Quote volume is low, so a single cached token per process is sufficient.

## Environment contract

| Variable | Purpose |
|----------|---------|
| `MS_GRAPH_TENANT_ID` | Entra tenant (directory) ID |
| `MS_GRAPH_CLIENT_ID` | App registration (application/client) ID |
| `MS_GRAPH_CLIENT_SECRET` | Client secret value (the "key" created in Azure) |
| `MS_GRAPH_SENDER` | Mailbox UPN to send *from* (e.g. info@socialspreadnwa.com) |
| `QUOTE_NOTIFICATION_EMAIL` | Owner recipient address for quote notifications |

If the first four are absent, sending is cleanly **skipped** (logged). If `QUOTE_NOTIFICATION_EMAIL` is absent, the quote notification is **skipped** — it is never sent to the requester.
