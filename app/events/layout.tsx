import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events, Catering & Private Dining Amsterdam",
  description:
    "Host your birthday, wedding, corporate dinner or company lunch with The Tandoor Company Amsterdam. Indian private dining, on-site catering and daily office lunches - up to 100 guests.",
  keywords: [
    "events Amsterdam",
    "Indian catering Amsterdam",
    "private dining Amsterdam",
    "restaurant events Amsterdam",
    "The Tandoor Company events",
    "party venue Amsterdam Noord",
    "catering Amsterdam Noord",
  ],
  alternates: { canonical: "/events" },
  openGraph: {
    title: "Events & Catering | The Tandoor Company Amsterdam",
    description:
      "Weddings, birthdays, corporate dinners and daily office lunches - expertly catered by The Tandoor Company.",
    url: "/events",
    type: "website",
  },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
