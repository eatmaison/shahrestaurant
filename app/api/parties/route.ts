import { NextResponse } from "next/server";
import { listParties, PartyError } from "../../lib/partyStore";

export async function GET() {
  try {
    const events = await listParties();
    return NextResponse.json({ events }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof PartyError ? error.message : "Events are temporarily unavailable" }, { status: 503 });
  }
}