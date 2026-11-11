"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useRichMedia } from "./HomeDepth";
import styles from "./HeroFilm.module.css";

type Connection = { effectiveType?: string; saveData?: boolean };
type FilmState = "waiting" | "loading" | "decoding" | "ready" | "scrubbing" | "complete" | "static" | "bypassed";
const SCRUB_PORTION = 0.8;
const FRAME_RATE = 24;

/** Original full-quality film, followed by a decoded final-frame hold on native scroll. */
export function HeroFilm({ trackRef }: { trackRef: RefObject<HTMLDivElement | null> }) {
  const allowed = useRichMedia();
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current, stage = stageRef.current;
    if (!track || !stage) return;
    let lastNotice = -1;
    const publish = (state: FilmState, progress: number, complete: boolean) => {
      const rounded = Number(Math.max(0, Math.min(1, progress)).toFixed(4));
      const changed = track.dataset.filmState !== state || track.dataset.filmComplete !== String(complete);
      track.dataset.filmState = state;
      track.dataset.filmProgress = String(rounded);
      track.dataset.filmComplete = String(complete);
      track.dataset.filmBypassed = String(state === "bypassed");
      if (changed || Math.abs(rounded - lastNotice) >= 0.05 || ((rounded === 0 || rounded === 1) && rounded !== lastNotice)) {
        lastNotice = rounded;
        track.dispatchEvent(new CustomEvent("shah:film-state", { bubbles: true, detail: { state, progress: rounded, complete, bypassed: state === "bypassed" } }));
      }
    };
    const staticState = () => {
      track.dataset.unavailable = "true";
      stage.dataset.filmPhase = "static";
      publish("static", 1, true);
    };
    if (typeof window.IntersectionObserver !== "function" || typeof window.ResizeObserver !== "function") {
      staticState();
      return;
    }
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    const slow = connection?.saveData || /^(slow-)?2g$/.test(connection?.effectiveType ?? "");
    // Read the actual media preference here; the hook also reruns this effect when it changes.
    const reduced = !window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    if (reduced || slow || window.location.hash || window.scrollY > 1) {
      staticState();
      return;
    }

    // Until the whole film is ready, keep one normal viewport rather than a still-image runway.
    track.dataset.unavailable = "true";
    stage.dataset.filmPhase = "waiting";
    delete stage.dataset.filmSource;
    delete stage.dataset.filmTransport;
    delete stage.dataset.filmDownloaded;
    publish("waiting", 0, false);

    // This effect owns the video. React owns only its empty fullscreen stage.
    const video = document.createElement("video");
    video.className = styles.film;
    video.muted = true; video.defaultMuted = true; video.playsInline = true;
    video.preload = "none"; video.tabIndex = -1;
    video.disablePictureInPicture = true; video.disableRemotePlayback = true;
    video.setAttribute("aria-hidden", "true");
    video.setAttribute("webkit-playsinline", "");
    let disposed = false, failed = false, url = "", frame = 0, visible = true, distance = 1, initialized = false, requested = -1;
    let progress = 0, hasScrolled = false, decodedEnd = false, presentedEnd = false, bypassed = false;
    let deadline = 0, idle = 0, idleFallback = 0, posterPaintFrame = 0, videoFrame = 0, finalPaintFrame = 0;
    const controller = new AbortController();
    const nativeWebKit = /AppleWebKit/.test(navigator.userAgent) && !/(Chrome|Chromium|Edg|OPR|Android)/.test(navigator.userAgent);
    const measure = () => { distance = Math.max(1, track.offsetHeight - stage.offsetHeight); };
    const finalTarget = () => Math.max(0, video.duration - 0.001);
    const cancelEndConfirmation = () => {
      if (videoFrame && typeof video.cancelVideoFrameCallback === "function") video.cancelVideoFrameCallback(videoFrame);
      videoFrame = 0;
      cancelAnimationFrame(finalPaintFrame);
      finalPaintFrame = 0;
    };
    const finishEnd = () => {
      if (disposed || failed || bypassed || !initialized || progress < 1 || video.seeking || video.readyState < 2 || requested !== finalTarget()) return;
      decodedEnd = true;
      publish("complete", 1, true);
    };
    const armEndConfirmation = () => {
      if (disposed || failed || bypassed || decodedEnd || progress < 1) return;
      if (presentedEnd) { finishEnd(); return; }
      if (videoFrame || finalPaintFrame) return;
      if (typeof video.requestVideoFrameCallback === "function") {
        videoFrame = video.requestVideoFrameCallback((_now, metadata) => {
          videoFrame = 0;
          if (disposed || failed || bypassed || progress < 1) return;
          const finalFrameStart = Math.max(0, video.duration - 1 / FRAME_RATE - 0.005);
          if (metadata.mediaTime >= finalFrameStart) { presentedEnd = true; finishEnd(); }
          else armEndConfirmation();
        });
      } else if (!video.seeking && video.readyState >= 2) {
        // Older engines expose decode readiness through seeked/readyState instead.
        finalPaintFrame = requestAnimationFrame(() => {
          if (disposed || failed) return;
          finalPaintFrame = requestAnimationFrame(() => { finalPaintFrame = 0; finishEnd(); });
        });
      }
    };
    const staticFallback = () => {
      if (disposed || failed) return;
      if (initialized) {
        // Activation locks the runway geometry; skipping must not move later anchors or break rewind.
        bypassed = true; cancelEndConfirmation();
        publish(decodedEnd ? "complete" : "bypassed", progress, decodedEnd);
        return;
      }
      failed = true; initialized = false;
      controller.abort(); clearTimeout(deadline); cancelEndConfirmation();
      cancelAnimationFrame(frame); frame = 0;
      delete video.dataset.ready;
      video.pause(); video.removeAttribute("src"); video.load(); video.remove();
      staticState();
    };
    const sync = () => {
      frame = 0;
      if (disposed || failed || !initialized || document.hidden) return;
      const bounds = track.getBoundingClientRect();
      progress = Math.max(0, Math.min(1, -bounds.top / (distance * SCRUB_PORTION)));
      if (progress < 1) {
        decodedEnd = false; presentedEnd = false;
        cancelEndConfirmation();
      }
      // Leaving an activated film never collapses its native-scroll runway or destroys its media.
      if (bounds.bottom <= 0) {
        if (decodedEnd) publish("complete", 1, true);
        else staticFallback();
        return;
      }
      if (bounds.top < window.innerHeight) bypassed = false;
      publish(bypassed ? "bypassed" : decodedEnd ? "complete" : progress === 0 ? "ready" : "scrubbing", progress, decodedEnd);
      if (bypassed) return;
      if ((!visible && progress < 1) || video.seeking || video.readyState < 1 || !Number.isFinite(video.duration)) return;
      const end = finalTarget();
      const target = progress === 1 ? end : Math.min(Math.max(0, end - 1 / FRAME_RATE), Math.round(progress * end * FRAME_RATE) / FRAME_RATE);
      if (target !== requested) {
        requested = target;
        if (Math.abs(video.currentTime - target) > 1 / 48) {
          if (progress === 1) armEndConfirmation();
          video.currentTime = target;
          return;
        }
      }
      // Initial still remains stable; attach the owned Blob video when native scrolling needs it.
      if (hasScrolled && video.readyState >= 2 && !video.seeking) {
        if (video.parentElement !== stage) stage.appendChild(video);
        video.dataset.ready = "true";
      }
      if (progress === 1) armEndConfirmation();
    };
    const schedule = () => { if (!frame && !disposed && !failed && !document.hidden) frame = requestAnimationFrame(sync); };
    const scrolled = () => {
      if (window.scrollY > 1) hasScrolled = true;
      if (!initialized && hasScrolled) { staticFallback(); return; }
      schedule();
    };
    const hashChanged = () => { if (window.location.hash) staticFallback(); };
    const resized = () => { measure(); schedule(); };
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; video.pause(); }
      else schedule();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); });
    observer.observe(stage);
    const resize = new ResizeObserver(resized); resize.observe(track); resize.observe(stage);
    window.addEventListener("scroll", scrolled, { passive: true });
    window.addEventListener("hashchange", hashChanged);
    window.addEventListener("shah:film-skip", staticFallback);
    window.addEventListener("resize", resized);
    document.addEventListener("visibilitychange", visibility);
    video.addEventListener("seeked", schedule);

    function firstFrame(target = 0) {
      return new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => { cleanup(); reject(new Error("Decode timeout")); }, 8000);
        const cleanup = () => {
          clearTimeout(timeout);
          video.removeEventListener("seeked", check); video.removeEventListener("loadeddata", check); video.removeEventListener("canplay", check);
          controller.signal.removeEventListener("abort", aborted);
        };
        const aborted = () => { cleanup(); reject(new DOMException("Aborted", "AbortError")); };
        const check = () => { if (video.readyState >= 2 && !video.seeking) { cleanup(); resolve(); } };
        video.addEventListener("seeked", check); video.addEventListener("loadeddata", check); video.addEventListener("canplay", check);
        controller.signal.addEventListener("abort", aborted, { once: true });
        if (Math.abs(video.currentTime - target) > 1 / 48) video.currentTime = target;
        check();
      });
    }

    async function load() {
      if (disposed || failed) return;
      try {
        stage!.dataset.filmPhase = "loading"; publish("loading", 0, false);
        deadline = window.setTimeout(() => { staticFallback(); }, 60000);
        const compact = window.matchMedia("(max-width: 767px)").matches;
        const source = `/brand/shah-hero-scroll-${compact ? "mobile" : "desktop"}-v4.mp4`;
        video.dataset.source = source;
        video.dataset.transport = nativeWebKit ? "native-prebuffered" : "blob-prebuffered-detached";
        stage!.dataset.filmSource = source; stage!.dataset.filmTransport = video.dataset.transport;
        const response = await fetch(source, { signal: controller.signal, cache: "force-cache" });
        if (!response.ok) throw new Error("Video unavailable");
        const blob = await response.blob();
        if (disposed || failed || controller.signal.aborted) return;
        if (!blob.size) throw new Error("Empty video");
        video.dataset.downloaded = String(blob.size); stage!.dataset.filmDownloaded = String(blob.size);
        if (!nativeWebKit) url = URL.createObjectURL(blob);
        stage!.dataset.filmPhase = "decoding"; publish("decoding", 0, false);
        video.preload = "auto"; video.src = nativeWebKit ? source : url;
        // Preserve the original attached WebKit play/end-to-first decoder warm-up.
        if (nativeWebKit) stage!.appendChild(video);
        video.load(); await video.play();
        if (disposed || failed || controller.signal.aborted) return;
        if (nativeWebKit) await firstFrame(Math.max(0, video.duration - 1 / FRAME_RATE));
        video.pause(); await firstFrame();
        if (disposed || failed || controller.signal.aborted) return;
        if (window.scrollY > 1 || window.location.hash) { staticFallback(); return; }
        clearTimeout(deadline);
        initialized = true; delete track!.dataset.unavailable; measure();
        stage!.dataset.filmPhase = "ready"; publish("ready", 0, false);
        schedule();
      } catch { if (!disposed && !failed) staticFallback(); }
    }

    const poster = track.querySelector<HTMLImageElement>('img[fetchpriority="high"]') ?? track.querySelector<HTMLImageElement>("picture img");
    const queueFilm = () => {
      if (disposed || failed) return;
      const scheduleIdle = window.requestIdleCallback;
      if (typeof scheduleIdle === "function") idle = scheduleIdle.call(window, () => { void load(); }, { timeout: 1500 });
      else idleFallback = window.setTimeout(() => { void load(); }, 250);
    };
    const afterPosterPaint = () => {
      if (disposed || failed) return;
      const decoded = poster && typeof poster.decode === "function" ? poster.decode().catch(() => {}) : Promise.resolve();
      void decoded.then(() => {
        if (disposed || failed) return;
        posterPaintFrame = requestAnimationFrame(() => {
          if (disposed || failed) return;
          posterPaintFrame = requestAnimationFrame(() => { posterPaintFrame = 0; if (!disposed && !failed) queueFilm(); });
        });
      });
    };
    const posterSettled = () => {
      poster?.removeEventListener("load", posterSettled); poster?.removeEventListener("error", posterSettled);
      afterPosterPaint();
    };
    if (!poster || poster.complete) afterPosterPaint();
    else { poster.addEventListener("load", posterSettled, { once: true }); poster.addEventListener("error", posterSettled, { once: true }); }

    return () => {
      disposed = true; failed = true; controller.abort();
      clearTimeout(deadline); clearTimeout(idleFallback); cancelAnimationFrame(posterPaintFrame); cancelEndConfirmation();
      if (idle && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      poster?.removeEventListener("load", posterSettled); poster?.removeEventListener("error", posterSettled);
      cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect();
      window.removeEventListener("scroll", scrolled); window.removeEventListener("hashchange", hashChanged); window.removeEventListener("shah:film-skip", staticFallback); window.removeEventListener("resize", resized);
      document.removeEventListener("visibilitychange", visibility); video.removeEventListener("seeked", schedule);
      video.pause(); video.removeAttribute("src"); video.load(); video.remove();
      if (url) URL.revokeObjectURL(url);
    };
  }, [trackRef, allowed]);

  return <div ref={stageRef} className={styles.stage} aria-hidden="true" />;
}
