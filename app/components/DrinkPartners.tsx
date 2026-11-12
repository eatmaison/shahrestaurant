"use client";

import Link from "./LocaleLink";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useLang } from "../providers";
import styles from "./DrinkPartners.module.css";

type Site = "shah" | "tandoor" | "eattogo";

const partners = [
  { name: "Coca-Cola", file: "coca-cola", width: 640, height: 209, light: false,
    nl: "Een vertrouwde frisdrank bij je favoriete gerecht.",
    en: "A familiar soft drink alongside your favourite dish." },
  { name: "Heineken", file: "heineken", width: 640, height: 344, light: true,
    nl: "Heineken bier voor bij het eten of een ontspannen avond aan tafel.",
    en: "Heineken beer to enjoy with your meal or a relaxed evening at the table." },
  { name: "De Kuyper", file: "de-kuyper", width: 640, height: 281, light: false,
    nl: "Cocktails met De Kuyper: een smaakvol begin van je avond.",
    en: "Cocktails with De Kuyper: a flavourful start to your evening." },
  { name: "Chaudfontaine", file: "chaudfontaine", width: 640, height: 160, light: true,
    nl: "Chaudfontaine mineraalwater als verfrissende aanvulling bij je maaltijd.",
    en: "Chaudfontaine mineral water, a refreshing companion to your meal." },
] as const;

const introductions = {
  shah: {
    nl: "Bij Shah Restaurant in Amsterdam-Noord hoort een goed glas bij gastvrij tafelen. Ontdek de vertrouwde merken achter onze frisdranken, bier, cocktails en mineraalwater.",
    en: "At Shah Restaurant in Amsterdam-Noord, a good drink is part of a warm welcome. Discover the familiar names behind our soft drinks, beer, cocktails and mineral water.",
  },
  tandoor: {
    nl: "Van een kruidige curry tot een gerecht uit de tandoor: maak je diner bij The Tandoor Company in Amsterdam-Noord compleet met een verfrissend drankje.",
    en: "From a fragrant curry to a dish from the tandoor, complete your dinner at The Tandoor Company in Amsterdam-Noord with a refreshing drink.",
  },
  eattogo: {
    nl: "Een wrap, burger of pizza smaakt nog beter met iets verfrissends erbij. Dit zijn onze drankenpartners bij EatToGo in Amsterdam-Noord. Bekijk het bestelmenu voor het actuele aanbod om af te halen of te laten bezorgen.",
    en: "A wrap, burger or pizza is even better with a refreshing drink. Meet our drinks partners at EatToGo in Amsterdam-Noord. See the order menu for the current takeaway and delivery selection.",
  },
};

export function DrinkPartners({ site }: { site: Site }) {
  const { lang } = useLang();
  const nl = lang === "nl";
  const railId = useId();
  const railRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLUListElement>(null);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [staticMotion, setStaticMotion] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    const update = () => setStaticMotion(preference.matches || typeof window.IntersectionObserver !== "function" || typeof window.ResizeObserver !== "function");
    queueMicrotask(() => { if (!disposed) { update(); setReady(true); } });
    preference.addEventListener("change", update);
    return () => { disposed = true; preference.removeEventListener("change", update); };
  }, []);

  useEffect(() => {
    const rail = railRef.current, group = groupRef.current;
    if (!rail || !group || !ready || paused || hovered || staticMotion) return;
    let frame = 0, previous = 0, distance = 0, visible = false, position = rail.scrollLeft;
    const stop = () => { cancelAnimationFrame(frame); frame = 0; previous = 0; rail.dataset.partnerRunning = "false"; };
    const schedule = () => {
      if (!visible || document.hidden || distance <= 0) { stop(); return; }
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const tick = (time: number) => {
      frame = 0;
      if (!visible || document.hidden) { stop(); return; }
      if (previous) {
        position = (position + Math.min(64, time - previous) * 0.028) % distance;
        rail.scrollLeft = position;
      }
      previous = time;
      rail.dataset.partnerRunning = "true";
      schedule();
    };
    const measure = () => {
      distance = group.getBoundingClientRect().width + parseFloat(getComputedStyle(group.parentElement!).columnGap || "0");
      if (distance > 0) { position = rail.scrollLeft % distance; rail.scrollLeft = position; }
      schedule();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting && entry.intersectionRatio >= 0.1; schedule(); }, { threshold: 0.1 });
    const resize = new ResizeObserver(measure);
    observer.observe(rail); resize.observe(rail); resize.observe(group); measure();
    document.addEventListener("visibilitychange", schedule);
    return () => { stop(); observer.disconnect(); resize.disconnect(); document.removeEventListener("visibilitychange", schedule); };
  }, [ready, paused, hovered, staticMotion]);

  const move = (direction: number) => {
    setPaused(true);
    const rail = railRef.current, group = groupRef.current;
    if (rail && group) {
      const step = (group.firstElementChild?.getBoundingClientRect().width ?? 220) + parseFloat(getComputedStyle(group).columnGap || "0");
      rail.scrollBy({ left: direction * step, behavior: staticMotion ? "instant" : "smooth" });
    }
  };
  const keyMove = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); }
    else if (event.key === "Home" || event.key === "End") {
      event.preventDefault(); setPaused(true);
      const rail = railRef.current;
      if (rail) rail.scrollTo({ left: event.key === "Home" ? 0 : Math.max(0, (groupRef.current?.scrollWidth ?? 0) - rail.clientWidth), behavior: "instant" });
    }
  };
  const card = (partner: typeof partners[number], clone = false) => <>
    <div className={styles.logoPanel} data-light={partner.light}>
      {/* Exact partner artwork: lossless AVIF is 3x larger than these WebPs. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.logo} src={`/partners/${partner.file}-v1.webp`} alt={clone ? "" : `${partner.name} logo`} width={partner.width} height={partner.height} loading="lazy" decoding="async" />
    </div>
    <h3 className={styles.brand}>{partner.name}</h3>
    <p className={styles.description}>{partner[nl ? "nl" : "en"]}</p>
  </>;
  return (
    <section id="drankenpartners" className={styles.section} data-style={site} data-enhanced={ready} data-paused={paused || hovered || staticMotion} aria-labelledby="drink-partners-title">
      <div className={styles.inner}>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>{nl ? "Onze drankenpartners" : "Our drinks partners"}</p>
            <h2 id="drink-partners-title" className={styles.title}>{nl ? "Goed gezelschap. Ook in je glas." : "Good company. In your glass, too."}</h2>
          </div>
          <p className={styles.introduction}>{introductions[site][nl ? "nl" : "en"]}</p>
        </div>
        <p id={`${railId}-help`} className="sr-only">{nl ? "Drankenpartners. Veeg horizontaal of gebruik de pijltjestoetsen om alle vier te bekijken. Aanraken of toetsenbordfocus pauzeert de beweging." : "Drinks partners. Swipe horizontally or use the arrow keys to explore all four. Touch or keyboard focus pauses the motion."}</p>
        <div className={styles.railShell} onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }} onPointerLeave={() => setHovered(false)}>
          {ready && !staticMotion && <button type="button" className={styles.pauseControl} aria-controls={railId} onFocus={() => setPaused(true)} onClick={() => setPaused(value => !value)}>{paused ? (nl ? "Afspelen" : "Play") : (nl ? "Pauzeren" : "Pause")}</button>}
        <div id={railId} ref={railRef} className={styles.viewport} role="region" aria-label={nl ? "Onze vier drankenpartners" : "Our four drinks partners"} aria-describedby={`${railId}-help`} tabIndex={0} onKeyDown={keyMove} onFocus={() => setPaused(true)} onPointerDown={() => setPaused(true)} onWheel={event => { if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) setPaused(true); }}>
          <div className={styles.track}>
            <ul ref={groupRef} className={styles.group} role="list">{partners.map(partner => <li key={partner.file} className={styles.partner}>{card(partner)}</li>)}</ul>
            <div className={`${styles.group} ${styles.clone}`} aria-hidden="true" inert>{partners.map(partner => <div key={partner.file} className={styles.partner}>{card(partner, true)}</div>)}</div>
          </div>
        </div>
        </div>
        <div className={styles.bottom}>
          <p>{nl ? "Benieuwd wat er op de kaart staat?" : "Curious about our menu?"}</p>
          <div className={styles.links}>
            <Link href="/order" className={styles.menuLink}>{nl ? "Bekijk eten & drinken" : "Explore food & drinks"}<span aria-hidden="true">↗</span></Link>
            {site !== "eattogo" && <Link href="/reservations" className={styles.reserveLink}>{nl ? "Reserveer een tafel" : "Book a table"}<span aria-hidden="true">→</span></Link>}
          </div>
        </div>
      </div>
    </section>
  );
}
