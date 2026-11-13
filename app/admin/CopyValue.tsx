"use client";
import { useEffect, useRef, useState } from "react";
import { useLang } from "../providers";
import styles from "./admin.module.css";
export function CopyValue({ value, label }: { value: string; label: string }) {
  const { lang } = useLang(), nl = lang === "nl";
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lifecycle = useRef<AbortController | null>(null), attempt = useRef(0);
  useEffect(() => { const controller = new AbortController(); lifecycle.current = controller; return () => { controller.abort(); clearTimeout(timer.current); }; }, []);
  return <span className={styles.copyControl}><button type="button" className={styles.button} aria-label={label} onClick={async () => { const id = ++attempt.current, controller = lifecycle.current; clearTimeout(timer.current); let next: "copied" | "error"; try { await navigator.clipboard.writeText(value); next = "copied"; } catch { next = "error"; } if (!controller || controller.signal.aborted || id !== attempt.current) return; setStatus(next); timer.current = setTimeout(() => setStatus("idle"), 4000); }}>{label}</button><span role="status" className={styles.muted}>{status === "copied" ? (nl ? "Gekopieerd" : "Copied") : status === "error" ? (nl ? "Selecteer de zichtbare waarde en kopieer handmatig." : "Select the visible value and copy manually.") : ""}</span></span>;
}
