import type { Metadata } from "next";

const url = "/events/gallery";

export const metadata: Metadata = {
  title: "Gallery - Shah Restaurant Amsterdam | Interior, Dishes & Events",
  description:
    "Explore Shah Restaurant Amsterdam in pictures: our warm dining room, tandoori dishes, private events, birthdays, weddings and corporate catering setups.",
  keywords: [
    "Shah Restaurant gallery",
    "Indian restaurant Amsterdam photos",
    "tandoori photos Amsterdam",
    "event venue Amsterdam pictures",
    "restaurant interior Amsterdam Noord",
    "wedding venue Amsterdam pictures",
  ],
  alternates: { canonical: url },
  openGraph: {
    title: "Gallery | Shah Restaurant Amsterdam",
    description:
      "Interior, tandoori dishes and past events at Shah Restaurant Amsterdam - a refined Indian restaurant in Amsterdam-Noord.",
    url,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Gallery - Shah Restaurant Amsterdam" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
