"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "../providers";
import { normalizeVisitorSource, observedPublicPath, readVisitAnalyticsChoice, VISIT_ANALYTICS_CHANGE } from "../lib/visitorSignals";

/** Loaded only after a new, separate opt-in. Never observes account/payment/admin URLs. */
export default function VisitObserver() {
  const pathname = usePathname(), { currentUser, hydrated, catalogStatus } = useStore();
  useEffect(() => {
    const path = observedPublicPath(pathname);
    if (!path || !hydrated || catalogStatus !== "ready" || readVisitAnalyticsChoice() !== "allowed") return;
    let disposed = false, pending = false, disabled = false, interaction = false, lastSent = 0;
    let controller: AbortController | undefined;
    const query = new URLSearchParams(location.search);
    let referrerHost: string | undefined;
    try { const referrer = new URL(document.referrer); if (referrer.hostname !== location.hostname) referrerHost = referrer.hostname; } catch { /* No readable referrer. */ }
    const normalized = normalizeVisitorSource({ source: query.get("utm_source"), medium: query.get("utm_medium"), campaign: query.get("utm_campaign"), referrerHost });
    const source = { ...(normalized.kind === "campaign" ? { source: normalized.label } : {}), ...(normalized.referrerHost ? { referrerHost: normalized.referrerHost } : {}), ...(normalized.medium ? { medium: normalized.medium } : {}), ...(normalized.campaign ? { campaign: normalized.campaign } : {}) };
    async function send(event: "entry" | "heartbeat") {
      if (disposed || disabled || pending || document.hidden || !navigator.onLine || readVisitAnalyticsChoice() !== "allowed") return;
      if (event === "heartbeat" && Date.now() - lastSent < 20_000) return;
      pending = true; controller = new AbortController();
      try {
        const response = await fetch("/api/visits", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, cache: "no-store", signal: controller.signal,
          body: JSON.stringify({ path, source, interaction, webdriver: navigator.webdriver === true }) });
        lastSent = Date.now();
        // No repeated background errors if the optional migration is not installed.
        if (!response.ok) disabled = true;
      } catch (error) { if (!disposed && !(error instanceof DOMException && error.name === "AbortError")) disabled = true; }
      finally { pending = false; }
    }
    const interacted = (event: Event) => { if (event.isTrusted) interaction = true; };
    const permission = () => { if (readVisitAnalyticsChoice() !== "allowed") { disabled = true; controller?.abort(); } };
    const visibility = () => { if (document.hidden) controller?.abort(); else void send("heartbeat"); };
    void send("entry");
    const timer = window.setInterval(() => void send("heartbeat"), 30_000);
    for (const type of ["pointerdown", "keydown", "touchstart"]) window.addEventListener(type, interacted, { passive: true });
    window.addEventListener(VISIT_ANALYTICS_CHANGE, permission);
    document.addEventListener("visibilitychange", visibility);
    return () => { disposed = true; controller?.abort(); clearInterval(timer); for (const type of ["pointerdown", "keydown", "touchstart"]) window.removeEventListener(type, interacted); window.removeEventListener(VISIT_ANALYTICS_CHANGE, permission); document.removeEventListener("visibilitychange", visibility); };
  }, [pathname, currentUser?.id, hydrated, catalogStatus]);
  return null;
}
