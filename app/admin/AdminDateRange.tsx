import { amsterdamDateKey, rangeFilterError, type RangeFilter } from "../lib/adminMetrics";
import styles from "./admin.module.css";

export function AdminDateRange({ value, onChange, now, lang }: { value: RangeFilter; onChange: (value: RangeFilter) => void; now: number; lang: "en" | "nl" }) {
  const nl = lang === "nl", error = rangeFilterError(value);
  return <div className={styles.filters}>
    <div className={styles.filterTabs} aria-label={nl ? "Periode" : "Period"}>{([
      ["all", nl ? "Alle tijd" : "All time"], ["today", nl ? "Vandaag" : "Today"], ["7d", "7 " + (nl ? "dagen" : "days")], ["30d", "30 " + (nl ? "dagen" : "days")],
    ] as const).map(([preset, label]) => <button type="button" key={preset} className={styles.button} aria-pressed={value.preset === preset} onClick={() => onChange({ preset })}>{label}</button>)}</div>
    {(["startDate", "endDate"] as const).map(field => <label key={field}>{field === "startDate" ? (nl ? "Vanaf" : "From") : (nl ? "Tot en met" : "Through")}<input type="date" max={amsterdamDateKey(now)} min={field === "endDate" ? value.startDate : undefined} value={value.preset === "date" ? value[field] || "" : ""} aria-invalid={Boolean(error)} onChange={event => onChange({ ...(value.preset === "date" ? value : {}), preset: "date", [field]: event.target.value })} /></label>)}
    <span className={styles.muted}>Europe/Amsterdam</span>
    {error && <p role="status" className={styles.notice}>{error === "incomplete" ? (nl ? "Vul beide datums in." : "Enter both dates.") : (nl ? "Controleer de datums en hun volgorde." : "Check the dates and their order.")}</p>}
  </div>;
}
