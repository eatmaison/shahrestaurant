import { NextRequest, NextResponse } from "next/server";
import { deleteExpiredOrder, placeOrder, publicOrigin, setInvoiceSent, setOrderPaid, updateOrderStatus } from "../../lib/serverStore";
import { deleteOrderSchema, placeOrderSchema, updateOrderSchema } from "../../lib/validation";
import { enforceRateLimit } from "../../lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    // Rate limit per IP: max 15 order attempts per 10 minutes.
    const limited = enforceRateLimit(req, "orders:place", 15, 10 * 60_000);
    if (limited) return limited;

    const raw = await req.json().catch(() => null);
    const parsed = placeOrderSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalidInput" }, { status: 400 });
    }

    const res = await placeOrder({ ...parsed.data, origin: publicOrigin(req) });
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Rate limit per IP: admin status updates, generous but bounded.
    const limited = enforceRateLimit(req, "orders:update", 120, 10 * 60_000);
    if (limited) return limited;

    const raw = await req.json().catch(() => null);
    const parsed = updateOrderSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalidInput" }, { status: 400 });
    }

    const body = parsed.data;
    if (typeof body.status === "string") await updateOrderStatus(body.id, body.status);
    if (typeof body.paid === "boolean") await setOrderPaid(body.id, body.paid);
    if (typeof body.invoiceSent === "boolean") await setInvoiceSent(body.id, body.invoiceSent);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, "orders:delete", 60, 10 * 60_000);
    if (limited) return limited;

    const raw = await req.json().catch(() => null);
    const parsed = deleteOrderSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalidInput" }, { status: 400 });
    }

    const deleted = await deleteExpiredOrder(parsed.data.id);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "notDeletable" }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "error" },
      { status: 500 }
    );
  }
}
