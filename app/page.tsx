"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  FaArrowRight,
  FaBellConcierge,
  FaCalendarCheck,
  FaChampagneGlasses,
  FaClock,
  FaLocationDot,
  FaPhone,
  FaQuoteLeft,
  FaStar,
  FaUtensils,
} from "react-icons/fa6";
import { useLang, useStore } from "./providers";
import { SITE_ID } from "./lib/data";

export default function Home() {
  const { t } = useLang();
  const { products, reviews } = useStore();

  // Only reviews written on this website (the database is shared across the
  // restaurant group; each site shows its own guest reviews).
  const siteReviews = useMemo(() => reviews.filter((r) => r.site === SITE_ID), [reviews]);

  // Signature dishes: a refined selection across the menu (max 6, with description).
  const featured = useMemo(() => {
    const seen = new Set<string>();
    const picks: typeof products = [];
    for (const p of products) {
      if (picks.length >= 6) break;
      if (seen.has(p.category)) continue;
      seen.add(p.category);
      picks.push(p);
    }
    // Fill up with remaining products if fewer than 6 categories exist.
    for (const p of products) {
      if (picks.length >= 6) break;
      if (!picks.includes(p)) picks.push(p);
    }
    return picks;
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
      name: "The Maison Amsterdam",
      servesCuisine: ["Fine Dining", "European", "Grill"],
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
      description: "Family of fine dining and casual restaurants in Amsterdam",
      url: "https://themaison.nl",
      parentOrganization: {
        "@type": "Organization",
        name: "Amsterdam Restaurant Group",
      },
      subOrganizations: [
        {
          "@type": "LocalBusiness",
          "@id": "https://themaison.nl",
          name: "The Maison",
          url: "https://themaison.nl",
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
          name: "Eat to go",
          url: "https://eattogo.nl",
          sameAs: "https://eattogo.nl",
          address: {
            "@type": "PostalAddress",
            addressCountry: "NL",
          },
        },
        {
          "@type": "LocalBusiness",
          name: "The Tandoor Company",
          url: "https://thetandoorcompany.nl",
          sameAs: "https://thetandoorcompany.nl",
          address: {
            "@type": "PostalAddress",
            addressCountry: "NL",
          },
        },
      ],
      sameAs: [
        "https://eattogo.nl",
        "https://thetandoorcompany.nl",
      ],
    };
  }, []);

  const stats = [
    { value: "15+", label: t.home.statYears },
    { value: "30+", label: t.home.statDishes },
    { value: "5000+", label: t.home.statGuests },
    { value: siteReviews.length > 0 ? avgRating.toFixed(1) : "5.0", label: t.home.statRating },
  ];

  const features = [
    { icon: FaUtensils, title: t.home.feature1Title, text: t.home.feature1Text },
    { icon: FaChampagneGlasses, title: t.home.feature2Title, text: t.home.feature2Text },
    { icon: FaBellConcierge, title: t.home.feature3Title, text: t.home.feature3Text },
  ];

  const testimonials = [
    { name: "Isabelle", text: "An unforgettable evening - the ambiance is warm and intimate, and every dish arrived like a work of art. The Maison has become our favourite address in Amsterdam." },
    { name: "Marc", text: "Impeccable service from aperitif to dessert. We hosted a business dinner and every detail was taken care of. Highly recommended." },
    { name: "Sophie", text: "We celebrated our anniversary here. Candlelight, wonderful wine and dishes full of flavour - pure class from start to finish." },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(65%_55%_at_20%_5%,rgba(195,144,61,0.16),transparent_60%),radial-gradient(45%_40%_at_90%_15%,rgba(139,94,60,0.12),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-12 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pt-24">
          <div className="animate-fade-up min-w-0">
            <span className="lux-overline inline-flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <span className="h-px w-10 bg-emerald-500/60" /> {t.home.badge}
            </span>
            <h1 className="font-display mt-6 text-4xl font-semibold leading-[1.12] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
              {t.home.heroTitle}{" "}
              <span className="italic text-emerald-600 dark:text-emerald-400">{t.home.heroTitleAccent}</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
              {t.home.heroSubtitle}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/reservations"
                className="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-500"
              >
                <FaCalendarCheck />
                {t.home.heroCtaReserve}
                <FaArrowRight className="transition group-hover:translate-x-1" />
              </Link>
              <Link
                href="/order"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-white/60 px-7 py-4 text-sm font-semibold text-slate-800 backdrop-blur transition hover:-translate-y-0.5 hover:border-emerald-500 hover:text-emerald-700 dark:bg-white/5 dark:text-slate-200 dark:hover:text-emerald-300"
              >
                {t.home.heroCtaMenu}
              </Link>
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-emerald-500/15 bg-white/70 p-4 backdrop-blur dark:border-emerald-400/15 dark:bg-white/5">
                  <dt className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">{s.value}</dt>
                  <dd className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero card - tonight's signatures */}
          <div className="animate-fade-up delay-200 relative min-w-0">
            <div className="pointer-events-none absolute -left-6 top-10 hidden h-28 w-28 animate-float rounded-full bg-emerald-400/25 blur-3xl lg:block" />
            <div className="pointer-events-none absolute -right-4 bottom-6 hidden h-32 w-32 animate-float rounded-full bg-amber-500/20 blur-3xl lg:block" style={{ animationDelay: "1s" }} />
            <div className="relative rounded-[2rem] border border-emerald-500/20 bg-white p-5 shadow-2xl shadow-emerald-900/10 dark:border-emerald-400/15 dark:bg-[#161006] sm:p-6">
              <div className="flex items-center justify-between">
                <span className="lux-overline inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <FaStar className="text-xs" /> {t.home.popularTitle}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  <FaClock className="text-emerald-500" /> 14:00–20:00
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                {featured.slice(0, 4).map((p, i) => (
                  <div
                    key={p.id}
                    className="animate-fade-up flex min-w-0 items-center gap-4 rounded-2xl border border-emerald-500/10 bg-slate-50/80 p-3.5 dark:border-emerald-400/10 dark:bg-white/5"
                    style={{ animationDelay: `${0.1 * i + 0.2}s` }}
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-sm text-emerald-600 dark:text-emerald-400">
                      <FaUtensils />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-bold text-slate-900 dark:text-white">{p.name}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{p.description}</p>
                    </div>
                    <span className="shrink-0 font-display text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      €{p.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Link
                  href="/reservations"
                  className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  {t.home.reserveCta} <FaArrowRight />
                </Link>
                <Link
                  href="/order"
                  className="flex items-center justify-center gap-2 rounded-full border border-emerald-500/40 bg-white/60 px-4 py-3.5 text-sm font-semibold text-slate-800 backdrop-blur transition hover:border-emerald-500 hover:text-emerald-700 dark:bg-white/5 dark:text-slate-200 dark:hover:text-emerald-300"
                >
                  {t.home.makeOrder} <FaArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="gold-rule mx-auto max-w-5xl" />

      {/* About */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="animate-fade-up">
            <span className="lux-overline text-emerald-600 dark:text-emerald-400">{t.home.aboutOverline}</span>
            <h2 className="font-display mt-4 text-3xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-4xl">
              {t.home.aboutTitle}
            </h2>
          </div>
          <div className="animate-fade-up delay-100">
            <p className="text-sm leading-8 text-slate-600 dark:text-slate-300 sm:text-base">{t.home.aboutText}</p>
            <Link
              href="/reservations"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:gap-3.5 dark:text-emerald-400"
            >
              {t.home.aboutCta} <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Features / experience */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="lux-overline text-emerald-600 dark:text-emerald-400">{t.home.featuresOverline}</span>
          <h2 className="font-display mt-3 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">{t.home.featuresTitle}</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group rounded-3xl border border-emerald-500/15 bg-white p-7 transition hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-900/10 dark:border-emerald-400/10 dark:bg-white/5"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-lg text-emerald-600 transition group-hover:scale-110 dark:text-emerald-400">
                  <Icon />
                </span>
                <h3 className="font-display mt-5 text-lg font-bold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>


      {/* Testimonials / Customer reviews */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
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
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {userReviews.length > 0
            ? userReviews.map((r) => (
                <figure key={r.id} className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
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
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/15 font-bold text-emerald-700 dark:text-emerald-300">
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
                <figure key={r.name} className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
                  <FaQuoteLeft className="text-2xl text-emerald-500/40" />
                  <blockquote className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{r.text}</blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/15 font-bold text-emerald-700 dark:text-emerald-300">
                      {r.name[0]}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{r.name}</span>
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

    </div>
  );
}
