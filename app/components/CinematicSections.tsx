"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { getPublicRoute } from "../lib/locale";
import { CINEMATIC_PAGE_READY, getReadyCinematicRoot } from "../lib/useCinematicPageReady";

type MotionConnection = EventTarget & { saveData?: boolean };

/** Optional choreography: the server-rendered page stays visible if this never runs. */
export function CinematicSections() {
  const pathname = usePathname();
  const route = getPublicRoute(pathname);
  const page = route && route.key !== "home" ? route.key : null;

  // The same attribute is rendered by RootLayout on the first request.
  useLayoutEffect(() => {
    if (page) document.body.dataset.cinematicPage = page;
    else delete document.body.dataset.cinematicPage;
  }, [page]);

  useEffect(() => {
    const main = document.getElementById("main-content");
    if (!main || !page || !("IntersectionObserver" in window)) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(min-width: 900px) and (hover: hover) and (pointer: fine)");
    const connection = (navigator as Navigator & { connection?: MotionConnection }).connection;
    const seen = new WeakSet<HTMLElement>();
    const registered = new Set<HTMLElement>();
    const visibleMedia = new Set<HTMLElement>();
    const animations = new Map<HTMLElement, Animation>();
    const previousWillChange = new Map<HTMLElement, string>();
    let disposed = false, frame = 0, scanQueued = false;
    let observedRoot: HTMLElement | null = null;

    const allowed = () => !preference.matches && !connection?.saveData;
    const restore = (element: HTMLElement) => {
      element.style.willChange = previousWillChange.get(element) ?? "";
      previousWillChange.delete(element);
    };
    const stopAnimations = () => {
      for (const [element, animation] of animations) { animation.cancel(); restore(element); }
      animations.clear();
      for (const element of visibleMedia) element.style.removeProperty("--cinema-parallax");
    };
    const enter = (element: HTMLElement) => {
      if (seen.has(element)) return;
      seen.add(element);
      element.dataset.cinemaState = "seen";
      if (!allowed() || !element.animate || animations.size >= 4 || element.matches(":focus-within")) return;
      const siblings = element.parentElement ? [...element.parentElement.children] : [];
      const stagger = element.tagName === "ARTICLE" ? Math.max(0, siblings.indexOf(element)) % 4 * 65 : 0;
      previousWillChange.set(element, element.style.willChange);
      element.style.willChange = "transform, opacity";
      const animation = element.animate([
        { transform: "translate3d(0, 22px, 0)" },
        { transform: "translate3d(0, 0, 0)" },
      ], { duration: 720, delay: stagger, easing: "cubic-bezier(.16, 1, .3, 1)" });
      animations.set(element, animation);
      void animation.finished.catch(() => {}).finally(() => {
        if (animations.get(element) === animation) { animations.delete(element); restore(element); }
      });
    };

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        if (element.dataset.cinemaParallax === "true") {
          if (entry.isIntersecting) {
            visibleMedia.add(element);
            if (element.classList.contains("reservation-location")) element.dataset.cinemaPhotoReady = "true";
          }
          else { visibleMedia.delete(element); element.style.removeProperty("--cinema-parallax"); }
        }
        if (entry.isIntersecting && element.dataset.cinemaReveal === "true") {
          enter(element);
          if (element.dataset.cinemaParallax !== "true") observer.unobserve(element);
        }
      }
      schedule();
    }, { rootMargin: "72px 0px -4% 0px", threshold: 0.06 });

    const revealSelector = page === "menu"
      ? ".order-hero-strip > .lux-overline, .order-hero-strip > h1, .order-hero-strip > p, article, section > div:first-child:has(h2)"
      : page === "reservations"
        ? ".reservation-hero-strip > .relative, .reservation-location__info, .reservation-map-shell, section > div > .premium-panel:not(:has(form)):not(:has(input)):not(:has(textarea))"
        : ":scope > .lux-overline, :scope > h1, :scope > p, :scope > section";
    const register = () => {
      const pageRoot = getReadyCinematicRoot(main, page, pathname);
      if (!pageRoot) return;
      if (observedRoot !== pageRoot) {
        mutation.disconnect();
        observedRoot = pageRoot;
        mutation.observe(pageRoot, { childList: true, subtree: true });
      }
      // Filtering may replace hundreds of dishes during a long menu visit.
      for (const element of registered) {
        if (element.isConnected) continue;
        observer.unobserve(element); registered.delete(element); visibleMedia.delete(element);
        animations.get(element)?.cancel(); animations.delete(element); restore(element);
      }
      for (const element of pageRoot.querySelectorAll<HTMLElement>(revealSelector)) {
        if (registered.has(element) || element.closest("dialog, [role='dialog']") || element.querySelector("form, input, select, textarea")) continue;
        registered.add(element); element.dataset.cinemaReveal = "true";
        observer.observe(element);
      }
      for (const element of pageRoot.querySelectorAll<HTMLElement>(".order-hero-strip, .reservation-hero-strip, .reservation-location")) {
        if (element.dataset.cinemaParallax === "true") continue;
        element.dataset.cinemaParallax = "true"; registered.add(element);
        observer.observe(element);
      }
    };
    const update = () => {
      frame = 0;
      if (disposed || document.hidden) return;
      if (scanQueued) { scanQueued = false; register(); }
      if (!allowed() || !finePointer.matches) return;
      for (const element of visibleMedia) {
        const bounds = element.getBoundingClientRect();
        const position = (window.innerHeight / 2 - (bounds.top + bounds.height / 2)) / Math.max(window.innerHeight, 1);
        element.style.setProperty("--cinema-parallax", `${Math.max(-18, Math.min(18, position * 24)).toFixed(2)}px`);
      }
    };
    function schedule() { if (!disposed && !frame && !document.hidden) frame = requestAnimationFrame(update); }
    const mutation = new MutationObserver(() => { scanQueued = true; schedule(); });
    const pageReady = () => { register(); schedule(); };
    const changed = () => { if (!allowed() || !finePointer.matches) stopAnimations(); schedule(); };
    const focused = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>("[data-cinema-reveal]");
      if (element) { animations.get(element)?.cancel(); animations.delete(element); restore(element); }
    };
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else schedule();
    };

    register();
    window.addEventListener(CINEMATIC_PAGE_READY, pageReady);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    main.addEventListener("focusin", focused);
    preference.addEventListener("change", changed); finePointer.addEventListener("change", changed);
    connection?.addEventListener("change", changed);
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); mutation.disconnect(); stopAnimations();
      window.removeEventListener(CINEMATIC_PAGE_READY, pageReady);
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", visibility); main.removeEventListener("focusin", focused);
      preference.removeEventListener("change", changed); finePointer.removeEventListener("change", changed);
      connection?.removeEventListener("change", changed);
      for (const element of registered) {
        delete element.dataset.cinemaReveal; delete element.dataset.cinemaParallax; delete element.dataset.cinemaState;
        delete element.dataset.cinemaPhotoReady;
        element.style.removeProperty("--cinema-parallax");
      }
    };
  }, [page, pathname]);

  return null;
}
