import { NextRequest, NextResponse } from "next/server";
import { getPartyBooking, PartyError } from "../../../lib/partyStore";
import { enforceRateLimit } from "../../../lib/rateLimit";

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req,"party:booking",90,10*60_000);
  if (limited) return limited;
  try {
    const token = req.headers.get("Authorization")?.replace(/^Bearer /,"") ?? "";
    return NextResponse.json({ booking: await getPartyBooking(token) }, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof PartyError ? error.message : "Unable to retrieve booking" }, { status: error instanceof PartyError ? error.status : 503 });
  }
}