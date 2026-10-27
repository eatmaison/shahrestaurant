import { NextResponse } from "next/server";
import { bootstrap } from "../../lib/serverStore";

export async function GET() {
  try {
    const data = await bootstrap();
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("[bootstrap] Unable to load site data", err);
    return NextResponse.json(
      { error: "temporarilyUnavailable" },
      { status: 500 }
    );
  }
}
