"use client";

import Link from "./LocaleLink";
import { useLang } from "../providers";
import { localePath } from "../lib/locale";

const labels = {
  "/events": { nl: "Evenementen en catering", en: "Events and catering" },
  "/events/about": { nl: "Over Shah Restaurant", en: "About Shah Restaurant" },
  "/events/gallery": { nl: "Galerij", en: "Gallery" },
  "/events/birthdays": { nl: "Verjaardagen en feesten", en: "Birthdays and parties" },
  "/events/celebrations": { nl: "Bruiloften en vieringen", en: "Weddings and celebrations" },
  "/events/company-catering": { nl: "Bedrijfscatering", en: "Company catering" },
  "/events/company-lunches": { nl: "Bedrijfslunches", en: "Company lunches" },
} as const;

/** The page supplies its route, so sibling navigation cannot retain a parent's breadcrumb. */
export function EventBreadcrumbs({ route }: { route: keyof typeof labels }) {
  const { lang } = useLang();
  const crumbs = [
    { href: localePath("/", lang), label: "Shah Restaurant" },
    ...(route === "/events" ? [] : [{ href: localePath("/events", lang), label: labels["/events"][lang] }]),
    { href: localePath(route, lang), label: labels[route][lang] },
  ];
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem", position: index + 1, name: crumb.label, item: `https://shahrestaurant.nl${crumb.href}`,
    })),
  };
  return <>
    <nav aria-label={lang === "nl" ? "Kruimelpad" : "Breadcrumb"} className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 text-sm sm:px-6 lg:px-8">
      <ol className="flex flex-wrap items-center gap-3">
        {crumbs.map((crumb, index) => <li key={crumb.href} className="flex items-center gap-3">
          {index > 0 && <span aria-hidden="true">/</span>}
          {index === crumbs.length - 1
            ? <span aria-current="page">{crumb.label}</span>
            : <Link href={crumb.href} className="inline-flex min-h-12 items-center underline underline-offset-4">{crumb.label}</Link>}
        </li>)}
      </ol>
    </nav>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
  </>;
}
