"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaArrowRight,
  FaBowlRice,
  FaCalendarCheck,
  FaChevronDown,
  FaClock,
  FaFire,
  FaHeart,
  FaLeaf,
  FaMapLocationDot,
  FaPepperHot,
  FaPhone,
  FaQuoteLeft,
  FaSeedling,
  FaStar,
  FaUserGroup,
  FaUtensils,
} from "react-icons/fa6";
import { useLang, useStore } from "./providers";
import { SITE_ID, getCategoryIcon } from "./lib/data";

/** Animated counter that counts up once it scrolls into view. */
function CountUp({ value, suffix = "", duration = 1400 }: { value: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      queueMicrotask(() => setDisplay(value));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
          setDisplay(Math.round(eased * value));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

/** Curated signature dishes shown first on the homepage (in this order). */
const SIGNATURE_IDS = [
  "tdc-butter-chicken",
  "tdc-tandoori-mixed-grill",
  "tdc-tandoori-lamb-chops",
  "tdc-biryani-lamb",
  "tdc-tandoori-chicken-tikka",
  "tdc-samosa-chaat",
];

/** Static ribbon of house favourites (SSR-stable, no data dependency). */
const MARQUEE_DISHES = [
  "Tandoori Chicken",
  "Butter Chicken",
  "Biryani",
  "Garlic Naan",
  "Paneer Tikka",
  "Tandoori Lamb Chops",
  "Mango Lassi",
  "Samosa Chaat",
  "Seekh Kebab",
  "Tandoori King Prawns",
  "Tikka Masala",
  "Onion Bhaji",
];

/** Deterministic ember particle layout (SSR-safe - no randomness). */
const EMBERS = [
  { left: "8%", delay: "0s", duration: "5.2s" },
  { left: "22%", delay: "1.6s", duration: "6.4s" },
  { left: "38%", delay: "0.8s", duration: "5.8s" },
  { left: "55%", delay: "2.4s", duration: "6.8s" },
  { left: "68%", delay: "0.4s", duration: "5.4s" },
  { left: "82%", delay: "1.9s", duration: "6.1s" },
  { left: "93%", delay: "3.1s", duration: "5.6s" },
];

/**
 * Homepage photo collage - real photography from /public/photos/.
 * Cells in the same row share the same height on lg screens because the
 * aspect ratio denominator (4) is constant: height = 4u for both col-span-7
 * (aspect 7/4) and col-span-5 (aspect 5/4).
 */
const AMBIANCE_PHOTOS = [
  {
    src: "/photos/687A0402.jpeg",
    altEn: "Curry served in a copper pot with sides and spices at The Tandoor Company Amsterdam",
    altNl: "Curry geserveerd in een koperen pan met bijgerechten en kruiden bij The Tandoor Company Amsterdam",
    wide: true,
  },
  {
    src: "/photos/687A0387.jpeg",
    altEn: "Signature cocktail with fresh naan in the background",
    altNl: "Signatuurcocktail met verse naan op de achtergrond",
    wide: false,
  },
  {
    src: "/photos/687A0210.jpeg",
    altEn: "Fresh tandoori chicken with lime, straight from the tandoor",
    altNl: "Verse tandoori kip met limoen, net uit de tandoor",
    wide: false,
  },
  {
    src: "/photos/687A0343.jpeg",
    altEn: "Modern dining room of The Tandoor Company in Amsterdam-Noord",
    altNl: "Moderne eetzaal van The Tandoor Company in Amsterdam-Noord",
    wide: true,
  },
];

export default function Home() {
  const { t, lang } = useLang();
  const { products, reviews, restaurantStatus } = useStore();
  const openNow = restaurantStatus.isOpen;

  // Only reviews written on this website (the database is shared across the
  // restaurant group; each site shows its own guest reviews).
  const siteReviews = useMemo(() => reviews.filter((r) => r.site === SITE_ID), [reviews]);

  // Signature dishes: curated tandoor classics first, then fill with variety
  // across the menu (max 6, one per category where possible).
  const featured = useMemo(() => {
    const tandoorMenu = products.filter((p) => p.brand === "tandoor");
    const pool = tandoorMenu.length > 0 ? tandoorMenu : products;
    const picks: typeof products = [];
    for (const id of SIGNATURE_IDS) {
      const p = pool.find((x) => x.id === id);
      if (p) picks.push(p);
    }
    const seen = new Set(picks.map((p) => p.category));
    for (const p of pool) {
      if (picks.length >= 6) break;
      if (picks.includes(p) || seen.has(p.category)) continue;
      seen.add(p.category);
      picks.push(p);
    }
    for (const p of pool) {
      if (picks.length >= 6) break;
      if (!picks.includes(p)) picks.push(p);
    }
    return picks.slice(0, 6);
  }, [products]);

  const userReviews = useMemo(() => siteReviews.filter((r) => r.text.trim().length > 0).slice(0, 6), [siteReviews]);
  const avgRating = useMemo(
    () => (siteReviews.length > 0 ? siteReviews.reduce((s, r) => s + r.rating, 0) / siteReviews.length : 0),
    [siteReviews]
  );

  // SEO: structured data with real customer reviews and aggregate rating.
  const reviewsJsonLd = useMemo(() => {
    if (siteReviews.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: "The Tandoor Company Amsterdam",
      servesCuisine: ["Indian", "Tandoori", "Curry", "Biryani"],
      address: {
        "@type": "PostalAddress",
        streetAddress: "Klaprozenweg 36a",
        postalCode: "1032 KL",
        addressLocality: "Amsterdam",
        addressCountry: "NL",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: +avgRating.toFixed(1),
        reviewCount: siteReviews.length,
        bestRating: 5,
        worstRating: 1,
      },
      review: userReviews.map((r) => ({
        "@type": "Review",
        author: { "@type": "Person", name: r.userName },
        datePublished: new Date(r.createdAt).toISOString().split("T")[0],
        reviewBody: r.text,
        reviewRating: {
          "@type": "Rating",
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1,
        },
      })),
    };
  }, [siteReviews, userReviews, avgRating]);

  // SEO: product schema for featured items
  const productsJsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: featured.map((p, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        item: {
          "@type": "Product",
          name: p.name,
          description: p.detailedDescription?.en || p.description,
          price: p.price.toString(),
          priceCurrency: "EUR",
          category: p.category,
        },
      })),
    };
  }, [featured]);

  // SEO: Organization schema linking the family of restaurants
  const organizationJsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Amsterdam Restaurant Group",
      description: "Family of Indian, fine dining and casual restaurants in Amsterdam",
      url: "https://thetandoorcompany.nl",
      parentOrganization: {
        "@type": "Organization",
        name: "Amsterdam Restaurant Group",
      },
      subOrganizations: [
        {
          "@type": "LocalBusiness",
          "@id": "https://thetandoorcompany.nl",
          name: "The Tandoor Company",
          url: "https://thetandoorcompany.nl",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Klaprozenweg 36a",
            postalCode: "1032 KL",
            addressLocality: "Amsterdam",
            addressCountry: "NL",
          },
        },
        {
          "@type": "LocalBusiness",
          name: "The Maison",
          url: "https://themaison.nl",
          sameAs: "https://themaison.nl",
          address: {
            "@type": "PostalAddress",
            addressCountry: "NL",
          },
        },
        {
          "@type": "LocalBusiness",
          name: "Eat to go",
          url: "https://eattogo.nl",
          sameAs: "https://eattogo.nl",
          address: {
            "@type": "PostalAddress",
            addressCountry: "NL",
          },
        },
      ],
      sameAs: ["https://themaison.nl", "https://eattogo.nl"],
    };
  }, []);

  const stats = [
    { value: "3+", label: t.home.statYears, icon: FaUtensils },
    { value: "16+", label: t.home.statDishes, icon: FaBowlRice },
    { value: "1500+", label: t.home.statGuests, icon: FaUserGroup },
    { value: siteReviews.length > 0 ? avgRating.toFixed(1) : "4.7", label: t.home.statRating, icon: FaStar },
  ];

  const features = [
    { icon: FaFire, title: t.home.feature1Title, text: t.home.feature1Text },
    { icon: FaLeaf, title: t.home.feature2Title, text: t.home.feature2Text },
    { icon: FaHeart, title: t.home.feature3Title, text: t.home.feature3Text },
  ];

  const storyPoints = [
    { icon: FaUtensils, text: t.home.storyPoint1 },
    { icon: FaBowlRice, text: t.home.storyPoint2 },
    { icon: FaStar, text: t.home.storyPoint3 },
  ];

  const testimonials = [
    { name: "Saira Khan", place: "Den Haag", text: "Fantastische smaken en een warme sfeer. De Butter Chicken was de beste die ik ooit heb gehad. Ik kom zeker terug!" },
    { name: "Jeroen van Dijk", place: "Rotterdam", text: "Heerlijk gegeten! De tandoori gerechten waren perfect gegrild en de service was vriendelijk en snel. Zeker een aanrader!" },
    { name: "Praveer Singh", place: "Purmerend", text: "Authentieke Indiase keuken zoals het hoort - de biryani was geurig, de naan vers uit de oven en het personeel ontzettend gastvrij." },
  ];

  return (
    <div className="page-stage overflow-hidden">
      {/* ============================================================ Hero */}
      <section className="cinematic-hero relative overflow-hidden">
        {/* Warm ember atmosphere */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_18%_0%,rgba(217,126,38,0.18),transparent_60%),radial-gradient(50%_45%_at_92%_12%,rgba(163,78,26,0.16),transparent_62%),radial-gradient(40%_35%_at_60%_100%,rgba(217,126,38,0.10),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 spice-dots opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_20%,#000,transparent)]" />
        {/* Rising embers */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64" aria-hidden>
          {EMBERS.map((e, i) => (
            <span key={i} className="ember" style={{ left: e.left, animationDelay: e.delay, animationDuration: e.duration }} />
          ))}
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-14 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pt-24">
          <div className="animate-fade-up min-w-0">
            <span className="lux-overline inline-flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <span className="ornament-gem" aria-hidden /> {t.home.badge}
            </span>
            <h1 className="font-display mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-[4.2rem]">
              {t.home.heroTitle}{" "}
              <span className="ember-text italic">{t.home.heroTitleAccent}</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
              {t.home.heroSubtitle}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/reservations"
                className="btn-shine group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 bg-[length:200%_auto] px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-right hover:shadow-xl hover:shadow-emerald-500/40"
              >
                <FaCalendarCheck />
                {t.home.heroCtaReserve}
                <FaArrowRight className="transition group-hover:translate-x-1" />
              </Link>
              <Link
                href="/order"
                className="group inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-white/60 px-7 py-4 text-sm font-semibold text-slate-800 backdrop-blur transition hover:-translate-y-0.5 hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-700 dark:bg-white/5 dark:text-slate-200 dark:hover:text-emerald-300"
              >
                <FaPepperHot className="text-emerald-500 transition group-hover:rotate-12 group-hover:scale-110" />
                {t.home.heroCtaMenu}
              </Link>
            </div>

            <dl className="stagger-rise mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((s, i) => {
                const StatIcon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="premium-panel magnetic-card lux-sweep animate-fade-up group rounded-2xl p-4 transition duration-300"
                    style={{ animationDelay: `${0.15 * i + 0.3}s` }}
                  >
                    <dt className="flex items-center gap-2 font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      <StatIcon className="text-sm opacity-60 transition group-hover:scale-125 group-hover:opacity-100" />
                      {s.value}
                    </dt>
                    <dd className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{s.label}</dd>
                  </div>
                );
              })}
            </dl>
          </div>

          {/* Hero card - the glow of the tandoor + tonight's favourites */}
          <div className="animate-fade-up delay-200 relative min-w-0">
            <div className="flame-glow pointer-events-none absolute -inset-10 hidden lg:block" aria-hidden />
            <div className="tandoor-ring pointer-events-none absolute -inset-3 hidden rounded-[2.6rem] lg:block" aria-hidden />
            {/* Floating rating badge */}
            <div className="animate-float absolute -right-3 -top-5 z-10 hidden rotate-6 items-center gap-1.5 rounded-2xl border border-emerald-500/30 bg-white/90 px-3.5 py-2 shadow-xl shadow-emerald-900/20 backdrop-blur dark:bg-[#241204]/95 lg:flex">
              <FaStar className="text-sm text-amber-400" />
              <span className="font-display text-sm font-bold text-slate-900 dark:text-white">
                {siteReviews.length > 0 ? avgRating.toFixed(1) : "4.7"}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">/ 5</span>
            </div>
            <div className="premium-panel ember-border lux-sweep relative rounded-[2rem] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="lux-overline inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <span className="relative inline-flex">
                    <span className="steam" style={{ left: "-2px", animationDelay: "0.4s" }} aria-hidden />
                    <span className="steam" style={{ left: "5px", animationDelay: "1.6s" }} aria-hidden />
                    <FaFire className="animate-pulse-soft text-sm text-emerald-500" />
                  </span>
                  {t.home.popularTitle}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {openNow !== null && (
                    <span
                      className={`h-2 w-2 rounded-full ${openNow ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-red-400"}`}
                      title={openNow ? t.hours.openNow : t.hours.closedNow}
                    />
                  )}
                  <FaClock className="text-emerald-500" /> 17:00–22:30
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                {featured.length === 0
                  ? [0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex min-w-0 items-center gap-4 rounded-2xl border border-emerald-500/10 bg-slate-50/80 p-3.5 dark:border-emerald-400/10 dark:bg-white/5"
                        aria-hidden
                      >
                        <span className="skeleton h-11 w-11 shrink-0 rounded-full" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <span className="skeleton block h-3.5 w-2/3 rounded-full" />
                          <span className="skeleton block h-2.5 w-full rounded-full" />
                        </div>
                        <span className="skeleton h-6 w-14 shrink-0 rounded-full" />
                      </div>
                    ))
                  : featured.slice(0, 4).map((p, i) => {
                      const Icon = getCategoryIcon(p.category);
                      return (
                        <div
                          key={p.id}
                          className="animate-fade-up group flex min-w-0 items-center gap-4 rounded-2xl border border-emerald-500/10 bg-slate-50/80 p-3.5 transition duration-300 hover:translate-x-1 hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:shadow-md hover:shadow-emerald-600/10 dark:border-emerald-400/10 dark:bg-white/5"
                          style={{ animationDelay: `${0.1 * i + 0.2}s` }}
                        >
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 text-sm text-emerald-600 transition duration-300 group-hover:rotate-6 group-hover:scale-110 dark:text-emerald-400">
                            <Icon />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display text-sm font-bold text-slate-900 dark:text-white">{p.name}</p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{(lang === "nl" && p.descriptionNl) || p.description}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 font-display text-sm font-bold text-emerald-700 transition group-hover:bg-emerald-500/20 dark:text-emerald-300">
                            €{p.price.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Link
                  href="/reservations"
                  className="btn-shine flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-500"
                >
                  {t.home.reserveCta} <FaArrowRight />
                </Link>
                <Link
                  href="/order"
                  className="flex items-center justify-center gap-2 rounded-full border border-emerald-500/40 bg-white/60 px-4 py-3.5 text-sm font-semibold text-slate-800 backdrop-blur transition hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-700 dark:bg-white/5 dark:text-slate-200 dark:hover:text-emerald-300"
                >
                  {t.home.makeOrder} <FaArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll-down hint */}
        <div className="relative -mt-2 hidden justify-center pb-6 lg:flex" aria-hidden>
          <span className="animate-float grid h-10 w-10 place-items-center rounded-full border border-emerald-500/30 bg-white/60 text-emerald-600 backdrop-blur dark:bg-white/5 dark:text-emerald-400">
            <FaChevronDown className="text-xs" />
          </span>
        </div>
      </section>

      {/* ============================================================ Marquee ribbon */}
      <div className="marquee-mask relative overflow-hidden border-y border-emerald-500/20 bg-gradient-to-r from-emerald-950 via-[#241204] to-emerald-950 py-3.5" aria-hidden>
        <div className="marquee gap-0 whitespace-nowrap">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center">
              {MARQUEE_DISHES.map((dish) => (
                <span key={`${copy}-${dish}`} className="mx-5 inline-flex items-center gap-5 text-xs font-bold uppercase tracking-[0.25em] text-emerald-200/90">
                  {dish}
                  <span className="ornament-gem !h-1.5 !w-1.5 opacity-80" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================ About */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="reveal grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="lux-overline text-emerald-600 dark:text-emerald-400">{t.home.aboutOverline}</span>
            <h2 className="font-display mt-4 text-3xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-4xl">
              {t.home.aboutTitle}
            </h2>
            <div className="ornament mt-6 max-w-[220px]">
              <span className="ornament-gem" />
            </div>
          </div>
          <div>
            <p className="text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-base">{t.home.aboutText}</p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {[
                { icon: FaSeedling, label: "100% Halal" },
                { icon: FaLeaf, label: lang === "nl" ? "Vegetarisch vriendelijk" : "Vegetarian friendly" },
                { icon: FaFire, label: lang === "nl" ? "Vers uit de tandoor" : "Fresh from the tandoor" },
              ].map((chip) => {
                const ChipIcon = chip.icon;
                return (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-700 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-500/20 dark:text-emerald-300"
                  >
                    <ChipIcon className="text-[0.7rem]" /> {chip.label}
                  </span>
                );
              })}
            </div>
            <Link
              href="/reservations"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:gap-3.5 dark:text-emerald-400"
            >
              {t.home.aboutCta} <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ Ambiance gallery */}
      <section className="relative overflow-hidden py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_60%_at_15%_30%,rgba(217,126,38,0.10),transparent_65%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mx-auto max-w-2xl text-center">
            <span className="lux-overline text-emerald-600 dark:text-emerald-400">{t.home.ambianceOverline}</span>
            <h2 className="font-display mt-3 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
              {t.home.ambianceTitle}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{t.home.ambianceText}</p>
            <div className="ornament mx-auto mt-6 max-w-[260px]">
              <span className="ornament-gem" />
            </div>
          </div>

          <div className="reveal-stagger mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
            {AMBIANCE_PHOTOS.map((photo) => (
              <Link
                key={photo.src}
                href="/events/gallery"
                className={`group relative overflow-hidden rounded-3xl border border-emerald-500/15 shadow-lg shadow-emerald-900/10 transition duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-600/20 dark:border-emerald-400/10 ${
                  photo.wide ? "aspect-[4/3] lg:col-span-7 lg:aspect-[7/4]" : "aspect-[4/3] lg:col-span-5 lg:aspect-[5/4]"
                }`}
              >
                <Image
                  src={photo.src}
                  alt={lang === "nl" ? photo.altNl : photo.altEn}
                  fill
                  sizes="(min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-emerald-950/40 via-transparent to-transparent opacity-60 transition duration-500 group-hover:opacity-80" />
                <span className="absolute bottom-4 left-4 inline-flex translate-y-2 items-center gap-2 rounded-full bg-black/40 px-3.5 py-1.5 text-xs font-semibold text-white opacity-0 backdrop-blur transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  {lang === "nl" ? photo.altNl : photo.altEn}
                </span>
              </Link>
            ))}
          </div>

          <div className="reveal mt-9 text-center">
            <Link
              href="/events/gallery"
              className="group inline-flex items-center gap-2 rounded-full border border-emerald-500/40 px-7 py-3.5 text-sm font-semibold text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-500/10 hover:shadow-lg hover:shadow-emerald-600/15 dark:text-emerald-300"
            >
              {t.home.ambianceCta} <FaArrowRight className="transition group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ Family story */}
      <section className="relative overflow-hidden py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_60%_at_85%_20%,rgba(217,126,38,0.10),transparent_65%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div className="reveal min-w-0">
            <span className="lux-overline text-emerald-600 dark:text-emerald-400">{t.home.storyOverline}</span>
            <h2 className="font-display mt-4 text-3xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-4xl">
              {t.home.storyTitle}
            </h2>
            <p className="mt-6 text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-base">{t.home.storyText}</p>
            <p className="mt-4 text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-base">{t.home.storyText2}</p>
            <figure className="mt-8 border-l-2 border-emerald-500/60 pl-5">
              <blockquote className="font-display text-lg italic leading-8 text-emerald-700 dark:text-emerald-300">
                “{t.home.storyQuote}”
              </blockquote>
              <figcaption className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
                The Tandoor Company
              </figcaption>
            </figure>
          </div>

          <div className="reveal relative min-w-0">
            <div className="pointer-events-none absolute -right-8 -top-8 hidden h-40 w-40 animate-float rounded-full bg-emerald-500/15 blur-3xl lg:block" />
            <div className="relative overflow-hidden rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-950 via-[#241204] to-[#170d04] p-8 shadow-2xl shadow-emerald-900/30 transition duration-500 hover:shadow-[0_25px_70px_-20px_rgba(217,126,38,0.45)]">
              <div className="spice-dots pointer-events-none absolute inset-0 opacity-30" />
              <p className="font-display relative text-[5.5rem] font-bold leading-none text-emerald-400/90 sm:text-[7rem]">
                <CountUp value={32} suffix="" />
                <span className="text-emerald-500">+</span>
              </p>
              <p className="lux-overline relative mt-1 text-emerald-300/80">{t.home.statYears}</p>
              <div className="relative mt-8 grid gap-4">
                {storyPoints.map((pt) => {
                  const Icon = pt.icon;
                  return (
                    <div
                      key={pt.text}
                      className="group flex items-center gap-4 rounded-2xl border border-emerald-400/15 bg-white/5 p-4 backdrop-blur transition duration-300 hover:translate-x-1.5 hover:border-emerald-400/40 hover:bg-white/10"
                    >
                      <span className="grid h-10 w-10 shrink-0 rotate-45 place-items-center rounded-lg border border-emerald-400/30 bg-emerald-500/15 transition duration-500 group-hover:rotate-[135deg] group-hover:bg-emerald-500/25">
                        <Icon className="-rotate-45 text-sm text-emerald-300 transition duration-500 group-hover:-rotate-[135deg]" />
                      </span>
                      <p className="text-sm font-semibold leading-6 text-emerald-50">{pt.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="gold-rule mx-auto max-w-5xl" />

      {/* ============================================================ Signature dishes */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="lux-overline text-emerald-600 dark:text-emerald-400">{t.home.popularOverline}</span>
          <h2 className="font-display mt-3 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">{t.home.popularTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{t.home.popularSubtitle}</p>
          <div className="ornament mx-auto mt-6 max-w-[260px]">
            <span className="ornament-gem" />
          </div>
        </div>
        <div className="reveal-stagger stagger-rise mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, idx) => {
            const Icon = getCategoryIcon(p.category);
            return (
              <Link
                key={p.id}
                href="/order"
                className="premium-panel magnetic-card lux-sweep group relative flex min-w-0 flex-col overflow-hidden rounded-3xl p-6"
              >
                {idx === 0 && (
                  <span className="absolute right-4 top-1 inline-flex rotate-3 items-center gap-1 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-emerald-600/30">
                    <FaStar className="text-[0.6rem]" /> Chef&apos;s choice
                  </span>
                )}
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 to-transparent text-lg text-emerald-600 transition duration-300 group-hover:-rotate-6 group-hover:scale-110 dark:text-emerald-400">
                    <Icon />
                  </span>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    {p.category}
                  </span>
                </div>
                <h3 className="font-display mt-4 text-lg font-bold text-slate-900 dark:text-white">{p.name}</h3>
                <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{(lang === "nl" && p.descriptionNl) || p.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-dashed border-emerald-500/20 pt-4">
                  <span className="font-display text-lg font-bold text-emerald-700 transition duration-300 group-hover:scale-110 group-hover:text-emerald-600 dark:text-emerald-300">€{p.price.toFixed(2)}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 transition group-hover:gap-2.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
                    {t.common.orderNow} <FaArrowRight />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="reveal mt-9 text-center">
          <Link
            href="/order"
            className="group inline-flex items-center gap-2 rounded-full border border-emerald-500/40 px-7 py-3.5 text-sm font-semibold text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-500/10 hover:shadow-lg hover:shadow-emerald-600/15 dark:text-emerald-300"
          >
            {t.home.heroCtaMenu} <FaArrowRight className="transition group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* ============================================================ Promises */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="lux-overline text-emerald-600 dark:text-emerald-400">{t.home.featuresOverline}</span>
          <h2 className="font-display mt-3 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">{t.home.featuresTitle}</h2>
        </div>
        <div className="reveal-stagger stagger-rise mt-10 grid gap-5 md:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="premium-panel magnetic-card lux-sweep group relative overflow-hidden rounded-3xl p-7"
              >
                <span className="font-display pointer-events-none absolute -right-2 -top-5 text-[5rem] font-bold text-emerald-500/10 transition duration-500 group-hover:text-emerald-500/20" aria-hidden>
                  0{i + 1}
                </span>
                <span className="grid h-12 w-12 rotate-45 place-items-center rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-transparent transition duration-500 group-hover:rotate-[135deg] group-hover:shadow-[0_0_18px_rgba(217,126,38,0.35)]">
                  <Icon className="-rotate-45 text-lg text-emerald-600 transition duration-500 group-hover:-rotate-[135deg] dark:text-emerald-400" />
                </span>
                <h3 className="font-display mt-6 text-lg font-bold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{f.text}</p>
                <span className="mt-5 block h-0.5 w-10 rounded-full bg-gradient-to-r from-emerald-500 to-transparent transition-all duration-500 group-hover:w-24" aria-hidden />
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================ Visit us */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="reveal premium-panel ember-border relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10">
          <div className="spice-dots pointer-events-none absolute inset-0 opacity-25" />
          <div className="pointer-events-none absolute -left-16 top-0 h-56 w-56 animate-float rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-emerald-600/10 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <span className="lux-overline inline-flex items-center gap-3 text-emerald-300">
                {t.home.reserveOverline}
                {openNow !== null && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-normal ${
                      openNow ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${openNow ? "animate-pulse-soft bg-green-400" : "bg-red-400"}`} />
                    {openNow ? t.hours.openNow : t.hours.closedNow}
                  </span>
                )}
              </span>
              <h2 className="font-display mt-3 text-2xl font-semibold text-white sm:text-3xl">{t.home.reserveTitle}</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-emerald-100/70">{t.home.reserveText}</p>
              <div className="mt-6 grid gap-3 text-xs text-emerald-50/90 sm:grid-cols-3">
                <a
                  href="https://maps.google.com/?q=Klaprozenweg+36a,+1032+KL+Amsterdam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 rounded-xl border border-emerald-400/15 bg-white/5 px-3.5 py-2.5 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-400/40 hover:bg-white/10"
                >
                  <FaMapLocationDot className="shrink-0 text-emerald-400 transition group-hover:scale-110" /> Klaprozenweg 36a, Amsterdam
                </a>
                <a
                  href="tel:+31203412995"
                  className="group flex items-center gap-2.5 rounded-xl border border-emerald-400/15 bg-white/5 px-3.5 py-2.5 transition duration-300 hover:-translate-y-0.5 hover:border-emerald-400/40 hover:bg-white/10 hover:text-emerald-300"
                >
                  <FaPhone className="shrink-0 text-emerald-400 transition group-hover:scale-110" /> +31 20 341 2995
                </a>
                <span className="flex items-center gap-2.5 rounded-xl border border-emerald-400/15 bg-white/5 px-3.5 py-2.5">
                  <FaClock className="shrink-0 text-emerald-400" /> {t.hours.tueSun}: 17:00–22:30
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/reservations"
                className="btn-shine inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-8 py-4 text-sm font-bold text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-400"
              >
                <FaCalendarCheck /> {t.home.reserveCta}
              </Link>
              <Link
                href="/order"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/40 px-8 py-4 text-sm font-bold text-emerald-100 backdrop-blur transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white/5 hover:text-white"
              >
                {t.home.makeOrder} <FaArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="lux-overline text-emerald-600 dark:text-emerald-400">{t.home.testimonialsOverline}</span>
          <h2 className="font-display mt-3 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">{t.home.testimonialsTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{t.home.testimonialsSubtitle}</p>
          {siteReviews.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-400/10 px-4 py-2">
              <span className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <FaStar key={s} className={s <= Math.round(avgRating) ? "" : "opacity-25"} />
                ))}
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t.reviews.basedOn} {siteReviews.length} {t.reviews.reviewsWord}
              </span>
            </div>
          )}
        </div>
        <div className="reveal-stagger stagger-rise mt-8 grid gap-5 md:grid-cols-3">
          {userReviews.length > 0
            ? userReviews.map((r) => (
                <figure key={r.id} className="premium-panel magnetic-card lux-sweep relative overflow-hidden rounded-3xl p-6">
                  <FaQuoteLeft className="pointer-events-none absolute -right-2 -top-2 text-6xl text-emerald-500/5" aria-hidden />
                  <div className="flex items-center justify-between">
                    <span className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <FaStar key={s} className={s <= r.rating ? "" : "opacity-25"} />
                      ))}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                      ✓ {t.reviews.verifiedOrder}
                    </span>
                  </div>
                  <blockquote className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{r.text}</blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-emerald-500/25 to-emerald-600/10 font-bold text-emerald-700 ring-2 ring-emerald-500/20 dark:text-emerald-300">
                      {r.userName[0]}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-slate-900 dark:text-white">{r.userName}</span>
                      <span className="block text-xs text-slate-400 dark:text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              ))
            : testimonials.map((r) => (
                <figure key={r.name} className="premium-panel magnetic-card lux-sweep relative overflow-hidden rounded-3xl p-6">
                  <FaQuoteLeft className="pointer-events-none absolute -right-2 -top-2 text-6xl text-emerald-500/5" aria-hidden />
                  <div className="flex items-center justify-between">
                    <FaQuoteLeft className="text-2xl text-emerald-500/40" />
                    <span className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <FaStar key={s} className="text-xs" />
                      ))}
                    </span>
                  </div>
                  <blockquote className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{r.text}</blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-emerald-500/25 to-emerald-600/10 font-bold text-emerald-700 ring-2 ring-emerald-500/20 dark:text-emerald-300">
                      {r.name[0]}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-slate-900 dark:text-white">{r.name}</span>
                      <span className="block text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">{r.place}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
        </div>
        {reviewsJsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewsJsonLd) }} />
        )}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productsJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      </section>

      {/* ============================================================ Final CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-4 pt-8 sm:px-6 lg:px-8">
        <div className="reveal premium-panel ember-border lux-sweep relative overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:px-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_50%_100%,rgba(217,126,38,0.22),transparent_70%)]" />
          <div className="spice-dots pointer-events-none absolute inset-0 opacity-20 [mask-image:radial-gradient(60%_80%_at_50%_100%,#000,transparent)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40" aria-hidden>
            {EMBERS.slice(0, 5).map((e, i) => (
              <span key={i} className="ember" style={{ left: e.left, animationDelay: e.delay, animationDuration: e.duration }} />
            ))}
          </div>
          <span className="lux-overline relative text-emerald-600 dark:text-emerald-400">The Tandoor Company</span>
          <h2 className="font-display relative mx-auto mt-4 max-w-2xl text-3xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-4xl">
            {t.home.ctaTitle}
          </h2>
          <div className="ornament relative mx-auto mt-5 max-w-[220px]">
            <span className="ornament-gem" />
          </div>
          <p className="relative mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-400">{t.home.ctaText}</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/reservations"
              className="btn-shine group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 bg-[length:200%_auto] px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-right hover:shadow-xl hover:shadow-emerald-500/40"
            >
              <FaCalendarCheck /> {t.home.ctaButton}
              <FaArrowRight className="transition group-hover:translate-x-1" />
            </Link>
            <Link
              href="/order"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 px-8 py-4 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-slate-200 dark:hover:text-emerald-300"
            >
              {t.home.makeOrder}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
