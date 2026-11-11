"use client";

import { useEffect, type RefObject } from "react";

/** Scene motion is optional: server content and native scrolling remain intact. */
export function useHomeChoreography(
  rootRef: RefObject<HTMLDivElement | null>,
  trackRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  onSection: (id: string) => void,
) {
  useEffect(() => {
    const root = rootRef.current, track = trackRef.current;
    if (!root || !track) return;
    if (!("IntersectionObserver" in window)) {
      root.dataset.filmView = "content";
      root.dataset.choreography = "static";
      return;
    }
    const footer = document.querySelector<HTMLElement>("[data-site-footer]");
    const seen = new WeakSet<HTMLElement>();
    const reveals = new Set<HTMLElement>();
    const scenes = new Set<HTMLElement>();
    const activeScenes = new Set<HTMLElement>();
    let frame = 0, disposed = false, scanQueued = false;
    let previousView = "";
    const fine = window.matchMedia("(min-width: 900px) and (hover: hover) and (pointer: fine)");

    const reveal = (node: HTMLElement) => {
      node.dataset.reveal = "visible";
      reveals.delete(node);
      observer.unobserve(node);
    };
    const mayReveal = (node: HTMLElement) => {
      // Ordinary film traversal finishes its decoded frame before the first chapter opens.
      // Focus/hash navigation and the static fallback always retain immediate access.
      return !node.closest("[data-opening-chapter]") || track.dataset.filmComplete === "true" || track.dataset.filmBypassed === "true" ||
        track.dataset.unavailable === "true" || node.matches(":focus-within");
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const node = entry.target as HTMLElement;
        if (mayReveal(node)) reveal(node);
      }
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });

    const sample = () => {
      frame = 0;
      if (disposed) return;
      const viewport = window.innerHeight;
      const filmBounds = track.getBoundingClientRect();
      const view = filmBounds.bottom > 1 && filmBounds.top < viewport ? "opening" : "content";
      if (root.dataset.filmView !== view) root.dataset.filmView = view;
      if (view !== previousView) {
        previousView = view;
        if (view === "opening") window.dispatchEvent(new Event("shah:film-opening"));
      }
      for (const scene of activeScenes) {
        const bounds = scene.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, (viewport - bounds.top) / Math.max(1, viewport + bounds.height)));
        scene.style.setProperty("--scene-progress", progress.toFixed(4));
        const travel = enabled ? (0.5 - progress) * (fine.matches ? 48 : 20) : 0;
        scene.style.setProperty("--scene-shift", `${travel.toFixed(2)}px`);
      }
    };
    const schedule = () => { if (!frame && !document.hidden) frame = requestAnimationFrame(sample); };
    const sceneObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const scene = entry.target as HTMLElement;
        scene.dataset.sceneActive = entry.isIntersecting ? "true" : "false";
        if (entry.isIntersecting) activeScenes.add(scene); else activeScenes.delete(scene);
        if (entry.isIntersecting && scene.dataset.section !== undefined && scene.id) onSection(scene.id);
      }
      schedule();
    }, { rootMargin: "12% 0px 12% 0px", threshold: 0 });

    const register = (node: HTMLElement, kind = "rise", delay = 0) => {
      if (seen.has(node)) return;
      seen.add(node);
      node.dataset.revealKind ||= kind;
      node.style.setProperty("--reveal-delay", `${Math.min(delay, 300)}ms`);
      if (!enabled || node.getBoundingClientRect().top < window.innerHeight * 0.92 || node.matches(":focus-within")) {
        node.dataset.reveal = "visible";
      } else {
        node.dataset.reveal = "pending";
        reveals.add(node);
        observer.observe(node);
      }
    };
    const scan = () => {
      scanQueued = false;
      if (disposed) return;
      for (const node of reveals) {
        if (node.isConnected) continue;
        observer.unobserve(node); reveals.delete(node);
      }
      root.querySelectorAll<HTMLElement>("[data-scene]").forEach(scene => {
        if (scenes.has(scene)) return;
        scenes.add(scene); sceneObserver.observe(scene);
      });
      root.querySelectorAll<HTMLElement>("[data-dish-list] > li").forEach((node, i) => register(node, "row", Math.min(i, 5) * 55));
      root.querySelectorAll<HTMLElement>("[data-evening-card]").forEach((node, i) => register(node, "rise", i * 110));
      root.querySelectorAll<HTMLElement>("[data-review-card]").forEach((node, i) => register(node, "quote", i * 90));
      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach(node => register(node, node.dataset.revealKind || "rise", Number(node.dataset.revealDelay || 0)));
      const partners = root.querySelector<HTMLElement>("#drankenpartners");
      if (partners && !scenes.has(partners)) {
        partners.dataset.scene = "partners"; scenes.add(partners); sceneObserver.observe(partners);
        const heading = partners.querySelector<HTMLElement>("h2");
        if (heading) register(heading, "rise");
        partners.querySelectorAll<HTMLElement>("li").forEach((node, i) => register(node, "quiet", i * 60));
      }
      schedule();
    };
    const mutation = new MutationObserver(() => {
      if (scanQueued || disposed) return;
      scanQueued = true; queueMicrotask(scan);
    });
    const forceTarget = (target: Element | null) => {
      if (!target || !root.contains(target)) return;
      const chapter = target.closest<HTMLElement>("[data-scene]");
      if (chapter) chapter.querySelectorAll<HTMLElement>("[data-reveal]").forEach(reveal);
      if (target instanceof HTMLElement && target.hasAttribute("data-reveal")) reveal(target);
    };
    const focus = (event: FocusEvent) => {
      if (!(event.target instanceof Element) || !root.contains(event.target)) return;
      if (root.dataset.filmView === "opening") window.dispatchEvent(new Event("shah:film-skip"));
      forceTarget(event.target);
      schedule();
    };
    const hash = () => {
      let id = "";
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      if (id) forceTarget(document.getElementById(id));
      schedule();
    };
    const film = () => {
      if (track.dataset.filmComplete === "true" || track.dataset.filmBypassed === "true" || track.dataset.unavailable === "true") {
        for (const node of [...reveals]) {
          const bounds = node.getBoundingClientRect();
          if (bounds.top < window.innerHeight * 0.94 && bounds.bottom > 0) reveal(node);
        }
      }
      schedule();
    };
    const visibility = () => { if (!document.hidden) schedule(); };

    root.dataset.choreography = enabled ? "ready" : "static";
    if (footer) {
      footer.dataset.cinematicFooter = "true";
      footer.dataset.reveal = "visible";
      register(footer, "footer");
    }
    scan(); hash(); sample();
    mutation.observe(root, { childList: true, subtree: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", hash);
    root.addEventListener("shah:film-state", film);
    document.addEventListener("focusin", focus);
    document.addEventListener("visibilitychange", visibility);
    fine.addEventListener("change", schedule);
    return () => {
      disposed = true; cancelAnimationFrame(frame);
      observer.disconnect(); sceneObserver.disconnect(); mutation.disconnect();
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", hash); root.removeEventListener("shah:film-state", film);
      document.removeEventListener("focusin", focus); document.removeEventListener("visibilitychange", visibility);
      fine.removeEventListener("change", schedule);
      for (const node of reveals) node.dataset.reveal = "visible";
      for (const scene of scenes) {
        scene.style.removeProperty("--scene-progress"); scene.style.removeProperty("--scene-shift");
        delete scene.dataset.sceneActive;
      }
      if (footer) { delete footer.dataset.cinematicFooter; delete footer.dataset.reveal; }
    };
  }, [enabled, onSection, rootRef, trackRef]);
}
