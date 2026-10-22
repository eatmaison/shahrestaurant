"use client";

import Link from "next/link";
import { useLang } from "../providers";
import { formatOrderNumber } from "../lib/data";
import type { Order } from "../lib/types";
import { OrderSheet } from "../order/OrderSheet";
import { OrderTotals } from "./OrderTotals";

export function OrderConfirmation({ order, onClose }: { order: Order; onClose: () => void }) {
  const { lang } = useLang();
  const nl = lang === "nl";
  return (
    <OrderSheet titleId="order-confirmed-title" onClose={onClose}>
      <div className="rounded-3xl bg-white p-6 text-slate-900 dark:bg-slate-900 dark:text-white">
        <div role="status" aria-live="polite">
          <p className="text-3xl text-emerald-600" aria-hidden="true">✓</p>
          <h2 id="order-confirmed-title" className="mt-2 text-xl font-bold">{nl ? "Bestelling ontvangen" : "Order received"}</h2>
          <p className="mt-2 text-2xl font-black">{formatOrderNumber(order.orderNumber)}</p>
          <p className="mt-2 text-sm">{nl ? "Je bestelling is opgeslagen. Je hoeft niet opnieuw te bestellen." : "Your order has been saved. You do not need to order again."}</p>
        </div>
        <ul className="mt-4 space-y-1 text-sm">{order.items.map((item, index) => <li key={index}>{item.qty}× {item.name}</li>)}</ul>
        <OrderTotals order={order} />
        {order.accountType === "company" && !order.paid && <p className="mt-3 text-sm">{nl ? "Betaling op factuur binnen 7 dagen. De factuur wordt apart per e-mail verstuurd." : "Pay by invoice within 7 days. The invoice is sent separately by email."}</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          {order.userId && <Link href="/account" onClick={onClose} className="rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white">{nl ? "Bekijk mijn bestellingen" : "View my orders"}</Link>}
          <button autoFocus type="button" onClick={onClose} className="rounded-full border border-slate-300 px-4 py-3 text-sm font-bold">{nl ? "Sluiten" : "Close"}</button>
        </div>
      </div>
    </OrderSheet>
  );
}
