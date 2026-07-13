import type { Metadata } from "next";

const url = "/events/about";

export const metadata: Metadata = {
  title: "About The Maison Amsterdam - Fine Dining Restaurant Story",
  description:
    "Meet the team behind The Maison Amsterdam: a fine dining restaurant in Amsterdam-Noord where classical European cuisine meets refined seasonal cooking, impeccable service and evening ambiance.",
  keywords: [
    "about The Maison",
    "restaurant Amsterdam Noord",
    "fine dining Klaprozenweg",
    "chef Amsterdam",
    "restaurant story Amsterdam",
    "The Maison team",
    "elegant restaurant Amsterdam",
  ],
  alternates: { canonical: url },
  openGraph: {
    title: "About The Maison Amsterdam",
    description:
      "The story, the team and the philosophy behind fine dining at The Maison, Amsterdam-Noord.",
    url,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "About The Maison Amsterdam",
    description: "The story behind our fine dining restaurant in Amsterdam-Noord.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
