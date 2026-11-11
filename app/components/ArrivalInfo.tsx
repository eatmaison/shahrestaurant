"use client";

import { useLang } from "../providers";
import styles from "./ArrivalInfo.module.css";

export function ArrivalInfo() {
  const { lang } = useLang();
  return <div className={styles.arrival}>
    <h3>{lang === "nl" ? "Hoe kom ik bij Shah Restaurant?" : "How do I get to Shah Restaurant?"}</h3>
    <p>{lang === "nl"
      ? "Ons adres is Klaprozenweg 36a, 1032 KL Amsterdam, in Amsterdam-Noord. Plan uw reis naar dit adres met de actuele routeplanner."
      : "Find us at Klaprozenweg 36a, 1032 KL Amsterdam, in Amsterdam-Noord. Plan your journey to this address using a current route planner."}</p>
    <div>
      <a href="https://9292.nl/en" target="_blank" rel="noopener noreferrer">{lang === "nl" ? "Plan uw reis met het openbaar vervoer" : "Plan your public transport journey"}</a>
      <a href="https://www.google.com/maps/dir/?api=1&destination=Klaprozenweg+36a+1032+KL+Amsterdam" target="_blank" rel="noopener noreferrer">{lang === "nl" ? "Route naar Klaprozenweg 36a" : "Directions to Klaprozenweg 36a"}</a>
    </div>
    <p>{lang === "nl"
      ? "Vragen over parkeren, het stallen van uw fiets of toegankelijkheid? Bel ons vóór uw bezoek op +31 20 341 2995 om de mogelijkheden te bespreken."
      : "Questions about car parking, bicycle parking or accessibility? Call +31 20 341 2995 before your visit to discuss the options."}</p>
  </div>;
}
