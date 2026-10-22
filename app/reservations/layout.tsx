import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tafel reserveren bij Shah Restaurant Amsterdam-Noord",
  description: "Reserveer online een tafel voor Indiaas eten bij Shah Restaurant aan de Klaprozenweg 36a in Amsterdam-Noord. Dinsdag t/m zondag vanaf 15:00.",
  alternates: { canonical: "/reservations" },
  openGraph: {
    title: "Tafel reserveren bij Shah Restaurant Amsterdam-Noord | Shah Restaurant",
    description: "Reserveer online een tafel voor Indiaas eten bij Shah Restaurant aan de Klaprozenweg 36a in Amsterdam-Noord. Dinsdag t/m zondag vanaf 15:00.",
    url: "/reservations",
    type: "website",
    images: ["/shahrestaurant.png"],
  },
};

export default function ReservationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
