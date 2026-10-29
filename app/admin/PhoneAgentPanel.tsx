"use client";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useLang } from "../providers";
import { amsterdamDateTime } from "../lib/restaurantClock";
type Status = { ready?: boolean; enabled?: boolean; missing?: string[]; activeCalls?: number; configured?: boolean };
type Day = { policy: { capacity: number; external_guests: number; limit_enabled: boolean } | null; bookedGuests: number };
const field = "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 dark:border-white/20";
export default function PhoneAgentPanel() {
  const { lang } = useLang(); const nl = lang === "nl";
  const [opened, setOpened] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [day, setDay] = useState<Day | null>(null);
  const [date, setDate] = useState(() => amsterdamDateTime().slice(0, 10));
  const [capacity, setCapacity] = useState(35);
  const [external, setExternal] = useState(0);
  const [limitEnabled, setLimitEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false); const lock = useRef(false);
  async function request(path: string, init?: RequestInit) {
    const response = await fetch("/api/admin/phone-agent" + path, { ...init, signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error("unavailable");
    return data;
  }
  async function load() {
    if (lock.current) return; lock.current = true; setBusy(true); setMessage("");
    try {
      const next = await request(""); setStatus(next);
      if (next.configured !== false) {
        const info: Day = await request("?date=" + encodeURIComponent(date));
        setDay(info); setCapacity(info.policy?.capacity ?? 35); setExternal(info.policy?.external_guests ?? 0); setLimitEnabled(info.policy?.limit_enabled ?? false);
      }
    } catch { setMessage(nl ? "Verbinding niet beschikbaar. Probeer opnieuw." : "Connection unavailable. Please retry."); }
    finally { lock.current = false; setBusy(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current || !day) return; lock.current = true; setBusy(true); setMessage("");
    try {
      const info = await request("", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, capacity, externalGuests: external, limitEnabled }) });
      setDay(info); setMessage(nl ? "Beschikbaarheid opgeslagen." : "Availability saved.");
    } catch { setMessage(nl ? "Opslaan mislukt. Controleer de verbinding en probeer opnieuw." : "Saving failed. Check the connection and retry."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section className="mt-6 rounded-2xl border border-emerald-300/60 bg-emerald-50/40 p-5 text-sm dark:border-emerald-400/20 dark:bg-emerald-950/20">
    <button type="button" aria-expanded={opened} aria-controls="phone-agent-settings" className="min-h-11 w-full text-left font-bold" onClick={() => { setOpened(!opened); if (!opened) void load(); }}>
      {nl ? "AI-telefoonassistent · instellingen en beschikbaarheid" : "AI phone assistant · settings and availability"}
    </button>
    {opened && <div id="phone-agent-settings" className="mt-3 space-y-4">
      <p>{nl ? "Begroeting: Goedendag, u spreekt met Shah Restaurant! Daarna vermeldt de assistent dat het AI is. Talen: Nederlands en Engels." : "Greeting: Goedendag, u spreekt met Shah Restaurant! The assistant then identifies itself as AI. Languages: Dutch and English."}</p>
      {status && <p className="font-semibold">{status.ready ? (nl ? "Verbonden · actief" : "Connected · active") : (nl ? "Voorbereid · nog niet actief" : "Prepared · not active")}{status.activeCalls ? " · " + status.activeCalls + (nl ? " lopende gesprekken" : " active calls") : ""}</p>}
      {!!status?.missing?.length && <p>{nl ? "Nog nodig: " : "Still needed: "}{status.missing.join(", ")}</p>}
      <p>{nl ? "Volgens de restaurantmanager zijn tafels beschikbaar. Geldige reserveringen worden standaard automatisch bevestigd na toestemming van de beller. Alleen indien nodig kunt u hieronder een dag beperken." : "The restaurant manager confirms tables are available. Valid bookings are automatically confirmed after caller consent. Set an optional day limit below only when needed."}</p>
      <div className="flex flex-wrap items-end gap-3">
        <label>{nl ? "Datum" : "Date"}<input className={field} type="date" disabled={busy} value={date} onChange={e => { setDate(e.target.value); setDay(null); }} /></label>
        <button type="button" disabled={busy || !date} onClick={() => void load()} className="min-h-11 rounded-xl border border-current px-4 disabled:opacity-50">{nl ? "Ophalen" : "Load"}</button>
      </div>
      {day && <form onSubmit={save} className="space-y-4">
        <p>{nl ? "Bestaande website-/AI-reserveringen deze avond: " : "Existing website/AI guests this evening: "}<strong>{day.bookedGuests}</strong></p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>{nl ? "Conservatief maximum voor de hele avond (0–35 gasten)" : "Conservative maximum for the whole evening (0–35 guests)"}<input className={field} type="number" min={0} max={35} required disabled={busy} value={capacity} onChange={e => setCapacity(Number(e.target.value))} /></label>
          <label>{nl ? "Extern gereserveerde/gereserveerd gehouden plaatsen" : "External bookings / seats held back"}<input className={field} type="number" min={0} max={1000} required disabled={busy} value={external} onChange={e => setExternal(Number(e.target.value))} /></label>
        </div>
        <label className="flex items-start gap-3"><input type="checkbox" disabled={busy} checked={limitEnabled} onChange={e => setLimitEnabled(e.target.checked)} className="mt-1 h-5 w-5" /><span>{nl ? "Beperk AI-reserveringen op deze datum tot het onderstaande maximum. Zonder vinkje geldt de standaard beschikbaarheid." : "Restrict AI reservations on this date to the configured maximum. Unchecked uses normal availability."}</span></label>
        <p className="text-xs">{nl ? "Dit maximum geldt voor de hele avond, niet per tijdslot. Het wijzigt geen bestaande boekingen. Nieuwe externe reserveringen moeten hier worden bijgewerkt." : "This maximum applies to the full evening, not each time slot. Existing bookings are not changed. Update this when new external reservations arrive."}</p>
        <button disabled={busy} className="min-h-11 rounded-xl bg-emerald-700 px-5 text-white disabled:opacity-50">{nl ? "Opslaan" : "Save"}</button>
      </form>}
      {message && <p role="status">{message}</p>}
    </div>}
  </section>;
}
