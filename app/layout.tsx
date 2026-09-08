import type { Metadata, Viewport } from "next";
import { Jost, Cormorant_Garamond } from "next/font/google";
import "./design-system.css";
import { Providers } from "./providers";
import { Header } from "./components/header";
import { Footer } from "./components/footer";
import { CookieConsent } from "./components/CookieConsent";
import { Atmosphere } from "./components/Atmosphere";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = "https://shahrestaurant.nl";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Shah Restaurant Amsterdam | Fine Indian Dining & Tandoori Grill",
    template: "%s | Shah Restaurant Amsterdam",
  },
  description:
    "Shah Restaurant Amsterdam-Noord - refined Indian fine dining with tandoori grills, rich curries, biryani and fresh naan. Reserve your table online or order for delivery and pickup. Klaprozenweg 36a, Amsterdam.",
  keywords: [
    "shah restaurant",
    "shahrestaurant",
    "Indian restaurant Amsterdam",
    "Indiaas restaurant Amsterdam",
    "fine dining Amsterdam",
    "tandoori Amsterdam",
    "curry Amsterdam",
    "biryani Amsterdam",
    "butter chicken Amsterdam",
    "Indian food delivery Amsterdam Noord",
    "restaurant reserveren Amsterdam",
    "Klaprozenweg",
  ],
  authors: [{ name: "Shah Restaurant" }],
  alternates: {
    canonical: siteUrl,
    languages: { en: siteUrl, nl: siteUrl },
  },
  openGraph: {
    type: "website",
    locale: "en_NL",
    alternateLocale: "nl_NL",
    url: siteUrl,
    siteName: "Shah Restaurant Amsterdam",
    title: "Shah Restaurant Amsterdam | Fine Indian Dining & Tandoori Grill",
    description:
      "Refined Indian dining - curries, tandoori grills, biryani and naan, served with understated luxury. Reserve your table or order online at Shah Restaurant, Amsterdam-Noord.",
    images: [{ url: "/shahrestaurant.png", width: 512, height: 512, alt: "Shah Restaurant Amsterdam" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shah Restaurant Amsterdam | Fine Indian Dining",
    description: "Tandoori grills, rich curries and fresh naan in Amsterdam-Noord. Reserve your table or order online.",
    images: ["/shahrestaurant.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: { icon: "/shahrestaurant.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#c49a3a",
};

const themeScript = `(function(){try{var t=JSON.parse(localStorage.getItem('tm.theme'));document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Shah Restaurant",
  image: `${siteUrl}/shahrestaurant.png`,
  "@id": siteUrl,
  url: siteUrl,
  telephone: "+31 20 341 2995",
  email: "info@shahrestaurant.nl",
  priceRange: "€€€",
  servesCuisine: ["Indian", "Tandoori", "Curry", "Biryani"],
  acceptsReservations: "True",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Klaprozenweg 36a",
    postalCode: "1032 KL",
    addressLocality: "Amsterdam",
    addressCountry: "NL",
  },
  geo: { "@type": "GeoCoordinates", latitude: 52.4045, longitude: 4.9009 },
  areaServed: "Amsterdam",
  openingHours: "Tu-Su 17:00-22:30",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" suppressHydrationWarning data-scroll-behavior="smooth" className={`${jost.variable} ${cormorant.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>
          <Header />
          <Atmosphere />
          <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
          <Footer />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}

