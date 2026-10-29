"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FaCircleCheck, FaCircleXmark, FaSpinner } from "react-icons/fa6";
import { useLang, useStore } from "../providers";
import { fetchJSON } from "../lib/clientFetch";

function VerifyEmailInner() {
  const { t, lang } = useLang(); const { refresh } = useStore();
  const token = useSearchParams().get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "ok" | "invalid" | "error">("loading");
  const [retry, setRetry] = useState(0);
  const validToken = token.length > 0 && token.length <= 2048;
  useEffect(() => {
    if (!validToken) return;
    const controller = new AbortController(); let active = true;
    queueMicrotask(() => { if (active) setStatus("loading"); });
    void (async () => {
      try {
        const { response, data } = await fetchJSON<{ ok?: boolean }>("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verifyEmail", token }), signal: controller.signal });
        if (!active) return;
        if (!response.ok && response.status >= 500) { setStatus("error"); return; }
        if (!response.ok || !data?.ok) { setStatus("invalid"); return; }
        setStatus("ok");
        const url = new URL(window.location.href); url.searchParams.delete("token"); window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
        void refresh();
      } catch { if (active && !controller.signal.aborted) setStatus("error"); }
    })();
    return () => { active = false; controller.abort(); };
  }, [token, validToken, retry, refresh]);
  const shown = !validToken && status !== "ok" ? "invalid" : status;
  return <section aria-busy={shown === "loading"} className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
    <div role="status"><span aria-hidden="true" className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10 text-3xl text-emerald-600">{shown === "loading" ? <FaSpinner className="animate-spin" /> : shown === "ok" ? <FaCircleCheck /> : <FaCircleXmark />}</span>
      <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">{shown === "loading" ? t.email.verifyingTitle : shown === "ok" ? t.email.verifySuccess : shown === "error" ? (lang === "nl" ? "Bevestigen is tijdelijk niet mogelijk" : "Verification is temporarily unavailable") : t.email.verifyFail}</h1>
      {shown !== "loading" && <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{shown === "ok" ? t.email.verifySuccessText : shown === "error" ? (lang === "nl" ? "Controleer je verbinding en probeer opnieuw." : "Check your connection and try again.") : t.email.verifyFailText}</p>}
    </div>
    {shown === "error" && <button type="button" onClick={() => { setStatus("loading"); setRetry(value => value + 1); }} className="mt-6 min-h-11 rounded-full border px-6 py-3 font-semibold">{lang === "nl" ? "Opnieuw proberen" : "Try again"}</button>}
    {shown !== "loading" && <Link href="/account" prefetch={false} className="mt-6 min-h-11 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white">{t.email.goToAccount}</Link>}
  </section>;
}
export default function VerifyEmailPage() { return <Suspense fallback={<p role="status" className="p-12 text-center">…</p>}><VerifyEmailInner /></Suspense>; }
