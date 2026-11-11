import type { Metadata } from "next";
import { siteSchema } from "../lib/seo";

const url = "/events";
const title = "Evenementen en catering | Shah Restaurant Amsterdam";
const description = "Ontdek de evenementen en catering van Shah Restaurant in Amsterdam-Noord. Bekijk verjaardagen, bruiloften, bedrijfscatering en lunches en neem contact op.";
const socialImage = "/brand/shah-social-v1.png";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
  title,
  description,
  keywords: [
    "events Amsterdam",
    "Indian catering Amsterdam",
    "private dining Amsterdam",
    "restaurant events Amsterdam",
    "Shah Restaurant events",
    "party venue Amsterdam Noord",
    "catering Amsterdam Noord",
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

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <div className="events-pages">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema("nl")).replace(/</g, "\\u003c") }} />
    {children}
  </div>;
}
