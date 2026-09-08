import { NextRequest, NextResponse } from "next/server";

const primaryHosts = new Set(["shahrestaurant.nl", "www.shahrestaurant.nl"]);

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase();

  if (host?.endsWith(".shahrestaurant.nl") && !primaryHosts.has(host)) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "X-Robots-Tag": "noindex" },
    });
  }

  return NextResponse.next();
}