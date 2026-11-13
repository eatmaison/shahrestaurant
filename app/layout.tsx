import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { getLocalizedRoute, getPublicRoute } from "./lib/locale";
import { translations } from "./lib/translations";
import { publicMetadata, SITE_URL, siteSchema } from "./lib/seo";
import "./fonts.css";
import "./design-system.css";
import "./optimizations.css";
import "./accessibility.css";
import "./light-gold.css";
import { CinematicSections } from "./components/CinematicSections";
import { Providers } from "./providers";
import { Header } from "./components/header";
import { Footer } from "./components/footer";
import { CookieConsent } from "./components/CookieConsent";
import { COOKIE_NOTICE_ACK_COOKIE, COOKIE_NOTICE_ACK_HIDE_CSS, cookieNoticeAcknowledgementBootstrap, isCookieNoticeAcknowledged } from "./lib/cookieNotice";
import { INTRO_RETURN_CSS, introSessionBootstrap } from "./lib/introSession";
import { getIntroMedia } from "./lib/introMedia";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const route = getPublicRoute(requestHeaders.get("x-shah-path") ?? "");
  return {
    ...(route ? publicMetadata(route.key, route.locale) : {
      metadataBase: new URL(SITE_URL),
      title: "Shah Restaurant",
      robots: { index: false, follow: false },
    }),
    authors: [{ name: "Shah Restaurant" }],
    icons: { icon: [{ url: "/brand/shah-favicon-v1.svg", type: "image/svg+xml" }, { url: "/brand/shah-icon-512-v1.png", sizes: "512x512", type: "image/png" }], apple: { url: "/brand/shah-apple-180-v1.png", sizes: "180x180", type: "image/png" } },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0D4952",
};

const themeScript = `(function(){try{var t=JSON.parse(localStorage.getItem('tm.theme'));document.documentElement.classList.toggle('dark',t!=='light');}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [requestHeaders, requestCookies] = await Promise.all([headers(), cookies()]);
  const initialAcknowledged = isCookieNoticeAcknowledged(requestCookies.get(COOKIE_NOTICE_ACK_COOKIE)?.value);
  const initialLang = requestHeaders.get("x-shah-locale") === "en" ? "en" : "nl";
  const heroPosters = getIntroMedia(initialLang).posters;
  const route = getPublicRoute(requestHeaders.get("x-shah-path") ?? "");
  // Public URLs carry one complete dictionary as data, rather than executing both
  // languages on every visit. Utility pages keep their in-page language switch.
  const initialDictionaries = getLocalizedRoute(requestHeaders.get("x-shah-path") ?? "")
    ? { [initialLang]: translations[initialLang] }
    : translations;
  const chapterPhoto = route?.key === "menu" ? "shah-table" : route?.key === "reservations" ? "shah-dining" : null;
  return (
    <html lang={initialLang} suppressHydrationWarning data-cookie-notice-ack={initialAcknowledged ? "true" : undefined} data-scroll-behavior="smooth" className="dark h-full antialiased">
      <head>
        {route?.key !== "home" && <>
          <link rel="preload" href="/fonts/jost-latin-235d8f8964bf-v1.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
          <link rel="preload" href="/fonts/cormorant-garamond-latin-5d618c462b7a-v1.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        </>}
        {chapterPhoto && <>
          {/* Match cinematic.css image-set densities and breakpoints exactly. */}
          <link rel="preload" as="image" type="image/avif" href={`/brand/restaurant-photos-v1/${chapterPhoto}-1400.avif`} imageSrcSet={`/brand/restaurant-photos-v1/${chapterPhoto}-640.avif 1x, /brand/restaurant-photos-v1/${chapterPhoto}-1400.avif 2x`} media="(max-width: 600px)" fetchPriority="high" />
          <link rel="preload" as="image" type="image/avif" href={`/brand/restaurant-photos-v1/${chapterPhoto}-1400.avif`} imageSrcSet={`/brand/restaurant-photos-v1/${chapterPhoto}-960.avif 1x, /brand/restaurant-photos-v1/${chapterPhoto}-1400.avif 2x`} media="(600px < width <= 900px)" fetchPriority="high" />
          <link rel="preload" as="image" type="image/avif" href={`/brand/restaurant-photos-v1/${chapterPhoto}-1400.avif`} media="(width > 900px)" fetchPriority="high" />
        </>}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <style>{COOKIE_NOTICE_ACK_HIDE_CSS}</style>
        <script dangerouslySetInnerHTML={{ __html: cookieNoticeAcknowledgementBootstrap() }} />
        {route?.key === "home" && <>
          <style>{INTRO_RETURN_CSS}</style>
          <script dangerouslySetInnerHTML={{ __html: introSessionBootstrap() }} />
          <link rel="preload" as="image" type="image/avif" href={heroPosters.mobile.avifSrc} imageSrcSet={heroPosters.mobile.avifSrcSet} imageSizes="100vw" media="(max-width: 767px)" fetchPriority="high" />
          <link rel="preload" as="image" type="image/avif" href={heroPosters.desktop.avifSrc} imageSrcSet={heroPosters.desktop.avifSrcSet} imageSizes="100vw" media="(min-width: 768px)" fetchPriority="high" />
        </>}
        {route && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema(initialLang)).replace(/</g, "\\u003c") }} />}
      </head>
      <body data-cinematic-page={route && route.key !== "home" ? route.key : undefined} className="flex min-h-full flex-col">
        <Providers initialLang={initialLang} initialDictionaries={initialDictionaries}>
          <CinematicSections />
          <Header />
          <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
          <Footer />
          <CookieConsent initialAcknowledged={initialAcknowledged} />
        </Providers>
      </body>
    </html>
  );
}

