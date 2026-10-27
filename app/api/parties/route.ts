import { NextResponse } from "next/server";
import { listParties, PartyError, partyAdmin } from "../../lib/partyStore";

export async function GET() {
  try {
    await partyAdmin();
    const events = await listParties();
    return NextResponse.json({ events }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof PartyError ? error.message : "Events are temporarily unavailable" }, { status: error instanceof PartyError ? error.status : 503 });
  }
}
