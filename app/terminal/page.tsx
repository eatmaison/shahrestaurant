"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaBellConcierge,
  FaCashRegister,
  FaCircleCheck,
  FaClock,
  FaLocationDot,
  FaLock,
  FaMotorcycle,
  FaPhone,
  FaPlay,
  FaPrint,
  FaStore,
} from "react-icons/fa6";
import { useLang, useStore } from "../providers";
import { formatOrderNumber, ORDER_STATUS_FLOW } from "../lib/data";
import type { Order, OrderStatus } from "../lib/types";

/* ------------------------------------------------------------------ */
/* ESC/POS receipt printing via the RawBT Android app.                 */
/* The POS terminal opens this page in its browser; tapping "Print"    */
/* (or auto-print) hands an ESC/POS byte stream to RawBT, which        */
/* drives the built-in thermal printer.                                */
/* ------------------------------------------------------------------ */

const ESC = "\x1b";
const GS = "\x1d";

/** Strip characters outside the printer's basic code page. */
function ascii(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/€/g, "EUR ")
    .replace(/[^\x20-\x7e\n]/g, "?");
}

/** Pad name/price into two columns for a 32-char wide (58/80mm) receipt. */
function line(left: string, right: string, width = 32): string {
  const l = ascii(left).slice(0, width - right.length - 1);
  return l + " ".repeat(Math.max(1, width - l.length - right.length)) + right + "\n";
}

/** Build the ESC/POS payload for one order. */
function buildReceipt(order: Order, lang: string): string {
  const d = new Date(order.createdAt);
  const when = d.toLocaleString(lang === "nl" ? "nl-NL" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  let r = "";
  r += ESC + "@"; // init
  r += ESC + "a" + "\x01"; // center
  r += ESC + "!" + "\x38"; // double width+height, bold
  r += "THE TANDOOR CO.\n";
  r += ESC + "!" + "\x00"; // normal
  r += "Klaprozenweg 36a, Amsterdam\n";
  r += "--------------------------------\n";
  r += ESC + "!" + "\x30"; // double size
  r += ascii(formatOrderNumber(order.orderNumber)) + "\n";
  r += ESC + "!" + "\x00";
  r += when + "\n";
  r += ESC + "a" + "\x00"; // left
  r += "--------------------------------\n";
  r += ESC + "!" + "\x08"; // bold
  r += (order.fulfillment === "pickup" ? "** PICKUP **" : "** DELIVERY **") + "\n";
  r += ESC + "!" + "\x00";
  r += ascii(order.customerName) + "\n";
  if (order.fulfillment !== "pickup") {
    r += ascii(`${order.address} ${order.postcode}`) + "\n";
  }
  r += ascii(`Tel: ${order.phone}`) + "\n";
  if (order.schedule) {
    r += ESC + "!" + "\x08";
    r += ascii(`PLANNED: ${order.schedule.date ?? "workdays"} ${order.schedule.time}`) + "\n";
    r += ESC + "!" + "\x00";
  }
  r += "--------------------------------\n";
  for (const it of order.items) {
    const side = it.sideLabel ? ` (Side: ${it.sideLabel})` : "";
    r += ESC + "!" + "\x08";
    r += line(`${it.qty}x ${it.name}${side}`, (it.price * it.qty).toFixed(2));
    r += ESC + "!" + "\x00";
  }
  r += "--------------------------------\n";
  r += line("Subtotal", order.subtotal.toFixed(2));
  if (order.discount > 0) r += line("Discount", "-" + order.discount.toFixed(2));
  if (order.delivery > 0) r += line("Delivery", order.delivery.toFixed(2));
  r += ESC + "!" + "\x18"; // double height bold
  r += line("TOTAL", "EUR " + order.total.toFixed(2));
  r += ESC + "!" + "\x00";
  r += line("Paid", order.paid ? "YES" : "NO (invoice)");
  if (order.note) {
    r += "--------------------------------\n";
    r += ESC + "!" + "\x08" + "NOTE:\n" + ESC + "!" + "\x00";
    r += ascii(order.note) + "\n";
  }
  r += "--------------------------------\n";
  r += ESC + "a" + "\x01";
  r += "thetandoorcompany.nl\n\n\n";
  r += GS + "V" + "\x42" + "\x00"; // partial cut
  return r;
}

/** Send the receipt to RawBT (which forwards it to the built-in printer). */
function printViaRawBT(payload: string): void {
  const bytes = new Uint8Array([...payload].map((c) => c.charCodeAt(0) & 0xff));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = btoa(bin);
  // RawBT deep link: opens the print service with raw ESC/POS data.
  window.location.href = `rawbt:base64,${b64}`;
}

/* ------------------------------------------------------------------ */
/* "Print from Kassa" - printing from a Windows POS whose Epson        */
/* TM-T20III is installed as the default Windows printer. The browser  */
/* cannot push raw ESC/POS to a USB printer, so we render an 80mm      */
/* HTML receipt in a hidden iframe and call the browser's print(),     */
/* which routes to the Epson via its Windows driver. Launch the        */
/* browser with --kiosk-printing (Epson as default printer) to skip    */
/* the print dialog and print silently.                                */
/* ------------------------------------------------------------------ */

const SHOP_NAME = "THE TANDOOR CO.";
const SHOP_ADDRESS = "Klaprozenweg 36a, Amsterdam";
const SHOP_SITE = "thetandoorcompany.nl";

/** Escape text for safe HTML interpolation. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Build an 80mm HTML receipt matching the ESC/POS layout. */
function buildReceiptHTML(order: Order, lang: string): string {
  const d = new Date(order.createdAt);
  const when = d.toLocaleString(lang === "nl" ? "nl-NL" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const items = order.items
    .map((it) => {
      const side = it.sideLabel ? `<div class="side">Side: ${esc(it.sideLabel)}</div>` : "";
      return `<div class="row bold"><span>${it.qty}x ${esc(it.name)}${side}</span><span>${(it.price * it.qty).toFixed(2)}</span></div>`;
    })
    .join("");
  const planned = order.schedule
    ? `<div class="bold">PLANNED: ${esc(order.schedule.date ?? "workdays")} ${esc(order.schedule.time)}</div>`
    : "";
  const address = order.fulfillment !== "pickup" ? `<div>${esc(`${order.address} ${order.postcode}`)}</div>` : "";
  const discount = order.discount > 0 ? `<div class="row"><span>Discount</span><span>-${order.discount.toFixed(2)}</span></div>` : "";
  const delivery = order.delivery > 0 ? `<div class="row"><span>Delivery</span><span>${order.delivery.toFixed(2)}</span></div>` : "";
  const note = order.note
    ? `<div class="hr"></div><div class="bold">NOTE:</div><div>${esc(order.note)}</div>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(formatOrderNumber(order.orderNumber))}</title><style>
@page { size: 80mm auto; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 80mm; }
body { padding: 3mm 4mm; font-family: 'Courier New', ui-monospace, monospace; font-size: 12px; line-height: 1.35; color: #000; }
.center { text-align: center; }
.bold { font-weight: 700; }
.shop { font-size: 22px; font-weight: 800; letter-spacing: 1px; }
.num { font-size: 26px; font-weight: 800; }
.when { font-size: 13px; }
.hr { border-top: 1px dashed #000; margin: 5px 0; }
.row { display: flex; justify-content: space-between; gap: 8px; }
.row span:last-child { white-space: nowrap; }
.side { font-size: 11px; font-weight: 400; }
.total { font-size: 16px; font-weight: 800; }
.tag { font-weight: 700; }
</style></head><body>
<div class="center shop">${esc(SHOP_NAME)}</div>
<div class="center">${esc(SHOP_ADDRESS)}</div>
<div class="hr"></div>
<div class="center num">${esc(formatOrderNumber(order.orderNumber))}</div>
<div class="center when">${esc(when)}</div>
<div class="hr"></div>
<div class="tag">${order.fulfillment === "pickup" ? "** PICKUP **" : "** DELIVERY **"}</div>
<div>${esc(order.customerName)}</div>
${address}
<div>Tel: ${esc(order.phone)}</div>
${planned}
<div class="hr"></div>
${items}
<div class="hr"></div>
<div class="row"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
${discount}
${delivery}
<div class="row total"><span>TOTAL</span><span>EUR ${order.total.toFixed(2)}</span></div>
<div class="row"><span>Paid</span><span>${order.paid ? "YES" : "NO (invoice)"}</span></div>
${note}
<div class="hr"></div>
<div class="center">${esc(SHOP_SITE)}</div>
</body></html>`;
}

/** Render the receipt in a hidden iframe and print via the Windows driver. */
function printFromKassa(order: Order, lang: string): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(buildReceiptHTML(order, lang));
  doc.close();
  const win = iframe.contentWindow!;
  let removed = false;
  const cleanup = () => {
    if (removed) return;
    removed = true;
    setTimeout(() => iframe.remove(), 500);
  };
  win.onafterprint = cleanup;
  // Give the browser a tick to lay out the receipt before printing.
  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch {
      /* ignore */
    }
    cleanup();
  }, 250);
}

const LS_SEEN = "tm.terminal.seen";
const LS_AUTOPRINT = "tm.terminal.autoprint";

export default function TerminalPage() {
  const { t, lang } = useLang();
  const { currentUser, orders, updateOrderStatus, refresh, hydrated } = useStore();

  const [shiftStarted, setShiftStarted] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [flash, setFlash] = useState<string[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<AudioContext | null>(null);
  const autoPrintRef = useRef(false);
  autoPrintRef.current = autoPrint;

  const isStaff = currentUser?.role === "admin";

  /* Two short rising beeps, generated locally (no audio file needed). */
  const beep = useCallback(() => {
    const ctx = audioRef.current;
    if (!ctx) return;
    for (const [i, freq] of [880, 1320].entries()) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.25);
      osc.stop(ctx.currentTime + i * 0.25 + 0.22);
    }
  }, []);

  /* Load persisted state once. */
  useEffect(() => {
    try {
      seenRef.current = new Set(JSON.parse(localStorage.getItem(LS_SEEN) ?? "[]"));
      setAutoPrint(localStorage.getItem(LS_AUTOPRINT) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  /* Start shift: unlock audio (needs a user gesture) + keep the screen on. */
  const startShift = useCallback(async () => {
    try {
      audioRef.current = audioRef.current ?? new AudioContext();
      await audioRef.current.resume();
    } catch {
      /* audio stays off */
    }
    try {
      // Keep the terminal screen awake while the feed is open.
      const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<unknown> } };
      await nav.wakeLock?.request("screen");
    } catch {
      /* not supported - staff can raise the screen timeout instead */
    }
    setShiftStarted(true);
  }, []);

  /* Poll for new orders every 15 seconds while the shift is running. */
  useEffect(() => {
    if (!shiftStarted) return;
    const id = setInterval(() => {
      refresh().then(() => setLastUpdate(new Date()));
    }, 15_000);
    refresh().then(() => setLastUpdate(new Date()));
    return () => clearInterval(id);
  }, [shiftStarted, refresh]);

  /* Detect newly arrived orders -> beep, flash, optionally print. */
  useEffect(() => {
    if (!shiftStarted || !isStaff) return;
    const fresh = orders.filter((o) => (o.paid || o.accountType === "company") && !seenRef.current.has(o.id));
    if (fresh.length === 0) return;
    for (const o of fresh) seenRef.current.add(o.id);
    try {
      // Persist only a bounded set so localStorage never grows forever.
      localStorage.setItem(LS_SEEN, JSON.stringify([...seenRef.current].slice(-500)));
    } catch {
      /* ignore */
    }
    // On the very first load everything is "new" - only alert after that.
    if (lastUpdate) {
      beep();
      setFlash(fresh.map((o) => o.id));
      setTimeout(() => setFlash([]), 6000);
      if (autoPrintRef.current) {
        for (const o of fresh) printViaRawBT(buildReceipt(o, lang));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, shiftStarted, isStaff]);

  const toggleAutoPrint = useCallback(() => {
    setAutoPrint((v) => {
      localStorage.setItem(LS_AUTOPRINT, v ? "0" : "1");
      return !v;
    });
  }, []);

  const active = useMemo(
    () => orders.filter((o) => (o.paid || o.accountType === "company") && o.status !== "delivered").sort((a, b) => a.createdAt - b.createdAt),
    [orders]
  );
  const doneToday = useMemo(() => {
    const start = new Date().setHours(0, 0, 0, 0);
    return orders.filter((o) => (o.paid || o.accountType === "company") && o.status === "delivered" && o.createdAt >= start).length;
  }, [orders]);

  const statusLabels: Record<OrderStatus, string> = {
    new: t.fulfillment.statusNew,
    preparing: t.fulfillment.statusPreparing,
    delivery: t.fulfillment.statusDelivery,
    delivered: t.fulfillment.statusDelivered,
  };
  const nextAction: Partial<Record<OrderStatus, string>> = {
    new: t.fulfillment.startPreparing,
    preparing: t.fulfillment.sendToCourier,
    delivery: t.fulfillment.markDelivered,
  };

  if (!hydrated) return null;

  if (!isStaff) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xl text-emerald-600 dark:text-emerald-400">
          <FaLock />
        </span>
        <h1 className="font-display mt-5 text-2xl font-semibold text-slate-900 dark:text-white">{t.terminal.title}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">{t.terminal.accessDenied}</p>
        <Link
          href="/account"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          {t.common.signIn}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-3 py-6 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display flex items-center gap-2.5 text-2xl font-semibold text-slate-900 dark:text-white">
            <FaBellConcierge className="text-emerald-600 dark:text-emerald-400" /> {t.terminal.title}
          </h1>
          {shiftStarted && (
            <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              {t.terminal.live}
              {lastUpdate && (
                <span className="font-normal text-slate-400">
                  · {t.terminal.lastUpdate} {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </p>
          )}
        </div>
        {shiftStarted && (
          <button
            onClick={toggleAutoPrint}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold transition ${
              autoPrint
                ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "border-slate-300 text-slate-500 dark:border-white/15 dark:text-slate-400"
            }`}
          >
            <FaPrint /> {t.terminal.autoPrint} {autoPrint ? "✓" : ""}
          </button>
        )}
      </div>

      {!shiftStarted ? (
        /* Start screen - one big tap unlocks sound + wake lock */
        <div className="mt-10 flex flex-col items-center rounded-[2rem] border border-emerald-500/20 bg-white p-10 text-center dark:border-emerald-400/15 dark:bg-white/5">
          <p className="max-w-sm text-sm leading-7 text-slate-600 dark:text-slate-400">{t.terminal.subtitle}</p>
          <button
            onClick={startShift}
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-emerald-600 px-10 py-5 text-lg font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500"
          >
            <FaPlay /> {t.terminal.startShift}
          </button>
          <p className="mt-4 text-xs text-slate-400">{t.terminal.startShiftHint}</p>
        </div>
      ) : (
        <>
          {/* Counters */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-emerald-500/20 bg-white p-4 text-center dark:border-emerald-400/15 dark:bg-white/5">
              <p className="font-display text-3xl font-bold text-emerald-600 dark:text-emerald-400">{active.length}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.terminal.activeOrders}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center dark:border-white/10 dark:bg-white/5">
              <p className="font-display text-3xl font-bold text-slate-700 dark:text-slate-300">{doneToday}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.terminal.doneOrders}</p>
            </div>
          </div>

          {/* Order cards */}
          {active.length === 0 ? (
            <p className="mt-10 text-center text-sm leading-7 text-slate-500 dark:text-slate-400">{t.terminal.noOrders}</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {active.map((o) => {
                const isNew = flash.includes(o.id);
                const next = ORDER_STATUS_FLOW[ORDER_STATUS_FLOW.indexOf(o.status) + 1];
                return (
                  <li
                    key={o.id}
                    className={`rounded-3xl border-2 p-4 transition sm:p-5 ${
                      isNew
                        ? "animate-pulse-soft border-emerald-500 bg-emerald-500/10"
                        : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-display text-xl font-bold text-slate-900 dark:text-white">
                        {formatOrderNumber(o.orderNumber)}
                        {isNew && (
                          <span className="ml-2 rounded-full bg-emerald-600 px-2.5 py-1 align-middle text-[0.65rem] font-black uppercase tracking-wider text-white">
                            {t.terminal.newOrderAlert}
                          </span>
                        )}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <FaClock className="text-emerald-500" />
                        {new Date(o.createdAt).toLocaleTimeString(lang === "nl" ? "nl-NL" : "en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                        {o.fulfillment === "pickup" ? <FaStore className="text-emerald-500" /> : <FaMotorcycle className="text-emerald-500" />}
                        {o.customerName}
                      </span>
                      {o.fulfillment !== "pickup" && (
                        <span className="inline-flex items-center gap-1.5"><FaLocationDot className="text-emerald-500" /> {o.address}, {o.postcode}</span>
                      )}
                      <a href={`tel:${o.phone}`} className="inline-flex items-center gap-1.5"><FaPhone className="text-emerald-500" /> {o.phone}</a>
                    </div>

                    <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm dark:border-white/10">
                      {o.items.map((it, i) => (
                        <li key={i} className="flex justify-between gap-3">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {it.qty}× {it.name}
                            {it.sideLabel && <span className="block text-xs text-emerald-700 dark:text-emerald-300">Side: {it.sideLabel}</span>}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">€{(it.price * it.qty).toFixed(2)}</span>
                        </li>
                      ))}
                      <li className="flex justify-between gap-3 border-t border-slate-100 pt-1.5 font-bold text-slate-900 dark:border-white/10 dark:text-white">
                        <span>{t.common.total}</span>
                        <span>€{o.total.toFixed(2)}</span>
                      </li>
                    </ul>

                    {o.note && (
                      <p className="mt-2 rounded-xl bg-amber-400/10 px-3 py-2 text-xs font-semibold leading-5 text-amber-700 dark:text-amber-300">
                        📝 {o.note}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => printViaRawBT(buildReceipt(o, lang))}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-emerald-500 px-4 py-3 text-sm font-bold text-emerald-700 transition active:bg-emerald-500/15 dark:text-emerald-300"
                      >
                        <FaPrint /> {t.terminal.print}
                      </button>
                      <button
                        onClick={() => printFromKassa(o, lang)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-slate-400 px-4 py-3 text-sm font-bold text-slate-700 transition active:bg-slate-500/15 dark:border-white/25 dark:text-slate-200"
                      >
                        <FaCashRegister /> {t.terminal.printKassa}
                      </button>
                      {next && (
                        <button
                          onClick={() => updateOrderStatus(o.id, next)}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition active:bg-emerald-500"
                        >
                          <FaCircleCheck /> {nextAction[o.status]}
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-center text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
                      {statusLabels[o.status]}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mt-8 rounded-2xl border border-slate-200 px-4 py-3 text-center text-xs leading-5 text-slate-400 dark:border-white/10">
            {t.terminal.printerHelp}
          </p>
          <p className="mt-2 rounded-2xl border border-slate-200 px-4 py-3 text-center text-xs leading-5 text-slate-400 dark:border-white/10">
            {t.terminal.printKassaHelp}
          </p>
        </>
      )}
    </div>
  );
}
