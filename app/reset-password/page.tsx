"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FaLock, FaCircleCheck } from "react-icons/fa6";
import { useLang } from "../providers";

function ResetPasswordInner() {
  const { t } = useLang();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (password.length < 6) {
      setError(t.email.passwordWeak);
      return;
    }
    if (password !== confirm) {
      setError(t.email.passwordMismatch);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resetPassword", token, password }),
      });
      const json = await res.json();
      if (json.ok) setDone(true);
      else setError(json.error === "weak" ? t.email.passwordWeak : t.email.resetInvalid);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-16">
      {done ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-white/5">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 text-2xl text-emerald-600 dark:text-emerald-400">
            <FaCircleCheck />
          </span>
          <h1 className="mt-5 text-xl font-black text-slate-900 dark:text-white">{t.email.resetSuccess}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t.email.resetSuccessText}</p>
          <Link href="/account" className="mt-6 inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-500">
            {t.email.backToSignIn}
          </Link>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-white/10 dark:bg-white/5">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-xl text-emerald-600 dark:text-emerald-400">
            <FaLock />
          </span>
          <h1 className="mt-4 text-xl font-black text-slate-900 dark:text-white">{t.email.resetTitle}</h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{t.email.resetText}</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.email.newPassword}
            className="mt-5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={t.email.confirmPassword}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-center text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
          <button
            onClick={submit}
            disabled={loading}
            className="mt-4 w-full rounded-full bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-60"
          >
            {t.email.resetSubmit}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-20 text-center text-sm text-slate-500">…</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
