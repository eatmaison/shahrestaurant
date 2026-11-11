"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useRichMedia } from "./HomeDepth";
import styles from "./HeroFilm.module.css";

type Connection = { effectiveType?: string; saveData?: boolean };

/** Fully prebuffer the original film without blocking the restaurant or its poster. */
export function HeroFilm({ trackRef }: { trackRef: RefObject<HTMLDivElement | null> }) {
  const allowed = useRichMedia();
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current, stage = stageRef.current;
    if (!track || !stage) return;
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    const slow = connection?.saveData || /^(slow-)?2g$/.test(connection?.effectiveType ?? "");
    if (!allowed || slow) {
      track.dataset.unavailable = "true";
      stage.dataset.filmPhase = "static";
      return;
    }

    delete track.dataset.unavailable;
    stage.dataset.filmPhase = "waiting";
    delete stage.dataset.filmSource;
    delete stage.dataset.filmTransport;
    delete stage.dataset.filmDownloaded;
    // This effect owns the film element. React owns only the empty fullscreen stage.
    const video = document.createElement("video");
    video.className = styles.film;
    video.muted = true; video.defaultMuted = true; video.playsInline = true;
    video.preload = "none"; video.tabIndex = -1;
    video.disablePictureInPicture = true; video.disableRemotePlayback = true;
    video.setAttribute("aria-hidden", "true");
    video.setAttribute("webkit-playsinline", "");
    let disposed = false, url = "", frame = 0, visible = true, distance = 1, initialized = false, requested = -1;
    let hasScrolled = window.scrollY > 1;
    let deadline = 0, idle = 0, idleFallback = 0, posterPaintFrame = 0;
    const controller = new AbortController();
    const nativeWebKit = /AppleWebKit/.test(navigator.userAgent) && !/(Chrome|Chromium|Edg|OPR|Android)/.test(navigator.userAgent);
    const measure = () => { distance = Math.max(1, track.offsetHeight - stage.offsetHeight); };
    const sync = () => {
      frame = 0;
      if (!initialized || !visible || document.hidden || video.seeking || video.readyState < 1 || !Number.isFinite(video.duration)) return;
      const progress = Math.max(0, Math.min(1, -track.getBoundingClientRect().top / distance));
      const end = Math.max(0, video.duration - 1 / 24), target = Math.min(end, Math.round(progress * end * 24) / 24);
      if (target !== requested) {
        requested = target;
        if (Math.abs(video.currentTime - target) > 1 / 48) { video.currentTime = target; return; }
      }
      // Keep the initial poster stable. Reveal only a decoded frame needed after scrolling.
      if (hasScrolled && video.readyState >= 2 && !video.seeking) {
        if (video.parentElement !== stage) stage.appendChild(video);
        video.dataset.ready = "true";
      }
    };
    const schedule = () => { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(sync); };
    const scrolled = () => { if (window.scrollY > 1) hasScrolled = true; schedule(); };
    const resized = () => { measure(); schedule(); };
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; video.pause(); }
      else schedule();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); });
    observer.observe(stage);
    const resize = new ResizeObserver(resized); resize.observe(track); resize.observe(stage);
    window.addEventListener("scroll", scrolled, { passive: true });
    window.addEventListener("resize", resized);
    document.addEventListener("visibilitychange", visibility);
    video.addEventListener("seeked", schedule);

    function firstFrame(target = 0) {
      return new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => { cleanup(); reject(new Error("Decode timeout")); }, 8000);
        const cleanup = () => {
          clearTimeout(timeout);
          video!.removeEventListener("seeked", check); video!.removeEventListener("loadeddata", check); video!.removeEventListener("canplay", check);
          controller.signal.removeEventListener("abort", aborted);
        };
        const aborted = () => { cleanup(); reject(new DOMException("Aborted", "AbortError")); };
        const check = () => { if (video && video.readyState >= 2 && !video.seeking) { cleanup(); resolve(); } };
        video!.addEventListener("seeked", check); video!.addEventListener("loadeddata", check); video!.addEventListener("canplay", check);
        controller.signal.addEventListener("abort", aborted, { once: true });
        if (Math.abs(video!.currentTime - target) > 1 / 48) video!.currentTime = target;
        check();
      });
    }

    const staticFallback = () => {
      initialized = false;
      delete video.dataset.ready;
      stage.dataset.filmPhase = "static";
      track.dataset.unavailable = "true";
      video.pause(); video.removeAttribute("src"); video.load(); video.remove();
    };

    async function load() {
      try {
        stage!.dataset.filmPhase = "loading";
        deadline = window.setTimeout(() => { controller.abort(); if (!disposed) staticFallback(); }, 60000);
        const compact = window.matchMedia("(max-width: 767px)").matches;
        const source = `/brand/shah-hero-scroll-${compact ? "mobile" : "desktop"}-v4.mp4`;
        video!.dataset.source = source;
        video!.dataset.transport = nativeWebKit ? "native-prebuffered" : "blob-prebuffered-detached";
        stage!.dataset.filmSource = source;
        stage!.dataset.filmTransport = video!.dataset.transport;
        const response = await fetch(source, { signal: controller.signal, cache: "force-cache" });
        if (!response.ok) throw new Error("Video unavailable");
        // Wait for the full, untouched file; avoiding partial network seeks retains the film's smooth-scrub strategy.
        const blob = await response.blob();
        if (disposed || controller.signal.aborted) return;
        if (!blob.size) throw new Error("Empty video");
        video!.dataset.downloaded = String(blob.size);
        stage!.dataset.filmDownloaded = String(blob.size);
        if (!nativeWebKit) url = URL.createObjectURL(blob);
        stage!.dataset.filmPhase = "decoding";
        video!.muted = true; video!.defaultMuted = true; video!.playsInline = true; video!.setAttribute("webkit-playsinline", "");
        video!.preload = "auto";
        video!.src = nativeWebKit ? source : url;
        // WebKit keeps its original attached native-media warm-up path.
        // Blob-capable browsers decode off-DOM and attach only when scrolling needs a frame.
        if (nativeWebKit) stage!.appendChild(video!);
        video!.load();
        await video!.play();
        if (disposed || controller.signal.aborted) return;
        // Keep the existing Safari decoder warm-up, then return to the original first frame.
        if (nativeWebKit) await firstFrame(Math.max(0, video!.duration - 1 / 24));
        video!.pause(); await firstFrame();
        if (disposed || controller.signal.aborted) return;
        clearTimeout(deadline);
        initialized = true; measure();
        stage!.dataset.filmPhase = "ready";
        schedule();
      } catch {
        if (disposed) return;
        controller.abort(); clearTimeout(deadline);
        staticFallback();
      }
    }

    // The only high-priority visual is the poster. Begin the optional full-quality film after it settles.
    const poster = track.querySelector<HTMLImageElement>('img[fetchpriority="high"]') ?? track.querySelector<HTMLImageElement>("picture img");
    const queueFilm = () => {
      if (disposed) return;
      const scheduleIdle = window.requestIdleCallback;
      if (typeof scheduleIdle === "function") idle = scheduleIdle.call(window, () => { void load(); }, { timeout: 1500 });
      else idleFallback = window.setTimeout(() => { void load(); }, 250);
    };
    const afterPosterPaint = () => {
      if (disposed) return;
      const decoded = poster && typeof poster.decode === "function" ? poster.decode().catch(() => {}) : Promise.resolve();
      void decoded.then(() => {
        if (disposed) return;
        // Let the decoded critical image paint before starting optional full-file work.
        posterPaintFrame = requestAnimationFrame(() => {
          if (disposed) return;
          posterPaintFrame = requestAnimationFrame(() => {
            posterPaintFrame = 0;
            if (!disposed) queueFilm();
          });
        });
      });
    };
    const posterSettled = () => {
      poster?.removeEventListener("load", posterSettled);
      poster?.removeEventListener("error", posterSettled);
      afterPosterPaint();
    };
    if (!poster || poster.complete) afterPosterPaint();
    else { poster.addEventListener("load", posterSettled, { once: true }); poster.addEventListener("error", posterSettled, { once: true }); }

    return () => {
      disposed = true; controller.abort(); clearTimeout(deadline); clearTimeout(idleFallback);
      cancelAnimationFrame(posterPaintFrame);
      if (idle && "cancelIdleCallback" in window) window.cancelIdleCallback(idle);
      poster?.removeEventListener("load", posterSettled); poster?.removeEventListener("error", posterSettled);
      cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect();
      window.removeEventListener("scroll", scrolled); window.removeEventListener("resize", resized);
      document.removeEventListener("visibilitychange", visibility); video.removeEventListener("seeked", schedule);
      delete video.dataset.ready;
      video.pause(); video.removeAttribute("src"); video.load(); video.remove();
      if (url) URL.revokeObjectURL(url);
    };
  }, [trackRef, allowed]);

  return <div ref={stageRef} className={styles.stage} aria-hidden="true" />;
}
