import { NextRequest, NextResponse } from "next/server";
import { approveVipRequest, buyVip, rejectVipRequest, requestVip } from "../../lib/serverStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action as string;

    if (action === "buy") {
      const res = await buyVip(new URL(req.url).origin);
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
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "error" },
      { status: 500 }
    );
  }
}
