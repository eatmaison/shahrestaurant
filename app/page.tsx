"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  FaArrowRight,
  FaBowlFood,
  FaBurger,
  FaClock,
  FaGlassWater,
  FaLeaf,
  FaPizzaSlice,
  FaQuoteLeft,
  FaShieldHeart,
  FaStar,
  FaTruckFast,
} from "react-icons/fa6";
import { useLang, useStore } from "./providers";
import type { Category } from "./lib/types";

const categoryIcons: Record<Category, typeof FaBowlFood> = {
  Wraps: FaBowlFood,
  Burgers: FaBurger,
  Pizzas: FaPizzaSlice,
  Drinks: FaGlassWater,
};

export default function Home() {
  const { t } = useLang();
  const { products, reviews } = useStore();

  const featured = useMemo(() => {
    const cats: Category[] = ["Wraps", "Burgers", "Pizzas", "Drinks"];
    return cats
      .map((c) => products.find((p) => p.category === c))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
  }, [products]);

  const userReviews = useMemo(() => reviews.filter((r) => r.text.trim().length > 0).slice(0, 6), [reviews]);
  const avgRating = useMemo(
    () => (reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0),
    [reviews]
  );

  // SEO: structured data with real customer reviews and aggregate rating.
  const reviewsJsonLd = useMemo(() => {
    if (reviews.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: "Eat to go Amsterdam",
      servesCuisine: ["Wraps", "Burgers", "Pizza", "Drinks"],
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
        reviewCount: reviews.length,
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
  }, [reviews, userReviews, avgRating]);

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

  // SEO: Organization schema linking all three restaurants
  const organizationJsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Amsterdam Restaurant Group",
      description: "Family of fine dining and casual restaurants in Amsterdam",
      url: "https://eattogo.nl",
      parentOrganization: {
        "@type": "Organization",
        name: "Amsterdam Restaurant Group",
      },
      subOrganizations: [
        {
          "@type": "LocalBusiness",
          "@id": "https://eattogo.nl",
          name: "Eat to go",
          url: "https://eattogo.nl",
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
        "https://themaison.nl",
        "https://thetandoorcompany.nl",
      ],
    };
  }, []);

  const stats = [
    { value: "25+", label: t.home.statFlavors },
    { value: "10+", label: t.home.statSpecialties },
    { value: "100%", label: t.home.statDaily },
    { value: "5", label: t.home.statWait },
  ];

  const features = [
    { icon: FaLeaf, title: t.home.feature1Title, text: t.home.feature1Text },
    { icon: FaClock, title: t.home.feature2Title, text: t.home.feature2Text },
    { icon: FaShieldHeart, title: t.home.feature3Title, text: t.home.feature3Text },
  ];

  const testimonials = [
    { name: "Sander", text: "Always fast service and super fresh food. Eat to go is my regular stop during work breaks!" },
    { name: "Laila", text: "The wraps are delicious and they have unique flavors. Always friendly staff and a clean place." },
    { name: "Jeroen", text: "I come here regularly for food on the go. Great quality and speed every time." },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_15%_10%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(50%_40%_at_90%_10%,rgba(59,130,246,0.14),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-10 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pt-20">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <FaLeaf /> {t.home.badge}
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
              {t.home.heroTitle}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
              {t.home.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/order"
                className="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-500"
              >
                {t.home.heroCtaOrder}
                <FaArrowRight className="transition group-hover:translate-x-1" />
              </Link>
              <Link
                href="/order"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:text-emerald-300"
              >
                {t.home.heroCtaMenu}
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-slate-200 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <dt className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{s.value}</dt>
                  <dd className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero card */}
          <div className="animate-fade-up delay-200 relative">
            <div className="absolute -left-6 top-10 h-28 w-28 animate-float rounded-full bg-emerald-400/30 blur-3xl" />
            <div className="absolute -right-4 bottom-6 h-32 w-32 animate-float rounded-full bg-sky-400/25 blur-3xl" style={{ animationDelay: "1s" }} />
            <div className="relative rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-emerald-900/10 dark:border-white/10 dark:bg-[#0c1420] sm:p-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  <FaStar /> Bestsellers
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  <FaTruckFast className="text-emerald-500" /> ~5 min
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                {featured.map((p, i) => {
                  const Icon = categoryIcons[p.category];
                  return (
                    <div
                      key={p.id}
                      className="animate-fade-up flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-white/5 dark:bg-white/5"
                      style={{ animationDelay: `${0.1 * i + 0.2}s` }}
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-lg text-emerald-600 dark:text-emerald-400">
                        <Icon />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{p.name}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{p.description}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-sm font-bold text-emerald-700 shadow-sm dark:bg-white/10 dark:text-emerald-300">
                        €{p.price.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Link
                href="/order"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                {t.common.orderNow} <FaArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">{t.home.featuresTitle}</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/5"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-xl text-emerald-600 transition group-hover:scale-110 dark:text-emerald-400">
                  <Icon />
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">{f.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Popular categories */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">{t.home.popularTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{t.home.popularSubtitle}</p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(["Wraps", "Burgers", "Pizzas", "Drinks"] as Category[]).map((cat) => {
            const Icon = categoryIcons[cat];
            const items = products.filter((p) => p.category === cat).slice(0, 5);
            return (
              <div key={cat} className="rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/10 text-lg text-emerald-600 dark:text-emerald-400">
                    <Icon />
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{cat}</h3>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  {items.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">{p.name}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">€{p.price.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/order" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 transition hover:gap-2.5 dark:text-emerald-400">
                  {t.common.viewMenu} <FaArrowRight />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-900 to-emerald-950 p-8 text-white dark:border-white/10 sm:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-black sm:text-3xl">{t.home.aboutTitle}</h2>
              <p className="mt-4 max-w-xl text-sm leading-8 text-slate-200">{t.home.aboutText}</p>
              <Link href="/order" className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400">
                {t.home.ctaButton} <FaArrowRight />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-black text-emerald-300">{s.value}</p>
                  <p className="mt-1 text-xs text-slate-300">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials / Customer reviews */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">{t.home.testimonialsTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{t.home.testimonialsSubtitle}</p>
          {reviews.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-400/10 px-4 py-2">
              <span className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <FaStar key={s} className={s <= Math.round(avgRating) ? "" : "opacity-25"} />
                ))}
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t.reviews.basedOn} {reviews.length} {t.reviews.reviewsWord}
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

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 rounded-[2rem] border border-emerald-200 bg-emerald-50 px-6 py-12 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <h2 className="max-w-2xl text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">{t.home.ctaTitle}</h2>
          <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">{t.home.ctaText}</p>
          <Link href="/order" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-500">
            {t.home.ctaButton} <FaArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
}
