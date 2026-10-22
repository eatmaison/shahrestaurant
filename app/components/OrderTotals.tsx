"use client";

import { useLang } from "../providers";
import type { Order } from "../lib/types";

export function OrderTotals({ order }: { order: Order }) {
  const { lang } = useLang();
  const nl = lang === "nl";
  return (
    <dl className="mt-3 space-y-1 rounded-xl border border-slate-200 p-3 text-sm dark:border-white/10">
      <div className="flex justify-between gap-4"><dt>{nl ? "Subtotaal" : "Subtotal"}</dt><dd>€{order.subtotal.toFixed(2)}</dd></div>
      {order.discount > 0 && <div className="flex justify-between gap-4 text-emerald-700 dark:text-emerald-300"><dt>{order.accountType === "company" ? (nl ? "Bedrijfskorting" : "Business discount") : (nl ? "Korting" : "Discount")}</dt><dd>−€{order.discount.toFixed(2)}</dd></div>}
      {order.pointsUsed > 0 && <div className="flex justify-between gap-4"><dt>{nl ? "Ingewisselde punten" : "Points redeemed"}</dt><dd>−€{order.pointsUsed.toFixed(2)}</dd></div>}
      <div className="flex justify-between gap-4"><dt>{order.fulfillment === "pickup" ? (nl ? "Afhalen" : "Pickup") : (nl ? "Bezorgkosten" : "Delivery")}</dt><dd>€{order.delivery.toFixed(2)}</dd></div>
      <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 font-bold dark:border-white/10"><dt>{nl ? "Totaal" : "Total"}</dt><dd>€{order.total.toFixed(2)}</dd></div>
    </dl>
  );
}
