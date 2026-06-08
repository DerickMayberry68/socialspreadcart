# Quickstart: Microsoft 365 Quote Notifications

**Feature**: 021-quote-notification-fix

## 1. Create the Entra ID app registration (Azure portal, Shayley's tenant)

1. Entra ID → **App registrations** → **New registration**. Name it e.g. `SocialSpreadCart Mailer`. Single tenant. No redirect URI needed.
2. Copy the **Application (client) ID** and **Directory (tenant) ID** from the Overview page.
3. **Certificates & secrets** → **New client secret** → copy the **Value** immediately (this is the "key").
4. **API permissions** → **Add a permission** → **Microsoft Graph** → **Application permissions** → **Mail.Send** → Add.
5. **Grant admin consent** for the tenant (requires admin). Confirm the status shows granted.

## 2. (Recommended) Restrict which mailbox the app can send as

App-only `Mail.Send` is tenant-wide by default. Scope it with an application access policy (Exchange Online PowerShell):

```powershell
New-ApplicationAccessPolicy -AppId <MS_GRAPH_CLIENT_ID> `
  -PolicyScopeGroupId <sender-mailbox-or-mail-enabled-security-group> `
  -AccessRight RestrictAccess `
  -Description "Restrict SocialSpreadCart mailer to the sender mailbox"
```

## 3. Set environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Example |
|----------|---------|
| `MS_GRAPH_TENANT_ID` | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `MS_GRAPH_CLIENT_ID` | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `MS_GRAPH_CLIENT_SECRET` | (secret value from step 1.3) |
| `MS_GRAPH_SENDER` | `info@socialspreadnwa.com` |
| `QUOTE_NOTIFICATION_EMAIL` | `info@socialspreadnwa.com` (where Shayley wants leads) |

Add to Production (and Preview if you want notifications from preview deploys). Redeploy after saving. Remove the old `RESEND_*` variables.

## 4. Verify

- Submit a quote on the deployed site. Confirm an email arrives at `QUOTE_NOTIFICATION_EMAIL`.
- Check the deployment runtime logs for a single line: `[email] quote notification sent` (or `skipped` / `failed` with reason).
- Failure path: temporarily set a bad secret → submit → confirm the **customer still sees success**, the quote is saved, and the log shows `failed`.

## Local development

Add the same five variables to `.env.local`. With them absent, sends are skipped and submissions still succeed (demo behavior preserved).
