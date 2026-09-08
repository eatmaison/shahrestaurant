"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { FaArrowDown, FaArrowLeft, FaArrowRight, FaBagShopping, FaCalendarCheck, FaChevronDown, FaClock, FaEnvelope, FaExpand, FaFireBurner, FaLocationDot, FaMagnifyingGlass, FaPause, FaPhone, FaPlay, FaStar, FaUtensils, FaUsers, FaXmark } from "react-icons/fa6";
import { useLang, useStore } from "./providers";
import { SITE_ID } from "./lib/data";
import type { Product } from "./lib/types";
import { homeContent } from "./lib/homeContent";
import { HomeDialog } from "./components/HomeDialog";
import { HomeDepth, useHomeMotion, useHomeTilt } from "./components/HomeDepth";
import styles from "./home.module.css";

const SIGNATURE_IDS = ["tdc-butter-chicken", "tdc-tandoori-mixed-grill", "tdc-tandoori-lamb-chops", "tdc-biryani-lamb", "tdc-tandoori-chicken-tikka", "tdc-samosa-chaat"];
const DIRECTIONS = "https://www.google.com/maps/dir/?api=1&destination=Klaprozenweg+36a+1032+KL+Amsterdam";

function DishPhoto({ product, large = false }: { product: Product; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <span className={large ? styles.productPhoto : styles.dishPhoto}>{product.image && !failed
    ? <Image src={product.image} alt={large ? product.name : ""} fill sizes={large ? "(min-width: 700px) 540px, 90vw" : "72px"} unoptimized onError={() => setFailed(true)} />
    : <FaUtensils aria-hidden="true" />}</span>;
}

export default function Home() {
  const { t, lang } = useLang();
  const { products, reviews, restaurantStatus, hydrated } = useStore();
  const copy = homeContent[lang];
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const swipeStart = useRef<{ horizontal: number; vertical: number } | null>(null);
  const { enabled: motionEnabled, reduced: reducedMotion, toggleMotion } = useHomeMotion();
  useHomeTilt(rootRef, motionEnabled);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const [activeSection, setActiveSection] = useState("menu");
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const menu = products.filter((product) => product.brand === "tandoor");
  const curated = SIGNATURE_IDS.flatMap((id) => menu.filter((product) => product.id === id));
  const featured = [...curated, ...menu.filter((product) => !SIGNATURE_IDS.includes(product.id))].slice(0, 6);
  const categories = [...new Set(menu.map((product) => product.category))];
  const selectedCategory = categories.includes(category) ? category : "";
  const searchTerm = deferredSearch.trim().toLocaleLowerCase(lang);
  const candidates = selectedCategory ? menu.filter((product) => product.category === selectedCategory) : searchTerm ? menu : featured;
  const matchedDishes = candidates.filter((product) => !searchTerm || [product.name, product.description, product.descriptionNl, product.category, ...(product.ingredients || []), ...(product.ingredientsNl || [])].join(" ").toLocaleLowerCase(lang).includes(searchTerm));
  const visibleDishes = showAll ? matchedDishes : matchedDishes.slice(0, 6);
  const siteReviews = reviews.filter((review) => review.site === SITE_ID && Number.isFinite(review.rating) && review.rating >= 1 && review.rating <= 5);
  const userReviews = siteReviews.filter((review) => review.text.trim()).slice(0, 3);
  const avgRating = siteReviews.length ? siteReviews.reduce((sum, review) => sum + review.rating, 0) / siteReviews.length : 0;
  const currency = new Intl.NumberFormat(lang === "nl" ? "nl-NL" : "en-IE", { style: "currency", currency: "EUR" });
  const dateFormat = new Intl.DateTimeFormat(lang === "nl" ? "nl-NL" : "en-GB", { month: "long", year: "numeric", timeZone: "Europe/Amsterdam" });
  const sections = [{ id: "menu", label: copy.menu }, { id: "atmosphere", label: copy.atmosphere }, { id: "story", label: copy.story }, { id: "visit", label: copy.visit }];
  const photos = [
    { src: "/photos/687A0402.jpeg", title: copy.table, alt: copy.tableAlt },
    { src: "/photos/687A0412.jpeg", title: copy.tandoor, alt: copy.dishAlt },
    { src: "/photos/687A0343.jpeg", title: copy.bar, alt: copy.barAlt },
    { src: "/photos/687A0260.jpeg", title: copy.drinks, alt: copy.drinksAlt },
    { src: "/photos/687A0336.jpeg", title: copy.room, alt: copy.interiorAlt },
  ];
  const currentPhoto = photoIndex === null ? null : photos[photoIndex];
  const ingredients = selectedProduct && ((lang === "nl" && selectedProduct.ingredientsNl?.length ? selectedProduct.ingredientsNl : selectedProduct.ingredients) || []);
  const allergens = selectedProduct && ((lang === "nl" && selectedProduct.allergensNl?.length ? selectedProduct.allergensNl : selectedProduct.allergens) || []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !("IntersectionObserver" in window)) return;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).dataset.reveal = "visible";
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    const revealAll = () => {
      if (motionQuery.matches) root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => { element.dataset.reveal = "visible"; });
    };
    root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => {
      if (!motionQuery.matches && element.getBoundingClientRect().top > window.innerHeight) element.dataset.reveal = "pending";
      revealObserver.observe(element);
    });
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(entry.target.id); });
    }, { rootMargin: "-20% 0px -55% 0px", threshold: 0 });
    root.querySelectorAll("[data-section]").forEach((section) => sectionObserver.observe(section));
    motionQuery.addEventListener("change", revealAll);
    return () => { revealObserver.disconnect(); sectionObserver.disconnect(); motionQuery.removeEventListener("change", revealAll); };
  }, []);

  function resetMenu() {
    setSearch("");
    setCategory("");
    setShowAll(false);
    searchRef.current?.focus();
  }

  function changePhoto(direction: number) {
    setPhotoIndex((index) => ((index ?? 0) + direction + photos.length) % photos.length);
  }

  const reviewsJsonLd = siteReviews.length ? {
    "@context": "https://schema.org", "@type": "Restaurant", "@id": "https://shahrestaurant.nl", name: "Shah Restaurant",
    aggregateRating: { "@type": "AggregateRating", ratingValue: Number(avgRating.toFixed(1)), reviewCount: siteReviews.length, bestRating: 5, worstRating: 1 },
    review: userReviews.map((review) => ({ "@type": "Review", author: { "@type": "Person", name: review.userName }, reviewBody: review.text, reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5 } })),
  } : null;
  const productsJsonLd = {
    "@context": "https://schema.org", "@type": "ItemList",
    itemListElement: featured.map((product, index) => ({ "@type": "ListItem", position: index + 1, item: { "@type": "Product", name: product.name, description: product.description, offers: { "@type": "Offer", price: product.price, priceCurrency: "EUR", url: "https://shahrestaurant.nl/order" } } })),
  };
  const organizationJsonLd = {
    "@context": "https://schema.org", "@type": "Organization", name: "Amsterdam Restaurant Group", url: "https://shahrestaurant.nl",
    subOrganization: [{ "@type": "Restaurant", name: "Shah Restaurant", url: "https://shahrestaurant.nl" }, { "@type": "Restaurant", name: "The Maison", url: "https://themaison.nl" }, { "@type": "Restaurant", name: "Eat to go", url: "https://eattogo.nl" }],
  };

  return (
    <div ref={rootRef} className={styles.home} data-motion={motionEnabled ? "on" : "off"}>
      <div className={styles.scrollProgress} aria-hidden="true" />
      <section className={styles.hero} aria-labelledby="home-title">
        <Image src="/photos/687A0343.jpeg" alt={copy.barAlt} fill loading="eager" fetchPriority="high" sizes="100vw" className={styles.heroImage} />
        <HomeDepth enabled={motionEnabled} rootRef={rootRef} />
        <div className={styles.heroShade} />
        <div className={styles.heroTopline}><span>Amsterdam-Noord</span><span>Indian kitchen & hospitality</span></div>
        <button type="button" className={styles.motionToggle} onClick={toggleMotion} aria-pressed={motionEnabled} disabled={reducedMotion} aria-label={reducedMotion ? copy.reducedMotion : motionEnabled ? copy.pauseMotion : copy.resumeMotion} title={reducedMotion ? copy.reducedMotion : motionEnabled ? copy.pauseMotion : copy.resumeMotion}>{motionEnabled ? <FaPause aria-hidden="true" /> : <FaPlay aria-hidden="true" />}</button>
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>Fine Indian Dining</p>
          <h1 id="home-title" className={styles.heroTitle}><span>Shah</span><span>Restaurant</span></h1>
          <p className={styles.heroSubtitle}>{copy.introduction}</p>
          <div className={styles.actions}>
            <Link href="/reservations" className={styles.primaryButton}><FaCalendarCheck aria-hidden="true" />{copy.reserve}<FaArrowRight aria-hidden="true" /></Link>
            <a href="#menu" className={styles.heroSecondary}>{copy.menu}<FaArrowDown aria-hidden="true" /></a>
          </div>
        </div>
        <a href="#menu" className={styles.heroMenuLink}><span>01 / {copy.kitchen}</span><strong>{copy.browseDishes}</strong><FaArrowDown aria-hidden="true" /></a>
        <div className={styles.heroFoot}>
          <a href={DIRECTIONS} target="_blank" rel="noopener noreferrer"><FaLocationDot aria-hidden="true" />Klaprozenweg 36a</a>
          <a href="#intro" className={styles.discover}>{copy.explore}<FaArrowDown aria-hidden="true" /></a>
          <span><FaClock aria-hidden="true" />{t.hours.tueSun} · 17:00–22:30</span>
        </div>
      </section>

      <nav className={styles.sectionNav} aria-label={copy.explore}>
        <div className={styles.sectionNavInner}>
          {sections.map((section) => <a key={section.id} href={`#${section.id}`} aria-current={activeSection === section.id ? "location" : undefined}>{section.label}</a>)}
          <Link href="/reservations" className={styles.navReserve}><FaCalendarCheck aria-hidden="true" />{copy.reserve}</Link>
        </div>
      </nav>

      <section id="intro" className={`${styles.section} ${styles.intro}`} aria-labelledby="intro-title">
        <div data-reveal="visible"><p className={styles.eyebrow}>{t.home.aboutOverline}</p><h2 id="intro-title">{copy.welcome}</h2></div>
        <div data-reveal="visible"><p className={styles.lead}>{copy.welcomeText}</p><div className={styles.facts}><span><FaFireBurner aria-hidden="true" />{copy.food}</span><span><FaUsers aria-hidden="true" />{copy.family}</span><span><FaLocationDot aria-hidden="true" />{copy.location}</span></div></div>
      </section>

      <section id="menu" data-section className={`${styles.section} ${styles.menuSection}`} aria-labelledby="menu-title">
        <div className={styles.menuVisual} data-reveal="visible">
          <div className={styles.menuPhoto} data-tilt><Image src="/photos/687A0412.jpeg" alt={copy.dishAlt} fill sizes="(min-width: 1000px) 42vw, 100vw" /><span className={styles.photoLabel}>{copy.fromMenu}<FaFireBurner aria-hidden="true" /></span></div>
          <div className={styles.photoCaption}><span>Shah Restaurant</span><span>{copy.kitchen}</span></div>
          <p className={styles.menuAside}>{copy.kitchenNote}</p>
          <a href="#atmosphere" className={styles.menuInset} data-tilt><span className={styles.menuInsetPhoto}><Image src="/photos/687A0402.jpeg" alt={copy.tableAlt} fill sizes="180px" /></span><span>{copy.table}<FaArrowRight aria-hidden="true" /></span></a>
        </div>
        <div className={styles.menuContent} data-reveal="visible">
          <p className={styles.eyebrow}>01 / {copy.kitchen}</p><h2 id="menu-title">{copy.menuTitle}</h2><p className={styles.sectionDescription}>{copy.menuText}</p>
          <div className={styles.menuSearch}><FaMagnifyingGlass aria-hidden="true" /><label className="sr-only" htmlFor="dish-search">{copy.searchMenu}</label><input ref={searchRef} id="dish-search" type="search" autoComplete="off" value={search} placeholder={copy.searchPlaceholder} onChange={(event) => { setSearch(event.target.value); setShowAll(false); }} />{search && <button type="button" onClick={() => { setSearch(""); setShowAll(false); searchRef.current?.focus(); }} aria-label={copy.clearSearch} title={copy.clearSearch}><FaXmark aria-hidden="true" /></button>}</div>
          <fieldset className={styles.filters}>
            <legend className="sr-only">{copy.category}</legend>
            {[{ value: "", label: copy.signature }, ...categories.map((value) => ({ value, label: value }))].map((option) => (
              <label key={option.value}><input type="radio" name="home-menu-category" value={option.value} checked={selectedCategory === option.value} onChange={() => { setCategory(option.value); setShowAll(false); }} /><span>{option.value === "" && searchTerm ? copy.allCategories : option.label}</span></label>
            ))}
          </fieldset>
          <div className={styles.menuMeta}><span>{copy.menuSelection}</span><span>{hydrated ? `${matchedDishes.length} ${copy.menuCount}` : copy.menuLoading}</span></div>
          <div className={styles.menuResults} aria-busy={!hydrated || search !== deferredSearch}>
            {!hydrated ? <div className={styles.menuSkeleton} role="status" aria-label={copy.menuLoading}>{[0, 1, 2, 3].map((index) => <span key={index} />)}</div> : visibleDishes.length ? <ul className={styles.dishes}>
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

      <section id="atmosphere" data-section className={styles.gallerySection} aria-labelledby="gallery-title">
        <div className={styles.sectionHeading} data-reveal="visible"><div><p className={styles.eyebrow}>02 / {copy.atmosphere}</p><h2 id="gallery-title">{copy.galleryTitle}</h2></div><p>{copy.galleryText}</p></div>
        <div className={styles.galleryGrid}>
          {photos.slice(0, 3).map((photo, index) => <figure key={photo.src} className={styles.galleryItem} data-reveal="visible"><button type="button" data-tilt onClick={() => setPhotoIndex(index)} aria-label={`${copy.enlarge}: ${photo.title}`} title={`${copy.enlarge}: ${photo.title}`}><Image src={photo.src} alt={photo.alt} fill sizes={index === 0 ? "(min-width: 800px) 50vw, 100vw" : "(min-width: 800px) 25vw, 50vw"} /><span className={styles.galleryPhotoNumber}>0{index + 1}</span><span className={styles.expandIcon}><FaExpand aria-hidden="true" /></span></button><figcaption><span>{photo.title}</span><span>0{index + 1}</span></figcaption></figure>)}
        </div>
        <div className={styles.galleryFooter}><Link href="/events/gallery" className={styles.textLink}>{copy.fullGallery}<FaArrowRight aria-hidden="true" /></Link></div>
      </section>

      <section id="story" data-section className={styles.storySection} aria-labelledby="story-title">
        <div className={styles.storyInner}>
          <div className={styles.storyContent} data-reveal="visible"><p className={styles.eyebrow}>03 / {copy.story}</p><h2 id="story-title">{t.home.storyTitle}</h2><p>{t.home.storyText}</p><blockquote>{t.home.storyQuote}</blockquote><Link href="/events/about" className={styles.textLink}>{copy.storyLink}<FaArrowRight aria-hidden="true" /></Link></div>
          <figure className={styles.storyPhoto} data-reveal="visible"><div data-tilt><Image src="/photos/687A0210.jpeg" alt={copy.interiorAlt} fill sizes="(min-width: 900px) 45vw, 100vw" /><span className={styles.storyPhotoMark} aria-hidden="true">Shah</span></div><figcaption><span>{copy.storyAside}</span><FaFireBurner aria-hidden="true" /></figcaption></figure>
        </div>
      </section>

      <section className={`${styles.section} ${styles.eveningSection}`} aria-labelledby="evening-title">
        <div className={styles.sectionHeading} data-reveal="visible"><div><p className={styles.eyebrow}>{copy.tableNote}</p><h2 id="evening-title">{copy.evening}</h2></div></div>
        <div className={styles.eveningGrid}>{[
          { href: "/reservations", title: copy.dine, text: copy.dineText, action: copy.reserve, image: photos[0], Icon: FaCalendarCheck },
          { href: "/order", title: copy.takeaway, text: copy.takeawayText, action: copy.order, image: photos[1], Icon: FaBagShopping },
          { href: "/events", title: copy.gather, text: copy.gatherText, action: copy.exploreEvents, image: photos[4], Icon: FaUsers },
        ].map(({ href, title, text, action, image, Icon }, index) => <article key={href} className={styles.eveningItem} data-reveal="visible"><Link href={href} className={styles.eveningPhoto} data-tilt aria-label={action}><Image src={image.src} alt={image.alt} fill sizes="(min-width: 701px) 30vw, 100vw" /><span><Icon aria-hidden="true" /></span><span className={styles.eveningNumber}>0{index + 1}</span></Link><h3>{title}</h3><p>{text}</p><Link href={href} className={styles.textLink}>{action}<FaArrowRight aria-hidden="true" /></Link></article>)}</div>
      </section>

      <section className={`${styles.section} ${styles.occasions}`} aria-labelledby="occasions-title">
        <div data-reveal="visible"><p className={styles.eyebrow}>{copy.occasions}</p><h2 id="occasions-title">{copy.occasionsTitle}</h2><p className={styles.sectionDescription}>{copy.occasionsText}</p></div>
        <div className={styles.occasionLinks} data-reveal="visible">{[{ href: "/events/birthdays", label: copy.birthdays }, { href: "/events/celebrations", label: copy.celebrations }, { href: "/events/company-catering", label: copy.company }].map((occasion, index) => <Link key={occasion.href} href={occasion.href}><span className={styles.occasionNumber}>0{index + 1}</span><span>{occasion.label}</span><FaArrowRight aria-hidden="true" /></Link>)}</div>
      </section>

      {userReviews.length > 0 && <section className={styles.reviewsSection} aria-labelledby="reviews-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>{t.home.testimonialsOverline}</p><h2 id="reviews-title">{copy.guestTitle}</h2></div><p className={styles.rating}><FaStar aria-hidden="true" /><strong>{avgRating.toFixed(1)} / 5</strong><span>{siteReviews.length} {copy.guestCount}</span></p></div><div className={styles.reviewsGrid}>{userReviews.map((review) => <figure key={review.id}><div className={styles.stars} aria-label={`${review.rating} ${copy.outOf}`}>{[1, 2, 3, 4, 5].map((star) => <FaStar key={star} aria-hidden="true" style={{ opacity: star <= Math.round(review.rating) ? 1 : 0.2 }} />)}</div><blockquote>{review.text}</blockquote><figcaption><strong>{review.userName}</strong><time dateTime={new Date(review.createdAt).toISOString()}>{dateFormat.format(new Date(review.createdAt))}</time></figcaption></figure>)}</div></section>}

      <section id="visit" data-section className={`${styles.section} ${styles.visit}`} aria-labelledby="visit-title">
        <div data-reveal="visible"><p className={styles.eyebrow}>04 / {copy.visit}</p><h2 id="visit-title">{copy.visitTitle}</h2><p className={styles.sectionDescription}>{copy.visitText}</p><address><FaLocationDot aria-hidden="true" /><span>Klaprozenweg 36a<br />1032 KL Amsterdam</span></address><a href={DIRECTIONS} target="_blank" rel="noopener noreferrer" className={styles.textLink}>{copy.directions}<FaArrowRight aria-hidden="true" /></a><a href={DIRECTIONS} target="_blank" rel="noopener noreferrer" className={styles.visitPhoto} aria-label={copy.directions}><Image src="/photos/687A0343.jpeg" alt={copy.barAlt} fill sizes="(min-width: 701px) 40vw, 90vw" /><span><FaLocationDot aria-hidden="true" />Amsterdam-Noord<FaArrowRight aria-hidden="true" /></span></a></div>
        <div className={styles.visitDetails} data-reveal="visible"><div className={styles.hoursHeading}><h3><FaClock aria-hidden="true" />{copy.hours}</h3>{typeof restaurantStatus.isOpen === "boolean" && <span className={styles.openStatus} data-open={restaurantStatus.isOpen}>{restaurantStatus.isOpen ? t.hours.openNow : t.hours.closedNow}</span>}</div><dl className={styles.hours}><div><dt>{t.hours.tueSun}</dt><dd>17:00–22:30</dd></div><div><dt>{t.hours.monday}</dt><dd>{t.hours.closed}</dd></div></dl><h3>{copy.contact}</h3><a href="tel:+31203412995" className={styles.contactLink}><FaPhone aria-hidden="true" />+31 20 341 2995</a><a href="mailto:info@shahrestaurant.nl" className={styles.contactLink}><FaEnvelope aria-hidden="true" />info@shahrestaurant.nl</a><Link href="/reservations" className={styles.primaryButton}><FaCalendarCheck aria-hidden="true" />{copy.reserve}<FaArrowRight aria-hidden="true" /></Link></div>
      </section>

      <section className={`${styles.section} ${styles.faq}`} aria-labelledby="faq-title"><div data-reveal="visible"><p className={styles.eyebrow}>{copy.faq}</p><h2 id="faq-title">{copy.faqTitle}</h2><a className={styles.faqContact} href="mailto:info@shahrestaurant.nl"><FaEnvelope aria-hidden="true" />{copy.email}<FaArrowRight aria-hidden="true" /></a></div><div className={styles.faqList}>{copy.questions.map((item, index) => <details key={item.question} name="visit-questions"><summary><span className={styles.faqNumber}>0{index + 1}</span><span>{item.question}</span><FaChevronDown aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div></section>

      <section className={styles.closing} aria-labelledby="closing-title"><Image src="/photos/687A0402.jpeg" alt="" fill sizes="100vw" className={styles.closingImage} /><div className={styles.closingShade} /><div className={styles.closingContent} data-reveal="visible"><p className={styles.heroEyebrow}>Shah Restaurant</p><h2 id="closing-title">{copy.closing}</h2><p>{copy.closingText}</p><div className={styles.actions}><Link href="/reservations" className={styles.primaryButton}><FaCalendarCheck aria-hidden="true" />{copy.reserve}</Link><a href="tel:+31203412995" className={styles.heroSecondary}><FaPhone aria-hidden="true" />{copy.call}</a></div></div></section>

      <div className={styles.mobileActions}><Link href="/order"><FaUtensils aria-hidden="true" />{copy.order}</Link><Link href="/reservations"><FaCalendarCheck aria-hidden="true" />{copy.reserve}</Link></div>

      {currentPhoto && <HomeDialog titleId="photo-title" closeLabel={copy.close} onClose={() => setPhotoIndex(null)} onKeyDown={(event) => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); changePhoto(event.key === "ArrowRight" ? 1 : -1); } }}><div className={styles.lightboxPhoto} onTouchStart={(event) => { swipeStart.current = event.touches.length === 1 ? { horizontal: event.touches[0].clientX, vertical: event.touches[0].clientY } : null; }} onTouchCancel={() => { swipeStart.current = null; }} onTouchEnd={(event) => { const start = swipeStart.current; swipeStart.current = null; const end = event.changedTouches[0]; if (start && end && Math.abs(end.clientX - start.horizontal) > 60 && Math.abs(end.clientY - start.vertical) < 50) changePhoto(end.clientX < start.horizontal ? 1 : -1); }}><Image key={currentPhoto.src} src={currentPhoto.src} alt={currentPhoto.alt} fill sizes="90vw" /></div><div className={styles.lightboxFooter}><button type="button" onClick={() => changePhoto(-1)} aria-label={copy.previous} title={copy.previous}><FaArrowLeft aria-hidden="true" /></button><div aria-live="polite"><h2 id="photo-title">{currentPhoto.title}</h2><p>{copy.photo} {(photoIndex ?? 0) + 1} / {photos.length}</p></div><button type="button" onClick={() => changePhoto(1)} aria-label={copy.next} title={copy.next}><FaArrowRight aria-hidden="true" /></button></div><nav className={styles.photoThumbnails} aria-label={copy.photoNavigation}>{photos.map((photo, index) => <button type="button" key={photo.src} aria-label={`${copy.viewPhoto}: ${photo.title}`} title={photo.title} aria-current={index === photoIndex ? "true" : undefined} onClick={() => setPhotoIndex(index)}><Image src={photo.src} alt="" fill sizes="72px" /></button>)}</nav></HomeDialog>}

      {selectedProduct && <HomeDialog titleId="dish-title" closeLabel={copy.close} onClose={() => setSelectedProduct(null)}><div className={styles.productDetails}>{selectedProduct.image && <DishPhoto key={selectedProduct.id} product={selectedProduct} large />}<p className={styles.eyebrow}>{selectedProduct.category}</p><h2 id="dish-title">{selectedProduct.name}</h2><p className={styles.productPrice}>{currency.format(selectedProduct.price)}</p><p>{(lang === "nl" && selectedProduct.detailedDescription?.nl) || selectedProduct.detailedDescription?.en || (lang === "nl" && selectedProduct.descriptionNl) || selectedProduct.description}</p>{!!ingredients?.length && <><h3>{copy.ingredients}</h3><ul className={styles.ingredientList}>{ingredients.map((ingredient, index) => <li key={`${ingredient}-${index}`}>{ingredient}</li>)}</ul></>}{!!allergens?.length && <><h3>{copy.allergens}</h3><p className={styles.allergenList}>{allergens.join(", ")}</p></>}<p className={styles.allergyNote}>{copy.allergy}</p><Link href="/order" className={styles.primaryButton}><FaUtensils aria-hidden="true" />{copy.order}<FaArrowRight aria-hidden="true" /></Link></div></HomeDialog>}
      {[reviewsJsonLd, productsJsonLd, organizationJsonLd].filter(Boolean).map((schema, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />)}
    </div>
  );
}