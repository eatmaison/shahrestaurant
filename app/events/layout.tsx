import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events, Catering & Private Dining Amsterdam",
  description:
    "Host your birthday, wedding, corporate dinner or company lunch with Shah Restaurant Amsterdam. Indian private dining, on-site catering and daily office lunches - up to 100 guests.",
  keywords: [
    "events Amsterdam",
    "Indian catering Amsterdam",
    "private dining Amsterdam",
    "restaurant events Amsterdam",
    "Shah Restaurant events",
    "party venue Amsterdam Noord",
    "catering Amsterdam Noord",
  ],
  alternates: { canonical: "/events" },
  openGraph: {
    title: "Events & Catering | Shah Restaurant Amsterdam",
    description:
      "Weddings, birthdays, corporate dinners and daily office lunches - expertly catered by Shah Restaurant.",
    url: "/events",
    type: "website",
  },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <div className="events-pages">{children}</div>;
}
