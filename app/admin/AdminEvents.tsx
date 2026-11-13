"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useLang } from "../providers";
import { processImageFile } from "./adminImage";
import styles from "./admin.module.css";
const PartyAdmin = dynamic(() => import("./PartyAdmin"));
const GalleryManager = dynamic(() => import("./GalleryManager"));

export default function AdminEvents() {
  const { lang } = useLang(), nl = lang === "nl";
  const [section, setSection] = useState<"events" | "gallery">("events");
  return <div className={styles.stack}>
    <div className={styles.filterTabs} aria-label={nl ? "Evenementbeheer" : "Event management"}><button type="button" className={styles.button} aria-pressed={section === "events"} onClick={() => setSection("events")}>{nl ? "Evenementen & boekingen" : "Events & bookings"}</button><button type="button" className={styles.button} aria-pressed={section === "gallery"} onClick={() => setSection("gallery")}>{nl ? "Openbare fotogalerij" : "Public photo gallery"}</button></div>
    <p className={styles.notice}>{section === "events" ? (nl ? "Dit beheert de besloten ticketpagina /parties. De openbare /events-pagina's blijven toegankelijk voor bezoekers." : "This manages the private /parties ticket area. Public /events marketing pages remain available to visitors.") : (nl ? "Foto's in dit onderdeel worden in de openbare galerij getoond. Uploaden en verwijderen gebeurt pas na uw actie." : "Photos in this area appear in the public gallery. Uploads and deletions happen only when you choose an action.")}</p>
    {section === "events" ? <PartyAdmin processImageFile={processImageFile} /> : <GalleryManager />}
  </div>;
}
