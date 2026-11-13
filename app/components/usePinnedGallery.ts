"use client";

import { useEffect, type RefObject } from "react";

/** Native scrolling drives a sticky scene; no wheel/touch/key event is cancelled. */
export function usePinnedGallery(rootRef: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useEffect(() => {
    const scene = rootRef.current?.querySelector<HTMLElement>("[data-pinned-gallery]");
    const stage = scene?.querySelector<HTMLElement>("[data-gallery-stage]");
    const grid = scene?.querySelector<HTMLElement>("[data-gallery-grid]");
    if (!scene || !stage || !grid || !enabled || !("ResizeObserver" in window) || !CSS.supports("position", "sticky") || !CSS.supports("overflow", "clip")) return;
    const cards = [...grid.querySelectorAll<HTMLElement>("[data-gallery-card]")];
    const counter = scene.querySelector<HTMLElement>("[data-gallery-counter]");
    const continueLink = scene.querySelector<HTMLAnchorElement>("[data-gallery-continue]");
    const tall = matchMedia("(min-height: 640px)");
    let frame = 0, resizeFrame = 0, disposed = false, pinned = false;
    let inset = 0, distance = 1, last = -1, compact = false;
    let entrances: number[] = [];
    const clamp = (n: number) => Math.max(0, Math.min(1, n));
    const clear = () => {
      pinned = false; last = -1;
      delete scene.dataset.galleryPinned; delete scene.dataset.galleryActive;
      delete scene.dataset.galleryStep;
      scene.style.removeProperty("--gallery-scroll-distance");
      for (const card of cards) {
        card.inert = false; card.removeAttribute("aria-hidden");
        for (const name of ["--gallery-x", "--gallery-y", "--gallery-scale", "--gallery-opacity"]) card.style.removeProperty(name);
      }
    };
    const sample = () => {
      frame = 0;
      if (disposed || !pinned) return;
      const bounds = scene.getBoundingClientRect(), viewport = innerHeight;
      const active = bounds.top < viewport && bounds.bottom > 0;
      scene.dataset.galleryActive = String(active);
      if (bounds.top < viewport * 1.6 && bounds.bottom > 0) {
        // Decode the small local deliveries before their entrance reaches the viewport.
        for (const image of grid.querySelectorAll<HTMLImageElement>("img[loading='lazy']")) image.loading = "eager";
      }
      // Preceding catalogue content can change height after hydration. Read the
      // track's current position, rather than retaining a stale document offset.
      const progress = clamp((inset - bounds.top) / distance);
      if (Math.abs(progress - last) < 0.0001) return;
      last = progress;
      const phases = cards.map((_, i) => {
        const t = clamp((progress * cards.length - i) / 0.84);
        return t * t * (3 - 2 * t);
      });
      cards.forEach((card, i) => {
        const phase = phases[i];
        const opacity = phase * (compact ? 1 - (phases[i + 1] ?? 0) : 1);
        const hidden = opacity < 0.5;
        if (hidden && card.contains(document.activeElement)) continueLink?.focus({ preventScroll: true });
        card.inert = hidden; card.setAttribute("aria-hidden", String(hidden));
        card.style.setProperty("--gallery-x", `${((1 - phase) * entrances[i]).toFixed(2)}px`);
        card.style.setProperty("--gallery-y", `${((1 - phase) * 14).toFixed(2)}px`);
        card.style.setProperty("--gallery-scale", String(0.97 + phase * 0.03));
        card.style.setProperty("--gallery-opacity", opacity.toFixed(4));
      });
      const step = Math.min(cards.length, Math.floor(progress * cards.length) + 1);
      if (scene.dataset.galleryStep !== String(step)) {
        scene.dataset.galleryStep = String(step);
        if (counter) counter.textContent = String(step).padStart(2, "0");
      }
    };
    const schedule = () => { if (!frame && !document.hidden) frame = requestAnimationFrame(sample); };
    const measure = () => {
      resizeFrame = 0;
      if (disposed) return;
      clear();
      if (!tall.matches) return;
      scene.dataset.galleryPinned = "true";
      scene.style.setProperty("--gallery-scroll-distance", `${Math.round(innerHeight * 1.9)}px`);
      // Narrow/short windows retain ordinary flow whenever the complete stage cannot fit.
      const footer = scene.querySelector<HTMLElement>("[data-gallery-footer]");
      const stageBounds = stage.getBoundingClientRect();
      if (footer && footer.getBoundingClientRect().bottom > stageBounds.bottom + 1) { clear(); return; }
      const gridBounds = grid.getBoundingClientRect();
      compact = innerWidth <= 700;
      entrances = cards.map(card => Math.max(80, innerWidth - gridBounds.left - card.offsetLeft + 24));
      inset = parseFloat(getComputedStyle(stage).top) || 0;
      distance = Math.max(1, scene.offsetHeight - stage.offsetHeight);
      pinned = true; sample();
    };
    const resize = () => { if (!resizeFrame) resizeFrame = requestAnimationFrame(measure); };
    const visibility = () => { if (!document.hidden) schedule(); };
    const observer = new ResizeObserver(resize);
    measure(); observer.observe(stage);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resize);
    window.addEventListener("hashchange", schedule);
    document.addEventListener("visibilitychange", visibility);
    tall.addEventListener("change", resize);
    return () => {
      disposed = true; cancelAnimationFrame(frame); cancelAnimationFrame(resizeFrame);
      observer.disconnect(); clear();
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", resize);
      window.removeEventListener("hashchange", schedule);
      document.removeEventListener("visibilitychange", visibility);
      tall.removeEventListener("change", resize);
    };
  }, [enabled, rootRef]);
}
