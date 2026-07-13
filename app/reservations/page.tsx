"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  const { currentUser, reservations, createReservation, cancelReservation, hydrated } = useStore();

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

  // Pre-fill contact details from the signed-in profile (once, after hydration).
  if (hydrated && currentUser && !prefilled) {
    setPrefilled(true);
    if (!name) setName(currentUser.name);
    if (!email) setEmail(currentUser.email);
    if (!phone && currentUser.phone) setPhone(currentUser.phone);
  }

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
    declined: { label: t.reservations.statusDeclined, cls: "border-red-400/40 bg-red-400/10 text-red-600 dark:text-red-400", Icon: FaCircleXmark },
    cancelled: { label: t.reservations.statusCancelled, cls: "border-slate-400/40 bg-slate-400/10 text-slate-500 dark:text-slate-400", Icon: FaCircleXmark },
  };

  const myReservations = useMemo(
    () => [...reservations].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)),
    [reservations]
  );

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
    <div className="overflow-hidden">
      {/* Heading */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(195,144,61,0.14),transparent_65%)]" />
        <div className="relative mx-auto max-w-3xl px-4 pb-4 pt-14 text-center sm:px-6 lg:pt-20">
          <span className="lux-overline inline-flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <span className="h-px w-10 bg-emerald-500/60" /> {t.reservations.overline} <span className="h-px w-10 bg-emerald-500/60" />
          </span>
          <h1 className="font-display mt-5 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            {t.reservations.title}
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">{t.reservations.subtitle}</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <FaClock /> {t.reservations.hoursNote}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        {/* Booking form */}
        <div className="animate-fade-up min-w-0">
          <div className="rounded-[2rem] border border-emerald-500/20 bg-white p-6 shadow-2xl shadow-emerald-900/10 dark:border-emerald-400/15 dark:bg-[#161006] sm:p-8">
            {done ? (
              <div className="flex flex-col items-center py-8 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-2xl text-emerald-600 dark:text-emerald-400">
                  <FaCalendarCheck />
                </span>
                <h2 className="font-display mt-5 text-2xl font-semibold text-slate-900 dark:text-white">
                  {t.reservations.successTitle}
                </h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-300">{t.reservations.successText}</p>
                <div className="mt-6 w-full max-w-sm rounded-2xl border border-emerald-500/20 bg-slate-50/80 p-5 text-left dark:bg-white/5">
                  <p className="lux-overline text-[0.6rem] text-emerald-600 dark:text-emerald-400">RSV-{done.reservationNumber}</p>
                  <p className="font-display mt-2 text-lg font-bold text-slate-900 dark:text-white">{fmtDate(done.date)}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {done.time} · {done.guests} {t.reservations.guestsSuffix}
                  </p>
                </div>
                {done.email && (
                  <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                    {t.reservations.successEmailNote} <span className="font-semibold">{done.email}</span>
                  </p>
                )}
                <button
                  onClick={() => setDone(null)}
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  {t.reservations.makeAnother}
                </button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">{t.reservations.formTitle}</h2>

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
                        <option key={s} value={s} className="dark:bg-[#161006]">
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
                  <div className="flex flex-wrap gap-2">
                    
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={guests}
                      onChange={(e) => setGuests(Math.min(40, Math.max(1, parseInt(e.target.value, 10) || 1)))}
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
                        className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                          occasion === o
                            ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
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
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
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
          <div className="rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-[#171208] via-[#221a0c] to-[#2c2110] p-7 text-white sm:p-8">
            <span className="lux-overline text-emerald-300/90">{t.reservations.infoTitle}</span>
            <div className="mt-5 space-y-5">
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
            <div className="mt-6 border-t border-white/10 pt-5 text-xs leading-6 text-stone-300">
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
          <div className="rounded-[2rem] border border-emerald-500/15 bg-white p-6 dark:border-emerald-400/10 dark:bg-white/5 sm:p-7">
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
                  const isUpcoming = r.date >= todayIso() && (r.status === "pending" || r.status === "confirmed");
                  return (
                    <li key={r.id} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
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
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Google Maps Location */}
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-emerald-500/20 bg-white p-5 shadow-2xl shadow-emerald-900/10 dark:border-emerald-400/15 dark:bg-[#161006] sm:p-6 overflow-hidden">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white mb-4">{t.reservations.location || "Our Location"}</h2>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2436.6236159783234!2d4.895563!3d52.357847!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c609c3e3c3c3c3%3A0x1234567890abcdef!2sKlaprozenweg%2036a%2C%201032%20KL%20Amsterdam!5e0!3m2!1sen!2snl!4v1234567890"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="rounded-xl"
          />
        </div>
      </section>
    </div>
  );
}
