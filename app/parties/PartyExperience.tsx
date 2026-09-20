"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FaArrowDown, FaArrowRight, FaCalendarDays, FaChampagneGlasses, FaCheck, FaCompactDisc, FaHeadphones, FaLocationDot, FaLock, FaMinus, FaPlus, FaShirt, FaTicket, FaUsers } from "react-icons/fa6";
import { partyDate, partyMoney, type PartyEvent } from "../lib/partyTypes";
import styles from "./party.module.css";

const features = [
  { icon: FaHeadphones, title: "Live DJ", text: "The soundtrack to your Friday night." },
  { icon: FaChampagneGlasses, title: "First cocktail included", text: "One for every ticket. Cheers to that." },
  { icon: FaCompactDisc, title: "Disco lights", text: "A familiar place. A whole new energy." },
  { icon: FaShirt, title: "Dress to impress", text: "Stylish, party-ready and unmistakably you." },
];

export default function PartyExperience() {
  const [events, setEvents] = useState<PartyEvent[]>([]);
  const [selected, setSelected] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const event = events.find(item => item.slug === selected) ?? events[0];
  const weekday = event ? new Date(`${event.event_date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", timeZone: "Europe/Amsterdam" }) : "Friday";

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/parties", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to check availability");
        if (active) { setEvents(result.events); setAvailabilityError(""); setSelected(value => value || new URLSearchParams(window.location.search).get("event") || ""); }
      } catch { if (active) setAvailabilityError("Live availability is temporarily unavailable. Please try again shortly."); }
      finally { if (active) setLoaded(true); }
    };
    void refresh();
    const interval = window.setInterval(() => { if (!document.hidden) void refresh(); }, 15_000);
    window.addEventListener("focus", refresh);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.setAttribute("data-visible", "true"); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    root.current?.querySelectorAll("[data-reveal]").forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [event?.id]);

  const ended = event ? !event.sales_open : false;
  const unavailable = !event || event.status !== "active" || event.remaining <= 0 || ended;
  const low = event && event.remaining > 0 && event.remaining <= Math.max(5, Math.ceil(event.capacity * .2));
  const label = event?.status === "cancelled" ? "EVENT CANCELLED" : ended ? "TICKET SALES CLOSED" : unavailable ? "SOLD OUT" : `GET YOUR TICKET - ${partyMoney(event.price_cents)}`;
  const limit = Math.min(10,event?.remaining ?? 0);

  async function checkout(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    if (!event || busy || unavailable || availabilityError) return;
    setBusy(true); setError("");
    const form = new FormData(submitEvent.currentTarget);
    try {
      const response = await fetch("/api/parties/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        eventId: event.id, quantity, expectedPriceCents: event.price_cents, firstName: form.get("firstName"), lastName: form.get("lastName"), email: form.get("email"), phone: form.get("phone"), accepted: form.get("accepted") === "on",
      }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to start payment");
      window.location.assign(result.checkoutUrl);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Please try again"); setBusy(false); }
  }

  if (!event) return <div className={styles.page}><section className={styles.empty}><p className={styles.eyebrow}>SHAH / AFTER HOURS</p><h1>Party / Events</h1><p role="status">{!loaded ? "Setting the scene..." : availabilityError || "The next night is taking shape. Check back for our upcoming parties."}</p><Link href="/events">Discover private events <FaArrowRight /></Link></section></div>;

  return <div ref={root} className={styles.page} lang="en">
    {events.length > 1 && <div className={styles.eventPicker}><label htmlFor="event-picker">Choose your night</label><select id="event-picker" value={event.slug} onChange={change => { setSelected(change.target.value); setQuantity(1); setError(""); window.history.replaceState(null,"",`?event=${encodeURIComponent(change.target.value)}`); }}>{events.map(item => <option key={item.id} value={item.slug}>{item.title} / {partyDate(item.event_date)}</option>)}</select></div>}
    <section className={styles.hero} aria-labelledby="party-title">
      <Image src={event.image} alt="Shah Restaurant, ready for a night at the bar" fill sizes="100vw" priority unoptimized={!event.image.startsWith("/photos/")} className={styles.heroImage} />
      <div className={styles.lighting} aria-hidden="true" />
      <div className={styles.heroInner}>
        <p className={styles.eyebrow}><span /> SHAH RESTAURANT / AFTER HOURS</p>
        <h1 id="party-title">{event.title}</h1>
        <p className={styles.tagline}>Dinner ends.<br /><em>The night begins.</em></p>
        <div className={styles.when}><span><FaCalendarDays />{new Date(`${event.event_date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "Europe/Amsterdam" }).toUpperCase()}</span><span>{event.start_time.slice(0,5)} - {event.end_time.slice(0,5)}</span></div>
        <p className={styles.heroCopy}>Live DJ. A cocktail on us. Your favourite people.<br />This is your invitation to stay out a little longer.</p>
        {unavailable ? <button className={styles.primary} disabled>{label}</button> : <a className={styles.primary} href="#tickets"><FaTicket />{label}<FaArrowRight /></a>}
        <p className={`${styles.availability} ${low ? styles.urgent : ""}`} role="status">{availabilityError || (unavailable ? label : <><span className={styles.liveDot} />{event.remaining} / {event.capacity} tickets remaining{low ? " - the last places are going." : ". One night only."}</>)}</p>
      </div>
      <a href="#the-night" className={styles.scrollCue} aria-label="Explore the night"><FaArrowDown /></a>
      <span className={styles.heroSide}>AMSTERDAM / GOOD PEOPLE. GREAT ENERGY.</span>
    </section>

    <div className={styles.lineup}><span><FaHeadphones /> LIVE DJ</span><span><FaChampagneGlasses /> FIRST COCKTAIL INCLUDED</span><span><FaUsers /> ONLY {event.capacity} GUESTS</span></div>

    <section id="the-night" className={styles.night} data-reveal>
      <div className={styles.nightIntro}><p className={styles.eyebrow}>A DIFFERENT SIDE OF SHAH</p><h2>Your {weekday}.<br /><em>Turned all the way up.</em></h2></div>
      <div className={styles.nightCopy}><p>{event.description}</p><p>From the first sip to the last track, make it a night worth talking about. Come with your friends, leave the week behind and bring nothing but positive energy.</p><span className={styles.note}>Your first cocktail is already on the list.</span></div>
      <div className={styles.features}>{features.map(feature => <div key={feature.title}><feature.icon aria-hidden="true" /><h3>{feature.title}</h3><p>{feature.text}</p></div>)}</div>
    </section>

    <section className={styles.interlude} data-reveal>
      <Image src="/photos/687A0260.jpeg" alt="A freshly prepared cocktail at Shah Restaurant" fill sizes="100vw" />
      <div><p className={styles.eyebrow}>THE FIRST ROUND IS OURS</p><h2>Good taste.<br /><em>Great company.</em></h2><p>One cocktail per guest, included in every ticket.</p></div>
    </section>

    <section id="tickets" className={styles.bookingSection} data-reveal>
      <div className={styles.bookingIntro}><p className={styles.eyebrow}>MAKE A NIGHT OF IT</p><h2>You&apos;re one ticket<br />away from <em>{weekday}.</em></h2><p>{event.capacity} guests. A live DJ. A room full of possibility.<br />Get your people together. We&apos;ll take care of the atmosphere.</p>
        <div className={styles.venue}><FaLocationDot /><div><strong>Shah Restaurant</strong><p>Klaprozenweg 36a<br />1032 KL Amsterdam</p><a href="https://www.google.com/maps/search/?api=1&query=Shah+Restaurant+Klaprozenweg+36a+Amsterdam" target="_blank" rel="noreferrer">Get directions <FaArrowRight /></a></div></div>
        <ul className={styles.practical}><li><FaCheck /> First cocktail included for every guest</li><li><FaCheck /> Stylish / party-ready dress code</li><li><FaCheck /> Overnight event; all times are Amsterdam local time</li><li><FaCheck /> Your group is listed under the purchaser&apos;s name</li></ul>
        <Link href="/reservations" className={styles.dinnerLink}>Dinner before the DJ? Reserve a table <FaArrowRight /></Link>
      </div>
      <form className={styles.ticketForm} onSubmit={checkout} aria-label="Buy party tickets">
        <div className={styles.ticketHeading}><FaTicket /><span>YOUR NIGHT AT SHAH</span></div><h3>{event.title}</h3><p>{partyDate(event.event_date)}<br />{event.start_time.slice(0,5)} - {event.end_time.slice(0,5)}</p>
        <div className={`${styles.stock} ${low ? styles.urgent : ""}`}><span role="status">{availabilityError || (unavailable ? label : `${event.remaining} of ${event.capacity} tickets remaining`)}</span><progress max={event.capacity} value={event.capacity-event.remaining} aria-label={`${event.tickets_sold} tickets sold`} /></div>
        <fieldset disabled={busy || unavailable || !!availabilityError}>
          <div className={styles.quantity}><div><label htmlFor="ticket-quantity">Tickets</label><small>{partyMoney(event.price_cents)} per person</small></div><div className={styles.stepper}><button type="button" title="Remove one ticket" aria-label="Remove one ticket" disabled={quantity <= 1} onClick={() => setQuantity(value => Math.max(1,value-1))}><FaMinus /></button><input id="ticket-quantity" type="number" min={1} max={limit} value={quantity} required onChange={change => setQuantity(Number(change.target.value))} /><button type="button" title="Add one ticket" aria-label="Add one ticket" disabled={quantity >= limit} onClick={() => setQuantity(value => Math.min(limit,value+1))}><FaPlus /></button></div></div>
          <div className={styles.fields}><label>First name<input name="firstName" autoComplete="given-name" required maxLength={80} /></label><label>Last name<input name="lastName" autoComplete="family-name" required maxLength={80} /></label><label className={styles.fullField}>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label><label className={styles.fullField}>Phone number<input name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={25} pattern={"[+0-9 \\(\\)\\-]{7,25}"} /></label></div>
          <div className={styles.total}><span>Total <small>{quantity} x {partyMoney(event.price_cents)}</small></span><strong>{partyMoney(event.price_cents*quantity)}</strong></div>
          <label className={styles.agreement}><input type="checkbox" name="accepted" required /><span>I agree to the <Link href="/terms" target="_blank">terms</Link> and have read the <Link href="/privacy" target="_blank">privacy policy</Link>.</span></label>
          <p className={styles.small}>Tickets are confirmed after payment, subject to availability. If the final places sell while you pay, your payment will be refunded in full.</p>
          <button className={styles.primary} type="submit" disabled={busy || unavailable || !!availabilityError}>{busy ? "OPENING SECURE PAYMENT..." : unavailable ? label : `CONTINUE TO PAYMENT - ${partyMoney(event.price_cents*quantity)}`}<FaArrowRight /></button>
        </fieldset>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <p className={styles.secure}><FaLock /> Secure payment with Mollie</p>
      </form>
    </section>
    <section className={styles.closing}><p className={styles.eyebrow}>ONLY {event.capacity} GUESTS. ONE NIGHT.</p><h2>See you <em>after hours.</em></h2><a href="#tickets">{unavailable ? label : "Put your name on the list"}<FaArrowRight /></a></section>
  </div>;
}