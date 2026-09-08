import type { Metadata } from "next";

const url = "/events/about";

export const metadata: Metadata = {
  title: "About Shah Restaurant Amsterdam - A Family Story of Indian Cuisine",
  description:
    "Meet the family behind Shah Restaurant Amsterdam: 32+ years of hospitality experience, five-star hotel kitchens in India and a passion for authentic tandoori cooking in Amsterdam-Noord.",
  keywords: [
    "about Shah Restaurant",
    "Indian restaurant Amsterdam Noord",
    "tandoori Klaprozenweg",
    "Indian chef Amsterdam",
    "restaurant story Amsterdam",
    "Shah Restaurant family",
    "authentic Indian restaurant Amsterdam",
  ],
  alternates: { canonical: url },
  openGraph: {
    title: "About Shah Restaurant Amsterdam",
    description:
      "The family story, the kitchen and the passion behind refined Indian cuisine at Shah Restaurant, Amsterdam-Noord.",
    url,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Shah Restaurant Amsterdam",
    description: "The family story behind our authentic Indian restaurant in Amsterdam-Noord.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
