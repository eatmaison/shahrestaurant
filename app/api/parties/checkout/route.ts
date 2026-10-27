import { NextRequest, NextResponse } from "next/server";
import { beginPartyCheckout, PartyError, partyAdmin } from "../../../lib/partyStore";
import { publicOrigin } from "../../../lib/serverStore";
import { enforceRateLimit } from "../../../lib/rateLimit";

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req,"party:checkout",10,10*60_000);
  if (limited) return limited;
  try {
    await partyAdmin();
    return NextResponse.json(await beginPartyCheckout(await req.json(),publicOrigin(req)));
  } catch (error) {
    return NextResponse.json({ error: error instanceof PartyError ? error.message : "Unable to start checkout" }, { status: error instanceof PartyError ? error.status : 500 });
  }
}
