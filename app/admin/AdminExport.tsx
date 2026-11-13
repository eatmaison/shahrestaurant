"use client";
import { useState } from "react";
import { useLang } from "../providers";
import { WorkspaceDialog } from "../components/WorkspaceDialog";
import { downloadCsv } from "./adminFormat";
import styles from "./admin.module.css";
export function AdminExport({ filename, rows, title, personal = false, description }: { filename: string; rows: readonly (readonly unknown[])[]; title: string; personal?: boolean; description: string }) {
  const { lang } = useLang(), nl = lang === "nl";
  const [open, setOpen] = useState(false), [error, setError] = useState(false);
  const count = Math.max(0, rows.length - 1);
  const save = () => { try { downloadCsv(filename, rows); setOpen(false); setError(false); } catch { setError(true); } };
  return <><button type="button" className={styles.button} disabled={!count} onClick={() => { setError(false); if (personal) setOpen(true); else save(); }} aria-label={`${title} — ${count} ${nl ? "rijen" : "rows"}`}>{title} <span className={styles.badge}>{count}</span></button>
    {open && <WorkspaceDialog titleId="admin-export-title" onClose={() => setOpen(false)}><div className={styles.dialogBody}><h2 id="admin-export-title">{nl ? "Persoonsgegevens exporteren?" : "Export personal information?"}</h2><p>{description}</p><p className="mt-3">{count} {nl ? "rijen in de huidige selectie. Het bestand bevat contact- of klantgegevens. Bewaar het veilig en verwijder het wanneer het niet meer nodig is." : "rows in the current selection. This file contains contact or customer information. Store it securely and remove it when no longer needed."}</p><p className={styles.muted}>{filename}</p>{error && <p role="alert" className={styles.error}>{nl ? "Download kon niet worden gestart. Uw gegevens zijn niet gewijzigd." : "The download could not start. Your data has not changed."}</p>}<div className={styles.actions}><button type="button" className={styles.button} onClick={() => setOpen(false)}>{nl ? "Annuleren" : "Cancel"}</button><button type="button" className={`${styles.button} ${styles.primary}`} onClick={save}>{nl ? "CSV downloaden" : "Download CSV"}</button></div></div></WorkspaceDialog>}
  </>;
}
