import type { Metadata, Viewport } from "next";
import { Jost, Cormorant_Garamond } from "next/font/google";
import "./design-system.css";
import "./optimizations.css";
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
    default: "Indiaas restaurant Amsterdam-Noord | Shah Restaurant",
    template: "%s | Shah Restaurant Amsterdam",
  },
  description:
    "Reserveer een tafel bij Shah Restaurant aan de Klaprozenweg 36a in Amsterdam-Noord. Indiase gerechten, tandoori, curry en verse naan. Dinsdag t/m zondag vanaf 15:00.",
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
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    alternateLocale: "en_GB",
    url: "./",
    siteName: "Shah Restaurant Amsterdam",
    title: "Indiaas restaurant Amsterdam-Noord | Shah Restaurant",
    description:
      "Reserveer online een tafel bij Shah Restaurant in Amsterdam-Noord. Indiase gerechten, tandoori en curry aan de Klaprozenweg 36a.",
    images: [{ url: "/shah-social-card.png", width: 1200, height: 630, alt: "Shah Restaurant — Indiaas eten in Amsterdam-Noord" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Indiaas restaurant Amsterdam-Noord | Shah Restaurant",
    description: "Reserveer een tafel voor Indiaas eten bij Shah Restaurant in Amsterdam-Noord.",
    images: ["/shah-social-card.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: { icon: [{ url: "/shahrestaurant.svg", type: "image/svg+xml" }, { url: "/shahrestaurant.png", sizes: "512x512", type: "image/png" }], apple: { url: "/shah-apple-180.png", sizes: "180x180", type: "image/png" } },
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
  "@id": `${siteUrl}/#restaurant`,
  url: siteUrl,
  telephone: "+31 20 341 2995",
  email: "info@shahrestaurant.nl",
  priceRange: "€€€",
  servesCuisine: ["Indian", "Tandoori", "Curry", "Biryani"],
  acceptsReservations: true,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Klaprozenweg 36a",
    postalCode: "1032 KL",
    addressLocality: "Amsterdam",
    addressCountry: "NL",
  },
  geo: { "@type": "GeoCoordinates", latitude: 52.4045, longitude: 4.9009 },
  areaServed: "Amsterdam",
  menu: `${siteUrl}/order`,
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "15:00",
    closes: "22:00",
  },
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
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

