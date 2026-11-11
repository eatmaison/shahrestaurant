import type { Metadata } from "next";

const url = "/events/birthdays";
const title = "Verjaardag vieren | Shah Restaurant Amsterdam-Noord";
const description = "Vier uw verjaardag of jubileum bij Shah Restaurant in Amsterdam-Noord. Bekijk de mogelijkheden voor een Indiaas menu en neem contact op over uw wensen.";
const socialImage = "/brand/shah-social-v1.png";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "birthday catering Amsterdam",
    "party catering Amsterdam",
    "Indian birthday party venue Amsterdam",
    "verjaardag catering Amsterdam",
    "private dining Amsterdam birthday",
    "anniversary dinner Amsterdam",
    "kinderfeestje restaurant Amsterdam",
    "milestone birthday Amsterdam",
    "graduation party Amsterdam",
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
