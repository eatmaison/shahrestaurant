import type { Metadata } from "next";

const url = "/events/celebrations";

export const metadata: Metadata = {
  title: "Wedding & Celebration Catering Amsterdam - Shah Restaurant",
  description:
    "Wedding receptions, engagement dinners, anniversaries, gala evenings and rehearsal dinners at Shah Restaurant Amsterdam. Refined Indian feasts, warm and unforgettable - up to 100 guests.",
  keywords: [
    "wedding catering Amsterdam",
    "Indian wedding catering Amsterdam",
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
    title: "Wedding & Celebration Catering Amsterdam | Shah Restaurant",
    description:
      "Wedding receptions and gala evenings at Shah Restaurant Amsterdam - refined, warm, unforgettable.",
    url,
    type: "article",
  },
  twitter: { card: "summary_large_image", title: "Wedding Catering Amsterdam - Shah Restaurant" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
