import { NextRequest, NextResponse } from "next/server";
import { cancelReservation, createReservation, deleteReservation, publicOrigin, setReservationStatus } from "../../lib/serverStore";
import { createReservationSchema, deleteReservationSchema, updateReservationSchema } from "../../lib/validation";
import { enforceRateLimit } from "../../lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    // Rate limit per IP: max 10 reservation attempts per 10 minutes.
    const limited = enforceRateLimit(req, "reservations:create", 10, 10 * 60_000);
    if (limited) return limited;

    const raw = await req.json().catch(() => null);
    const parsed = createReservationSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalidInput" }, { status: 400 });
    }

    const res = await createReservation({ ...parsed.data, origin: publicOrigin(req) });
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
    const limited = enforceRateLimit(req, "reservations:update", 120, 10 * 60_000);
    if (limited) return limited;

    const raw = await req.json().catch(() => null);
    const parsed = updateReservationSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalidInput" }, { status: 400 });
    }

    const { id, action } = parsed.data;
    if (action === "cancel") {
      const res = await cancelReservation(id);
      return NextResponse.json(res);
    }
    await setReservationStatus(id, action === "confirm" ? "confirmed" : action === "arrived" ? "arrived" : action === "no_show" ? "no_show" : "declined");
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
    const limited = enforceRateLimit(req, "reservations:delete", 60, 10 * 60_000);
    if (limited) return limited;

    const raw = await req.json().catch(() => null);
    const parsed = deleteReservationSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalidInput" }, { status: 400 });
    }

    const res = await deleteReservation(parsed.data.id);
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "error" },
      { status: 500 }
    );
  }
}
