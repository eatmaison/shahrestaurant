import type { Metadata } from "next";

const url = "/events/celebrations";

export const metadata: Metadata = {
  title: "Wedding & Celebration Catering Amsterdam — The Maison",
  description:
    "Wedding receptions, engagement dinners, anniversaries, gala evenings and rehearsal dinners at The Maison Amsterdam. Elegant, elevated and unforgettable — up to 100 guests.",
  keywords: [
    "wedding catering Amsterdam",
    "wedding venue Amsterdam Noord",
    "bruiloft catering Amsterdam",
    "trouwlocatie Amsterdam",
    "engagement dinner Amsterdam",
    "gala evening Amsterdam",
    "reception venue Amsterdam",
    "anniversary Amsterdam restaurant",
    "verlovingsdiner Amsterdam",
    "rehearsal dinner Amsterdam",
  ],
  alternates: { canonical: url },
  openGraph: {
    title: "Wedding & Celebration Catering Amsterdam | The Maison",
    description:
      "Wedding receptions and gala evenings at The Maison Amsterdam — elegant, elevated, unforgettable.",
    url,
    type: "article",
  },
  twitter: { card: "summary_large_image", title: "Wedding Catering Amsterdam — The Maison" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
