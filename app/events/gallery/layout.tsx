import type { Metadata } from "next";

const url = "/events/gallery";
const title = "Galerij Shah Restaurant | Sfeer en gerechten Amsterdam";
const description = "Bekijk de galerij van Shah Restaurant in Amsterdam-Noord: het interieur, gedekte tafels en Indiase gerechten. Ontdek de sfeer en plan uw bezoek.";
const socialImage = "/brand/shah-social-v1.png";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Shah Restaurant gallery",
    "Indian restaurant Amsterdam photos",
    "tandoori photos Amsterdam",
    "event venue Amsterdam pictures",
    "restaurant interior Amsterdam Noord",
    "wedding venue Amsterdam pictures",
  ],
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    url,
    type: "website",
    siteName: "Shah Restaurant",
    locale: "nl_NL",
    images: [{ url: socialImage, width: 1200, height: 630, alt: "Shah Restaurant in Amsterdam-Noord" }],
  },
  twitter: { card: "summary_large_image", title, description, images: [socialImage] },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
