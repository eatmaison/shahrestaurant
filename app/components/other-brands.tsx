import { relatedSites, relatedSiteUrl, type SiteId } from "./related-sites";

export function OtherBrands({ current, language }: { current: SiteId; language: "nl" | "en" }) {
  const nl = language === "nl";
  const heading = nl ? "Onze websites" : "Our websites";
  const takeawayReady = process.env.NEXT_PUBLIC_SHAH_TO_GO_PENDING !== "1";
  const activeSite = current === "restaurant" ? (takeawayReady ? "takeaway" : "eat") : "restaurant";
  const activeDescription = current === "restaurant"
    ? (nl ? "Afhalen en bezorgen" : "Pickup and delivery")
    : (nl ? "Indiaas dineren en reserveren" : "Indian dining and reservations");
  const olderBrands: SiteId[] = ["tandoor", "eat", "maison"];
  const formerNames = olderBrands.filter(id => id !== current && id !== activeSite);

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">{heading}</p>
      <nav aria-label={heading} className="mt-2 flex min-w-0 flex-col gap-3 break-words text-xs text-slate-600 dark:text-slate-400">
        <a href={relatedSiteUrl(activeSite, language)} className="hover:text-emerald-600 hover:underline dark:hover:text-emerald-400">
          <span className="font-semibold">{relatedSites[activeSite].name}</span>
          <span className="mt-1 block leading-5">{activeDescription}</span>
        </a>
        <ul className="space-y-1">
          {formerNames.map(id => (
            <li key={id}>
              <a href={relatedSiteUrl(id)} className="inline-block py-1 underline-offset-2 hover:text-emerald-600 hover:underline dark:hover:text-emerald-400">
                {relatedSites[id].name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
