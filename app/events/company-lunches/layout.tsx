import type { Metadata } from "next";

const url = "/events/company-lunches";
const title = "Bedrijfslunches | Shah Restaurant in Amsterdam-Noord";
const description = "Ontdek de bedrijfslunches van Shah Restaurant in Amsterdam-Noord. Bekijk de lunchvormen en menuopties voor uw team en neem contact op over uw wensen.";
const socialImage = "/brand/shah-social-v1.png";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "company lunches Amsterdam",
    "office catering Amsterdam",
    "Indian lunch Amsterdam",
    "bedrijfslunch Amsterdam",
    "lunch bezorgen Amsterdam kantoor",
    "office lunch delivery Amsterdam",
    "corporate lunch Amsterdam",
    "healthy lunch office Amsterdam",
    "weekly lunch catering Amsterdam",
    "meeting lunch Amsterdam",
    "lunch bezorging kantoor Amsterdam Noord",
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
