import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tafel reserveren bij Shah Restaurant Amsterdam-Noord",
  description: "Reserveer online een tafel voor Indiaas eten bij Shah Restaurant aan de Klaprozenweg 36a in Amsterdam-Noord. Dinsdag t/m zondag vanaf 15:00.",
  alternates: { canonical: "/reservations" },
  twitter: { card: "summary_large_image", title: "Tafel reserveren bij Shah Restaurant Amsterdam-Noord", images: ["/shah-social-card.png"] },
  openGraph: {
    title: "Tafel reserveren bij Shah Restaurant Amsterdam-Noord | Shah Restaurant",
    description: "Reserveer online een tafel voor Indiaas eten bij Shah Restaurant aan de Klaprozenweg 36a in Amsterdam-Noord. Dinsdag t/m zondag vanaf 15:00.",
    url: "/reservations",
    type: "website",
    images: [{ url: "/shah-social-card.png", width: 1200, height: 630 }],
  },
};

export default function ReservationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
