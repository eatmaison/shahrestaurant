"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { FaEnvelope, FaCircleCheck } from "react-icons/fa6";
import { useLang } from "../providers";
import { fetchJSON } from "../lib/clientFetch";

export default function ForgotPasswordPage() {
  const { t, lang } = useLang();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const failure = lang === "nl" ? "Verzenden lukt nu niet. Controleer je verbinding en probeer opnieuw." : "Unable to send right now. Check your connection and try again.";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setLoading(true); setError("");
    try {
      const { response, data } = await fetchJSON<{ ok?: boolean }>("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "requestReset", email: email.trim() }) });
      if (response.ok && data.ok) setSent(true);
      else setError(response.status === 429 ? (lang === "nl" ? "Te veel verzoeken. Probeer het straks opnieuw." : "Too many requests. Please try again later.") : failure);
    } catch { setError(failure); }
    finally { busy.current = false; setLoading(false); }
  };

  return <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-16">
    {sent ? <div role="status" className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-white/5">
      <FaCircleCheck className="mx-auto text-3xl text-emerald-600" aria-hidden="true" />
      <h1 className="mt-5 text-xl font-black text-slate-900 dark:text-white">{t.email.forgotTitle}</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t.email.forgotSent}</p>
      <Link href="/account" className="mt-6 inline-flex rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white">{t.email.backToSignIn}</Link>
    </div> : <form onSubmit={submit} aria-busy={loading} className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-white/10 dark:bg-white/5">
      <FaEnvelope className="text-2xl text-emerald-600" aria-hidden="true" />
      <h1 className="mt-4 text-xl font-black text-slate-900 dark:text-white">{t.email.forgotTitle}</h1>
      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{t.email.forgotText}</p>
      <label htmlFor="reset-email" className="mt-5 block text-sm font-semibold text-slate-700 dark:text-slate-300">{t.email.emailLabel}</label>
      <input id="reset-email" type="email" required maxLength={254} inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={e => setEmail(e.target.value)} aria-describedby={error ? "reset-request-error" : undefined} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 dark:border-white/10 dark:bg-white/5 dark:text-white" />
      {error && <p id="reset-request-error" role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button type="submit" disabled={loading} className="mt-4 w-full rounded-full bg-emerald-600 py-3 text-sm font-bold text-white disabled:opacity-60">{t.email.forgotSubmit}</button>
      <Link href="/account" className="mt-4 block text-center text-sm font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400">{t.email.backToSignIn}</Link>
    </form>}
  </div>;
}
