"use client";

import { RestaurantPhoto } from "./components/RestaurantPhoto";
import Link from "./components/LocaleLink";
import { BrandLogo } from "./components/BrandLogo";
import { HeroFilm } from "./components/HeroFilm";
import { DrinkPartners } from "./components/DrinkPartners";
import dynamic from "next/dynamic";
import { ProductImage } from "./components/ProductImage";
import { CatalogFeedback } from "./components/CatalogFeedback";
import { matchesMenuSearch, normalizeMenuSearch } from "./lib/menuSearch";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { FaArrowDown, FaArrowLeft, FaArrowRight, FaBagShopping, FaCalendarCheck, FaChevronDown, FaClock, FaEnvelope, FaExpand, FaFireBurner, FaLocationDot, FaMagnifyingGlass, FaPhone, FaStar, FaUtensils, FaUsers, FaXmark } from "react-icons/fa6";
import { useLang, useStore } from "./providers";
import { SITE_ID } from "./lib/data";
import type { Product } from "./lib/types";
import { homeContent } from "./lib/homeContent";
import { MenuSchema } from "./components/MenuSchema";
import { ArrivalInfo } from "./components/ArrivalInfo";
import { useRestaurantClock } from "./lib/useRestaurantClock";
const HomeDialog = dynamic(() => import("./components/HomeDialog").then(module => module.HomeDialog), { ssr: false });
const RichDescription = dynamic(() => import("./components/RichDescription"), { ssr: false });
import { useHomeTilt, useRichMedia } from "./components/HomeDepth";
import { useHomeChoreography } from "./components/HomeChoreography";
import styles from "./home.module.css";

const SIGNATURE_IDS = ["tdc-butter-chicken", "tdc-tandoori-mixed-grill", "tdc-tandoori-lamb-chops", "tdc-biryani-lamb", "tdc-tandoori-chicken-tikka", "tdc-samosa-chaat"];
const DIRECTIONS = "https://www.google.com/maps/dir/?api=1&destination=Klaprozenweg+36a+1032+KL+Amsterdam";

function DishPhoto({ product, large = false }: { product: Product; large?: boolean }) {
  return <span className={large ? styles.productPhoto : styles.dishPhoto}>{product.image
    ? <ProductImage src={product.image} alt={large ? product.name : ""} sizes={large ? "(min-width: 700px) 540px, 90vw" : "72px"} />
    : <FaUtensils aria-hidden="true" />}</span>;
}

export default function Home() {
  const { t, lang } = useLang();
  const { products, reviews, hydrated } = useStore();
  const nowLocal = useRestaurantClock();
  const diningOpen = nowLocal ? new Date(nowLocal.slice(0, 10) + "T12:00:00Z").getUTCDay() !== 1 && nowLocal.slice(11) >= "15:00" && nowLocal.slice(11) < "22:00" : null;
  const eveningPhotoSizes = "(min-width: 1296px) 379px, (min-width: 1051px) calc(33.333vw - 53.333px), (min-width: 701px) calc(33.333vw - 42.667px), calc(100vw - 44px)";
  const copy = homeContent[lang];
  const rootRef = useRef<HTMLDivElement>(null);
  const heroScrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const swipeStart = useRef<{ horizontal: number; vertical: number } | null>(null);
  const richMedia = useRichMedia();
  useHomeTilt(rootRef, richMedia);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const [activeSection, setActiveSection] = useState("menu");
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { menu, featured, categories } = useMemo(() => {
    const menu = products.filter(product => product.brand === "tandoor");
    const curated = SIGNATURE_IDS.flatMap(id => menu.filter(product => product.id === id));
    return { menu, featured: [...curated, ...menu.filter(product => !SIGNATURE_IDS.includes(product.id))].slice(0, 6), categories: [...new Set(menu.map(product => product.category))] };
  }, [products]);
  const selectedCategory = categories.includes(category) ? category : "";
  const searchTerm = normalizeMenuSearch(deferredSearch);
  const matchedDishes = useMemo(() => {
    const candidates = selectedCategory ? menu.filter(product => product.category === selectedCategory) : searchTerm ? menu : featured;
    return candidates.filter(product => matchesMenuSearch(product, searchTerm));
  }, [menu, featured, selectedCategory, searchTerm]);
  const visibleDishes = showAll ? matchedDishes : matchedDishes.slice(0, 6);
  const { siteReviews, userReviews, avgRating } = useMemo(() => {
    const siteReviews = reviews.filter(review => review.site === SITE_ID && Number.isFinite(review.rating) && review.rating >= 1 && review.rating <= 5 && Number.isFinite(new Date(review.createdAt).getTime()));
    return { siteReviews, userReviews: siteReviews.filter(review => review.text.trim()).slice(0, 3), avgRating: siteReviews.length ? siteReviews.reduce((sum, review) => sum + review.rating, 0) / siteReviews.length : 0 };
  }, [reviews]);
  const currency = useMemo(() => new Intl.NumberFormat(lang === "nl" ? "nl-NL" : "en-IE", { style: "currency", currency: "EUR" }), [lang]);
  const dateFormat = useMemo(() => new Intl.DateTimeFormat(lang === "nl" ? "nl-NL" : "en-GB", { month: "long", year: "numeric", timeZone: "Europe/Amsterdam" }), [lang]);
  const sections = [{ id: "menu", label: copy.menu }, { id: "atmosphere", label: copy.atmosphere }, { id: "story", label: copy.story }, { id: "visit", label: copy.visit }];
  const photos = [
    { src: "/brand/shah-dining-v1.webp", title: copy.table, alt: copy.tableAlt },
    { src: "/brand/shah-table-v1.webp", title: copy.tandoor, alt: copy.dishAlt },
    { src: "/brand/shah-bar-v1.webp", title: copy.bar, alt: copy.barAlt },
    { src: "/brand/shah-cocktail-v1.webp", title: copy.drinks, alt: copy.drinksAlt },
    { src: "/brand/shah-atmosphere-v1.webp", title: copy.room, alt: copy.interiorAlt },
  ];
  const currentPhoto = photoIndex === null ? null : photos[photoIndex];
  const ingredients = selectedProduct && ((lang === "nl" && selectedProduct.ingredientsNl?.length ? selectedProduct.ingredientsNl : selectedProduct.ingredients) || []);
  const allergens = selectedProduct && ((lang === "nl" && selectedProduct.allergensNl?.length ? selectedProduct.allergensNl : selectedProduct.allergens) || []);

  useHomeChoreography(rootRef, heroScrollRef, richMedia, setActiveSection);

  function resetMenu() {
    setSearch("");
    setCategory("");
    setShowAll(false);
    searchRef.current?.focus();
  }

  function changePhoto(direction: number) {
    setPhotoIndex((index) => ((index ?? 0) + direction + photos.length) % photos.length);
  }

  const faqJsonLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: copy.questions.map(item => ({
      "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <div ref={rootRef} className={styles.home} data-cinematic-home="true" data-film-view="opening" data-motion={richMedia ? "on" : "off"} data-media={richMedia ? "scrub" : "static"}>
      <noscript><style>{`body:has([data-cinematic-home][data-film-view]) [data-site-header]{position:relative!important;inset:auto!important;background:var(--shah-surface)!important;pointer-events:auto!important}body:has([data-cinematic-home][data-film-view]) [data-site-header-bar]{visibility:visible!important;opacity:1!important;transform:none!important}[data-cinematic-home] [data-film-track]{margin-top:0!important;height:calc(100svh - var(--site-header-height,102px))!important}[data-cinematic-home] [data-film-track]>section{height:100%!important;min-height:0!important}`}</style></noscript>
      <div ref={heroScrollRef} className={styles.heroScroll} data-film-track data-unavailable="true" data-film-state="waiting" data-film-progress="0" data-film-complete="false">
      <section className={styles.hero} aria-label={lang === "nl" ? "Film van Shah Restaurant" : "Shah Restaurant film"}>
        <div className={styles.heroMedia}>
          <picture style={{ display: "block", position: "relative", width: "100%", height: "100%" }}>
            <source media="(max-width: 767px)" type="image/avif" srcSet="/brand/shah-hero-poster-mobile-delivery-v1-360.avif 360w, /brand/shah-hero-poster-mobile-delivery-v1.avif 608w" sizes="100vw" />
            <source media="(max-width: 767px)" type="image/webp" srcSet="/brand/shah-hero-poster-mobile-delivery-v1-360.webp 360w, /brand/shah-hero-poster-mobile-delivery-v1.webp 608w" sizes="100vw" />
            <source type="image/avif" srcSet="/brand/shah-hero-poster-desktop-delivery-v1-960.avif 960w, /brand/shah-hero-poster-desktop-delivery-v1.avif 1600w" sizes="100vw" />
            <source type="image/webp" srcSet="/brand/shah-hero-poster-desktop-delivery-v1-960.webp 960w, /brand/shah-hero-poster-desktop-delivery-v1.webp 1600w" sizes="100vw" />
            {/* Native picture keeps the selected responsive poster as the film fallback. */}
            <img src="/brand/shah-hero-poster-desktop-delivery-v1.webp" alt={lang === "nl" ? "De entree en het terras van Shah Restaurant in Amsterdam-Noord" : "The entrance and terrace of Shah Restaurant in Amsterdam-Noord"} width={1600} height={900} loading="eager" decoding="async" fetchPriority="high" className={styles.heroImage} />
          </picture>
          <HeroFilm trackRef={heroScrollRef} />
        </div>
      </section>

      </div>

      <section id="intro" tabIndex={-1} data-scene="opening" data-opening-chapter className={`${styles.section} ${styles.intro} ${styles.opening}`} aria-labelledby="home-title">
        <div className={styles.openingHeading}>
          <p className={styles.eyebrow} data-reveal="visible" data-reveal-kind="quiet">{copy.introduction}</p>
          <h1 id="home-title"><span className={styles.titleMask} data-reveal="visible" data-reveal-kind="title"><span>{lang === "nl" ? "Indiaas restaurant" : "Indian restaurant"}</span></span>{" "}<span className={styles.titleMask} data-reveal="visible" data-reveal-kind="title" data-reveal-delay="110"><span>in Amsterdam-Noord</span></span></h1>
        </div>
        <div className={styles.openingContent}>
          <div data-reveal="visible" data-reveal-kind="left" data-reveal-delay="100"><p className={styles.eyebrow}>{t.home.aboutOverline}</p><h2>{copy.welcome}</h2><div className={styles.facts}><span><FaFireBurner aria-hidden="true" />{copy.food}</span><span><FaUsers aria-hidden="true" />{copy.family}</span></div></div>
          <div data-reveal="visible" data-reveal-kind="rise" data-reveal-delay="180"><p className={styles.lead}>{copy.welcomeText}</p><div className={styles.openingDetails}><a href={DIRECTIONS} target="_blank" rel="noopener noreferrer"><FaLocationDot aria-hidden="true" />Klaprozenweg 36a, Amsterdam-Noord</a><span><FaClock aria-hidden="true" />{t.hours.tueSun} · 15:00–22:00</span><span><FaUtensils aria-hidden="true" />{copy.priceNote}</span></div><div className={styles.actions}><Link href="/reservations" className={styles.primaryButton}><FaCalendarCheck aria-hidden="true" />{copy.reserve}</Link><a href="tel:+31203412995" className={styles.openingPhone}><FaPhone aria-hidden="true" />{copy.call}</a></div></div>
        </div>
      </section>

      <nav className={styles.sectionNav} aria-label={copy.explore}><div className={styles.sectionNavInner}><span className={styles.chapterLead}>{copy.explore}<FaArrowDown aria-hidden="true" /></span>{sections.map((section, index) => <a key={section.id} href={`#${section.id}`} aria-current={activeSection === section.id ? "location" : undefined}><span aria-hidden="true">0{index + 1}</span>{section.label}</a>)}</div></nav>

      <section id="menu" data-section data-scene="menu" className={`${styles.section} ${styles.menuSection}`} aria-labelledby="menu-title">
        <div className={styles.menuVisual} data-reveal="visible" data-reveal-kind="left">
          <div className={styles.menuPhoto} data-tilt><RestaurantPhoto data-parallax src="/brand/shah-table-v1.webp" alt={copy.dishAlt} fill sizes="(min-width: 1000px) 42vw, 100vw" /><span className={styles.photoLabel}>{copy.fromMenu}<FaFireBurner aria-hidden="true" /></span></div>
          <div className={styles.photoCaption}><span>Shah Restaurant</span><span>{copy.kitchen}</span></div>
          <p className={styles.menuAside}>{copy.kitchenNote}</p>
          <a href="#atmosphere" className={styles.menuInset} data-tilt><span className={styles.menuInsetPhoto}><RestaurantPhoto src="/brand/shah-dining-v1.webp" alt={copy.tableAlt} fill sizes="180px" /></span><span>{copy.table}<FaArrowRight aria-hidden="true" /></span></a>
        </div>
        <div className={styles.menuContent} data-reveal="visible" data-reveal-kind="rise">
          <p className={styles.eyebrow}>01 / {copy.kitchen}</p><h2 id="menu-title">{copy.menuTitle}</h2><p className={styles.sectionDescription}>{copy.menuText}</p>
          <div className={styles.menuSearch}><FaMagnifyingGlass aria-hidden="true" /><label className="sr-only" htmlFor="dish-search">{copy.searchMenu}</label><input ref={searchRef} id="dish-search" type="search" autoComplete="off" maxLength={120} spellCheck={false} enterKeyHint="search" value={search} placeholder={copy.searchPlaceholder} onChange={(event) => { setSearch(event.target.value); setShowAll(false); }} />{search && <button type="button" onClick={() => { setSearch(""); setShowAll(false); searchRef.current?.focus(); }} aria-label={copy.clearSearch} title={copy.clearSearch}><FaXmark aria-hidden="true" /></button>}</div>
          <CatalogFeedback />
          <fieldset className={styles.filters}>
            <legend className="sr-only">{copy.category}</legend>
            {[{ value: "", label: copy.signature }, ...categories.map((value) => ({ value, label: value }))].map((option) => (
              <label key={option.value}><input type="radio" name="home-menu-category" value={option.value} checked={selectedCategory === option.value} onChange={() => { setCategory(option.value); setShowAll(false); }} /><span>{option.value === "" && searchTerm ? copy.allCategories : option.label}</span></label>
            ))}
          </fieldset>
          <div className={styles.menuMeta}><span>{copy.menuSelection}</span><span>{hydrated ? `${matchedDishes.length} ${copy.menuCount}` : copy.menuLoading}</span></div>
          <div className={styles.menuResults} aria-busy={!hydrated || search !== deferredSearch}>
            {!hydrated ? <div className={styles.menuSkeleton} role="status" aria-label={copy.menuLoading}>{[0, 1, 2, 3].map((index) => <span key={index} />)}</div> : visibleDishes.length ? <ul data-dish-list className={styles.dishes}>
              {visibleDishes.map((product) => <li key={product.id}><button type="button" className={styles.dish} onClick={() => setSelectedProduct(product)} aria-label={`${copy.details}: ${product.name}`}>
                <DishPhoto product={product} /><span className={styles.dishBody}><span className={styles.dishHeading}><span>{product.name}</span><span className={styles.price}>{currency.format(product.price)}</span></span>
                <span className={styles.dishDescription}>{(lang === "nl" && product.descriptionNl) || product.description}</span>{(product.isPopular || product.isNew) && <span className={styles.dishTags}>{product.isPopular && <span><FaStar aria-hidden="true" />{copy.popular}</span>}{product.isNew && <span>{copy.newDish}</span>}</span>}</span><FaArrowRight className={styles.dishArrow} aria-hidden="true" />
              </button></li>)}
            </ul> : searchTerm || selectedCategory ? <div className={styles.emptyState}><FaMagnifyingGlass aria-hidden="true" /><p>{copy.noMatches}</p><button type="button" className={styles.textLink} onClick={resetMenu}>{copy.resetMenu}<FaArrowRight aria-hidden="true" /></button></div> : <p className={styles.emptyState}>{copy.menuEmpty} <a href="tel:+31203412995">+31 20 341 2995</a></p>}
          </div>
          <p className="sr-only" role="status">{hydrated ? `${matchedDishes.length} ${copy.menuCount}` : copy.menuLoading}</p>
          {matchedDishes.length > 6 && <button type="button" className={styles.showMore} aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>{showAll ? copy.showLess : copy.showMore}<FaChevronDown aria-hidden="true" /></button>}
          <p className={styles.allergyNote}>{copy.allergy}</p>
          <Link href="/order" className={styles.textLink}>{copy.fullMenu}<FaArrowRight aria-hidden="true" /></Link>
        </div>
      </section>

      <section id="atmosphere" data-section data-scene="gallery" className={styles.gallerySection} aria-labelledby="gallery-title">
        <div className={styles.sectionHeading} data-reveal="visible"><div><p className={styles.eyebrow}>02 / {copy.atmosphere}</p><h2 id="gallery-title">{copy.galleryTitle}</h2></div><p>{copy.galleryText}</p></div>
        <div className={styles.galleryGrid}>
          {photos.slice(0, 3).map((photo, index) => <figure key={photo.src} className={styles.galleryItem} data-reveal="visible" data-reveal-kind="frame" data-reveal-delay={index * 110}><button type="button" data-tilt onClick={() => setPhotoIndex(index)} aria-label={`${copy.enlarge}: ${photo.title}`} title={`${copy.enlarge}: ${photo.title}`}><RestaurantPhoto data-parallax src={photo.src} alt={photo.alt} fill sizes={index === 0 ? "(min-width: 800px) 50vw, 100vw" : "(min-width: 800px) 25vw, 50vw"} /><span className={styles.galleryPhotoNumber}>0{index + 1}</span><span className={styles.expandIcon}><FaExpand aria-hidden="true" /></span></button><figcaption><span>{photo.title}</span><span>0{index + 1}</span></figcaption></figure>)}
        </div>
        <div className={styles.galleryFooter}><Link href="/events/gallery" className={styles.textLink}>{copy.fullGallery}<FaArrowRight aria-hidden="true" /></Link></div>
      </section>

      <section id="story" data-section data-scene="story" className={styles.storySection} aria-labelledby="story-title">
        <div className={styles.storyInner}>
          <div className={styles.storyContent} data-reveal="visible" data-reveal-kind="left"><p className={styles.eyebrow}>03 / {copy.story}</p><h2 id="story-title">{t.home.storyTitle}</h2><p>{t.home.storyText}</p><blockquote>{t.home.storyQuote}</blockquote><Link href="/events/about" className={styles.textLink}>{copy.storyLink}<FaArrowRight aria-hidden="true" /></Link></div>
          <figure className={styles.storyPhoto} data-reveal="visible" data-reveal-kind="right"><div data-tilt><RestaurantPhoto data-parallax src="/brand/shah-room-v1.webp" alt={copy.interiorAlt} fill sizes="(min-width: 900px) 45vw, 100vw" /><BrandLogo variant="wordmark" tone="gold" className={styles.storyPhotoMark} alt="" /></div><figcaption><span>{copy.storyAside}</span><FaFireBurner aria-hidden="true" /></figcaption></figure>
        </div>
      </section>

      <section className={`${styles.section} ${styles.eveningSection}`} data-scene="evening" aria-labelledby="evening-title">
        <div className={styles.sectionHeading} data-reveal="visible"><div><p className={styles.eyebrow}>{copy.tableNote}</p><h2 id="evening-title">{copy.evening}</h2></div></div>
        <div className={styles.eveningGrid}>{[
          { href: "/reservations", title: copy.dine, text: copy.dineText, action: copy.reserve, image: photos[0], Icon: FaCalendarCheck },
          { href: "/order", title: copy.takeaway, text: copy.takeawayText, action: copy.order, image: photos[1], Icon: FaBagShopping },
          { href: "/events", title: copy.gather, text: copy.gatherText, action: copy.exploreEvents, image: photos[4], Icon: FaUsers },
        ].map(({ href, title, text, action, image, Icon }, index) => <article key={href} className={styles.eveningItem} data-evening-card data-reveal="visible"><Link href={href} className={styles.eveningPhoto} data-tilt aria-label={action}><RestaurantPhoto data-parallax src={image.src} alt={image.alt} fill sizes={eveningPhotoSizes} /><span><Icon aria-hidden="true" /></span><span className={styles.eveningNumber}>0{index + 1}</span></Link><h3>{title}</h3><p>{text}</p><Link href={href} className={styles.textLink}>{action}<FaArrowRight aria-hidden="true" /></Link></article>)}</div>
      </section>

      <section className={`${styles.section} ${styles.occasions}`} data-scene="occasions" aria-labelledby="occasions-title">
        <div data-reveal="visible"><p className={styles.eyebrow}>{copy.occasions}</p><h2 id="occasions-title">{copy.occasionsTitle}</h2><p className={styles.sectionDescription}>{copy.occasionsText}</p></div>
        <div className={styles.occasionLinks} data-reveal="visible">{[{ href: "/events/birthdays", label: copy.birthdays }, { href: "/events/celebrations", label: copy.celebrations }, { href: "/events/company-catering", label: copy.company }].map((occasion, index) => <Link key={occasion.href} href={occasion.href}><span className={styles.occasionNumber}>0{index + 1}</span><span>{occasion.label}</span><FaArrowRight aria-hidden="true" /></Link>)}</div>
      </section>

      {userReviews.length > 0 && <section data-scene="reviews" className={styles.reviewsSection} aria-labelledby="reviews-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>{t.home.testimonialsOverline}</p><h2 id="reviews-title">{copy.guestTitle}</h2></div><p className={styles.rating}><FaStar aria-hidden="true" /><strong>{avgRating.toFixed(1)} / 5</strong><span>{siteReviews.length} {copy.guestCount}</span></p></div><div className={styles.reviewsGrid}>{userReviews.map((review) => <figure data-review-card key={review.id}><div className={styles.stars} aria-label={`${review.rating} ${copy.outOf}`}>{[1, 2, 3, 4, 5].map((star) => <FaStar key={star} aria-hidden="true" style={{ opacity: star <= Math.round(review.rating) ? 1 : 0.2 }} />)}</div><blockquote>{review.text}</blockquote><figcaption><strong>{review.userName}</strong><time dateTime={new Date(review.createdAt).toISOString()}>{dateFormat.format(new Date(review.createdAt))}</time></figcaption></figure>)}</div></section>}

      <section id="visit" data-section data-scene="visit" className={`${styles.section} ${styles.visit}`} aria-labelledby="visit-title">
        <div data-reveal="visible"><p className={styles.eyebrow}>04 / {copy.visit}</p><h2 id="visit-title">{copy.visitTitle}</h2><p className={styles.sectionDescription}>{copy.visitText}</p><address><FaLocationDot aria-hidden="true" /><span>Klaprozenweg 36a<br />1032 KL Amsterdam</span></address><a href={DIRECTIONS} target="_blank" rel="noopener noreferrer" className={styles.textLink}>{copy.directions}<FaArrowRight aria-hidden="true" /></a><a href={DIRECTIONS} target="_blank" rel="noopener noreferrer" className={styles.visitPhoto} aria-label={copy.directions}><RestaurantPhoto data-parallax src="/brand/shah-bar-v1.webp" alt={copy.barAlt} fill sizes="(min-width: 701px) 40vw, 90vw" /><span><FaLocationDot aria-hidden="true" />Amsterdam-Noord<FaArrowRight aria-hidden="true" /></span></a></div>
        <div className={styles.visitDetails}><div className={styles.hoursHeading}><h3><FaClock aria-hidden="true" />{copy.hours}</h3>{diningOpen !== null && <span className={styles.openStatus} data-open={diningOpen}>{diningOpen ? (lang === "nl" ? "Open volgens openingstijden" : "Open during scheduled hours") : (lang === "nl" ? "Gesloten volgens openingstijden" : "Closed during scheduled hours")}</span>}</div><dl className={styles.hours}><div><dt>{t.hours.tueSun}</dt><dd>15:00–22:00</dd></div><div><dt>{t.hours.monday}</dt><dd>{t.hours.closed}</dd></div></dl><ArrivalInfo /><h3>{copy.contact}</h3><a href="tel:+31203412995" className={styles.contactLink}><FaPhone aria-hidden="true" />+31 20 341 2995</a><a href="mailto:info@shahrestaurant.nl" className={styles.contactLink}><FaEnvelope aria-hidden="true" />info@shahrestaurant.nl</a><Link href="/reservations" className={styles.primaryButton}><FaCalendarCheck aria-hidden="true" />{copy.reserve}<FaArrowRight aria-hidden="true" /></Link></div>
      </section>

      <section className={`${styles.section} ${styles.faq}`} data-scene="faq" aria-labelledby="faq-title"><div data-reveal="visible"><p className={styles.eyebrow}>{copy.faq}</p><h2 id="faq-title">{copy.faqTitle}</h2><a className={styles.faqContact} href="mailto:info@shahrestaurant.nl"><FaEnvelope aria-hidden="true" />{copy.email}<FaArrowRight aria-hidden="true" /></a></div><div className={styles.faqList}>{copy.questions.map((item, index) => <details key={item.question} name="visit-questions"><summary><span className={styles.faqNumber}>0{index + 1}</span><span>{item.question}</span><FaChevronDown aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div></section>

      <DrinkPartners site="shah" />

      <section className={styles.closing} data-scene="closing" aria-labelledby="closing-title"><RestaurantPhoto data-parallax src="/brand/shah-dining-v1.webp" alt="" fill sizes="100vw" className={styles.closingImage} /><div className={styles.closingShade} /><div className={styles.closingContent} data-reveal="visible"><BrandLogo variant="mark" tone="gold" className={styles.closingMark} alt="" /><p className={styles.heroEyebrow}>Shah Restaurant</p><h2 id="closing-title">{copy.closing}</h2><p>{copy.closingText}</p><div className={styles.actions}><Link href="/reservations" className={styles.primaryButton}><FaCalendarCheck aria-hidden="true" />{copy.reserve}</Link><a href="tel:+31203412995" className={styles.heroSecondary}><FaPhone aria-hidden="true" />{copy.call}</a></div></div></section>

      <div className={styles.mobileActions}><Link href="/order"><FaUtensils aria-hidden="true" />{copy.order}</Link><Link href="/reservations"><FaCalendarCheck aria-hidden="true" />{copy.reserve}</Link></div>

      {currentPhoto && <HomeDialog titleId="photo-title" closeLabel={copy.close} onClose={() => setPhotoIndex(null)} onKeyDown={(event) => { if (event.key === "Home" || event.key === "End") { event.preventDefault(); setPhotoIndex(event.key === "Home" ? 0 : photos.length - 1); } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); changePhoto(event.key === "ArrowRight" ? 1 : -1); } }}><div className={styles.lightboxPhoto} onTouchStart={(event) => { swipeStart.current = event.touches.length === 1 ? { horizontal: event.touches[0].clientX, vertical: event.touches[0].clientY } : null; }} onTouchCancel={() => { swipeStart.current = null; }} onTouchEnd={(event) => { const start = swipeStart.current; swipeStart.current = null; const end = event.changedTouches[0]; if (start && end && Math.abs(end.clientX - start.horizontal) > 60 && Math.abs(end.clientY - start.vertical) < 50) changePhoto(end.clientX < start.horizontal ? 1 : -1); }}><RestaurantPhoto key={currentPhoto.src} src={currentPhoto.src} alt={currentPhoto.alt} fill sizes="90vw" placeholderFit="contain" /></div><div className={styles.lightboxFooter}><button type="button" onClick={() => changePhoto(-1)} aria-label={copy.previous} title={copy.previous}><FaArrowLeft aria-hidden="true" /></button><div aria-live="polite"><h2 id="photo-title">{currentPhoto.title}</h2><p>{copy.photo} {(photoIndex ?? 0) + 1} / {photos.length}</p></div><button type="button" onClick={() => changePhoto(1)} aria-label={copy.next} title={copy.next}><FaArrowRight aria-hidden="true" /></button></div><nav className={styles.photoThumbnails} aria-label={copy.photoNavigation}>{photos.map((photo, index) => <button type="button" key={photo.src} aria-label={`${copy.viewPhoto}: ${photo.title}`} title={photo.title} aria-current={index === photoIndex ? "true" : undefined} onClick={() => setPhotoIndex(index)}><RestaurantPhoto src={photo.src} alt="" fill sizes="72px" /></button>)}</nav></HomeDialog>}

      {selectedProduct && <HomeDialog titleId="dish-title" closeLabel={copy.close} onClose={() => setSelectedProduct(null)}><div className={styles.productDetails}>{selectedProduct.image && <DishPhoto key={selectedProduct.id} product={selectedProduct} large />}<p className={styles.eyebrow}>{selectedProduct.category}</p><h2 id="dish-title">{selectedProduct.name}</h2><p className={styles.productPrice}>{currency.format(selectedProduct.price)}</p><RichDescription html={(lang === "nl" && selectedProduct.detailedDescription?.nl) || selectedProduct.detailedDescription?.en || (lang === "nl" && selectedProduct.descriptionNl) || selectedProduct.description || ""} />{!!ingredients?.length && <><h3>{copy.ingredients}</h3><ul className={styles.ingredientList}>{ingredients.map((ingredient, index) => <li key={`${ingredient}-${index}`}>{ingredient}</li>)}</ul></>}{!!allergens?.length && <><h3>{copy.allergens}</h3><p className={styles.allergenList}>{allergens.join(", ")}</p></>}<p className={styles.allergyNote}>{copy.allergy}</p><Link href={`/order?dish=${encodeURIComponent(selectedProduct.id)}`} className={styles.primaryButton}><FaUtensils aria-hidden="true" />{copy.order}<FaArrowRight aria-hidden="true" /></Link></div></HomeDialog>}
      <MenuSchema products={visibleDishes} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
