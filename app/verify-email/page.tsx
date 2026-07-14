"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FaCircleCheck, FaCircleXmark, FaSpinner } from "react-icons/fa6";
import { useLang } from "../providers";

function VerifyEmailInner() {
  const { t } = useLang();
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "ok" | "fail">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("fail");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verifyEmail", token }),
        });
        const json = await res.json();
        setStatus(json.ok ? "ok" : "fail");
      } catch {
        setStatus("fail");
      }
    })();
  }, [token]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      {status === "loading" ? (
        <>
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10 text-3xl text-emerald-600 dark:text-emerald-400">
            <FaSpinner className="animate-spin" />
          </span>
          <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">{t.email.verifyingTitle}</h1>
        </>
      ) : status === "ok" ? (
        <>
          <span className="animate-pop grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/15 text-3xl text-emerald-600 shadow-[0_0_30px_rgba(217,126,38,0.3)] dark:text-emerald-400">
            <FaCircleCheck />
          </span>
          <h1 className="font-display mt-6 text-2xl font-bold text-slate-900 dark:text-white">{t.email.verifySuccess}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t.email.verifySuccessText}</p>
          <Link href="/account" className="btn-shine mt-8 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 bg-[length:200%_auto] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-right">
            {t.email.goToAccount}
          </Link>
        </>
      ) : (
        <>
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-red-500/10 text-3xl text-red-500">
            <FaCircleXmark />
          </span>
          <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">{t.email.verifyFail}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t.email.verifyFailText}</p>
          <Link href="/account" className="mt-8 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-500">
            {t.email.goToAccount}
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-slate-500">…</div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
