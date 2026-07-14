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

const siteUrl = "https://thetandoorcompany.nl";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "The Tandoor Company Amsterdam | Authentic Indian Restaurant & Tandoori Grill",
    template: "%s | The Tandoor Company Amsterdam",
  },
  description:
    "The Tandoor Company Amsterdam-Noord - authentic Indian cuisine with tandoori grills, rich curries, biryani and fresh naan. Reserve your table online or order for delivery and pickup. Klaprozenweg 36a, Amsterdam.",
  keywords: [
    "the tandoor company",
    "thetandoorcompany",
    "Indian restaurant Amsterdam",
    "Indiaas restaurant Amsterdam",
    "tandoori Amsterdam",
    "curry Amsterdam",
    "biryani Amsterdam",
    "butter chicken Amsterdam",
    "Indian food delivery Amsterdam Noord",
    "restaurant reserveren Amsterdam",
    "Klaprozenweg",
  ],
  authors: [{ name: "The Tandoor Company" }],
  alternates: {
    canonical: siteUrl,
    languages: { en: siteUrl, nl: siteUrl },
  },
  openGraph: {
    type: "website",
    locale: "en_NL",
    alternateLocale: "nl_NL",
    url: siteUrl,
    siteName: "The Tandoor Company Amsterdam",
    title: "The Tandoor Company Amsterdam | Authentic Indian Cuisine & Tandoori Grill",
    description:
      "Authentic Indian flavours from a traditional tandoor - curries, grills, biryani and naan. Reserve your table or order online at The Tandoor Company, Amsterdam-Noord.",
    images: [{ url: "/tandoorcompany.png", width: 512, height: 512, alt: "The Tandoor Company Amsterdam" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Tandoor Company Amsterdam | Authentic Indian Restaurant",
    description: "Tandoori grills, rich curries and fresh naan in Amsterdam-Noord. Reserve your table or order online.",
    images: ["/tandoorcompany.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: { icon: "/tandoorcompany.png" },
};

// Warm ember dark is the house default; users can opt into light mode.
const themeScript = `(function(){try{var t=JSON.parse(localStorage.getItem('tm.theme'));if(t!=='light'){document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "The Tandoor Company",
  image: `${siteUrl}/tandoorcompany.png`,
  "@id": siteUrl,
  url: siteUrl,
  telephone: "+31 20 341 2995",
  email: "info@thetandoorcompany.nl",
  priceRange: "€€",
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
    <html lang="nl" suppressHydrationWarning data-scroll-behavior="smooth" className={`${manrope.variable} ${playfair.variable} h-full antialiased`}>
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

