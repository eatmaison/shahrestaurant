"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  FaBellConcierge,
  FaCalendarCheck,
  FaChampagneGlasses,
  FaCircleCheck,
  FaCircleXmark,
  FaClock,
  FaEnvelope,
  FaHourglassHalf,
  FaLocationDot,
  FaPhone,
  FaStar,
  FaUser,
  FaUserGroup,
  FaWandMagicSparkles,
} from "react-icons/fa6";
import { useLang, useStore } from "../providers";
import type { Reservation, ReservationStatus } from "../lib/types";
import { OPEN_FROM_MIN, OPEN_UNTIL_MIN } from "../lib/openingHours";

/** Selectable arrival times: every 30 min within opening hours (last seating 30 min before close). */
const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let m = OPEN_FROM_MIN; m <= OPEN_UNTIL_MIN - 30; m += 30) {
    slots.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return slots;
})();

const OCCASIONS = ["", "birthday", "business", "romantic", "family", "other"] as const;

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ReservationsPage() {
  const { t, lang } = useLang();
  const { currentUser, reservations, reviews, createReservation, cancelReservation, addReservationReview, hydrated } = useStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState(2);
  const [occasion, setOccasion] = useState<string>("");
  const [note, setNote] = useState("");
  const [prefilled, setPrefilled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Reservation | null>(null);
  const [nowLocal, setNowLocal] = useState("");

  // Per-reservation review state (only one open at a time).
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  // Pre-fill contact details from the signed-in profile (once, after hydration).
  useEffect(() => {
    if (!hydrated || !currentUser || prefilled) return;
    queueMicrotask(() => {
      setPrefilled(true);
      setName((value) => value || currentUser.name);
      setEmail((value) => value || currentUser.email);
      setPhone((value) => value || currentUser.phone || "");
    });
  }, [hydrated, currentUser, prefilled]);

  useEffect(() => {
    const update = () => setNowLocal(new Date().toLocaleString("sv-SE", { timeZone: "Europe/Amsterdam" }).replace(" ", "T"));
    queueMicrotask(update);
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  const occasionLabels: Record<string, string> = {
    "": t.reservations.occasionNone,
    birthday: t.reservations.occasionBirthday,
    business: t.reservations.occasionBusiness,
    romantic: t.reservations.occasionRomantic,
    family: t.reservations.occasionFamily,
    other: t.reservations.occasionOther,
  };

  const statusMeta: Record<ReservationStatus, { label: string; cls: string; Icon: typeof FaClock }> = {
    pending: { label: t.reservations.statusPending, cls: "border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-300", Icon: FaHourglassHalf },
    confirmed: { label: t.reservations.statusConfirmed, cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", Icon: FaCircleCheck },
    arrived: { label: t.admin.resArrivedStatus, cls: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300", Icon: FaCircleCheck },
    no_show: { label: t.admin.resNoShowStatus, cls: "border-red-400/40 bg-red-400/10 text-red-600 dark:text-red-400", Icon: FaCircleXmark },
    declined: { label: t.reservations.statusDeclined, cls: "border-red-400/40 bg-red-400/10 text-red-600 dark:text-red-400", Icon: FaCircleXmark },
    cancelled: { label: t.reservations.statusCancelled, cls: "border-slate-400/40 bg-slate-400/10 text-slate-500 dark:text-slate-400", Icon: FaCircleXmark },
  };

  const myReservations = useMemo(
    () => [...reservations].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)),
    [reservations]
  );

  // Map reservationId → existing review so we can show "Your review" instead of the form.
  const reviewsByReservationId = useMemo(() => {
    const m = new Map<string, (typeof reviews)[number]>();
    for (const r of reviews) if (r.reservationId) m.set(r.reservationId, r);
    return m;
  }, [reviews]);

  const infoCards = [
    { Icon: FaWandMagicSparkles, title: t.reservations.info1Title, text: t.reservations.info1Text },
    { Icon: FaChampagneGlasses, title: t.reservations.info2Title, text: t.reservations.info2Text },
    { Icon: FaBellConcierge, title: t.reservations.info3Title, text: t.reservations.info3Text },
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !phone.trim() || !date || !time) {
      setError(t.reservations.errorFillFields);
      return;
    }
    setSubmitting(true);
    const res = await createReservation({
      guestName: name,
      email: email.trim() || undefined,
      phone,
      date,
      time,
      guests,
      occasion: occasion || undefined,
      note: note.trim() || undefined,
    });
    setSubmitting(false);
    if (res.ok && res.reservation) {
      setDone(res.reservation);
      setNote("");
      return;
    }
    const messages: Record<string, string> = {
      fillFields: t.reservations.errorFillFields,
      invalidSlot: t.reservations.errorInvalidSlot,
      pastDate: t.reservations.errorPastDate,
    };
    setError(messages[res.error ?? ""] ?? t.reservations.errorGeneric);
  };

  const dateLocale = lang === "nl" ? "nl-NL" : "en-GB";
  const fmtDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="page-stage overflow-hidden">
      {/* Heading - candlelit evening hero, intentionally darker & moodier than the homepage */}
      <section className="reservation-hero-strip relative overflow-hidden bg-gradient-to-b from-[#160b03] via-[#201005] to-[#2a1608]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_90%_at_50%_110%,rgba(217,126,38,0.30),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 spice-dots opacity-20 [mask-image:radial-gradient(70%_70%_at_50%_30%,#000,transparent)]" />
        {/* Rising embers drifting up from the tandoor */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {[8, 24, 41, 58, 73, 88].map((left, i) => (
            <span
              key={left}
              className="ember"
              style={{ left: `${left}%`, animationDelay: `${i * 1.1}s`, animationDuration: `${5 + (i % 3)}s` }}
            />
          ))}
        </div>
        <div className="relative mx-auto max-w-3xl px-4 pb-10 pt-10 text-center sm:px-6 lg:pb-12 lg:pt-14">
          <span className="lux-overline inline-flex items-center gap-3 text-emerald-300">
            <span className="h-px w-10 bg-emerald-400/60" /> <span className="ornament-gem" aria-hidden /> {t.reservations.overline} <span className="ornament-gem" aria-hidden /> <span className="h-px w-10 bg-emerald-400/60" />
          </span>
          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            <span className="ember-text">{t.reservations.title}</span>
          </h1>
          <p className="mt-4 text-base leading-8 text-stone-300">{t.reservations.subtitle}</p>
          <p className="mt-4 inline-flex items-center gap-2.5 rounded-full border border-emerald-400/25 bg-white/5 px-5 py-2.5 text-xs font-semibold text-emerald-200 backdrop-blur">
            <span className="glow-dot" aria-hidden /> <FaClock className="opacity-80" /> {t.reservations.hoursNote}
          </p>
        </div>
        {/* Soft fade into the page background */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-[#fbf5eb] dark:to-[#0c0703]" />
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        {/* Booking form */}
        <div className="animate-fade-up min-w-0">
          <div className="premium-panel ember-border frame-ornate lux-sweep texture-linen rounded-[2rem] p-6 sm:p-8">
            {done ? (
              <div className="flex flex-col items-center py-8 text-center">
                <span className="animate-pop grid h-16 w-16 place-items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-2xl text-emerald-600 dark:text-emerald-400">
                  <FaCalendarCheck />
                </span>
                <h2 className="font-display mt-5 text-2xl font-semibold text-slate-900 dark:text-white">
                  {t.reservations.successTitle}
                </h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-300">{t.reservations.successText}</p>
                {/* Reservation "ticket" with a torn scalloped edge */}
                <div className="ticket-edge mt-6 w-full max-w-sm rounded-t-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-500/10 to-slate-50/80 p-5 pb-8 text-left shadow-lg shadow-emerald-900/10 dark:to-white/5">
                  <div className="flex items-center justify-between">
                    <p className="lux-overline text-[0.6rem] text-emerald-600 dark:text-emerald-400">RSV-{done.reservationNumber}</p>
                    <span className="ornament-gem" aria-hidden />
                  </div>
                  <p className="font-display mt-2 text-lg font-bold text-slate-900 dark:text-white">{fmtDate(done.date)}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {done.time} · {done.guests} {t.reservations.guestsSuffix}
                  </p>
                  <div className="gold-rule mt-4" />
                  <p className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <FaLocationDot className="text-emerald-500" /> Klaprozenweg 36a, Amsterdam
                  </p>
                </div>
                {done.email && (
                  <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                    {t.reservations.successEmailNote} <span className="font-semibold">{done.email}</span>
                  </p>
                )}
                <button
                  onClick={() => setDone(null)}
                  className="btn-ember btn-shine mt-7 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white"
                >
                  {t.reservations.makeAnother}
                </button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="form-lux">
                <div className="ornament">
                  <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">{t.reservations.formTitle}</h2>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {/* Date */}
                  <label className="block min-w-0">
                    <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <FaCalendarCheck className="text-emerald-500" /> {t.reservations.date} *
                    </span>
                    <input
                      type="date"
                      required
                      min={todayIso()}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="block w-full min-w-0 max-w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition [-webkit-appearance:none] focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:[color-scheme:dark]"
                    />
                  </label>

                  {/* Time */}
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <FaClock className="text-emerald-500" /> {t.reservations.time} *
                    </span>
                    <select
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    >
                      <option value="" disabled>
                        --:--
                      </option>
                      {TIME_SLOTS.map((s) => (
                        <option key={s} value={s} className="dark:bg-[#170d04]">
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Guests */}
                <div className="mt-4">
                  <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <FaUserGroup className="text-emerald-500" /> {t.reservations.guests} *
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {[2, 3, 4, 5, 6, 8].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setGuests(n)}
                        aria-pressed={guests === n}
                        className={`h-10 w-10 rounded-full border text-sm font-bold transition duration-200 hover:-translate-y-0.5 ${
                          guests === n
                            ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 shadow-md shadow-emerald-600/15 dark:text-emerald-300"
                            : "border-slate-200 bg-white text-slate-500 hover:border-emerald-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={guests}
                      onChange={(e) => setGuests(Math.min(200, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                      aria-label={t.reservations.guests}
                      className="h-10 w-20 rounded-full border border-slate-200 bg-white px-4 text-center text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{t.reservations.largeGroupNote}</p>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {/* Name */}
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <FaUser className="text-emerald-500" /> {t.reservations.name} *
                    </span>
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </label>

                  {/* Phone */}
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <FaPhone className="text-emerald-500" /> {t.reservations.phone} *
                    </span>
                    <input
                      type="tel"
                      required
                      autoComplete="tel"
                      placeholder="+31 6 …"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </label>
                </div>

                {/* Email */}
                <label className="mt-4 block">
                  <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <FaEnvelope className="text-emerald-500" /> {t.reservations.email}
                  </span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                  <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">{t.reservations.emailHint}</span>
                </label>

                {/* Occasion */}
                <div className="mt-4">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t.reservations.occasion}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {OCCASIONS.map((o) => (
                      <button
                        key={o || "none"}
                        type="button"
                        onClick={() => setOccasion(o)}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold transition duration-200 hover:-translate-y-0.5 ${
                          occasion === o
                            ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 shadow-md shadow-emerald-600/10 dark:text-emerald-300"
                            : "border-slate-200 bg-white text-slate-500 hover:border-emerald-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                        }`}
                      >
                        {occasionLabels[o]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <label className="mt-4 block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t.reservations.note}
                  </span>
                  <textarea
                    rows={3}
                    maxLength={500}
                    placeholder={t.reservations.notePlaceholder}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </label>

                {error && (
                  <p className="mt-4 rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-ember btn-shine mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaCalendarCheck />
                  {submitting ? t.reservations.submitting : t.reservations.submit}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right column: info + my reservations */}
        <div className="animate-fade-up delay-200 min-w-0 space-y-6">
          {/* Good to know */}
          <div className="premium-panel ember-border relative overflow-hidden rounded-[2rem] p-7 text-white sm:p-8">
            <div className="spice-dots pointer-events-none absolute inset-0 opacity-25" />
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 animate-float rounded-full bg-emerald-500/15 blur-3xl" />
            <span className="ember" style={{ left: "16%", animationDelay: "0.8s" }} aria-hidden />
            <span className="ember" style={{ left: "74%", animationDelay: "2.4s" }} aria-hidden />
            <span className="lux-overline relative text-emerald-300/90">{t.reservations.infoTitle}</span>
            <div className="relative mt-5 space-y-5">
              {infoCards.map(({ Icon, title, text }) => (
                <div key={title} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                    <Icon />
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold">{title}</p>
                    <p className="mt-1 text-xs leading-6 text-stone-300">{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative mt-6 border-t border-white/10 pt-5 text-xs leading-6 text-stone-300">
              <p className="flex items-center gap-2">
                <FaLocationDot className="text-emerald-300" /> Klaprozenweg 36a, 1032 KL Amsterdam
              </p>
              <p className="mt-1.5 flex items-center gap-2">
                <FaPhone className="text-emerald-300" />
                <a href="tel:+31203412995" className="transition hover:text-emerald-300">+31 20 341 2995</a>
              </p>
            </div>
          </div>

          {/* My reservations */}
          <div className="premium-panel lux-sweep texture-linen rounded-[2rem] p-6 sm:p-7">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">{t.reservations.myReservations}</h2>
            {!currentUser ? (
              <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                {t.reservations.signInPrompt}{" "}
                <Link href="/account" className="font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400">
                  {t.common.signIn} →
                </Link>
              </p>
            ) : myReservations.length === 0 ? (
              <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">{t.reservations.noReservations}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {myReservations.map((r) => {
                  const meta = statusMeta[r.status];
                  const today = todayIso();
                  const isUpcoming = r.date >= today && (r.status === "pending" || r.status === "confirmed");
                  // Reviewable when confirmed AND already took place (past date, or today after the seating time).
                  const slot = `${r.date}T${r.time}:00`;
                  const isReviewable = r.status === "confirmed" && !!nowLocal && slot < nowLocal;
                  const existingReview = reviewsByReservationId.get(r.id);
                  return (
                    <li key={r.id} className="magnetic-card rounded-2xl border border-emerald-500/15 bg-white/55 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-display text-sm font-bold text-slate-900 dark:text-white">{fmtDate(r.date)}</p>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide ${meta.cls}`}>
                          <meta.Icon /> {meta.label}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        RSV-{r.reservationNumber} · {r.time} · {r.guests} {t.reservations.guestsSuffix}
                        {r.occasion ? ` · ${occasionLabels[r.occasion] ?? r.occasion}` : ""}
                      </p>
                      {isUpcoming && (
                        <button
                          onClick={() => cancelReservation(r.id)}
                          className="mt-2.5 text-xs font-semibold text-red-500 underline-offset-4 transition hover:underline"
                        >
                          {t.reservations.cancelBooking}
                        </button>
                      )}

                      {/* Existing review shown as read-only */}
                      {existingReview && (
                        <div className="mt-3 rounded-xl bg-emerald-500/5 p-3 dark:bg-emerald-400/10">
                          <div className="flex items-center gap-2">
                            <span className="flex text-amber-400">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <FaStar key={s} className={`text-xs ${s <= existingReview.rating ? "" : "opacity-25"}`} />
                              ))}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                              ✓ {t.reviews.verifiedVisit}
                            </span>
                          </div>
                          {existingReview.text && (
                            <p className="mt-1.5 text-xs leading-6 text-slate-600 dark:text-slate-300">{existingReview.text}</p>
                          )}
                        </div>
                      )}

                      {/* Review form for a completed, confirmed visit */}
                      {isReviewable && !existingReview && reviewingId !== r.id && (
                        <button
                          onClick={() => {
                            setReviewingId(r.id);
                            setReviewRating(5);
                            setReviewText("");
                          }}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-400/20 dark:text-amber-300"
                        >
                          <FaStar /> {t.reviews.leaveReview}
                        </button>
                      )}
                      {isReviewable && !existingReview && reviewingId === r.id && (
                        <div className="mt-3 space-y-2 rounded-xl border border-amber-300/40 bg-amber-400/5 p-3">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.reviews.yourRating}</p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setReviewRating(s)}
                                className={`text-2xl transition hover:scale-110 ${
                                  s <= reviewRating ? "text-amber-400" : "text-slate-300 dark:text-slate-600"
                                }`}
                                aria-label={`${s}/5`}
                              >
                                <FaStar />
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder={t.reviews.reservationPlaceholder}
                            rows={3}
                            maxLength={500}
                            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                const res = await addReservationReview({
                                  reservationId: r.id,
                                  rating: reviewRating,
                                  text: reviewText,
                                });
                                if (res.ok) {
                                  setReviewingId(null);
                                  setReviewText("");
                                  setReviewRating(5);
                                }
                              }}
                              className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-500"
                            >
                              {t.reviews.submit}
                            </button>
                            <button
                              type="button"
                              onClick={() => setReviewingId(null)}
                              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition hover:text-slate-700 dark:border-white/10 dark:text-slate-400"
                            >
                              {t.common.cancel}
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Location - warm directions panel + framed map */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="reservation-location relative overflow-hidden rounded-[2rem] text-white">
          <div className="reservation-location__glow reservation-location__glow--left" />
          <div className="reservation-location__glow reservation-location__glow--right" />
          <div className="spice-dots pointer-events-none absolute inset-0 opacity-20" />
          <span className="ember" style={{ left: "12%", animationDelay: "0.6s" }} aria-hidden />
          <span className="ember" style={{ left: "38%", animationDelay: "2.2s" }} aria-hidden />

          <div className="relative grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-8 lg:p-10">
            <div className="reservation-location__info">
              <span className="lux-overline inline-flex items-center gap-3 text-[#f7c878]">
                <span className="h-px w-8 bg-[#d97e26]/70" /> <span className="ornament-gem" aria-hidden /> {t.reservations.location || "Our Location"}
              </span>
              <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                <span className="ember-text">Klaprozenweg 36a</span>
                <span className="mt-1 block text-lg font-medium text-stone-300 sm:text-xl">1032 KL Amsterdam</span>
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-stone-300">{t.reservations.locationSubtitle}</p>

              <div className="reservation-location__route-grid mt-6">
                <span>Car</span>
                <span>Bike</span>
                <span>Public transport</span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <a href="tel:+31203412995" className="reservation-contact-card group">
                  <span className="reservation-contact-card__icon"><FaPhone /></span>
                  <span>
                    <span className="block text-[0.68rem] font-bold uppercase tracking-[0.22em] text-stone-400">Call us</span>
                    <span className="mt-1 block font-semibold tracking-wide transition group-hover:text-[#f7c878]">+31 20 341 2995</span>
                  </span>
                </a>
                <div className="reservation-contact-card">
                  <span className="reservation-contact-card__icon"><FaClock /></span>
                  <span>
                    <span className="block text-[0.68rem] font-bold uppercase tracking-[0.22em] text-stone-400">Opening hours</span>
                    <span className="mt-1 block leading-6 text-stone-300">{t.reservations.hoursNote}</span>
                  </span>
                </div>
              </div>

              <div className="reservation-arrival-note mt-6">
                <span className="reservation-arrival-note__dot" aria-hidden />
                <span>Amsterdam-Noord arrival point, tucked close to the water and easy to reach before dinner.</span>
              </div>
            </div>

            <div className="reservation-map-shell">
              <div className="reservation-map-toolbar">
                <span className="inline-flex items-center gap-2"><FaLocationDot /> Klaprozenweg 36a</span>
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=Klaprozenweg+36a,+1032+KL+Amsterdam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ember btn-shine inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white"
                >
                  {t.reservations.getDirections}
                </a>
              </div>
              <div className="reservation-map-frame">
                <iframe
                  src="https://www.google.com/maps?q=Klaprozenweg%2036a%2C%201032%20KL%20Amsterdam&output=embed"
                  width="100%"
                  height="520"
                  style={{ border: 0, filter: "sepia(0.58) saturate(0.24) contrast(1.14) brightness(0.92)" }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="block h-full min-h-[380px] w-full"
                  title={t.reservations.location}
                />
                <div className="reservation-map-pin-card" aria-hidden>
                  <span><FaLocationDot /></span>
                  <strong>The Tandoor Company</strong>
                  <small>Klaprozenweg 36a</small>
                </div>
              </div>
              <div className="reservation-map-caption">
                <span>Amsterdam-Noord</span>
                <span>17:00 - 22:30</span>
                <span>Tue - Sun</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
