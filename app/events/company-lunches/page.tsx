"use client";

import { FaBoxesStacked, FaBreadSlice, FaCalendarDays, FaCarrot, FaCheck, FaClock, FaFileInvoice, FaLeaf, FaMugSaucer, FaSeedling, FaTruck } from "react-icons/fa6";
import { useLang } from "../../providers";
import { EventsContactCta } from "../../components/EventsContactCta";

export default function CompanyLunchesPage() {
  const { lang } = useLang();
  const nl = lang === "nl";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    name: "Shah Restaurant - Company Lunches Amsterdam",
    description: nl
      ? "Vers bezorgde bedrijfslunches in Amsterdam - dagelijkse of wekelijkse levering, maandelijkse facturatie."
      : "Fresh delivered company lunches across Amsterdam - daily or weekly delivery, monthly invoicing.",
    servesCuisine: ["Indian", "Healthy", "Vegan-friendly"],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Klaprozenweg 36a",
      postalCode: "1032 KL",
      addressLocality: "Amsterdam",
      addressCountry: "NL",
    },
    telephone: "+31 20 341 2995",
    areaServed: { "@type": "City", name: "Amsterdam" },
    url: "https://shahrestaurant.nl/events/company-lunches",
    priceRange: "€€€",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Company Lunch Formats",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Daily lunch delivery" }, price: "18", priceCurrency: "EUR" },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Weekly rotating menu" }, price: "22", priceCurrency: "EUR" },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Executive plated lunch" }, price: "35", priceCurrency: "EUR" },
      ],
    },
  };

  const formats = [
    {
      Icon: FaBreadSlice,
      title: nl ? "Standaard lunch" : "Everyday lunch",
      price: nl ? "€20 p.p." : "€20 p.p.",
      description: nl
        ? "Rijke belegde broodjes, verse salades, soep van de dag en fruit. Ideaal voor dagelijkse teamlunches."
        : "Rich filled sandwiches, fresh salads, soup of the day and fruit. Ideal for daily team lunches.",
      features: [
        nl ? "3–5 broodjes per persoon" : "3–5 sandwiches per person",
        nl ? "1 salade + soep" : "1 salad + soup",
        nl ? "Vers fruit inbegrepen" : "Fresh fruit included",
      ],
    },
    {
      Icon: FaCarrot,
      title: nl ? "Gezond & plantaardig" : "Healthy & plant-forward",
      price: nl ? "€24 p.p." : "€24 p.p.",
      description: nl
        ? "Grain bowls, groentenrijke salades, veganistische opties en cold-pressed sappen - voor teams die energiek willen blijven."
        : "Grain bowls, vegetable-forward salads, vegan options and cold-pressed juices - for teams that want to stay sharp.",
      features: [
        nl ? "Volledig vegetarisch/veganistisch mogelijk" : "Fully vegetarian/vegan available",
        nl ? "Glutenvrije en suikervrije opties" : "Gluten-free and no-added-sugar options",
        nl ? "Matcha-, bubble tea- en smoothies" : "Matcha, bubble teas & smoothies",
      ],
    },
    {
      Icon: FaMugSaucer,
      title: nl ? "Meeting lunch" : "Meeting lunch",
      price: nl ? "€38 p.p." : "€38 p.p.",
      description: nl
        ? "Warme en koude opties op één opstelling - inclusief koffiestation en zoetigheid. Perfect voor lange sessies."
        : "Hot and cold options in one setup - including coffee station and sweets. Perfect for longer sessions.",
      features: [
        nl ? "Warme hoofdgangen inbegrepen" : "Hot mains included",
        nl ? "Koffiestation + gebak" : "Coffee station + pastries",
        nl ? "Volledige opstelling en opruiming" : "Full setup and clear-away",
      ],
    },
    {
      Icon: FaLeaf,
      title: nl ? "Executive plated lunch" : "Executive plated lunch",
      price: nl ? "€48 p.p." : "€48 p.p.",
      description: nl
        ? "Verfijnde tweegangen op bord geserveerd door onze staff - voor board meetings, klantvergaderingen of bestuurslunches."
        : "Refined two-course plated lunch served by our staff - for board meetings, client conferences or leadership lunches.",
      features: [
        nl ? "Drie gangen op bord" : "Three-course plated service",
        nl ? "Serveerstaff inbegrepen" : "Service staff included",
        nl ? "Inclusief één glas wijn" : "Includes one glass of wine",
      ],
    },
  ];

  const howItWorks = [
    {
      step: "01",
      Icon: FaCalendarDays,
      title: nl ? "Kies uw ritme" : "Choose your rhythm",
      text: nl
        ? "Dagelijks, 2 dagen per week, wekelijks of maandelijks - u bepaalt het schema. Pauzeren tijdens vakanties is standaard."
        : "Daily, twice a week, weekly or monthly - you set the schedule. Pausing during holidays is standard.",
    },
    {
      step: "02",
      Icon: FaSeedling,
      title: nl ? "Wij ontwerpen het menu" : "We design the menu",
      text: nl
        ? "Onze chef stelt een roterend menu samen dat rekening houdt met seizoen, dieetwensen en variatie voor uw team."
        : "Our chef designs a rotating menu that accounts for season, dietary needs and variety for your team.",
    },
    {
      step: "03",
      Icon: FaTruck,
      title: nl ? "Vers bezorgd - op tijd" : "Delivered fresh - on time",
      text: nl
        ? "Elke dag rond 11:45 (of eerder op verzoek) staat de lunch klaar in uw pantry - koel, gedecoreerd en dienklaar."
        : "Every day around 11:45 (earlier on request) your lunch is set in your pantry - chilled, styled and ready to serve.",
    },
    {
      step: "04",
      Icon: FaFileInvoice,
      title: nl ? "Één factuur per maand" : "One invoice per month",
      text: nl
        ? "Al uw lunches worden verzameld in één maandelijkse factuur met btw-detail - geen bonnetjes verzamelen."
        : "All your lunches are consolidated into one monthly invoice with VAT details - no receipt chasing.",
    },
  ];

  const inclusions = [
    nl ? "Wekelijks roterend menu op maat" : "Weekly rotating menu built for you",
    nl ? "Vegetarische, veganistische, glutenvrije en halal-varianten" : "Vegetarian, vegan, gluten-free and halal variants",
    nl ? "Geleverd in gestylde biologisch afbreekbare verpakking" : "Delivered in styled biodegradable packaging",
    nl ? "Volledige opstelling en opruiming (bij plated lunches)" : "Full setup and clear-away (plated lunches)",
    nl ? "Geen minimum contractduur - maandelijks opzegbaar" : "No minimum contract length - cancel monthly",
    nl ? "Prioritair contact bij ad-hoc bestellingen" : "Priority contact for ad-hoc orders",
    nl ? "Rapportage van teamvoorkeuren en dieetdata" : "Reports on team preferences and dietary data",
    nl ? "Optioneel: espresso-station en versgeperst sap" : "Optional: espresso station and cold-pressed juice",
  ];

  return (
    <div className="overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(217,126,38,0.16),transparent_65%)]" />
        <div className="relative mx-auto max-w-3xl px-4 pb-4 pt-14 text-center sm:px-6 lg:pt-20">
          <span className="lux-overline inline-flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <span className="h-px w-10 bg-emerald-500/60" /> {nl ? "Bedrijfslunches" : "Company lunches"}{" "}
            <span className="h-px w-10 bg-emerald-500/60" />
          </span>
          <h1 className="font-display mt-5 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            {nl
              ? "Bedrijfslunches & kantoor-catering in Amsterdam"
              : "Company lunches & office catering in Amsterdam"}
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
            {nl
              ? "Dagelijkse, wekelijkse of maandelijkse lunches bezorgd bij uw kantoor in Amsterdam. Verfijnd, gezond en aangepast aan het dieet van uw team - met maandelijkse facturatie."
              : "Daily, weekly or monthly lunches delivered to your Amsterdam office. Refined, wholesome and adapted to your team's dietary needs - with monthly invoicing."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[
              { Icon: FaClock, label: nl ? "Aankomst voor 12:00" : "Arrives before 12:00" },
              { Icon: FaBoxesStacked, label: nl ? "Vanaf 10 personen" : "From 10 people" },
              { Icon: FaFileInvoice, label: nl ? "Maandelijkse facturatie" : "Monthly invoicing" },
            ].map(({ Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
              >
                <Icon /> {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Formats */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="lux-overline text-emerald-600 dark:text-emerald-400">{nl ? "Formats" : "Lunch formats"}</span>
          <h2 className="font-display mt-3 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
            {nl ? "Van dagelijkse broodjes tot geplaatste executive lunches" : "From everyday sandwiches to plated executive lunches"}
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {formats.map(({ Icon, title, price, description, features }) => (
            <article
              key={title}
              className="animate-fade-up group flex flex-col rounded-3xl border border-emerald-500/15 bg-white p-7 transition hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-900/10 dark:border-emerald-400/10 dark:bg-white/5"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-lg text-emerald-600 transition group-hover:scale-110 dark:text-emerald-400">
                  <Icon />
                </span>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {price}
                </span>
              </div>
              <h3 className="font-display mt-5 text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{description}</p>
              <ul className="mt-4 space-y-1.5">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                    <FaCheck className="mt-1 shrink-0 text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="lux-overline text-emerald-600 dark:text-emerald-400">{nl ? "Zo werkt het" : "How it works"}</span>
          <h2 className="font-display mt-3 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
            {nl ? "Vier stappen naar betere lunches op kantoor" : "Four steps to better lunches at the office"}
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map(({ step, Icon, title, text }) => (
            <article
              key={step}
              className="animate-fade-up rounded-3xl border border-emerald-500/15 bg-white p-6 dark:border-emerald-400/10 dark:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl font-bold text-emerald-600/40 dark:text-emerald-400/40">{step}</span>
                <span className="grid h-9 w-9 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Icon />
                </span>
              </div>
              <h3 className="font-display mt-3 text-base font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Inclusions */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-950 via-[#241204] to-[#170d04] p-8 text-white shadow-2xl shadow-emerald-900/30 sm:p-10">
          <span className="lux-overline text-emerald-300/90">{nl ? "Inbegrepen" : "What's included"}</span>
          <h2 className="font-display mt-3 text-2xl font-semibold sm:text-3xl">
            {nl ? "Meer dan alleen eten" : "More than just food"}
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {inclusions.map((item) => (
              <p key={item} className="flex items-start gap-2 text-sm leading-7 text-stone-200">
                <FaCheck className="mt-1 shrink-0 text-emerald-300" /> {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Ideal for */}
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-center text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
          {nl ? "Ideaal voor" : "Ideal for"}
        </p>
        <p className="mt-3 text-center text-sm leading-7 text-slate-600 dark:text-slate-400">
          {nl
            ? "Amsterdamse tech- en scale-up teams · advocaten- en accountantskantoren · start-up hubs · coworking spaces · consultancies · agencies · onderzoeksteams · scholen en onderwijsinstellingen"
            : "Amsterdam tech and scale-up teams · law and accounting firms · start-up hubs · coworking spaces · consultancies · agencies · research teams · schools and education institutes"}
        </p>
      </section>

      <EventsContactCta />
    </div>
  );
}
