import type { Metadata, Viewport } from "next";
import { Jost, Cormorant_Garamond } from "next/font/google";
import { headers } from "next/headers";
import { getPublicRoute } from "./lib/locale";
import { publicMetadata, SITE_URL, siteSchema } from "./lib/seo";
import "./design-system.css";
import "./optimizations.css";
import "./accessibility.css";
import { CinematicSections } from "./components/CinematicSections";
import { Providers } from "./providers";
import { Header } from "./components/header";
import { Footer } from "./components/footer";
import { CookieConsent } from "./components/CookieConsent";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

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

const themeScript = `(function(){try{var t=JSON.parse(localStorage.getItem('tm.theme'));document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const initialLang = requestHeaders.get("x-shah-locale") === "en" ? "en" : "nl";
  const route = getPublicRoute(requestHeaders.get("x-shah-path") ?? "");
  return (
    <html lang={initialLang} suppressHydrationWarning data-scroll-behavior="smooth" className={`${jost.variable} ${cormorant.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {route && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema(initialLang)).replace(/</g, "\\u003c") }} />}
      </head>
      <body data-cinematic-page={route && route.key !== "home" ? route.key : undefined} className="flex min-h-full flex-col">
        <Providers initialLang={initialLang}>
          <CinematicSections />
          <Header />
          <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
          <Footer />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}

