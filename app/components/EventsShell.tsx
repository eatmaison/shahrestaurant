import type { ReactNode } from "react";
import type { SiteLocale } from "../lib/locale";
import { siteSchema } from "../lib/seo";
import styles from "../events/events.module.css";

/** One stable business graph for each URL locale; route-specific crumbs stay in pages. */
export function EventsShell({ locale, children }: { locale: SiteLocale; children: ReactNode }) {
  return <div className={`events-pages ${styles.pages}`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema(locale)).replace(/</g, "\\u003c") }} />
    {children}
  </div>;
}
