"use client";

import { useState } from "react";
import { fetchJSON } from "../../lib/clientFetch";

export default function Unsubscribe({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  async function submit() {
    setStatus("busy");
    try {
      const { response } = await fetchJSON("/api/email/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      setStatus(response.ok ? "done" : "error");
    } catch { setStatus("error"); }
  }
  const valid = /^[a-f0-9-]{36}$/i.test(token);
  return <section className="mx-auto max-w-lg px-5 py-20">
    <h1 className="text-2xl font-semibold">Afmelden / Unsubscribe</h1>
    <p className="my-4">Shah Restaurant: e-mails met nieuws en aanbiedingen / news and offers by email.</p>
    {!valid ? <p>Ongeldige link / Invalid link.</p> : status === "done" ? <p role="status">Afmelding verwerkt / Unsubscribe request processed.</p>
      : <button type="button" disabled={status === "busy"} className="rounded border px-4 py-3" onClick={() => void submit()}>
          {status === "busy" ? "Even geduld / Please wait" : "Afmelden / Unsubscribe"}
        </button>}
    {status === "error" && <p role="alert">Probeer opnieuw / Please try again.</p>}
  </section>;
}
