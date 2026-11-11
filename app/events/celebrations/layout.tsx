import type { Metadata } from "next";

const url = "/events/celebrations";
const title = "Bruiloften en vieringen | Shah Restaurant Amsterdam";
const description = "Ontdek bruiloften en vieringen bij Shah Restaurant in Amsterdam-Noord. Bekijk de mogelijkheden voor een Indiaas diner en bespreek uw wensen met ons.";
const socialImage = "/brand/shah-social-v1.png";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "wedding catering Amsterdam",
    "Indian wedding catering Amsterdam",
    "wedding venue Amsterdam Noord",
    "bruiloft catering Amsterdam",
    "trouwlocatie Amsterdam",
    "engagement dinner Amsterdam",
    "gala evening Amsterdam",
    "reception venue Amsterdam",
    "anniversary Amsterdam restaurant",
    "verlovingsdiner Amsterdam",
    "rehearsal dinner Amsterdam",
  ],
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    url,
    type: "article",
    siteName: "Shah Restaurant",
    locale: "nl_NL",
    images: [{ url: socialImage, width: 1200, height: 630, alt: "Shah Restaurant in Amsterdam-Noord" }],
  },
  twitter: { card: "summary_large_image", title, description, images: [socialImage] },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
