import nodemailer, { type Transporter } from "nodemailer";

/**
 * Email sending via SMTP (Strato). Configure in .env.local:
 *   SMTP_HOST=smtp.strato.de
 *   SMTP_PORT=465
 *   SMTP_USER=info@eattogo.nl
 *   SMTP_PASS=<mailbox password>
 *   SMTP_FROM="Eat to go <info@eattogo.nl>"
 */
let transporter: Transporter | null = null;

export function emailEnabled(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // 465 = implicit TLS, 587 = STARTTLS
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendMail(opts: { to: string; subject: string; html: string }): Promise<void> {
  if (!emailEnabled()) {
    console.warn(`[email] SMTP not configured — skipped sending "${opts.subject}" to ${opts.to}`);
    return;
  }
  const from = process.env.SMTP_FROM || `Eat to go <${process.env.SMTP_USER}>`;
  await getTransporter().sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html });
}

/* ------------------------------------------------------------------ templates */

const BRAND = {
  green: "#059669",
  greenDark: "#047857",
  ink: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  bg: "#f1f5f9",
};

/** Shared branded email shell. Inline styles only, for wide client support. */
function layout(opts: {
  base: string;
  heading: string;
  intro: string;
  ctaText?: string;
  ctaUrl?: string;
  bodyHtml?: string;
  outro?: string;
}): string {
  const { base, heading, intro, ctaText, ctaUrl, bodyHtml, outro } = opts;
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${BRAND.border};border-radius:20px;overflow:hidden;">
        <!-- header -->
        <tr><td style="background:linear-gradient(135deg,${BRAND.green},${BRAND.greenDark});padding:28px 32px;">
          <div style="font-size:12px;letter-spacing:3px;color:#d1fae5;font-weight:600;text-transform:uppercase;">Amsterdam</div>
          <div style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:1px;">EAT TO GO</div>
        </td></tr>
        <!-- body -->
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:${BRAND.ink};">${heading}</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:24px;color:${BRAND.muted};">${intro}</p>
          ${bodyHtml || ""}
          ${
            ctaText && ctaUrl
              ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;"><tr><td style="border-radius:999px;background:${BRAND.green};">
                  <a href="${ctaUrl}" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${ctaText}</a>
                </td></tr></table>
                <p style="margin:0 0 8px;font-size:12px;line-height:20px;color:${BRAND.muted};">Or copy this link into your browser:<br><a href="${ctaUrl}" style="color:${BRAND.green};word-break:break-all;">${ctaUrl}</a></p>`
              : ""
          }
          ${outro ? `<p style="margin:20px 0 0;font-size:13px;line-height:22px;color:${BRAND.muted};">${outro}</p>` : ""}
        </td></tr>
        <!-- footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid ${BRAND.border};background:#fafafa;">
          <p style="margin:0;font-size:12px;line-height:20px;color:${BRAND.muted};">
            Eat to go — Klaprozenweg 36a, 1032 KL Amsterdam<br>
            <a href="mailto:info@eattogo.nl" style="color:${BRAND.green};">info@eattogo.nl</a> · <a href="${base}" style="color:${BRAND.green};">eattogo.nl</a>
          </p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} Eat to go — Amsterdam. All rights reserved.</p>
    </td></tr>
  </table>
</body></html>`;
}

export function verificationEmail(name: string, url: string, base: string): { subject: string; html: string } {
  return {
    subject: "Confirm your email — Eat to go",
    html: layout({
      base,
      heading: `Welcome, ${name}! 🎉`,
      intro:
        "Thanks for creating your Eat to go account. Please confirm your email address so we can secure your account and send you order updates.",
      ctaText: "Confirm my email",
      ctaUrl: url,
      outro: "This link expires in 48 hours. If you didn't create an account, you can safely ignore this email.",
    }),
  };
}

export function passwordResetEmail(name: string, url: string, base: string): { subject: string; html: string } {
  return {
    subject: "Reset your password — Eat to go",
    html: layout({
      base,
      heading: "Reset your password",
      intro: `Hi ${name}, we received a request to reset your Eat to go password. Click the button below to choose a new one.`,
      ctaText: "Choose a new password",
      ctaUrl: url,
      outro: "This link expires in 1 hour. If you didn't request this, you can ignore this email — your password stays the same.",
    }),
  };
}

export function companyInvoiceEmail(data: {
  base: string;
  companyName: string;
  orderNumber: string;
  createdAt: number;
  address: string;
  postcode: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  total: number;
  btw?: string;
  kvk?: string;
}): { subject: string; html: string } {
  const rows = data.items
    .map(
      (it) =>
        `<tr><td style="padding:6px 0;font-size:14px;color:${BRAND.ink};">${it.qty}× ${it.name}</td><td style="padding:6px 0;font-size:14px;text-align:right;color:${BRAND.ink};">€${(it.price * it.qty).toFixed(2)}</td></tr>`
    )
    .join("");
  const dateStr = new Date(data.createdAt).toLocaleDateString("nl-NL");
  const bodyHtml = `
    <div style="border:1px solid ${BRAND.border};border-radius:14px;padding:18px;margin:0 0 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font-size:13px;color:${BRAND.muted};">Invoice</td><td style="font-size:13px;text-align:right;color:${BRAND.muted};">${data.orderNumber} · ${dateStr}</td></tr>
      </table>
      <p style="margin:10px 0 4px;font-size:14px;font-weight:700;color:${BRAND.ink};">${data.companyName}</p>
      <p style="margin:0 0 2px;font-size:13px;color:${BRAND.muted};">${data.address}, ${data.postcode}</p>
      ${data.btw ? `<p style="margin:0;font-size:13px;color:${BRAND.muted};">BTW: ${data.btw}${data.kvk ? ` · KVK: ${data.kvk}` : ""}</p>` : ""}
      <hr style="border:none;border-top:1px solid ${BRAND.border};margin:14px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
        <tr><td colspan="2" style="border-top:1px solid ${BRAND.border};padding-top:8px;"></td></tr>
        ${data.discount > 0 ? `<tr><td style="font-size:13px;color:${BRAND.muted};">Company discount</td><td style="font-size:13px;text-align:right;color:${BRAND.muted};">−€${data.discount.toFixed(2)}</td></tr>` : ""}
        <tr><td style="font-size:16px;font-weight:800;color:${BRAND.ink};padding-top:6px;">Total</td><td style="font-size:16px;font-weight:800;text-align:right;color:${BRAND.ink};padding-top:6px;">€${data.total.toFixed(2)}</td></tr>
      </table>
    </div>`;
  return {
    subject: `Invoice ${data.orderNumber} — Eat to go`,
    html: layout({
      base: data.base,
      heading: "Your invoice",
      intro: `Thank you for your order, ${data.companyName}. Please find your invoice below. Per our agreement, the amount is due within 7 days of receiving your order.`,
      bodyHtml,
      outro: "Questions about this invoice? Just reply to this email and we'll help you out.",
    }),
  };
}
