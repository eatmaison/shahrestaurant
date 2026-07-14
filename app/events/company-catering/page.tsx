"use client";

import { FaBriefcase, FaCheck, FaChartLine, FaEarthEurope, FaHandshake, FaPeopleGroup, FaReceipt, FaRocket, FaWineGlass } from "react-icons/fa6";
import { useLang } from "../../providers";
import { EventsContactCta } from "../../components/EventsContactCta";

export default function CompanyCateringPage() {
  const { lang } = useLang();
  const nl = lang === "nl";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: nl ? "Zakelijke catering en bedrijfsdiners" : "Corporate catering and business dinners",
    provider: {
      "@type": "Restaurant",
      name: "The Tandoor Company",
      "@id": "https://thetandoorcompany.nl/#restaurant",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Klaprozenweg 36a",
        postalCode: "1032 KL",
        addressLocality: "Amsterdam",
        addressCountry: "NL",
      },
      telephone: "+31 20 341 2995",
    },
    areaServed: { "@type": "City", name: "Amsterdam" },
    audience: { "@type": "BusinessAudience", audienceType: "Corporate clients and business teams up to 100 attendees" },
    url: "https://thetandoorcompany.nl/events/company-catering",
    description: nl
      ? "Zakelijke diners, klantrecepties, productlanceringen en board-diners in Amsterdam. Maandelijkse facturatie beschikbaar."
      : "Corporate dinners, client receptions, product launches and board dinners in Amsterdam. Monthly invoicing available.",
  };

  const scenarios = [
    {
      Icon: FaHandshake,
      title: nl ? "Klantrecepties" : "Client receptions",
      text: nl
        ? "Onthaal klanten met een verfijnde receptie: welkomstcocktail, canapés en gerichte gesprekken in een discrete setting."
        : "Welcome clients with a refined reception: welcome cocktail, canapés and focused conversations in a discreet setting.",
      capacity: nl ? "20–100 gasten" : "20–100 guests",
    },
    {
      Icon: FaBriefcase,
      title: nl ? "Bestuurs- en directie-diners" : "Board and executive dinners",
      text: nl
        ? "Rustige, discrete diners voor bestuur en directie. Privé-eetzaal, sommelier, en volledige menuvertrouwelijkheid."
        : "Quiet, discreet dinners for board and leadership. Private dining room, sommelier, and full menu confidentiality.",
      capacity: nl ? "4–20 gasten" : "4–20 guests",
    },
    {
      Icon: FaRocket,
      title: nl ? "Productlanceringen" : "Product launches",
      text: nl
        ? "Volledige productie voor productlanceringen: podium, AV, foto/video, styling en catering - één contactpersoon."
        : "Full production for product launches: stage, AV, photo/video, styling and catering - with one dedicated contact.",
      capacity: nl ? "30–100 gasten" : "30–100 guests",
    },
    {
      Icon: FaPeopleGroup,
      title: nl ? "Team- en kwartaalvieringen" : "Team offsites & quarterly celebrations",
      text: nl
        ? "Vier successen als team met een gezamenlijk diner, drankarrangement en optioneel entertainment."
        : "Celebrate wins as a team with a shared dinner, drinks package and optional entertainment.",
      capacity: nl ? "10–80 gasten" : "10–80 guests",
    },
    {
      Icon: FaChartLine,
      title: nl ? "Investor- en fundraising-avonden" : "Investor & fundraising evenings",
      text: nl
        ? "Elegante avonden voor investeerders en donateurs. Presentatie, meergangenmenu en discrete afhandeling."
        : "Elegant evenings for investors and donors. Presentation, multi-course menu and discreet execution.",
      capacity: nl ? "20–100 gasten" : "20–100 guests",
    },
    {
      Icon: FaEarthEurope,
      title: nl ? "Internationale delegaties" : "International delegations",
      text: nl
        ? "Meertalige service, cultureel bewust menu-ontwerp en aandacht voor dieetwensen - ideaal voor internationale gasten."
        : "Multilingual service, culturally aware menu design and dietary attention - ideal for international visitors.",
      capacity: nl ? "6–60 gasten" : "6–60 guests",
    },
  ];

  const benefits = [
    {
      Icon: FaReceipt,
      title: nl ? "Maandelijkse facturatie" : "Monthly invoicing",
      text: nl
        ? "Zakelijke rekening met maandelijkse gebundelde facturen - geen administratieve rompslomp per evenement."
        : "Business account with consolidated monthly invoicing - no per-event administrative overhead.",
    },
    {
      Icon: FaHandshake,
      title: nl ? "Eén contactpersoon" : "Single point of contact",
      text: nl
        ? "Uw eigen event manager coördineert alles: menu, planning, service en na-afwikkeling."
        : "Your own event manager coordinates everything: menu, planning, service and post-event wrap-up.",
    },
    {
      Icon: FaWineGlass,
      title: nl ? "Sommelier en drankarrangement" : "Sommelier and drinks pairing",
      text: nl
        ? "Ontworpen wijnkeuze afgestemd op menu, gasten en doel van het evenement - met optie voor alcoholvrije pairings."
        : "Curated wine pairings matched to the menu, audience and purpose - with alcohol-free pairing options.",
    },
  ];

  const menuOptions = [
    {
      title: nl ? "Zakelijke lunch - 2 gangen" : "Business lunch - 2 courses",
      price: nl ? "vanaf €38 p.p." : "from €38 p.p.",
      description: nl
        ? "Snel, verfijnd en efficiënt - ideaal voor tussenzittingen en werklunches met een aankomstuur binnen 90 minuten."
        : "Quick, refined and efficient - ideal for mid-meeting sessions with a 90-minute in/out target.",
    },
    {
      title: nl ? "Klantreceptie met walking dinner" : "Client reception with walking dinner",
      price: nl ? "vanaf €65 p.p." : "from €65 p.p.",
      description: nl
        ? "Welkomstcocktail plus 6 tot 8 elegante bites, geserveerd al lopend - perfect voor netwerken en gesprekken."
        : "Welcome cocktail plus 6–8 elegant bites served while mingling - perfect for networking and conversation.",
    },
    {
      title: nl ? "Executive dinner - 4 gangen" : "Executive dinner - 4 courses",
      price: nl ? "vanaf €95 p.p." : "from €95 p.p.",
      description: nl
        ? "Klassiek meergangenmenu met wijnarrangement - voor bestuurs- of directie-diners waarbij het gesprek centraal staat."
        : "Classic multi-course menu with wine pairing - for board or leadership dinners where conversation leads.",
    },
    {
      title: nl ? "Gala tastingmenu - 6 gangen" : "Gala tasting menu - 6 courses",
      price: nl ? "vanaf €135 p.p." : "from €135 p.p.",
      description: nl
        ? "Signature tastingmenu, sommelier-pairing, personeelsverhouding 1:8. De hoogste standaard voor cruciale avonden."
        : "Signature tasting menu, sommelier pairing, 1:8 staff-to-guest ratio. Our highest standard for evenings that matter most.",
    },
  ];

  return (
    <div className="overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(217,126,38,0.16),transparent_65%)]" />
        <div className="relative mx-auto max-w-3xl px-4 pb-4 pt-14 text-center sm:px-6 lg:pt-20">
          <span className="lux-overline inline-flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <span className="h-px w-10 bg-emerald-500/60" /> {nl ? "Bedrijfscatering" : "Corporate catering"}{" "}
            <span className="h-px w-10 bg-emerald-500/60" />
          </span>
          <h1 className="font-display mt-5 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            {nl
              ? "Bedrijfscatering"
              : "Corporate catering"}
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
            {nl
              ? "Klantrecepties, board-diners, productlanceringen en team-vieringen - verzorgd bij The Tandoor Company of op uw locatie. Maandelijkse facturatie, één contactpersoon en volledige productie inbegrepen."
              : "Client receptions, board dinners, product launches and team celebrations - hosted at The Tandoor Company or delivered on-site. Monthly invoicing, single point of contact and full production included."}
          </p>
        </div>
      </section>

      {/* Scenarios */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="lux-overline text-emerald-600 dark:text-emerald-400">
            {nl ? "Zakelijke scenario's" : "Business scenarios"}
          </span>
          <h2 className="font-display mt-3 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
            {nl ? "Wij weten wat elke bedrijfsavond nodig heeft" : "We know what every business evening needs"}
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map(({ Icon, title, text, capacity }) => (
            <article
              key={title}
              className="animate-fade-up group flex flex-col rounded-3xl border border-emerald-500/15 bg-white p-7 transition hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-900/10 dark:border-emerald-400/10 dark:bg-white/5"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-lg text-emerald-600 transition group-hover:scale-110 dark:text-emerald-400">
                <Icon />
              </span>
              <h3 className="font-display mt-5 text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-7 text-slate-600 dark:text-slate-400">{text}</p>
              <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                {capacity}
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="lux-overline text-emerald-600 dark:text-emerald-400">{nl ? "Voordelen" : "Corporate benefits"}</span>
          <h2 className="font-display mt-3 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
            {nl ? "Zakelijk verfijnd, administratief simpel" : "Corporate polish, administratively simple"}
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ Icon, title, text }) => (
            <article
              key={title}
              className="animate-fade-up rounded-3xl border border-emerald-500/15 bg-white p-6 dark:border-emerald-400/10 dark:bg-white/5"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Icon />
              </span>
              <h3 className="font-display mt-4 text-base font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Menu options */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-950 via-[#241204] to-[#170d04] p-8 text-white shadow-2xl shadow-emerald-900/30 sm:p-10">
          <span className="lux-overline text-emerald-300/90">{nl ? "Menu-opties" : "Menu formats"}</span>
          <h2 className="font-display mt-3 text-2xl font-semibold sm:text-3xl">
            {nl ? "Formats voor elk doel" : "Formats for every objective"}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {menuOptions.map((m) => (
              <div key={m.title} className="rounded-2xl bg-white/5 p-5 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-base font-bold">{m.title}</h3>
                  <span className="shrink-0 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[0.65rem] font-bold text-emerald-300">
                    {m.price}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-6 text-stone-300">{m.description}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs leading-6 text-stone-400">
            {nl
              ? "Alle menu's kunnen worden aangepast aan vegetarische, veganistische, glutenvrije en halal wensen. Prijzen exclusief btw en dranken tenzij anders vermeld."
              : "All menus can be adapted to vegetarian, vegan, gluten-free and halal requirements. Prices exclude VAT and drinks unless otherwise noted."}
          </p>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-3 rounded-3xl border border-emerald-500/15 bg-white p-6 sm:grid-cols-2 sm:p-8 dark:border-emerald-400/10 dark:bg-white/5">
          {[
            nl ? "Vertrouwd door Amsterdamse tech-, finance- en juridische bedrijven" : "Trusted by Amsterdam tech, finance and legal firms",
            nl ? "NDA en confidentialiteit standaard" : "NDA and confidentiality standard",
            nl ? "Volledige BTW-facturatie en boekhoudkoppeling" : "Full VAT invoicing and bookkeeping integration",
            nl ? "Voertaal Nederlands én Engels" : "Service in Dutch and English",
          ].map((t) => (
            <p key={t} className="flex items-start gap-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <FaCheck className="mt-1 shrink-0 text-emerald-500" /> {t}
            </p>
          ))}
        </div>
      </section>

      <EventsContactCta />
    </div>
  );
}
