import { NextRequest, NextResponse } from "next/server";
import { fulfillPaymentByRecord } from "../../../lib/serverStore";

// Called from the payment return page to reconcile the payment status.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const p = searchParams.get("p");
    if (!p) return NextResponse.json({ status: "not_found" }, { status: 400 });
    const result = await fulfillPaymentByRecord(p);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { status: "error", error: err instanceof Error ? err.message : "error" },
      { status: 500 }
    );
  }
}
