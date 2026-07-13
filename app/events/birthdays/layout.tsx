import type { Metadata } from "next";

const url = "/events/birthdays";

export const metadata: Metadata = {
  title: "Birthday & Party Catering Amsterdam — The Maison",
  description:
    "Celebrate your birthday, anniversary or private party at The Maison Amsterdam. Personalised menus, candlelit ambiance, dedicated service and private dining for up to 100 guests.",
  keywords: [
    "birthday catering Amsterdam",
    "party catering Amsterdam",
    "birthday party venue Amsterdam",
    "verjaardag catering Amsterdam",
    "private dining Amsterdam birthday",
    "anniversary dinner Amsterdam",
    "kinderfeestje restaurant Amsterdam",
    "milestone birthday Amsterdam",
    "graduation party Amsterdam",
  ],
  alternates: { canonical: url },
  openGraph: {
    title: "Birthday & Party Catering Amsterdam | The Maison",
    description:
      "Personalised birthday parties and private celebrations at The Maison Amsterdam — up to 100 guests.",
    url,
    type: "article",
  },
  twitter: { card: "summary_large_image", title: "Birthday Catering Amsterdam — The Maison" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
