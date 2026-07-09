"use client";

import Link from "next/link";
import { useState } from "react";
import { FaEnvelope, FaCircleCheck } from "react-icons/fa6";
import { useLang } from "../providers";

export default function ForgotPasswordPage() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "requestReset", email }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-16">
      {sent ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-white/5">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 text-2xl text-emerald-600 dark:text-emerald-400">
            <FaCircleCheck />
          </span>
          <h1 className="mt-5 text-xl font-black text-slate-900 dark:text-white">{t.email.forgotTitle}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t.email.forgotSent}</p>
          <Link href="/account" className="mt-6 inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-500">
            {t.email.backToSignIn}
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-white/10 dark:bg-white/5">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-xl text-emerald-600 dark:text-emerald-400">
            <FaEnvelope />
          </span>
          <h1 className="mt-4 text-xl font-black text-slate-900 dark:text-white">{t.email.forgotTitle}</h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{t.email.forgotText}</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={t.email.emailLabel}
            className="mt-5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          <button
            onClick={submit}
            disabled={loading}
            className="mt-4 w-full rounded-full bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-60"
          >
            {t.email.forgotSubmit}
          </button>
          <Link href="/account" className="mt-4 block text-center text-sm font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400">
            {t.email.backToSignIn}
          </Link>
        </div>
      )}
    </div>
  );
}
