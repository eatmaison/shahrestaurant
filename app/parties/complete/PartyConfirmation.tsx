"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FaCircleCheck, FaClock, FaPrint, FaTicket } from "react-icons/fa6";
import { partyDate, partyMoney, type PartyBooking } from "../../lib/partyTypes";
import styles from "../party.module.css";

export default function PartyConfirmation() {
  const [booking,setBooking] = useState<PartyBooking | null>(null);
  const [error,setError] = useState("");
  const [retry,setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fragment = new URLSearchParams(window.location.hash.slice(1)).get("token");
    let token = fragment ?? "";
    try {
      if (fragment) window.sessionStorage.setItem("shah-party-booking",fragment);
      token ||= window.sessionStorage.getItem("shah-party-booking") ?? "";
      if (token) window.history.replaceState(null,"",window.location.pathname);
    } catch { token = fragment ?? ""; }
    let attempts = 0;
    const refresh = async () => {
      if (!token) { setError("No booking link was found. Please return using your payment confirmation link."); return; }
      try {
        const response = await fetch("/api/parties/booking", { method: "POST", headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to check payment");
        if (!active) return;
        setBooking(result.booking); setError(""); attempts++;
        if (["pending","refund_pending"].includes(result.booking.ticket_status) && attempts < 20) timer = setTimeout(refresh,5000);
      } catch (failure) { if (active) setError(failure instanceof Error ? failure.message : "Unable to check payment. Please retry."); }
    };
    void refresh();
    return () => { active = false; if (timer) clearTimeout(timer); };
  },[retry]);
  const confirmed = booking?.ticket_status === "confirmed";
  const refund = booking?.ticket_status === "refund_pending" || booking?.ticket_status === "refunded";
  const failed = booking?.ticket_status === "failed";
  return <div className={styles.page} lang="en"><section className={styles.confirmation}>
    {confirmed ? <FaCircleCheck /> : refund || failed ? <FaTicket /> : <FaClock />}
    <p className={styles.eyebrow}>SHAH RESTAURANT / AFTER HOURS</p>
    <h1>{confirmed ? "YOU'RE ON THE LIST." : refund ? "A little too late." : failed ? "Payment not completed." : "Checking your payment."}</h1>
    <p role="status">{confirmed ? "Your place is confirmed. Your first cocktail is waiting. Bring your best energy; we'll bring the music." : refund ? booking?.ticket_status === "refunded" ? "The last places were taken before your payment completed. Your payment has been refunded in full. Bank processing times may vary." : "No tickets have been issued. The event became unavailable while your payment completed. Your full refund is being processed; please contact us if you need assistance." : failed ? "No tickets were confirmed and no places have been deducted. You can start a new booking while tickets remain available." : "Your tickets will appear here once Mollie confirms payment. Please do not make another payment while this is pending."}</p>
    {booking && <dl>
      <div><dt>Guest</dt><dd>{booking.first_name} {booking.last_name}</dd></div>
      <div><dt>Event</dt><dd>{booking.event_title}</dd></div>
      <div><dt>Date</dt><dd>{partyDate(booking.event_date)}</dd></div>
      <div><dt>Time</dt><dd>{booking.start_time.slice(0,5)} - {booking.end_time.slice(0,5)} (Amsterdam time){booking.end_time < booking.start_time && ", ends the following day"}</dd></div>
      <div><dt>Tickets</dt><dd>{booking.quantity} {confirmed ? "confirmed" : "requested"}</dd></div>
      <div><dt>{confirmed ? "Amount paid" : refund ? "Refund amount" : "Booking total"}</dt><dd>{partyMoney(booking.total_cents)}</dd></div>
      <div><dt>Ticket / order ID</dt><dd>{booking.id}</dd></div>
    </dl>}
    {confirmed && <p>Shah Restaurant, Klaprozenweg 36a, 1032 KL Amsterdam.<br />Stylish / party-ready dress code. One cocktail included per guest.<br />{booking?.email_sent_at ? `A confirmation has been sent to ${booking.email}.` : "Keep this page as your confirmation. Your email confirmation may still be on its way."}</p>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    <div className={styles.confirmationActions}>{confirmed ? <button className={styles.primary} onClick={() => window.print()}><FaPrint /> Print confirmation</button> : <button className={styles.primary} onClick={() => setRetry(value => value+1)}>Check payment status</button>}<Link href="/parties">{failed ? "Try booking again" : "Back to events"}</Link></div>
    <p className={styles.small}>Questions about your booking? <a href="mailto:info@shahrestaurant.nl">info@shahrestaurant.nl</a> / <a href="tel:+31203412995">+31 20 341 2995</a></p>
  </section></div>;
}