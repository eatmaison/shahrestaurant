"use client";

import { useEffect, useSyncExternalStore, type RefObject } from "react";

const MOTION_KEY = "shah-home-motion";
const MOTION_EVENT = "shah-motion-change";

function subscribeMotion(listener: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", listener);
  window.addEventListener("storage", listener);
  window.addEventListener(MOTION_EVENT, listener);
  return () => {
    query.removeEventListener("change", listener);
    window.removeEventListener("storage", listener);
    window.removeEventListener(MOTION_EVENT, listener);
  };
}

let motionPreference = "on";

function motionSnapshot() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "reduced";
  try {
    const stored = window.localStorage.getItem(MOTION_KEY);
    return stored === "on" || stored === "off" ? stored : motionPreference;
  }
  catch { return motionPreference; }
}

export function useHomeMotion() {
  const mode = useSyncExternalStore(subscribeMotion, motionSnapshot, () => "off");
  function toggleMotion() {
    motionPreference = mode === "on" ? "off" : "on";
    try { window.localStorage.setItem(MOTION_KEY, motionPreference); } catch {}
    window.dispatchEvent(new Event(MOTION_EVENT));
  }
  return { enabled: mode === "on", reduced: mode === "reduced", toggleMotion };
}

export function useHomeTilt(rootRef: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let frame = 0;
    let active: HTMLElement | null = null;
    let pointerHorizontal = 0;
    let pointerVertical = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      active?.style.removeProperty("--tilt-x");
      active?.style.removeProperty("--tilt-y");
      active?.style.removeProperty("--light-x");
      active?.style.removeProperty("--light-y");
      active = null;
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-tilt]") : null;
      if (target !== active) { reset(); active = target; }
      if (!active) return;
      pointerHorizontal = event.clientX;
      pointerVertical = event.clientY;
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0;
        if (!active) return;
        const bounds = active.getBoundingClientRect();
        const horizontal = Math.max(-0.5, Math.min(0.5, (pointerHorizontal - bounds.left) / Math.max(bounds.width, 1) - 0.5));
        const vertical = Math.max(-0.5, Math.min(0.5, (pointerVertical - bounds.top) / Math.max(bounds.height, 1) - 0.5));
        active.style.setProperty("--tilt-x", `${-vertical * 8}deg`);
        active.style.setProperty("--tilt-y", `${horizontal * 10}deg`);
        active.style.setProperty("--light-x", `${(horizontal + 0.5) * 100}%`);
        active.style.setProperty("--light-y", `${(vertical + 0.5) * 100}%`);
      });
    };
    root.addEventListener("pointermove", move, { passive: true });
    root.addEventListener("pointerleave", reset);
    window.addEventListener("blur", reset);
    window.addEventListener("scroll", reset, { passive: true });
    return () => {
      reset();
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", reset);
      window.removeEventListener("blur", reset);
      window.removeEventListener("scroll", reset);
    };
  }, [enabled, rootRef]);
}
type MediaConnection = EventTarget & { saveData?: boolean; effectiveType?: string };
const mediaConnection = () => (navigator as Navigator & { connection?: MediaConnection }).connection;
function subscribeRichMedia(listener: () => void) {
  const query = window.matchMedia("(min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  const connection = mediaConnection();
  query.addEventListener("change", listener);
  connection?.addEventListener("change", listener);
  return () => { query.removeEventListener("change", listener); connection?.removeEventListener("change", listener); };
}
function richMediaSnapshot() {
  const connection = mediaConnection();
  return window.matchMedia("(min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches && !connection?.saveData && !["slow-2g", "2g"].includes(connection?.effectiveType ?? "");
}
/** Rich visual media is optional; the fully rendered restaurant image remains available. */
export function useRichMedia() { return useSyncExternalStore(subscribeRichMedia, richMediaSnapshot, () => false); }
