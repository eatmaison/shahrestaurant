/**
 * Minimal Mollie REST client (no SDK dependency).
 * Docs: https://docs.mollie.com/reference/v2/payments-api/create-payment
 */
const MOLLIE_API = "https://api.mollie.com/v2";

/** True when a Mollie API key is configured. When false, the site falls back to
 * marking orders paid immediately (useful for local dev without a key). */
export function mollieEnabled(): boolean {
  return !!process.env.MOLLIE_API_KEY;
}

interface CreatePaymentArgs {
  amount: number;
  description: string;
  redirectUrl: string;
  webhookUrl?: string;
  metadata?: Record<string, unknown>;
}

export async function createMolliePayment(
  args: CreatePaymentArgs
): Promise<{ id: string; checkoutUrl: string }> {
  const body: Record<string, unknown> = {
    amount: { currency: "EUR", value: args.amount.toFixed(2) },
    description: args.description,
    redirectUrl: args.redirectUrl,
    metadata: args.metadata ?? {},
  };
  // Mollie rejects non-public webhook URLs (e.g. localhost), so only send it when available.
  if (args.webhookUrl) body.webhookUrl = args.webhookUrl;

  const res = await fetch(`${MOLLIE_API}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MOLLIE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Mollie create payment failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return { id: data.id, checkoutUrl: data._links.checkout.href };
}

export type MollieStatus = "open" | "pending" | "authorized" | "paid" | "canceled" | "expired" | "failed";

export async function getMolliePayment(id: string): Promise<{ status: MollieStatus }> {
  const res = await fetch(`${MOLLIE_API}/payments/${id}`, {
    headers: { Authorization: `Bearer ${process.env.MOLLIE_API_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`Mollie get payment failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return { status: data.status };
}
