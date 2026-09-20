import type { Metadata } from "next";
import PartyExperience from "./PartyExperience";

export const metadata: Metadata = {
  title: "Party / Events",
  description: "Friday Night Party at Shah Restaurant. 2 October 2026, 22:00 to 03:00. Live DJ, your first cocktail included, and only 100 places. Tickets EUR 16.99.",
  alternates: { canonical: "/parties" },
  openGraph: { title: "Friday Night Party | Shah After Hours", description: "Dinner ends. The night begins. 2 October 2026. Your first cocktail is included.", images: [{ url: "/photos/687A0343.jpeg", alt: "The bar at Shah Restaurant" }] },
};

export default function PartiesPage() { return <PartyExperience />; }