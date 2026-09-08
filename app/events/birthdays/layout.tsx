import type { Metadata } from "next";

const url = "/events/birthdays";

export const metadata: Metadata = {
  title: "Birthday & Party Catering Amsterdam - Shah Restaurant",
  description:
    "Celebrate your birthday, anniversary or private party at Shah Restaurant Amsterdam. Personalised Indian menus, warm ambiance, dedicated service and private dining for up to 100 guests.",
  keywords: [
    "birthday catering Amsterdam",
    "party catering Amsterdam",
    "Indian birthday party venue Amsterdam",
    "verjaardag catering Amsterdam",
    "private dining Amsterdam birthday",
    "anniversary dinner Amsterdam",
    "kinderfeestje restaurant Amsterdam",
    "milestone birthday Amsterdam",
    "graduation party Amsterdam",
  ],
  alternates: { canonical: url },
  openGraph: {
    title: "Birthday & Party Catering Amsterdam | Shah Restaurant",
    description:
      "Personalised birthday parties and private celebrations at Shah Restaurant Amsterdam - up to 100 guests.",
    url,
    type: "article",
  },
  twitter: { card: "summary_large_image", title: "Birthday Catering Amsterdam - Shah Restaurant" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
