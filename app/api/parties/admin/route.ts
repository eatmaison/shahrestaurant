import { NextRequest, NextResponse } from "next/server";
import { listParties, listPartyGuests, partyAdmin, PartyError, retryPartyPayments, saveParty } from "../../../lib/partyStore";
import { enforceRateLimit } from "../../../lib/rateLimit";

const failure = (error: unknown) => NextResponse.json({ error: error instanceof PartyError ? error.message : "Unable to process event management request" }, { status: error instanceof PartyError ? error.status : 500 });

export async function GET() {
  try {
    await partyAdmin();
    return NextResponse.json({ events: await listParties(true), bookings: await listPartyGuests() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req,"party:admin",30,60_000);
  if (limited) return limited;
  try {
    await partyAdmin();
    if (req.headers.get("origin") !== new URL(req.url).origin && req.headers.get("origin") !== process.env.APP_URL?.replace(/\/$/,"")) throw new PartyError("Invalid request origin",403);
    if (Number(req.headers.get("content-length") || 0)>3_100_000) throw new PartyError("Image too large",413);
    const text = await req.text();
    if (text.length>3_100_000) throw new PartyError("Image too large",413);
    const body: unknown = JSON.parse(text);
    if (body && typeof body === "object" && "action" in body && body.action === "reconcile") return NextResponse.json(await retryPartyPayments());
    await saveParty(body);
    return NextResponse.json({ ok: true });
  } catch (error) { return failure(error); }
}