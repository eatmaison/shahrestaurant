import { NextRequest, NextResponse } from "next/server";
import { fulfillPaymentByMollieId } from "../../../lib/serverStore";

// Mollie calls this (production only) with a form-encoded `id=tr_xxx` body.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const id = form.get("id");
    if (typeof id === "string") await fulfillPaymentByMollieId(id);
  } catch (err) {
    console.error("[mollie] webhook fulfillment failed:", err);
    return NextResponse.json({ received: false }, { status: 503 });
  }
  return NextResponse.json({ received: true });
}
