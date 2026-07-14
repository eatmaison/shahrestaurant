import type { Metadata } from "next";

const url = "/events/company-lunches";

export const metadata: Metadata = {
  title: "Company Lunches & Office Catering Amsterdam - The Tandoor Company",
  description:
    "Fresh daily and weekly office lunches delivered across Amsterdam. Aromatic Indian lunches, healthy options, hot mains and dietary choices - invoiced monthly, delivered on time.",
  keywords: [
    "company lunches Amsterdam",
    "office catering Amsterdam",
    "Indian lunch Amsterdam",
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
    title: "Company Lunches & Office Catering Amsterdam | The Tandoor Company",
    description:
      "Weekly delivered office lunches across Amsterdam - fresh, aromatic, invoiced monthly.",
    url,
    type: "article",
  },
  twitter: { card: "summary_large_image", title: "Office Lunches Amsterdam - The Tandoor Company" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
