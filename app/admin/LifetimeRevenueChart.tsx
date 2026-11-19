"use client";

import { useMemo } from "react";
import type { Order } from "../lib/types";
import { buildLifetimeRevenueMetrics } from "../lib/adminMetrics";

function money(value: number, lang: string) {
  return new Intl.NumberFormat(lang === "nl" ? "nl-NL" : "en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(value);
}

function dateLabel(date: string, lang: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
}

export function LifetimeRevenueChart({ orders, now, lang }: { orders: readonly Order[]; now: number; lang: string }) {
  const data = useMemo(() => buildLifetimeRevenueMetrics(orders, now), [orders, now]);
  const title = lang === "nl" ? "Totale betaalde omzet" : "Lifetime paid revenue";
  const note = lang === "nl"
    ? "Opgeteld per dag vanaf de eerste betaalde bestelling. Alleen bestellingen met betaald-status."
    : "Accumulated by day from the first paid order. Only orders marked as paid are included.";

  if (!data.length) {
    return <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5" aria-label={title}>
      <h2 className="text-lg font-black text-slate-900 dark:text-white">{title}</h2>
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{lang === "nl" ? "Er zijn nog geen betaalde bestellingen om weer te geven." : "There are no paid orders to display yet."}</p>
    </section>;
  }

  const width = Math.min(12_000, Math.max(760, data.length * 12));
  const height = 250;
  const pad = { top: 28, right: 24, bottom: 42, left: 58 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const max = Math.max(1, data[data.length - 1].cumulativeRevenue);
  const xFor = (index: number) => pad.left + (data.length <= 1 ? plotWidth / 2 : index / (data.length - 1) * plotWidth);
  const yFor = (value: number) => pad.top + plotHeight - value / max * plotHeight;
  const points = data.map((item, index) => ({ x: xFor(index), y: yFor(item.cumulativeRevenue) }));
  const line = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const area = `${line} L ${points[points.length - 1].x} ${pad.top + plotHeight} L ${points[0].x} ${pad.top + plotHeight} Z`;
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(6, Math.floor(width / 130))));

  return <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5" aria-label={title}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{note}</p>
      </div>
      <div className="text-right">
        <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">{lang === "nl" ? "Totaal" : "Total"}</span>
        <strong className="text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{money(data[data.length - 1].cumulativeRevenue, lang)}</strong>
      </div>
    </div>
    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{dateLabel(data[0].date, lang)} – {dateLabel(data[data.length - 1].date, lang)}</p>
    <div tabIndex={0} role="group" aria-label={title} className="mt-4 overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title}: ${money(data[data.length - 1].cumulativeRevenue, lang)}`} style={{ minWidth: width }} className="w-full overflow-visible">
        <defs><linearGradient id="lifetimeRevenueFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0f766e" stopOpacity=".28"/><stop offset="100%" stopColor="#0f766e" stopOpacity=".02"/></linearGradient></defs>
        {[0, 0.5, 1].map((ratio) => {
          const y = pad.top + plotHeight * ratio;
          return <line key={ratio} x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="currentColor" className="text-slate-200 dark:text-white/10" strokeDasharray="3 6"/>;
        })}
        <path d={area} fill="url(#lifetimeRevenueFill)"/>
        <path d={line} fill="none" stroke="#0f766e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        {data.map((item, index) => <g key={item.date}>
          {(index === 0 || index === data.length - 1 || index % labelEvery === 0) && <circle cx={points[index].x} cy={points[index].y} r="4" fill="#d9a64e" stroke="white" strokeWidth="2" className="dark:stroke-slate-900"/>}
          <title>{`${dateLabel(item.date, lang)}: ${money(item.cumulativeRevenue, lang)} cumulative · +${money(item.dailyRevenue, lang)} · ${item.orders} ${lang === "nl" ? "bestellingen" : "orders"}`}</title>
          {(index === 0 || index === data.length - 1 || index % labelEvery === 0) && <text x={points[index].x} y={height - 14} textAnchor="middle" className="fill-slate-400 text-[11px]">{dateLabel(item.date, lang)}</text>}
        </g>)}
        <text x="8" y={pad.top + 4} className="fill-slate-400 text-[10px]">{money(max, lang)}</text>
        <text x="28" y={pad.top + plotHeight + 4} className="fill-slate-400 text-[10px]">{money(0, lang)}</text>
      </svg>
    </div>
  </section>;
}
