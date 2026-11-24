import { createHash } from "node:crypto";
import { campaignEmail } from "./campaignContacts";

const origin = "https://shahrestaurant.nl";
const escape = (text: string) => text.replace(/[&<>"']/g,c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
export function campaignSender() {
  const sender = process.env.SHAH_CAMPAIGN_FROM;
  return process.env.SHAH_CAMPAIGN_EMAIL_ENABLED === "true" && process.env.RESEND_API_KEY &&
    sender && campaignEmail.safeParse(sender).success && sender.toLowerCase().endsWith("@shahrestaurant.nl") ? sender : null;
}
export async function deliverCampaign(input: { campaign: string; id: string; email: string; token: string; subject: string; body: string }, from: string) {
  const url = origin + "/email/unsubscribe?token=" + encodeURIComponent(input.token);
  const oneClick = origin + "/api/email/unsubscribe?token=" + encodeURIComponent(input.token);
  const footer = "Shah Restaurant\nKlaprozenweg 36a, Amsterdam\nAfmelden / Unsubscribe: " + url;
  const key = createHash("sha256").update(input.campaign + ":" + input.id).digest("hex");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", signal: AbortSignal.timeout(12000),
    headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": "shah-campaign-" + key },
    body: JSON.stringify({
      from: "Shah Restaurant <" + from + ">", to: [input.email], subject: input.subject,
      text: input.body + "\n\n" + footer,
      html: '<div style="white-space:pre-wrap">' + escape(input.body) + '</div><hr><p>Shah Restaurant<br>Klaprozenweg 36a, Amsterdam<br><a href="' + escape(url) + '">Afmelden / Unsubscribe</a></p>',
      headers: { "List-Unsubscribe": "<" + oneClick + ">", "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }),
  });
  if ([401, 402, 403, 429].includes(response.status)) return "deferred" as const;
  if (!response.ok) return response.status >= 500 || response.status === 409 || response.status === 408 ? "uncertain" : "not_sent";
  const result = await response.json() as { id?: unknown };
  return typeof result.id === "string" && result.id ? "accepted" : "uncertain";
}
