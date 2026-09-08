"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">SHAH RESTAURANT</p>
      <h1 className="mt-3 text-3xl font-black text-slate-900 dark:text-white">Something went wrong</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">Please try again. Your order and account are safe.</p>
      <button onClick={() => reset()} className="mt-7 rounded-full bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-500">Try again</button>
    </main>
  );
}
