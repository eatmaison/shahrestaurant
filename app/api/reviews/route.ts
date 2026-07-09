import { NextRequest, NextResponse } from "next/server";
import { addReview } from "../../lib/serverStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await addReview(body);
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "error" },
      { status: 500 }
    );
  }
}
