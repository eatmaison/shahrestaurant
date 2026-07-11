import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "./components/header";
import { Footer } from "./components/footer";
import { CookieConsent } from "./components/CookieConsent";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const siteUrl = "https://themaison.nl";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "The Maison Amsterdam | Fine Dining Restaurant & Table Reservations",
    template: "%s | The Maison Amsterdam",
  },
  description:
    "The Maison Amsterdam - fine dining where luxury, ambiance and gastronomy meet. Reserve your table online or order refined dishes for delivery. Klaprozenweg 36a, Amsterdam.",
  keywords: [
    "the maison",
    "themaison",
    "fine dining Amsterdam",
    "luxury restaurant Amsterdam",
    "restaurant reserveren Amsterdam",
    "table reservation Amsterdam",
    "romantic dinner Amsterdam",
    "business dinner Amsterdam",
    "gourmet Amsterdam",
    "Klaprozenweg",
  ],
  authors: [{ name: "The Maison" }],
  alternates: {
    canonical: siteUrl,
    languages: { en: siteUrl, nl: siteUrl },
  },
  openGraph: {
    type: "website",
    locale: "en_NL",
    alternateLocale: "nl_NL",
    url: siteUrl,
    siteName: "The Maison Amsterdam",
    title: "The Maison Amsterdam | Fine Dining & Table Reservations",
    description:
      "Fine dining with a timeless, elegant atmosphere. Reserve your table at The Maison Amsterdam - where service, style and culinary refinement come together.",
    images: [{ url: "/themaison.png", width: 512, height: 512, alt: "The Maison Amsterdam" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Maison Amsterdam | Fine Dining Restaurant",
    description: "Reserve your table at The Maison - fine dining with a timeless, elegant atmosphere in Amsterdam.",
    images: ["/themaison.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: { icon: "/themaison.png" },
};

// Dark is the house default - The Maison is an evening restaurant.
const themeScript = `(function(){try{var t=JSON.parse(localStorage.getItem('tm.theme'));if(t!=='light'){document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "The Maison",
  image: `${siteUrl}/themaison.png`,
  "@id": siteUrl,
  url: siteUrl,
  telephone: "+31 20 341 2995",
  priceRange: "€€€",
  servesCuisine: ["Fine Dining", "European", "Grill"],
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
  openingHours: "Tu-Su 14:00-20:00",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${manrope.variable} ${playfair.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}

