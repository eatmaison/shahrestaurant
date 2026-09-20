"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { FaArrowsRotate, FaArrowUpRightFromSquare, FaFloppyDisk, FaImage, FaMagnifyingGlass, FaPen, FaPlus, FaTicket, FaXmark } from "react-icons/fa6";
import { partyDate, partyMoney, type PartyBooking, type PartyEvent } from "../lib/partyTypes";
import styles from "./partyAdmin.module.css";

type EventDraft = Pick<PartyEvent,"slug" | "title" | "description" | "event_date" | "start_time" | "end_time" | "price_cents" | "capacity" | "image" | "status" | "published"> & { id?: string };
const emptyEvent: EventDraft = { slug: "", title: "", description: "", event_date: "", start_time: "22:00", end_time: "03:00", price_cents: 1699, capacity: 100, image: "/photos/687A0343.jpeg", status: "active", published: false };
const timestamp = (value: string) => new Date(value).toLocaleString("en-GB", { timeZone: "Europe/Amsterdam", dateStyle: "medium", timeStyle: "short" });

export default function PartyAdmin({ processImageFile }: { processImageFile: (file: File) => Promise<string> }) {
  const [events,setEvents] = useState<PartyEvent[]>([]);
  const [bookings,setBookings] = useState<PartyBooking[]>([]);
  const [loaded,setLoaded] = useState(false);
  const [error,setError] = useState("");
  const [message,setMessage] = useState("");
  const [eventFilter,setEventFilter] = useState("");
  const [statusFilter,setStatusFilter] = useState("");
  const [query,setQuery] = useState("");
  const [sort,setSort] = useState("newest");
  const [draft,setDraft] = useState<EventDraft | null>(null);
  const [busy,setBusy] = useState(false);
  const [page,setPage] = useState(0);

  async function refresh() {
    const response = await fetch("/api/parties/admin", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load events");
    setEvents(result.events); setBookings(result.bookings); setLoaded(true);
  }

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/parties/admin", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to load events");
        if (active) { setEvents(result.events); setBookings(result.bookings); setLoaded(true); }
      } catch (failure) { if (active) setError(failure instanceof Error ? failure.message : "Unable to load events"); }
    };
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); },30_000);
    return () => { active = false; clearInterval(timer); };
  },[]);

  async function post(body: unknown) {
    const response = await fetch("/api/parties/admin", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to save");
    return result;
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || busy) return;
    setBusy(true); setError(""); setMessage("");
    try { await post(draft); await refresh(); setDraft(null); setMessage("Event saved."); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to save event"); }
    finally { setBusy(false); }
  }

  async function reconcile() {
    setBusy(true); setError(""); setMessage("");
    try { const result = await post({ action:"reconcile" }); await refresh(); setMessage(`Checked ${result.checked} payments. ${result.failed} require another retry or attention in Mollie.`); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to check payments"); }
    finally { setBusy(false); }
  }

  async function upload(file?: File) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 10_000_000) { setError("Choose a JPEG, PNG or WebP image under 10 MB."); return; }
    setBusy(true); setError("");
    try { const image = await processImageFile(file); setDraft(value => value ? { ...value,image } : value); }
    catch { setError("Unable to read this image."); }
    finally { setBusy(false); }
  }

  const displayedEvents = events.filter(event => !eventFilter || event.id === eventFilter);
  const totals = displayedEvents.reduce((sum,event) => ({ sold:sum.sold+event.tickets_sold, capacity:sum.capacity+event.capacity, remaining:sum.remaining+event.remaining, revenue:sum.revenue+event.revenue_cents }),{ sold:0,capacity:0,remaining:0,revenue:0 });
  const search = query.trim().toLowerCase();
  const guests = bookings.filter(booking => (!eventFilter || booking.event_id === eventFilter) &&
    (!statusFilter || (statusFilter.startsWith("ticket:") ? booking.ticket_status === statusFilter.slice(7) : booking.payment_status === statusFilter)) &&
    (!search || `${booking.first_name} ${booking.last_name} ${booking.email} ${booking.phone} ${booking.id}`.toLowerCase().includes(search) || (/^[+\d ()-]+$/.test(search) && booking.phone.replace(/\D/g,"").includes(search.replace(/\D/g,"")))))
    .sort((first,second) => (sort === "newest" ? -1 : 1)*(new Date(first.created_at).getTime()-new Date(second.created_at).getTime()));
  const currentPage = Math.min(page,Math.max(0,Math.ceil(guests.length/25)-1));
  const visibleGuests = guests.slice(currentPage*25,(currentPage+1)*25);

  return <section id="party-admin" className={styles.section} aria-labelledby="party-admin-title">
    <header className={styles.heading}><div><p>SHAH AFTER HOURS</p><h2 id="party-admin-title"><FaTicket /> PARTIES / EVENTS</h2></div><div className={styles.actions}><a href="/parties" target="_blank" rel="noreferrer" title="View public party page" aria-label="View public party page"><FaArrowUpRightFromSquare /></a><button type="button" disabled={busy} onClick={reconcile}><FaArrowsRotate /> Check payments</button><button type="button" disabled={busy} onClick={() => { setDraft({ ...emptyEvent }); setError(""); setMessage(""); }}><FaPlus /> Create event</button></div></header>
    {error && <p role="alert" className={styles.error}>{error}</p>}{message && <p role="status" className={styles.message}>{message}</p>}
    {!loaded && !error && <p role="status">Loading parties and guest lists...</p>}
    <div className={styles.events}>{events.map(event => <article key={event.id} className={styles.event}><div className={styles.eventImage}><Image src={event.image} alt="" fill sizes="100px" unoptimized /></div><div><h3>{event.title}</h3><p>{partyDate(event.event_date)} / {event.start_time.slice(0,5)} - {event.end_time.slice(0,5)}</p><span>{event.published ? "Published" : "Unpublished"} / {event.status.replace("_"," ")} / {partyMoney(event.price_cents)}</span></div><button title={`Edit ${event.title}`} aria-label={`Edit ${event.title}`} onClick={() => { setDraft({ ...event,start_time:event.start_time.slice(0,5),end_time:event.end_time.slice(0,5) }); setError(""); setMessage(""); }} disabled={busy}><FaPen /></button></article>)}</div>

    {draft && <form className={styles.editor} onSubmit={save}><div className={styles.editorTitle}><h3>{draft.id ? "Edit event" : "New event"}</h3><button type="button" aria-label="Close event editor" title="Close editor" disabled={busy} onClick={() => setDraft(null)}><FaXmark /></button></div><fieldset disabled={busy}>
      <label>Event title<input value={draft.title} required minLength={3} maxLength={120} onChange={change => setDraft({ ...draft,title:change.target.value })} /></label>
      <label>URL slug<input value={draft.slug} required minLength={3} maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" onChange={change => setDraft({ ...draft,slug:change.target.value })} /></label>
      <label className={styles.wide}>Description<textarea value={draft.description} required minLength={10} maxLength={4000} rows={4} onChange={change => setDraft({ ...draft,description:change.target.value })} /></label>
      <label>Date<input type="date" value={draft.event_date} required onChange={change => setDraft({ ...draft,event_date:change.target.value })} /></label>
      <div className={styles.timeFields}><label>Start time<input type="time" value={draft.start_time} required onChange={change => setDraft({ ...draft,start_time:change.target.value })} /></label><label>End time<input type="time" value={draft.end_time} required onChange={change => setDraft({ ...draft,end_time:change.target.value })} /></label></div>
      <label>Ticket price (EUR)<input type="number" step="0.01" min="1" max="1000" value={draft.price_cents/100} required onChange={change => setDraft({ ...draft,price_cents:Math.round(Number(change.target.value)*100) })} /></label>
      <label>Maximum capacity<input type="number" min={1} max={10000} value={draft.capacity} required onChange={change => setDraft({ ...draft,capacity:Number(change.target.value) })} /></label>
      <label>Status<select value={draft.status} onChange={change => setDraft({ ...draft,status:change.target.value as PartyEvent["status"] })}><option value="active">Active</option><option value="sold_out">Sold out (close sales)</option><option value="cancelled">Cancelled</option></select></label>
      <label className={styles.checkbox}><input type="checkbox" checked={draft.published} onChange={change => setDraft({ ...draft,published:change.target.checked })} /> Published on website</label>
      <label className={styles.wide}>Event image URL<input value={draft.image.startsWith("data:") ? "" : draft.image} placeholder={draft.image.startsWith("data:") ? "Uploaded image ready" : "https://..."} onChange={change => setDraft({ ...draft,image:change.target.value })} /></label>
      <label className={styles.upload}><FaImage /> Upload event image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={change => void upload(change.target.files?.[0])} /></label>
      <div className={styles.preview}><Image src={draft.image || "/photos/687A0343.jpeg"} alt="Event image preview" fill sizes="200px" unoptimized /></div>
      <button className={styles.save} type="submit"><FaFloppyDisk />{busy ? "Saving..." : "Save event"}</button>
    </fieldset><p className={styles.hint}>Amsterdam local time. An end time before the start time means the following day. Existing bookings retain their purchased details. Cancelling closes sales; refunds for previously confirmed guests must be arranged in Mollie.</p></form>}

    <div className={styles.filters}><label>Event<select value={eventFilter} onChange={change => { setEventFilter(change.target.value); setPage(0); }}><option value="">All events</option>{events.map(event => <option key={event.id} value={event.id}>{event.title} / {event.event_date}</option>)}</select></label></div>
    <dl className={styles.stats}><div><dt>Tickets sold</dt><dd>{totals.sold} <small>/ {totals.capacity}</small></dd></div><div><dt>Tickets remaining</dt><dd>{totals.remaining}</dd></div><div><dt>Confirmed revenue</dt><dd>{partyMoney(totals.revenue)}</dd></div></dl>
    <div className={styles.filters}><label className={styles.search}><span><FaMagnifyingGlass /> Search guests</span><input type="search" value={query} placeholder="Name, email, phone or ticket ID" onChange={change => { setQuery(change.target.value); setPage(0); }} /></label><label>Payment / ticket status<select value={statusFilter} onChange={change => { setStatusFilter(change.target.value); setPage(0); }}><option value="">All statuses</option>{["paid","open","pending","authorized","failed","canceled","expired"].map(status => <option key={status} value={status}>{status}</option>)}<option value="ticket:confirmed">Confirmed tickets</option><option value="ticket:refund_pending">Refund pending</option><option value="ticket:refunded">Refunded</option></select></label><label>Purchase date<select value={sort} onChange={change => { setSort(change.target.value); setPage(0); }}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></div>
    <div className={styles.tableWrap}><table className={styles.table}><caption>{guests.length} purchases / Amsterdam local time</caption><thead><tr><th>Guest</th><th>Contact</th><th>Tickets</th><th>Event / date</th><th>Purchased</th><th>Amount paid</th><th>Payment / ticket</th><th>Ticket / payment ID</th></tr></thead><tbody>{visibleGuests.map(booking => <tr key={booking.id}><td data-label="Guest"><strong>{booking.first_name} {booking.last_name}</strong></td><td data-label="Contact"><a href={`mailto:${booking.email}`}>{booking.email}</a><a href={`tel:${booking.phone}`}>{booking.phone}</a></td><td data-label="Tickets">{booking.quantity}</td><td data-label="Event / date">{booking.event_title}<small>{booking.event_date} / {booking.start_time.slice(0,5)}</small></td><td data-label="Purchased">{timestamp(booking.created_at)}</td><td data-label="Amount paid">{partyMoney(booking.payment_status === "paid" ? booking.total_cents : 0)}<small>Total: {partyMoney(booking.total_cents)}</small></td><td data-label="Status"><span className={booking.ticket_status === "confirmed" ? styles.confirmed : styles.badge}>{booking.payment_status}</span><small>{booking.ticket_status.replace("_"," ")}</small>{booking.ticket_status === "confirmed" && <small>{booking.email_sent_at ? "Email sent" : "Email pending"}</small>}</td><td data-label="Ticket / payment ID" className={styles.identifier}>{booking.id}<small>{booking.mollie_payment_id || "Payment not started"}</small></td></tr>)}</tbody></table></div>
    {loaded && !guests.length && <p className={styles.noGuests}>No purchases match these filters.</p>}
    <div className={styles.pagination}><button disabled={currentPage===0} onClick={() => setPage(currentPage-1)}>Previous</button><span>Page {currentPage+1} of {Math.max(1,Math.ceil(guests.length/25))}</span><button disabled={(currentPage+1)*25>=guests.length} onClick={() => setPage(currentPage+1)}>Next</button></div>
  </section>;
}