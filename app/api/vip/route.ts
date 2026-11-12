import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "../../lib/rateLimit";
import { approveVipRequest, buyVip, publicOrigin, rejectVipRequest, requestVip } from "../../lib/serverStore";

export async function POST(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, "vip:action", 30, 10 * 60_000);
    if (limited) return limited;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ ok: false, error: "invalidInput" }, { status: 400 });
    const action = body.action as string;

    if (action === "buy") {
      const res = await buyVip(publicOrigin(req));
      return NextResponse.json(res);
    }
    if (action === "request") {
      const res = await requestVip(body.image ?? "");
      return NextResponse.json(res);
    }
    if (action === "approve") {
      await approveVipRequest(body.id);
      return NextResponse.json({ ok: true });
    }
    if (action === "reject") {
      await rejectVipRequest(body.id);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: "unknownAction" }, { status: 400 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "temporarilyUnavailable" },
      { status: 500 }
    );
  }
}
