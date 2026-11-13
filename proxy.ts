import { NextRequest, NextResponse } from "next/server";
import { hasEventAdminAccess } from "./app/lib/eventAccess";
import { getLocalizedRoute } from "./app/lib/locale";

const primaryHosts = new Set(["shahrestaurant.nl", "www.shahrestaurant.nl"]);

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase();
  const pathname = request.nextUrl.pathname;
  if (host?.endsWith(".shahrestaurant.nl") && !primaryHosts.has(host)) {
    return new NextResponse("Not Found", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
  }

  const route = getLocalizedRoute(pathname.toLowerCase());
  const navigation = ["GET", "HEAD"].includes(request.method) && !pathname.startsWith("/api/");
  // Preserve Next's ordinary slash removal for every method, including webhooks.
  const withoutTrailingSlash = pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const canonicalPath = navigation && route ? route.canonical : withoutTrailingSlash;
  // No broad rewrites: only recognized public aliases change case/name. Queries survive.
  const canonicalHost = navigation && host === "www.shahrestaurant.nl";
  if (canonicalHost || pathname !== canonicalPath) {
    // NextURL retains the incoming slash flag when pathname changes.
    const canonical = new URL(request.url);
    canonical.pathname = canonicalPath;
    if (canonicalHost) {
      canonical.hostname = "shahrestaurant.nl"; canonical.port = ""; canonical.protocol = "https:";
    }
    return NextResponse.redirect(canonical, 308);
  }

  const requestHeaders = new Headers(request.headers);
  // Overwrite incoming values: only the real URL chooses render language/path.
  requestHeaders.set("x-shah-locale", route?.locale ?? (pathname === "/en" || pathname.startsWith("/en/") ? "en" : "nl"));
  requestHeaders.set("x-shah-path", pathname);

  // Public /events pages describe catering and dining; only ticketed /parties stay private.
  const partyPage = pathname === "/parties" || pathname.startsWith("/parties/");
  const partyApi = pathname === "/api/parties" || pathname.startsWith("/api/parties/");
  const adminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  // Mollie must still reconcile payments that were started before the section became private.
  if ((partyPage || partyApi || adminPage) && pathname !== "/api/parties/webhook") {
    const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };
    if (!await hasEventAdminAccess(request.cookies.get("etg_session")?.value)) {
      return partyApi
        ? NextResponse.json({ error: "Administrator access required" }, { status: 403, headers })
        : new NextResponse("Not Found", { status: 404, headers });
    }
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}
