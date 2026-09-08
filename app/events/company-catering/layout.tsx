import type { Metadata } from "next";

const url = "/events/company-catering";

export const metadata: Metadata = {
  title: "Corporate & Company Catering Amsterdam - Shah Restaurant",
  description:
    "Corporate dinners, client receptions, product launches and executive catering in Amsterdam. On-site or at Shah Restaurant - monthly invoicing, bespoke Indian menus and full-service events for up to 100 guests.",
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
    title: "Corporate & Company Catering Amsterdam | Shah Restaurant",
    description:
      "Executive dinners, client receptions and corporate events at Shah Restaurant Amsterdam - bespoke, invoiced, unforgettable.",
    url,
    type: "article",
  },
  twitter: { card: "summary_large_image", title: "Corporate Catering Amsterdam - Shah Restaurant" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
