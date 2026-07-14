import type { Metadata } from "next";

const url = "/events/about";

export const metadata: Metadata = {
  title: "About The Tandoor Company Amsterdam - A Family Story of Indian Cuisine",
  description:
    "Meet the family behind The Tandoor Company Amsterdam: 32+ years of hospitality experience, five-star hotel kitchens in India and a passion for authentic tandoori cooking in Amsterdam-Noord.",
  keywords: [
    "about The Tandoor Company",
    "Indian restaurant Amsterdam Noord",
    "tandoori Klaprozenweg",
    "Indian chef Amsterdam",
    "restaurant story Amsterdam",
    "The Tandoor Company family",
    "authentic Indian restaurant Amsterdam",
  ],
  alternates: { canonical: url },
  openGraph: {
    title: "About The Tandoor Company Amsterdam",
    description:
      "The family story, the kitchen and the passion behind authentic Indian cuisine at The Tandoor Company, Amsterdam-Noord.",
    url,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "About The Tandoor Company Amsterdam",
    description: "The family story behind our authentic Indian restaurant in Amsterdam-Noord.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
