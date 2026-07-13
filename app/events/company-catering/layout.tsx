import type { Metadata } from "next";

const url = "/events/company-catering";

export const metadata: Metadata = {
  title: "Corporate & Company Catering Amsterdam - The Maison",
  description:
    "Corporate dinners, client receptions, product launches and executive catering in Amsterdam. On-site or at The Maison - monthly invoicing, bespoke menus and full-service events for up to 100 guests.",
  keywords: [
    "corporate catering Amsterdam",
    "company catering Amsterdam",
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
    title: "Corporate & Company Catering Amsterdam | The Maison",
    description:
      "Executive dinners, client receptions and corporate events at The Maison Amsterdam - bespoke, invoiced, unforgettable.",
    url,
    type: "article",
  },
  twitter: { card: "summary_large_image", title: "Corporate Catering Amsterdam - The Maison" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
