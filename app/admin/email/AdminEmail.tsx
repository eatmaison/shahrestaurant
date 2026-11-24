"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "../../providers";
import { fetchJSON } from "../../lib/clientFetch";
import type { CampaignSummary, EmailContact } from "../../lib/campaignContacts";
import admin from "../admin.module.css";
import css from "./email.module.css";

type Directory = {
  items: EmailContact[]; total: number; eligible: string[]; campaigns: CampaignSummary[]; sendingEnabled: boolean;
};
type Draft = { id: string; subject: string; body: string; recipients: string[]; action: "create" };

const messages = {
  en: {
    directory: "Customer directory", search: "Search name, email, phone or address", searchButton: "Search",
    customers: "contacts", chosen: "selected recipients", selectAll: "Select all eligible in these results",
    clear: "Clear selection", only: "Subscribers only", name: "Name", address: "Address", phone: "Phone", source: "Source", permission: "Email permission",
    account: "Account", order: "Order", reservation: "Reservation", allowed: "Subscribed", blocked: "Unsubscribed", unknown: "No consent recorded",
    addConsent: "Record consent", empty: "No contacts match your search.", setup: "Email workspace setup is required. Apply the Shah admin email migration.",
    noSender: "Sending is disabled until the restaurant’s email sender is configured.",
    previous: "Previous", next: "Next", compose: "Compose email", subject: "Subject", text: "Message (plain text)",
    review: "Preview email", send: "Confirm and send", cancel: "Back to editing",
    footer: "A Shah Restaurant footer and a personal unsubscribe link will be added to each email.", privacy: "Emails are sent individually. Only selected subscribers can receive this email.",
    history: "Campaign history", resume: "Resume pending emails", pause: "Pause after current email", paused: "Paused. You can resume from campaign history.",
    pending: "Pending", sending: "In progress", accepted: "Accepted by provider", notSent: "Not sent", uncertainty: "Unconfirmed",
    explaining: "Unconfirmed emails will not be retried automatically. Check the provider before sending again.",
    done: "Campaign processed. See the result below.", failed: "Could not complete the action. Refresh the list and check campaign history before retrying.",
    changed: "The selected audience changed. Review the updated contacts before sending.",
    proof: "Where and when did this customer explicitly agree to receive Shah marketing emails? Do not include sensitive information.",
    declaration: "I have evidence that this person gave explicit consent for Shah email marketing.",
    savePermission: "Save consent", close: "Close", reload: "Refresh contacts",
  },
  nl: {
    directory: "Klantcontacten", search: "Zoek op naam, e-mail, telefoon of adres", searchButton: "Zoeken",
    customers: "contacten", chosen: "geselecteerde ontvangers", selectAll: "Selecteer alle abonnees in deze resultaten",
    clear: "Selectie wissen", only: "Alleen abonnees", name: "Naam", address: "Adres", phone: "Telefoon", source: "Bron", permission: "E-mailtoestemming",
    account: "Account", order: "Bestelling", reservation: "Reservering", allowed: "Geabonneerd", blocked: "Afgemeld", unknown: "Geen toestemming vastgelegd",
    addConsent: "Toestemming vastleggen", empty: "Geen contacten gevonden.", setup: "Voer de Shah-migratie voor de e-mailwerkruimte uit.",
    noSender: "Verzenden is uitgeschakeld totdat de afzender is ingesteld.",
    previous: "Vorige", next: "Volgende", compose: "E-mail opstellen", subject: "Onderwerp", text: "Bericht (platte tekst)",
    review: "Voorbeeld bekijken", send: "Bevestigen en verzenden", cancel: "Terug naar bewerken",
    footer: "Elke e-mail krijgt een Shah Restaurant-voettekst en een persoonlijke afmeldlink.", privacy: "E-mails worden apart verstuurd, alleen naar geselecteerde abonnees.",
    history: "Verzendgeschiedenis", resume: "Openstaande e-mails hervatten", pause: "Pauzeren na huidige e-mail", paused: "Gepauzeerd. Hervat via de verzendgeschiedenis.",
    pending: "Openstaand", sending: "Bezig", accepted: "Aanvaard door mailprovider", notSent: "Niet verzonden", uncertainty: "Onbevestigd",
    explaining: "Onbevestigde e-mails worden niet automatisch opnieuw verstuurd. Controleer eerst de mailprovider.",
    done: "Campagne verwerkt. Bekijk hieronder het resultaat.", failed: "De actie is niet voltooid. Vernieuw en controleer de verzendgeschiedenis voordat je opnieuw probeert.",
    changed: "De selectie is veranderd. Controleer de bijgewerkte contacten.",
    proof: "Waar en wanneer gaf de klant expliciet toestemming voor Shah-reclame per e-mail? Vermeld geen gevoelige gegevens.",
    declaration: "Ik kan aantonen dat deze persoon expliciet toestemming gaf voor Shah-marketingmails.",
    savePermission: "Toestemming opslaan", close: "Sluiten", reload: "Contacten vernieuwen",
  },
};

export default function AdminEmail() {
  const { lang } = useLang();
  const t = messages[lang === "nl" ? "nl" : "en"];
  const [data, setData] = useState<Directory | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [only, setOnly] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [proofFor, setProofFor] = useState<string | null>(null);
  const [evidence, setEvidence] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [active, setActive] = useState<CampaignSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const run = useRef(false);
  const pause = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ q: query, page: String(page), subscribed: only ? "1" : "0" });
    fetchJSON<Directory & { error?: string }>("/api/admin/email?" + params, { signal: controller.signal, cache: "no-store" }).then(({ response, data }) => {
      if (controller.signal.aborted) return;
      if (!response.ok) { setProblem(data.error === "migration_required" ? t.setup : t.failed); return; }
      setData(data);
    }).catch(() => { if (!controller.signal.aborted) setProblem(t.failed); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, page, only, refresh, t.failed, t.setup]);

  useEffect(() => () => { pause.current = true; }, []);

  function reload() { setLoading(true); setRefresh(x => x + 1); }
  function select(id: string) {
    setSelected(old => { const next = new Set(old); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  async function post(input: object) {
    return await fetchJSON<{ campaign?: CampaignSummary; error?: string }>("/api/admin/email", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
    }, 30_000);
  }
  async function savePermission() {
    if (run.current || !proofFor || !confirmed) return;
    run.current = true;
    setBusy(true);
    setProblem("");
    try {
      const { response } = await post({ action: "consent", email: proofFor, evidence, confirmed: true });
      if (!response.ok) throw new Error();
      setProofFor(null);
      reload();
    } catch { setProblem(t.failed); }
    finally { run.current = false; setBusy(false); }
  }
  async function sendCampaign(campaign: Draft | CampaignSummary) {
    if (run.current) return;
    run.current = true;
    pause.current = false;
    setBusy(true);
    setProblem("");
    try {
      let current: CampaignSummary;
      if ("action" in campaign) {
        const { response, data } = await post(campaign);
        if (response.status === 409) { setDraft(null); setSelected(new Set()); setProblem(t.changed); return; }
        if (!response.ok || !data.campaign) throw new Error();
        current = data.campaign;
        setDraft(null);
        setSelected(new Set());
        setSubject("");
        setBody("");
      } else current = campaign;
      setActive(current);
      while (current.pending > 0 && !pause.current) {
        const { response, data } = await post({ action: "dispatch", id: current.id });
        if (!response.ok || !data.campaign) throw new Error();
        current = data.campaign;
        setActive(current);
        if (current.pending > 0) await new Promise(resolve => setTimeout(resolve, 650));
      }
      setProblem(current.pending > 0 ? t.paused : t.done);
    } catch { setProblem(t.failed); }
    finally { setBusy(false); run.current = false; reload(); }
  }
  const choosing = !busy && !draft && !loading;
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / 40));
  const stats = (c: CampaignSummary) => <span className={css.statusLine}>
    {t.pending}: {c.pending} · {t.sending}: {c.sending} · {t.accepted}: {c.accepted} · {t.notSent}: {c.notSent} · {t.uncertainty}: {c.uncertain}
  </span>;
  const button = admin.button;
  return <div className={css.workspace}>
    <p role="status" className={css.statusLine}>{problem}</p>
    {data && !data.sendingEnabled && <p className={css.notice}>{t.noSender}</p>}
    <section className={css.panel} aria-labelledby="email-directory">
      <h2 id="email-directory">{t.directory}</h2>
      <form className={css.actions} onSubmit={event => { event.preventDefault(); setPage(0); setQuery(search.trim()); setSelected(new Set()); reload(); }}>
        <input className={css.search} value={search} onChange={event => setSearch(event.target.value)} placeholder={t.search} aria-label={t.search} maxLength={160} />
        <button className={button} disabled={busy}>{t.searchButton}</button>
        <label><input type="checkbox" checked={only} disabled={busy} onChange={event => {
          setOnly(event.target.checked); setPage(0); setSelected(new Set()); setLoading(true);
        }} /> {t.only}</label>
        <button type="button" className={button} onClick={reload} disabled={busy}>{t.reload}</button>
      </form>
      <div className={css.actions}>
        <span>{data?.total ?? 0} {t.customers} · {selected.size} {t.chosen}</span>
        <button className={button} type="button" disabled={!choosing || !data?.eligible.length} onClick={() => setSelected(new Set(data?.eligible ?? []))}>{t.selectAll}</button>
        <button className={button} type="button" disabled={!choosing || !selected.size} onClick={() => setSelected(new Set())}>{t.clear}</button>
      </div>
      <div className={css.tableWrap} aria-busy={loading} tabIndex={0}>
        <table>
          <thead><tr><th scope="col">✓</th><th scope="col">{t.name}</th><th scope="col">Email</th><th scope="col">{t.phone}</th><th scope="col">{t.address}</th><th scope="col">{t.source}</th><th scope="col">{t.permission}</th></tr></thead>
          <tbody>{data?.items.map(contact => <tr key={contact.key}>
            <td><input type="checkbox" aria-label={contact.email ?? contact.name ?? t.permission} disabled={!choosing || !contact.permissionId}
              checked={!!contact.permissionId && selected.has(contact.permissionId)} onChange={() => contact.permissionId && select(contact.permissionId)} /></td>
            <td>{contact.name}</td><td>{contact.email}</td><td>{contact.phone}</td><td>{contact.address}</td>
            <td>{contact.sources.map(source => t[source]).join(", ")}</td>
            <td>{contact.permissionId ? t.allowed : contact.optedOut ? t.blocked : t.unknown}
              {contact.email && !contact.permissionId && !contact.optedOut && <button type="button" className={button} disabled={busy}
                onClick={() => { setProofFor(contact.email); setEvidence(""); setConfirmed(false); }}>{t.addConsent}</button>}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {!loading && data?.items.length === 0 && <p>{t.empty}</p>}
      <div className={css.actions}>
        <button type="button" className={button} disabled={page === 0 || loading || busy} onClick={() => { setLoading(true); setPage(page - 1); }}>{t.previous}</button>
        <span>{page + 1} / {pages}</span>
        <button type="button" className={button} disabled={page + 1 >= pages || loading || busy} onClick={() => { setLoading(true); setPage(page + 1); }}>{t.next}</button>
      </div>
    </section>
    {proofFor && <section className={css.panel} aria-label={t.addConsent}>
      <h2>{t.addConsent}: {proofFor}</h2>
      <form className={css.form} onSubmit={event => { event.preventDefault(); void savePermission(); }}>
        <label>{t.proof}<textarea value={evidence} onChange={event => setEvidence(event.target.value)} required minLength={12} maxLength={500} rows={3} /></label>
        <label><input type="checkbox" required checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /> {t.declaration}</label>
        <div className={css.actions}><button className={button} disabled={busy || !confirmed}>{t.savePermission}</button>
          <button type="button" className={button} disabled={busy} onClick={() => setProofFor(null)}>{t.close}</button></div>
      </form>
    </section>}
    <section className={css.panel} aria-labelledby="email-compose">
      <h2 id="email-compose">{t.compose}</h2>
      {draft ? <div className={css.form}>
        <strong>{draft.subject}</strong><p className={css.preview}>{draft.body}</p>
        <p>{draft.recipients.length} {t.chosen}. {t.privacy} {t.footer}</p>
        <div className={css.actions}>
          <button type="button" className={button + " " + admin.primary} disabled={busy || !data?.sendingEnabled} onClick={() => void sendCampaign(draft)}>{t.send}</button>
          <button type="button" className={button} disabled={busy} onClick={() => setDraft(null)}>{t.cancel}</button>
        </div>
      </div> : <form className={css.form} onSubmit={event => {
        event.preventDefault();
        if (selected.size && subject.trim() && body.trim() && !run.current) setDraft({ action: "create", id: crypto.randomUUID(), subject: subject.trim(), body: body.trim(), recipients: [...selected] });
      }}>
        <label>{t.subject}<input required maxLength={160} value={subject} disabled={busy} onChange={event => setSubject(event.target.value)} /></label>
        <label>{t.text}<textarea required maxLength={12000} rows={8} value={body} disabled={busy} onChange={event => setBody(event.target.value)} /></label>
        <div className={css.actions}><button className={button} disabled={busy || !selected.size || !subject.trim() || !body.trim()}>{t.review}</button><span>{selected.size} {t.chosen}</span></div>
      </form>}
    </section>
    <section className={css.panel} aria-labelledby="email-history">
      <h2 id="email-history">{t.history}</h2>
      {active && <div className={css.actions} role="status"><strong>{active.subject}</strong>{stats(active)}
        {busy && <button type="button" className={button} onClick={() => { pause.current = true; }}>{t.pause}</button>}</div>}
      {data?.campaigns.map(c => <div key={c.id} className={css.history}>
        <strong>{c.subject}</strong><time dateTime={c.createdAt}>{new Date(c.createdAt).toLocaleString(lang === "nl" ? "nl-NL" : "en-GB", { timeZone: "Europe/Amsterdam" })}</time>{stats(c)}
        {c.uncertain > 0 && <small>{t.explaining}</small>}
        {c.pending > 0 && <button type="button" className={button} disabled={busy || !!draft || !data.sendingEnabled} onClick={() => void sendCampaign(c)}>{t.resume}</button>}
      </div>)}
    </section>
  </div>;
}
