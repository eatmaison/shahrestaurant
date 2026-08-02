import { NextRequest, NextResponse } from "next/server";

const legacyHosts = new Set(["order.thetandoorcompany.nl"]);

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase();

  if (host && legacyHosts.has(host)) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "X-Robots-Tag": "noindex" },
    });
  }

  return NextResponse.next();
}
