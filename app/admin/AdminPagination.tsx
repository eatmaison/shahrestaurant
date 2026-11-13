"use client";
import { useCallback, useEffect, useState } from "react";
import { useLang } from "../providers";
import styles from "./admin.module.css";

export function usePageSize(scope: string, initial = 25): [number, (value: number) => void] {
  const [size, setSize] = useState(initial);
  useEffect(() => { let active = true; queueMicrotask(() => { if (!active) return; try { const value = Number(sessionStorage.getItem(`shah.admin.${scope}.size`)); if ([10, 25, 50].includes(value)) setSize(value); } catch { /* Optional preference only. */ } }); return () => { active = false; }; }, [scope]);
  const change = useCallback((value: number) => { if (![10, 25, 50].includes(value)) return; setSize(value); try { sessionStorage.setItem(`shah.admin.${scope}.size`, String(value)); } catch { /* In-memory preference remains usable. */ } }, [scope]);
  return [size, change];
}

export function focusResults(id: string) {
  requestAnimationFrame(() => { const target = document.getElementById(id); target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: "start", behavior: "instant" }); });
}

export function AdminPagination({ page, pages, total, size, onPage, onSize, target, label }: {
  page: number; pages: number; total: number; size: number; onPage: (page: number) => void; onSize: (size: number) => void; target: string; label: string;
}) {
  const { lang } = useLang(), nl = lang === "nl";
  const go = (value: number) => { onPage(Math.max(1, Math.min(pages, value))); focusResults(target); };
  return <div className={styles.pager}>
    <p role="status" aria-live="polite">{total ? (page - 1) * size + 1 : 0}–{Math.min(page * size, total)} / {total} · {label}</p>
    <div className={styles.pageControls}>
      <label>{nl ? "Per pagina" : "Per page"}<select value={size} onChange={event => { onSize(Number(event.target.value)); onPage(1); }}>{[10, 25, 50].map(value => <option value={value} key={value}>{value}</option>)}</select></label>
      <nav aria-label={`${label} — ${nl ? "paginering" : "pagination"}`}><button type="button" className={styles.button} disabled={page === 1} aria-label={nl ? "Eerste pagina" : "First page"} onClick={() => go(1)}>«</button><button type="button" className={styles.button} disabled={page === 1} onClick={() => go(page - 1)}>{nl ? "Vorige" : "Previous"}</button><button type="button" className={styles.button} disabled={page === pages} onClick={() => go(page + 1)}>{nl ? "Volgende" : "Next"}</button><button type="button" className={styles.button} disabled={page === pages} aria-label={nl ? "Laatste pagina" : "Last page"} onClick={() => go(pages)}>»</button></nav>
      <form onSubmit={event => { event.preventDefault(); const value = Number(new FormData(event.currentTarget).get("page")); if (Number.isInteger(value)) go(value); }}><label>{nl ? "Pagina" : "Page"}<input key={page} aria-label={`${label} — ${nl ? "paginanummer" : "page number"}`} type="number" inputMode="numeric" min={1} max={pages} name="page" defaultValue={page} required /></label><span>/ {pages}</span><button type="submit" className={styles.button}>{nl ? "Ga" : "Go"}</button></form>
    </div>
  </div>;
}
