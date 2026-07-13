import type { Metadata } from "next";

const url = "/events/gallery";

export const metadata: Metadata = {
  title: "Gallery - The Maison Amsterdam | Interior, Dishes & Events",
  description:
    "Explore The Maison Amsterdam in pictures: our elegant dining room, plated dishes, private events, birthdays, weddings and corporate catering setups.",
  keywords: [
    "The Maison gallery",
    "restaurant Amsterdam photos",
    "fine dining photos Amsterdam",
    "event venue Amsterdam pictures",
    "restaurant interior Amsterdam Noord",
    "wedding venue Amsterdam pictures",
  ],
  alternates: { canonical: url },
  openGraph: {
    title: "Gallery | The Maison Amsterdam",
    description:
      "Interior, plated dishes and past events at The Maison Amsterdam - a fine dining restaurant in Amsterdam-Noord.",
    url,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Gallery - The Maison Amsterdam" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
