import { NextRequest, NextResponse } from "next/server";
import { hasEventAdminAccess } from "./app/lib/eventAccess";
import { getPublicRoute } from "./app/lib/locale";

const primaryHosts = new Set(["shahrestaurant.nl", "www.shahrestaurant.nl"]);

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase();
  const pathname = request.nextUrl.pathname;
  if (host?.endsWith(".shahrestaurant.nl") && !primaryHosts.has(host)) {
    return new NextResponse("Not Found", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
  }

  const route = getPublicRoute(pathname.toLowerCase());
  const canonicalPath = route?.canonical ?? pathname;
  // Host and known legacy-path changes happen together; clone retains the query.
  if (["GET", "HEAD"].includes(request.method) && !pathname.startsWith("/api/") &&
      (host === "www.shahrestaurant.nl" || pathname !== canonicalPath)) {
    const canonical = request.nextUrl.clone();
    canonical.pathname = canonicalPath;
    if (host === "www.shahrestaurant.nl") {
      canonical.hostname = "shahrestaurant.nl"; canonical.port = ""; canonical.protocol = "https:";
    }
    return NextResponse.redirect(canonical, 308);
  }

  const requestHeaders = new Headers(request.headers);
  // Overwrite incoming values: only the real URL chooses render language/path.
  requestHeaders.set("x-shah-locale", route?.locale ?? (pathname === "/en" || pathname.startsWith("/en/") ? "en" : "nl"));
  requestHeaders.set("x-shah-path", pathname);

  const eventPage = ["/events", "/parties"].some(path => pathname === path || pathname.startsWith(`${path}/`));
  const eventApi = pathname === "/api/parties" || pathname.startsWith("/api/parties/");
  // Mollie must still reconcile payments that were started before the section became private.
  if ((eventPage || eventApi) && pathname !== "/api/parties/webhook") {
    const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };
    if (!await hasEventAdminAccess(request.cookies.get("etg_session")?.value)) {
      return eventApi
        ? NextResponse.json({ error: "Administrator access required" }, { status: 403, headers })
        : new NextResponse("Not Found", { status: 404, headers });
    }
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}
