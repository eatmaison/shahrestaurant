import { NextRequest, NextResponse } from "next/server";
import { PartyError, reconcilePartyPayment } from "../../../lib/partyStore";

export async function POST(req: NextRequest) {
  try {
    const id = (await req.formData()).get("id");
    if (typeof id !== "string") return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
    await reconcilePartyPayment(id);
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: "Payment processing requires retry" }, { status: error instanceof PartyError ? error.status : 503 });
  }
}