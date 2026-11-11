import type { Metadata } from "next";

const url = "/events/company-catering";
const title = "Bedrijfscatering | Shah Restaurant in Amsterdam-Noord";
const description = "Bekijk bedrijfscatering van Shah Restaurant in Amsterdam-Noord. Ontdek de mogelijkheden voor zakelijke diners en ontvangsten en bespreek uw wensen.";
const socialImage = "/brand/shah-social-v1.png";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "corporate catering Amsterdam",
    "company catering Amsterdam",
    "Indian catering Amsterdam",
    "bedrijfscatering Amsterdam",
    "zakelijk diner Amsterdam",
    "business dinner Amsterdam",
    "client dinner Amsterdam",
    "corporate event Amsterdam",
    "product launch catering Amsterdam",
    "bedrijfsevent Amsterdam",
    "board dinner Amsterdam",
    "executive catering Amsterdam",
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
