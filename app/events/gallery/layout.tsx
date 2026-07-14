import type { Metadata } from "next";

const url = "/events/gallery";

export const metadata: Metadata = {
  title: "Gallery - The Tandoor Company Amsterdam | Interior, Dishes & Events",
  description:
    "Explore The Tandoor Company Amsterdam in pictures: our warm dining room, tandoori dishes, private events, birthdays, weddings and corporate catering setups.",
  keywords: [
    "The Tandoor Company gallery",
    "Indian restaurant Amsterdam photos",
    "tandoori photos Amsterdam",
    "event venue Amsterdam pictures",
    "restaurant interior Amsterdam Noord",
    "wedding venue Amsterdam pictures",
  ],
  alternates: { canonical: url },
  openGraph: {
    title: "Gallery | The Tandoor Company Amsterdam",
    description:
      "Interior, tandoori dishes and past events at The Tandoor Company Amsterdam - an authentic Indian restaurant in Amsterdam-Noord.",
    url,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Gallery - The Tandoor Company Amsterdam" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
