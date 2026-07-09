import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "./components/header";
import { Footer } from "./components/footer";
import { CookieConsent } from "./components/CookieConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://eattogo.nl";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Eat to go Amsterdam | Fresh Wraps, Burgers, Pizza & Drinks to go",
    template: "%s | Eat to go Amsterdam",
  },
  description:
    "Eat to go Amsterdam - order fresh wraps, burgers, pizzas and drinks online for fast pickup or delivery. Always freshly prepared at Klaprozenweg 36a, 1032 KL Amsterdam.",
  keywords: [
    "eat to go",
    "eattogo",
    "food Amsterdam",
    "order food Amsterdam",
    "wraps Amsterdam",
    "burgers Amsterdam",
    "pizza Amsterdam",
    "takeaway Amsterdam",
    "food delivery Amsterdam",
    "to go Amsterdam",
    "Klaprozenweg",
  ],
  authors: [{ name: "Eat to go" }],
  alternates: {
    canonical: siteUrl,
    languages: { en: siteUrl, nl: siteUrl },
  },
  openGraph: {
    type: "website",
    locale: "en_NL",
    alternateLocale: "nl_NL",
    url: siteUrl,
    siteName: "Eat to go Amsterdam",
    title: "Eat to go Amsterdam | Fresh Wraps, Burgers, Pizza & Drinks",
    description:
      "Order fresh wraps, burgers, pizzas and drinks online in Amsterdam. Freshly prepared, fast and ready to go.",
    images: [{ url: "/eattogo.png", width: 512, height: 512, alt: "Eat to go Amsterdam" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eat to go Amsterdam | Fresh food to go",
    description: "Order fresh wraps, burgers, pizzas and drinks online in Amsterdam.",
    images: ["/eattogo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: { icon: "/eattogo.png" },
};

const themeScript = `(function(){try{var t=JSON.parse(localStorage.getItem('etg.theme'));if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Eat to go",
  image: `${siteUrl}/eattogo.png`,
  "@id": siteUrl,
  url: siteUrl,
  telephone: "+31 20 341 2995",
  priceRange: "€€",
  servesCuisine: ["Wraps", "Burgers", "Pizza", "Drinks"],
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
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

