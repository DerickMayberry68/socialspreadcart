const BRAND = {
  name: "The Social Spread Cart",
  tagline: "Northwest Arkansas",
  sage: "#5b733c",
  cream: "#f8f1e3",
  ink: "#171717",
  gold: "#b69152",
  walnut: "#4a2f1d",
  linen: "#faf0db",
  muted: "#6b6256",
  cardBorder: "#e7ddc7",
};

export interface BrandedEmailRow {
  label: string;
  value: string;
  emphasis?: boolean;
}

export interface BrandedEmailOptions {
  /** Hidden inbox-preview line. */
  preheader?: string;
  heading: string;
  intro?: string[];
  rows?: BrandedEmailRow[];
  outro?: string[];
}

function escapeHtml(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Renders a branded, email-client-safe HTML message (inline styles, table
 * layout) plus a matching plain-text version from the same content.
 */
export function renderBrandedEmail(
  opts: BrandedEmailOptions,
): { html: string; text: string } {
  const intro = opts.intro ?? [];
  const outro = opts.outro ?? [];
  const rows = opts.rows ?? [];

  const introHtml = intro
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${BRAND.ink};">${escapeHtml(p)}</p>`,
    )
    .join("");

  const rowsHtml = rows.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:6px 0 2px;">${rows
        .map((r) => {
          const label = `<td style="padding:9px 12px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:${BRAND.muted};vertical-align:top;border-bottom:1px solid ${BRAND.linen};">${escapeHtml(r.label)}</td>`;
          const valStyle = r.emphasis
            ? `font-weight:700;color:${BRAND.walnut};`
            : `color:${BRAND.ink};`;
          const value = `<td style="padding:9px 12px;font-size:15px;line-height:1.5;${valStyle}text-align:right;border-bottom:1px solid ${BRAND.linen};">${escapeHtml(r.value)}</td>`;
          return `<tr>${label}${value}</tr>`;
        })
        .join("")}</table>`
    : "";

  const outroHtml = outro
    .map(
      (p) =>
        `<p style="margin:14px 0 0;font-size:14px;line-height:1.6;color:${BRAND.muted};">${escapeHtml(p)}</p>`,
    )
    .join("");

  const preheader = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.preheader)}</div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.cream};">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${BRAND.cardBorder};border-radius:14px;overflow:hidden;">
<tr><td style="background:${BRAND.sage};padding:26px 28px;text-align:center;">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;letter-spacing:.02em;color:${BRAND.cream};">${escapeHtml(BRAND.name)}</div>
<div style="height:3px;width:54px;background:${BRAND.gold};margin:10px auto 0;border-radius:2px;"></div>
</td></tr>
<tr><td style="padding:28px;font-family:Arial,Helvetica,sans-serif;">
<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:20px;color:${BRAND.walnut};">${escapeHtml(opts.heading)}</h1>
${introHtml}${rowsHtml}${outroHtml}
</td></tr>
<tr><td style="background:${BRAND.linen};padding:16px 28px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${BRAND.muted};">
${escapeHtml(BRAND.name)} &middot; ${escapeHtml(BRAND.tagline)}
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  const text = [
    opts.heading,
    "",
    ...intro,
    ...(rows.length ? ["", ...rows.map((r) => `${r.label}: ${r.value}`)] : []),
    ...(outro.length ? ["", ...outro] : []),
  ].join("\n");

  return { html, text };
}
