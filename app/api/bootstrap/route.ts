import { NextRequest, NextResponse } from "next/server";
import { bootstrap } from "../../lib/serverStore";
import { parseAdminDataView } from "../../lib/adminView";

export async function GET(request: NextRequest) {
  try {
    const admin = request.nextUrl.searchParams.get("admin");
    const data = await bootstrap(admin === null ? undefined : parseAdminDataView(admin));
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("[bootstrap] Unable to load site data", err);
    return NextResponse.json(
      { error: "temporarilyUnavailable" },
      { status: 500 }
    );
  }
}
