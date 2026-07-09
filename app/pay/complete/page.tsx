"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FaCircleCheck, FaCircleXmark, FaSpinner, FaCrown, FaReceipt } from "react-icons/fa6";
import { useLang, useStore } from "../../providers";

type Result = { kind: "order" | "vip" | null; status: string; orderNumber?: number };

function PaymentCompleteInner() {
  const { t } = useLang();
  const { clearCart } = useStore();
  const params = useSearchParams();
  const p = params.get("p");
  const [result, setResult] = useState<Result | null>(null);
  const clearedRef = useRef(false);

  useEffect(() => {
    if (!p) {
      setResult({ kind: null, status: "not_found" });
      return;
    }
    let attempts = 0;
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(`/api/mollie/verify?p=${p}`, { cache: "no-store" });
        const data: Result = await res.json();
        if (cancelled) return;
        // Payment may still be settling right after the redirect — retry a few times.
        if ((data.status === "open" || data.status === "pending") && attempts < 5) {
          attempts += 1;
          setTimeout(check, 1500);
          return;
        }
        if (data.status === "paid" && data.kind === "order" && !clearedRef.current) {
          clearedRef.current = true;
          clearCart();
        }
        setResult(data);
      } catch {
        if (!cancelled) setResult({ kind: null, status: "error" });
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [p, clearCart]);

  const paid = result?.status === "paid";
  const pending = !result || result.status === "open" || result.status === "pending";
  const isVip = result?.kind === "vip";

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      {pending ? (
        <>
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10 text-3xl text-emerald-600 dark:text-emerald-400">
            <FaSpinner className="animate-spin" />
          </span>
          <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">{t.pay.processing}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.pay.processingDesc}</p>
        </>
      ) : paid ? (
        <>
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/15 text-3xl text-emerald-600 dark:text-emerald-400">
            {isVip ? <FaCrown /> : <FaCircleCheck />}
          </span>
          <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">{t.pay.success}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {isVip ? t.pay.vipActivated : t.pay.orderConfirmed}
          </p>
          {result?.orderNumber && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-black text-white dark:bg-white/15">
              <FaReceipt /> {t.order.orderNumber} ETG-{result.orderNumber}
            </p>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/account" className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-500">
              {isVip ? t.pay.goToAccount : t.pay.viewOrders}
            </Link>
            <Link href="/order" className="rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
              {t.pay.backToMenu}
            </Link>
          </div>
        </>
      ) : (
        <>
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-red-500/10 text-3xl text-red-500">
            <FaCircleXmark />
          </span>
          <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">{t.pay.failed}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t.pay.failedDesc}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/order" className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-500">
              {t.pay.tryAgain}
            </Link>
            <Link href="/account" className="rounded-full border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
              {t.pay.goToAccount}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function PaymentCompletePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-slate-500">…</div>}>
      <PaymentCompleteInner />
    </Suspense>
  );
}
