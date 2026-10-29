import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fulfillPaymentByRecord } from "../../../lib/serverStore";
export async function GET(req: NextRequest) {
  const reference = z.string().uuid().safeParse(req.nextUrl.searchParams.get("p"));
  if (!reference.success) return NextResponse.json({ status: "not_found" }, { status: 400 });
  try { return NextResponse.json(await fulfillPaymentByRecord(reference.data)); }
  catch (error) { console.error("[payment] verification failed", error); return NextResponse.json({ status: "error" }, { status: 500 }); }
}
