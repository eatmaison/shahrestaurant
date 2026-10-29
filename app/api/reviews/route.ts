import { NextRequest, NextResponse } from "next/server";
import { addReservationReview, addReview } from "../../lib/serverStore";
import { reviewSchema } from "../../lib/validation";
export async function POST(req: NextRequest) {
  const parsed = reviewSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalidInput" }, { status: 400 });
  try {
    const data = parsed.data;
    const result = data.reservationId ? await addReservationReview({ reservationId: data.reservationId, rating: data.rating, text: data.text }) : await addReview({ orderId: data.orderId!, rating: data.rating, text: data.text });
    return NextResponse.json(result);
  } catch (error) { console.error("[reviews] request failed", error); return NextResponse.json({ ok: false, error: "temporarilyUnavailable" }, { status: 500 }); }
}
