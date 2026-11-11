import Link from "next/link";
import { PUBLIC_PATHS, type PublicPageKey, type SiteLocale } from "../lib/locale";
import { pageLabel, SITE_URL } from "../lib/seo";

export function Breadcrumbs({ page, locale }: { page: Exclude<PublicPageKey, "home">; locale: SiteLocale }) {
  const path = PUBLIC_PATHS[page][locale];
  const label = pageLabel(page, locale);
  const schema = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Shah Restaurant", item: `${SITE_URL}${PUBLIC_PATHS.home[locale]}` },
      { "@type": "ListItem", position: 2, name: label, item: `${SITE_URL}${path}` },
    ],
  };
  return <>
    <nav aria-label={locale === "nl" ? "Kruimelpad" : "Breadcrumb"} className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 text-sm sm:px-6 lg:px-8">
      <Link href={PUBLIC_PATHS.home[locale]} className="inline-flex min-h-12 items-center underline underline-offset-4">Shah Restaurant</Link>
      <span aria-hidden="true">/</span><span aria-current="page">{label}</span>
    </nav>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
  </>;
}
