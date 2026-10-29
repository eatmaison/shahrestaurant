"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FaCircleCheck, FaCircleXmark, FaSpinner, FaCrown, FaReceipt } from "react-icons/fa6";
import { useLang, useStore } from "../../providers";
import { fetchJSON } from "../../lib/clientFetch";
import { formatOrderNumber } from "../../lib/data";

type Result = { kind: "order" | "vip" | null; status: string; orderNumber?: number };
const waiting = new Set(["open", "pending", "authorized"]);
const knownStatuses = new Set(["paid", "open", "pending", "authorized", "failed", "canceled", "expired", "not_found"]);

function PaymentCompleteInner() {
  const { t, lang } = useLang();
  const { clearCart, refresh } = useStore();
  const reference = useSearchParams().get("p") ?? "";
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [resultReference, setResultReference] = useState("");
  const validReference = reference.length > 0 && reference.length <= 2048;

  useEffect(() => {
    if (!validReference) return;
    let active = true; let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    let checks = 0;
    const check = async () => {
      if (!active) return;
      try {
        const { response, data } = await fetchJSON<Result>(`/api/mollie/verify?p=${encodeURIComponent(reference)}`, { cache: "no-store", signal: controller.signal });
        if (!active) return;
        if (!response.ok || !data || !knownStatuses.has(data.status) || !["order", "vip", null].includes(data.kind ?? null) || (data.status === "paid" && !data.kind)) throw new Error("Verification unavailable");
        setResult(data); setResultReference(reference);
        if (waiting.has(data.status) && checks++ < 5) { timer = setTimeout(() => void check(), 1500); return; }
        if (data.status === "paid") { if (data.kind === "order") clearCart(); void refresh(); }
      } catch {
        if (!active || controller.signal.aborted) return;
        setResult({ kind: null, status: "error" }); setResultReference(reference);
      }
      if (active) setLoading(false);
    };
    void check();
    return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, [reference, validReference, attempt, clearCart, refresh]);

  const current = resultReference === reference ? result : null;
  const busy = validReference && (loading || !current);
  const pending = !!current && waiting.has(current.status);
  const paid = current?.status === "paid";
  const error = current?.status === "error";
  const isVip = current?.kind === "vip";
  const retry = () => { setLoading(true); setAttempt(value => value + 1); };
  const nl = lang === "nl";

  return <section aria-busy={busy} className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
    <div role="status" aria-live="polite">
      <span aria-hidden="true" className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl text-3xl ${paid ? "bg-emerald-500/15 text-emerald-600" : pending || busy ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-500"}`}>
        {busy ? <FaSpinner className="animate-spin" /> : paid ? isVip ? <FaCrown /> : <FaCircleCheck /> : pending ? <FaReceipt /> : <FaCircleXmark />}
      </span>
      <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">{busy ? t.pay.processing : paid ? t.pay.success : pending ? (nl ? "De betaling is nog niet bevestigd" : "Payment is not confirmed yet") : error ? (nl ? "Betalingsstatus tijdelijk niet beschikbaar" : "Payment status temporarily unavailable") : t.pay.failed}</h1>
      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{busy ? t.pay.processingDesc : paid ? isVip ? t.pay.vipActivated : t.pay.orderConfirmed : pending || error ? (nl ? "Controleer de status opnieuw. Plaats niet meteen een tweede bestelling als het bedrag al is afgeschreven. Neem bij twijfel contact met ons op." : "Check the status again. If money has already left your account, avoid placing a second order immediately. Contact us if you are unsure.") : t.pay.failedDesc}</p>
    </div>
    {paid && current?.orderNumber && <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white"><FaReceipt aria-hidden="true" />{formatOrderNumber(current.orderNumber)}</p>}
    {!busy && <div className="mt-7 flex flex-wrap justify-center gap-3">
      {validReference && (pending || error) && <button type="button" onClick={retry} className="min-h-11 rounded-full bg-emerald-600 px-6 py-3 font-bold text-white">{nl ? "Status opnieuw controleren" : "Check status again"}</button>}
      <Link href="/account" prefetch={false} className="min-h-11 rounded-full border px-6 py-3 font-semibold">{t.pay.goToAccount}</Link>
      <Link href="/order" className="min-h-11 rounded-full border px-6 py-3 font-semibold">{t.pay.backToMenu}</Link>
    </div>}
    {!busy && !paid && <a href="tel:+31203412995" className="mt-6 underline">+31 20 341 2995</a>}
  </section>;
}
export default function PaymentCompletePage() { return <Suspense fallback={<p role="status" className="p-12 text-center">…</p>}><PaymentCompleteInner /></Suspense>; }
