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
    <p>{lang === "nl"
      ? "GVB-bus 38 stopt bij halte Klaprozenweg. Controleer voor vertrek de actuele halte-informatie en uw route."
      : "GVB bus 38 serves the Klaprozenweg stop. Check the current stop information and your route before travelling."}</p>
    <p>{lang === "nl"
      ? "U kunt gratis parkeren aan de overkant bij KARWEI. Volg de borden en voorwaarden op het parkeerterrein."
      : "Free parking is available across the road by KARWEI. Follow the signs and conditions at the car park."}</p>
    <div>
      <a href="https://www.gvb.nl/reisinformatie/halte/NL%3AS%3A30001401" target="_blank" rel="noopener noreferrer">{lang === "nl" ? "Bekijk halte Klaprozenweg bij GVB" : "Check Klaprozenweg stop with GVB"}</a>
      <a href={lang === "nl" ? "https://9292.nl/" : "https://9292.nl/en"} target="_blank" rel="noopener noreferrer">{lang === "nl" ? "Plan uw reis met het openbaar vervoer" : "Plan your public transport journey"}</a>
      <a href="https://www.google.com/maps/dir/?api=1&destination=Klaprozenweg+36a+1032+KL+Amsterdam" target="_blank" rel="noopener noreferrer">{lang === "nl" ? "Route naar Klaprozenweg 36a" : "Directions to Klaprozenweg 36a"}</a>
      <a href="https://www.amsterdam.nl/parkeren/parkeertarieven-kaart/" target="_blank" rel="noopener noreferrer">{lang === "nl" ? "Controleer parkeerzones en betaaltijden op de gemeentelijke kaart" : "Check parking zones and paid hours on the city map"}</a>
    </div>
    <p>{lang === "nl"
      ? "Vragen over het stallen van uw fiets of toegankelijkheid? Bel ons vóór uw bezoek op +31 20 341 2995 om de mogelijkheden te bespreken."
      : "Questions about bicycle parking or accessibility? Call +31 20 341 2995 before your visit to discuss the options."}</p>
  </div>;
}
