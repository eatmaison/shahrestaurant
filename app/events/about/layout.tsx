import type { Metadata } from "next";

const url = "/events/about";
const title = "Over Shah Restaurant | Indiaas eten in Amsterdam-Noord";
const description = "Lees het verhaal van Shah Restaurant in Amsterdam-Noord. Ontdek de Indiase keuken, tandoori gerechten en gastvrijheid en bekijk de sfeer in onze galerij.";
const socialImage = "/brand/shah-social-v1.png";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "about Shah Restaurant",
    "Indian restaurant Amsterdam Noord",
    "tandoori Klaprozenweg",
    "Indian chef Amsterdam",
    "restaurant story Amsterdam",
    "Shah Restaurant family",
    "authentic Indian restaurant Amsterdam",
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
