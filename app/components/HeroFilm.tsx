"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useRichMedia } from "./HomeDepth";
import styles from "./HeroFilm.module.css";

type Connection = { effectiveType?: string; saveData?: boolean };
type FilmState = "waiting" | "loading" | "decoding" | "playing" | "paused" | "blocked" | "complete" | "static" | "bypassed";
const FRAME_RATE = 24;

/** Play the original film once; native scrolling always remains available. */
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
      if (changed || Math.abs(rounded - lastNotice) >= 0.05 || rounded === 1 && lastNotice !== 1) {
        lastNotice = rounded;
        track.dispatchEvent(new CustomEvent("shah:film-state", { bubbles: true, detail: { state, progress: rounded, complete, bypassed: state === "bypassed" } }));
      }
    };
    const staticState = (reason: string) => {
      track.dataset.unavailable = "true";
      track.dataset.filmFallback = reason;
      stage.dataset.filmPhase = "static";
      publish("static", 1, true);
    };
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    const reduced = !window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    if (reduced || connection?.saveData || /^(slow-)?2g$/.test(connection?.effectiveType ?? "")) {
      staticState(reduced ? "reduced-motion" : "data-saving");
      return;
    }
    if (window.location.hash || window.scrollY > 1) {
      staticState("initial-navigation");
      return;
    }
    track.dataset.unavailable = "true";
    delete track.dataset.filmFallback;
    stage.dataset.filmPhase = "waiting";
    delete stage.dataset.filmSource;
    delete stage.dataset.filmTransport;
    delete stage.dataset.filmDownloaded;
    delete stage.dataset.filmFinalFrame;
    delete stage.dataset.filmFinalFrameConfirmed;
    publish("waiting", 0, false);

    // React owns only the empty stage. This effect owns the media and its cleanup.
    const video = document.createElement("video");
    video.className = styles.film;
    video.muted = true; video.defaultMuted = true; video.playsInline = true;
    video.autoplay = true; video.preload = "none"; video.tabIndex = -1;
    video.disablePictureInPicture = true; video.disableRemotePlayback = true;
    video.setAttribute("aria-hidden", "true");
    video.setAttribute("webkit-playsinline", "");
    let disposed = false, failed = false, initialized = false, bypassed = false, manual = false, resumeAfterVisibility = false;
    let url = "", deadline = 0, idle = 0, idleFallback = 0, posterPaintFrame = 0, videoFrame = 0, finalPaintFrame = 0;
    let lastFrameTime = -1;
    const controller = new AbortController();
    const nativeWebKit = /AppleWebKit/.test(navigator.userAgent) && !/(Chrome|Chromium|Edg|OPR|Android)/.test(navigator.userAgent);
    const progress = () => Number.isFinite(video.duration) && video.duration > 0 ? video.currentTime / video.duration : 0;
    const cancelFrames = () => {
      if (videoFrame && typeof video.cancelVideoFrameCallback === "function") video.cancelVideoFrameCallback(videoFrame);
      videoFrame = 0; cancelAnimationFrame(finalPaintFrame); finalPaintFrame = 0;
    };
    const finish = () => {
      if (disposed || failed || !initialized || !video.ended || video.readyState < 2) return;
      finalPaintFrame = requestAnimationFrame(() => {
        finalPaintFrame = requestAnimationFrame(() => {
          finalPaintFrame = 0;
          if (disposed || failed || !video.ended) return;
          stage.dataset.filmFinalFrame = String(lastFrameTime);
          stage.dataset.filmFinalFrameConfirmed = String(lastFrameTime >= Math.max(0, video.duration - 1 / FRAME_RATE - 0.005));
          stage.dataset.filmPhase = "complete";
          publish("complete", 1, true);
          cancelFrames();
        });
      });
    };
    const observeFrame = () => {
      if (disposed || failed || typeof video.requestVideoFrameCallback !== "function") return;
      videoFrame = video.requestVideoFrameCallback((_now, metadata) => {
        videoFrame = 0; lastFrameTime = metadata.mediaTime;
        if (!video.ended) observeFrame();
      });
    };
    const exposeManualPlayback = () => {
      manual = true;
      video.controls = true; video.tabIndex = 0;
      video.dataset.manual = "true";
      video.removeAttribute("aria-hidden");
      video.setAttribute("aria-label", document.documentElement.lang === "en" ? "Play Shah Restaurant film" : "Film van Shah Restaurant afspelen");
      stage.removeAttribute("aria-hidden");
      stage.dataset.filmPhase = "blocked";
      publish("blocked", progress(), false);
    };
    const fallback = (reason: string) => {
      if (disposed || failed) return;
      controller.abort(); clearTimeout(deadline);
      video.pause(); cancelFrames();
      if (initialized && reason !== "media-error") {
        bypassed = true;
        stage.dataset.filmPhase = "bypassed";
        track.dataset.filmFallback = reason;
        publish(video.ended ? "complete" : "bypassed", progress(), video.ended);
        return;
      }
      failed = true;
      video.removeAttribute("src"); video.load(); video.remove();
      staticState(reason);
    };
    const resume = () => {
      if (disposed || failed || !initialized || video.ended || bypassed || document.hidden || window.scrollY > 1 || window.location.hash) return;
      void video.play().catch(() => { if (!disposed && !failed && !bypassed && !document.hidden && window.scrollY <= 1 && !window.location.hash) exposeManualPlayback(); });
    };
    const scrolled = () => {
      if (window.scrollY > 1) fallback("early-navigation");
      else if (initialized && bypassed && !video.ended && !manual) { bypassed = false; delete track.dataset.filmFallback; observeFrame(); resume(); }
    };
    const skipped = () => fallback("explicit-navigation");
    const hashChanged = () => { if (window.location.hash) fallback("hash-navigation"); };
    const visibility = () => {
      if (document.hidden) { resumeAfterVisibility = !video.paused && !video.ended; video.pause(); }
      else if (resumeAfterVisibility) { resumeAfterVisibility = false; resume(); }
    };
    const playing = () => {
      if (!initialized || disposed || failed) return;
      if (bypassed && window.scrollY > 1) { video.pause(); return; }
      bypassed = false; stage.dataset.filmPhase = "playing";
      if (!videoFrame) observeFrame();
      publish("playing", progress(), false);
    };
    const timeUpdated = () => { if (initialized && !bypassed && !video.paused && !video.ended) publish("playing", progress(), false); };
    const paused = () => { if (initialized && !bypassed && !video.ended && !failed && !disposed) publish("paused", progress(), false); };
    const mediaError = () => fallback("media-error");
    window.addEventListener("scroll", scrolled, { passive: true });
    window.addEventListener("hashchange", hashChanged);
    window.addEventListener("shah:film-skip", skipped);
    document.addEventListener("visibilitychange", visibility);
    video.addEventListener("playing", playing);
    video.addEventListener("timeupdate", timeUpdated);
    video.addEventListener("pause", paused);
    video.addEventListener("ended", finish);
    video.addEventListener("error", mediaError);

    function firstFrame() {
      return new Promise<void>((resolve, reject) => {
        const cleanup = () => { clearTimeout(timeout); video.removeEventListener("loadeddata", check); video.removeEventListener("canplay", check); controller.signal.removeEventListener("abort", aborted); };
        const check = () => { if (video.readyState >= 2 && !video.seeking) { cleanup(); resolve(); } };
        const aborted = () => { cleanup(); reject(new DOMException("Aborted", "AbortError")); };
        const timeout = window.setTimeout(() => { cleanup(); reject(new Error("Decode timeout")); }, 8000);
        video.addEventListener("loadeddata", check); video.addEventListener("canplay", check);
        controller.signal.addEventListener("abort", aborted, { once: true });
        check();
      });
    }
    const load = async () => {
      if (disposed || failed) return;
      try {
        stage.dataset.filmPhase = "loading"; publish("loading", 0, false);
        const compact = window.matchMedia("(max-width: 767px)").matches;
        // Keep full-file buffering: the original bitrate exceeds a slow 4G link.
        // The longer deadline allows that download; visitors can scroll away at any time.
        deadline = window.setTimeout(() => fallback("download-timeout"), compact ? 180000 : 300000);
        const source = `/brand/shah-hero-scroll-${compact ? "mobile" : "desktop"}-v4.mp4`;
        video.dataset.source = source;
        video.dataset.transport = nativeWebKit ? "native-prebuffered-autoplay" : "blob-prebuffered-autoplay";
        stage.dataset.filmSource = source; stage.dataset.filmTransport = video.dataset.transport;
        const response = await fetch(source, { signal: controller.signal, cache: "force-cache" });
        if (!response.ok) throw new Error("Video unavailable");
        const blob = await response.blob();
        if (disposed || failed || controller.signal.aborted) return;
        if (!blob.size) throw new Error("Empty video");
        video.dataset.downloaded = String(blob.size); stage.dataset.filmDownloaded = String(blob.size);
        if (!nativeWebKit) url = URL.createObjectURL(blob);
        stage.dataset.filmPhase = "decoding"; publish("decoding", 0, false);
        video.preload = "auto"; video.src = nativeWebKit ? source : url;
        stage.appendChild(video); observeFrame(); video.load();
        const started = video.play().then(() => true, () => false);
        await firstFrame();
        if (disposed || failed || controller.signal.aborted) return;
        if (window.scrollY > 1 || window.location.hash) { fallback("early-navigation"); return; }
        initialized = true; clearTimeout(deadline);
        delete track.dataset.unavailable;
        video.dataset.ready = "true";
        const didStart = await started;
        if (disposed || failed || bypassed || controller.signal.aborted || window.scrollY > 1 || window.location.hash) return;
        if (document.hidden) {
          resumeAfterVisibility = true; video.pause();
          stage.dataset.filmPhase = "paused"; publish("paused", progress(), false);
        } else if (didStart) {
          stage.dataset.filmPhase = video.paused ? "paused" : "playing";
          publish(video.paused ? "paused" : "playing", progress(), false);
        } else exposeManualPlayback();
      } catch { if (!disposed && !failed) fallback("load-or-decode-error"); }
    };
    const poster = track.querySelector<HTMLImageElement>('img[fetchpriority="high"]') ?? track.querySelector<HTMLImageElement>("picture img");
    const queueFilm = () => {
      if (disposed || failed) return;
      const scheduleIdle = window.requestIdleCallback;
      if (typeof scheduleIdle === "function") idle = scheduleIdle.call(window, () => { void load(); }, { timeout: 1500 });
      else idleFallback = window.setTimeout(() => { void load(); }, 250);
    };
    const afterPosterPaint = () => {
      const decoded = poster && typeof poster.decode === "function" ? poster.decode().catch(() => {}) : Promise.resolve();
      void decoded.then(() => {
        if (disposed || failed) return;
        posterPaintFrame = requestAnimationFrame(() => { posterPaintFrame = requestAnimationFrame(() => { posterPaintFrame = 0; if (!disposed && !failed) queueFilm(); }); });
      });
    };
    const posterSettled = () => { poster?.removeEventListener("load", posterSettled); poster?.removeEventListener("error", posterSettled); afterPosterPaint(); };
    if (!poster || poster.complete) afterPosterPaint();
    else { poster.addEventListener("load", posterSettled, { once: true }); poster.addEventListener("error", posterSettled, { once: true }); }

    return () => {
      disposed = true; failed = true; controller.abort();
      clearTimeout(deadline); clearTimeout(idleFallback); cancelAnimationFrame(posterPaintFrame); cancelFrames();
      if (idle && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      poster?.removeEventListener("load", posterSettled); poster?.removeEventListener("error", posterSettled);
      window.removeEventListener("scroll", scrolled); window.removeEventListener("hashchange", hashChanged); window.removeEventListener("shah:film-skip", skipped);
      document.removeEventListener("visibilitychange", visibility);
      video.removeEventListener("playing", playing); video.removeEventListener("timeupdate", timeUpdated); video.removeEventListener("pause", paused); video.removeEventListener("ended", finish); video.removeEventListener("error", mediaError);
      video.pause(); video.removeAttribute("src"); video.load(); video.remove();
      stage.setAttribute("aria-hidden", "true");
      if (url) URL.revokeObjectURL(url);
    };
  }, [trackRef, allowed]);

  return <div ref={stageRef} className={styles.stage} aria-hidden="true" />;
}
