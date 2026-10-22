import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacybeleid",
  description: "Lees hoe wij persoonsgegevens verwerken en beschermen.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Privacybeleid", description: "Lees hoe wij persoonsgegevens verwerken en beschermen.", url: "/privacy" },
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
