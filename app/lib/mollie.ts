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
  idempotencyKey?: string;
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
      ...(args.idempotencyKey ? { "Idempotency-Key": args.idempotencyKey } : {}),
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

export async function getMolliePayment(id: string): Promise<{ status: MollieStatus; failureReason?: string; amount: { currency: string; value: string }; metadata: Record<string, unknown> }> {
  const res = await fetch(`${MOLLIE_API}/payments/${id}`, {
    headers: { Authorization: `Bearer ${process.env.MOLLIE_API_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`Mollie get payment failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const details = data.details && typeof data.details === "object" ? data.details : {};
  const failureReason =
    typeof details.failureReason === "string" ? details.failureReason :
    typeof details.failureMessage === "string" ? details.failureMessage :
    typeof details.reason === "string" ? details.reason :
    typeof data.statusReason === "string" ? data.statusReason :
    undefined;
  return { status: data.status, failureReason, amount: data.amount, metadata: data.metadata ?? {} };
}

export async function refundMolliePayment(paymentId: string, bookingId: string, amount: number): Promise<{ id: string; status: string }> {
  const url = `${MOLLIE_API}/payments/${encodeURIComponent(paymentId)}/refunds`;
  const headers = { Authorization: `Bearer ${process.env.MOLLIE_API_KEY}`, "Content-Type": "application/json" };
  const previous = await fetch(url, { headers, cache: "no-store" });
  if (!previous.ok) throw new Error("Unable to check refund status");
  const data = await previous.json() as { _embedded: { refunds: { id: string; status: string; description: string }[] } };
  const description = `Party booking ${bookingId}: no places available`;
  const existing = data._embedded.refunds.find(refund => refund.description === description);
  if (existing) {
    if (["failed", "canceled"].includes(existing.status)) throw new Error("Refund needs administrator attention");
    return existing;
  }
  const response = await fetch(url, {
    method: "POST",
    headers: { ...headers, "Idempotency-Key": bookingId },
    body: JSON.stringify({ amount: { currency: "EUR", value: amount.toFixed(2) }, description }),
  });
  if (!response.ok) throw new Error("Unable to issue party refund; retry required");
  return response.json();
}
