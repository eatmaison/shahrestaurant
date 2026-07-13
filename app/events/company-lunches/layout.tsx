import type { Metadata } from "next";

const url = "/events/company-lunches";

export const metadata: Metadata = {
  title: "Company Lunches & Office Catering Amsterdam — The Maison",
  description:
    "Fresh daily and weekly office lunches delivered across Amsterdam. Elevated corporate lunches, healthy salads, hot mains and dietary options — invoiced monthly, delivered on time.",
  keywords: [
    "company lunches Amsterdam",
    "office catering Amsterdam",
    "bedrijfslunch Amsterdam",
    "lunch bezorgen Amsterdam kantoor",
    "office lunch delivery Amsterdam",
    "corporate lunch Amsterdam",
    "healthy lunch office Amsterdam",
    "weekly lunch catering Amsterdam",
    "meeting lunch Amsterdam",
    "lunch bezorging kantoor Amsterdam Noord",
  ],
  alternates: { canonical: url },
  openGraph: {
    title: "Company Lunches & Office Catering Amsterdam | The Maison",
    description:
      "Weekly delivered office lunches across Amsterdam — refined, wholesome, invoiced monthly.",
    url,
    type: "article",
  },
  twitter: { card: "summary_large_image", title: "Office Lunches Amsterdam — The Maison" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
