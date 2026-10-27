"use client";
import Link from "next/link";
import { Suspense, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { FaLock, FaCircleCheck } from "react-icons/fa6";
import { useLang } from "../providers";
import { fetchJSON } from "../lib/clientFetch";

function ResetPasswordInner() {
  const { t, lang } = useLang();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy.current) return;
    if (!token) { setError(t.email.resetInvalid); return; }
    if (password.length < 6) { setError(t.email.passwordWeak); return; }
    if (password !== confirm) { setError(t.email.passwordMismatch); return; }
    busy.current = true; setLoading(true); setError("");
    try {
      const { response, data } = await fetchJSON<{ ok?: boolean; error?: string }>("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "resetPassword", token, password }) });
      if (response.ok && data.ok) {
        setDone(true); setPassword(""); setConfirm("");
        window.history.replaceState(null, "", window.location.pathname);
      } else setError(data.error === "weak" ? t.email.passwordWeak : t.email.resetInvalid);
    } catch { setError(lang === "nl" ? "Controleer je verbinding en probeer opnieuw." : "Check your connection and try again."); }
    finally { busy.current = false; setLoading(false); }
  };

  return <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-16">
    {done ? <div role="status" className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-white/5">
      <FaCircleCheck className="mx-auto text-3xl text-emerald-600" aria-hidden="true" />
      <h1 className="mt-5 text-xl font-black text-slate-900 dark:text-white">{t.email.resetSuccess}</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t.email.resetSuccessText}</p>
      <Link href="/account" className="mt-6 inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white">{t.email.backToSignIn}</Link>
    </div> : <form onSubmit={submit} aria-busy={loading} className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-white/10 dark:bg-white/5">
      <FaLock className="text-2xl text-emerald-600" aria-hidden="true" />
      <h1 className="mt-4 text-xl font-black text-slate-900 dark:text-white">{t.email.resetTitle}</h1>
      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{t.email.resetText}</p>
      <label htmlFor="new-password" className="mt-5 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t.email.newPassword}</label>
      <input id="new-password" type="password" required minLength={6} maxLength={200} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 dark:border-white/10 dark:bg-white/5 dark:text-white" />
      <label htmlFor="confirm-password" className="mt-4 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t.email.confirmPassword}</label>
      <input id="confirm-password" type="password" required minLength={6} maxLength={200} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} aria-describedby={error || !token ? "reset-error" : undefined} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 dark:border-white/10 dark:bg-white/5 dark:text-white" />
      {(error || !token) && <p id="reset-error" role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error || t.email.resetInvalid}</p>}
      <button type="submit" disabled={loading || !token} className="mt-4 w-full rounded-full bg-emerald-600 py-3 text-sm font-bold text-white disabled:opacity-60">{t.email.resetSubmit}</button>
    </form>}
  </div>;
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<p role="status" className="p-12 text-center">…</p>}><ResetPasswordInner /></Suspense>;
}
