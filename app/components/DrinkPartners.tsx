"use client";

import Link from "./LocaleLink";
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
  return (
    <section id="drankenpartners" className={styles.section} data-style={site} aria-labelledby="drink-partners-title">
      <div className={styles.inner}>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>{nl ? "Onze drankenpartners" : "Our drinks partners"}</p>
            <h2 id="drink-partners-title" className={styles.title}>{nl ? "Goed gezelschap. Ook in je glas." : "Good company. In your glass, too."}</h2>
          </div>
          <p className={styles.introduction}>{introductions[site][nl ? "nl" : "en"]}</p>
        </div>
        <ul className={styles.grid}>
          {partners.map(partner => (
            <li key={partner.file} className={styles.partner}>
              <div className={styles.logoPanel} data-light={partner.light}>
                {/* Exact partner artwork: lossless AVIF is 3x larger than these WebPs. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles.logo} src={`/partners/${partner.file}-v1.webp`} alt={`${partner.name} logo`} width={partner.width} height={partner.height} loading="lazy" decoding="async" />
              </div>
              <h3 className={styles.brand}>{partner.name}</h3>
              <p className={styles.description}>{partner[nl ? "nl" : "en"]}</p>
            </li>
          ))}
        </ul>
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
