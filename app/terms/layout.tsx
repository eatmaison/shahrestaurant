import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Algemene voorwaarden",
  description: "Lees de voorwaarden voor bestellingen en reserveringen.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Algemene voorwaarden", description: "Lees de voorwaarden voor bestellingen en reserveringen.", url: "/terms" },
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
