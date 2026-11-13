import { NextRequest, NextResponse } from "next/server";
import { bootstrap } from "../../lib/serverStore";
import { parseAdminDataView } from "../../lib/adminView";

export async function GET(request: NextRequest) {
  try {
    const data = await bootstrap(parseAdminDataView(request.nextUrl.searchParams.get("admin")));
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("[bootstrap] Unable to load site data", err);
    return NextResponse.json(
      { error: "temporarilyUnavailable" },
      { status: 500 }
    );
  }
}
