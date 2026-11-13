"use client";
import { useLang } from "../providers";
import styles from "./admin.module.css";
export default function AdminError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  const { lang } = useLang(), nl = lang === "nl";
  return <section role="alert" className={styles.panel}><h2>{nl ? "Dit onderdeel kon niet worden geladen" : "This workspace could not load"}</h2><p>{nl ? "Deze weergave kon niet worden hersteld. Ververs en controleer de serverstatus vóór u een actie herhaalt." : "This view could not recover. Refresh and check the server state before repeating an action."}</p>{error.digest && /^[\w-]{1,64}$/.test(error.digest) && <p className={styles.muted}>{nl ? "Referentie" : "Reference"}: {error.digest}</p>}<div className={styles.actions}><button type="button" className={styles.button} onClick={unstable_retry}>{nl ? "Opnieuw proberen" : "Try again"}</button><a className={styles.button} href="/admin">{nl ? "Dagelijks beheer" : "Daily operations"}</a></div></section>;
}
