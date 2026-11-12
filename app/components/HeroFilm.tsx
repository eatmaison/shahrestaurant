"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { useRichMedia } from "./HomeDepth";
import { claimIntroEntry, INTRO_ACTIVE_ATTRIBUTE, isClosingSecond, markIntroConsumed, prepareIntroPresentation } from "../lib/introSession";
import { getIntroMedia, introVariantNeedsContain } from "../lib/introMedia";
import type { Lang } from "../lib/types";
import styles from "./HeroFilm.module.css";

type Connection = { effectiveType?: string; saveData?: boolean };
type FilmState = "waiting" | "loading" | "decoding" | "playing" | "paused" | "blocked" | "complete" | "static" | "handoff" | "dismissed";
const FRAME_RATE = 30;

function restoreConsumedIntro(track: HTMLDivElement, reason = "session-return") {
  const focused = document.activeElement;
  const moveFocus = focused instanceof HTMLElement && track.contains(focused);
  track.dataset.filmConsumed = "true";
  track.dataset.filmState = "dismissed";
  track.dataset.filmDismissal = reason;
  const root = track.closest<HTMLElement>("[data-cinematic-home]");
  if (root) { root.dataset.filmConsumed = "true"; root.dataset.filmView = "content"; }
  markIntroConsumed();
  if (moveFocus) root?.querySelector<HTMLElement>("[data-opening-chapter]")?.focus({ preventScroll: true });
}

/** Play the approved film once; native scrolling always remains available. */
export function HeroFilm({ trackRef, lang }: { trackRef: RefObject<HTMLDivElement | null>; lang: Lang }) {
  const allowed = useRichMedia();
  const stageRef = useRef<HTMLDivElement>(null);
  const entryRef = useRef<boolean | null>(null);
  const initialLanguageRef = useRef(lang);

  useLayoutEffect(() => {
    // Child layout effects can precede attachment of a parent's host ref. Our own
    // stage is already attached, and its DOM ancestry identifies the same track.
    const track = stageRef.current?.closest<HTMLDivElement>("[data-film-track]");
    if (!track) return;
    // A language change dismisses the existing intro before paint, including an
    // in-place locale update. It never starts another language's film in this tab.
    if (initialLanguageRef.current !== lang) { restoreConsumedIntro(track, "language-change"); return; }
    // useRichMedia can change immediately after hydration. That is still this entry.
    entryRef.current ??= claimIntroEntry();
    if (entryRef.current) restoreConsumedIntro(track);
    else prepareIntroPresentation();
  }, [trackRef, lang]);

  useEffect(() => {
    const stage = stageRef.current;
    const track = stage?.closest<HTMLDivElement>("[data-film-track]");
    if (!track || !stage) return;
    // Also cover an unusual deferred attachment without claiming an active entry twice.
    if (entryRef.current === null) {
      entryRef.current = claimIntroEntry();
      if (!entryRef.current) prepareIntroPresentation();
    }
    if (entryRef.current) { restoreConsumedIntro(track); return; }
    if (track.dataset.filmConsumed === "true") return;
    let lastNotice = -1;
    const publish = (state: FilmState, progress: number, complete: boolean) => {
      const rounded = Number(Math.max(0, Math.min(1, progress)).toFixed(4));
      const changed = track.dataset.filmState !== state || track.dataset.filmComplete !== String(complete);
      track.dataset.filmState = state;
      track.dataset.filmProgress = String(rounded);
      track.dataset.filmComplete = String(complete);
      track.dataset.filmBypassed = String(state === "handoff" || state === "dismissed");
      if (changed || Math.abs(rounded - lastNotice) >= 0.05 || rounded === 1 && lastNotice !== 1) {
        lastNotice = rounded;
        track.dispatchEvent(new CustomEvent("shah:film-state", { bubbles: true, detail: { state, progress: rounded, complete, bypassed: state === "handoff" || state === "dismissed" } }));
      }
    };
    const staticState = (reason: string) => {
      track.dataset.unavailable = "true";
      track.dataset.filmFallback = reason;
      stage.dataset.filmPhase = "static";
      publish("static", 0, false);
    };
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    const reduced = !window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    const presentationActive = document.documentElement.getAttribute(INTRO_ACTIVE_ATTRIBUTE) === "true";
    const staticReason = reduced ? "reduced-motion" : connection?.saveData || /^(slow-)?2g$/.test(connection?.effectiveType ?? "") ? "data-saving" : !presentationActive ? "initial-static-preference" : "";
    const initialNavigation = !!window.location.hash || window.scrollY > 1;
    track.dataset.unavailable = "true";
    delete track.dataset.filmFallback;
    stage.dataset.filmPhase = "waiting";
    delete stage.dataset.filmSource;
    delete stage.dataset.filmTransport;
    delete stage.dataset.filmDownloaded;
    delete stage.dataset.filmFinalFrame;
    delete stage.dataset.filmFinalFrameConfirmed;
    delete track.dataset.filmNaturalEnded;
    publish("waiting", 0, false);

    // React owns only the empty stage. This effect owns the media and its cleanup.
    const video = document.createElement("video");
    video.className = styles.film;
    video.muted = true; video.defaultMuted = true; video.playsInline = true;
    video.autoplay = true; video.preload = "none"; video.tabIndex = -1;
    video.disablePictureInPicture = true; video.disableRemotePlayback = true;
    video.setAttribute("aria-hidden", "true");
    video.setAttribute("webkit-playsinline", "");
    let disposed = false, failed = false, initialized = false, consumed = false, handingOff = false, resumeAfterVisibility = false;
    let url = "", deadline = 0, idle = 0, idleFallback = 0, posterPaintFrame = 0, videoFrame = 0, finalPaintFrame = 0;
    let lastFrameTime = -1;
    let handoffFrame = 0, naturalEnded = false;
    let selectedCompact: boolean | null = null;
    const controller = new AbortController();
    const nativeWebKit = /AppleWebKit/.test(navigator.userAgent) && !/(Chrome|Chromium|Edg|OPR|Android)/.test(navigator.userAgent);
    const progress = () => Number.isFinite(video.duration) && video.duration > 0 ? video.currentTime / video.duration : 0;
    const fitVariant = () => {
      if (selectedCompact === null || disposed || consumed) return;
      // Preserve the selected file and clock through rotation; show its full frame
      // when its orientation/breakpoint no longer matches the viewport.
      const contain = introVariantNeedsContain(selectedCompact, window.innerWidth, window.innerHeight);
      video.style.objectFit = contain ? "contain" : "";
      video.style.backgroundColor = contain ? "#000" : "";
      video.dataset.viewportMismatch = String(contain);
    };
    const cancelFrames = () => {
      if (videoFrame && typeof video.cancelVideoFrameCallback === "function") video.cancelVideoFrameCallback(videoFrame);
      videoFrame = 0; cancelAnimationFrame(finalPaintFrame); finalPaintFrame = 0;
    };
    const content = () => track.closest<HTMLElement>("[data-cinematic-home]")?.querySelector<HTMLElement>("[data-opening-chapter]");
    const consume = (reason: string) => {
      if (disposed || consumed) return;
      consumed = true;
      cancelAnimationFrame(handoffFrame); handoffFrame = 0;
      const intro = content();
      const focused = document.activeElement;
      const moveFocus = focused instanceof HTMLElement && track.contains(focused);
      track.dataset.filmConsumed = "true";
      track.dataset.filmDismissal = reason;
      delete track.dataset.filmHandoff;
      const root = track.closest<HTMLElement>("[data-cinematic-home]");
      if (root) { root.dataset.filmConsumed = "true"; root.dataset.filmView = "content"; }
      markIntroConsumed();
      // The initial overlay was out of flow before paint. No height or scroll correction.
      if (moveFocus) intro?.focus({ preventScroll: true });
      stage.dataset.filmPhase = "consumed";
      publish(naturalEnded ? "complete" : "dismissed", progress(), naturalEnded);
      controller.abort(); clearTimeout(deadline); clearTimeout(idleFallback); cancelAnimationFrame(posterPaintFrame); cancelFrames();
      if (idle && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      video.pause(); video.removeAttribute("src"); video.load(); video.remove();
      if (url) { URL.revokeObjectURL(url); url = ""; }
    };
    const startHandoff = () => {
      if (disposed || consumed || handingOff || document.hidden) return;
      const intro = content();
      if (!intro) return consume("content-unavailable");
      const focused = document.activeElement;
      // Focused page controls, links and forms keep the visitor's chosen location.
      if (focused instanceof HTMLElement && focused !== document.body && !track.contains(focused)) return consume("content-interaction");
      handingOff = true;
      track.dataset.filmHandoff = "true";
      stage.dataset.filmPhase = "handoff";
      publish("handoff", progress(), naturalEnded);
      const startedAt = performance.now();
      const settle = () => {
        handoffFrame = 0;
        if (disposed || consumed) return;
        if (performance.now() - startedAt >= 850) return consume(naturalEnded ? "natural-ended" : "closing-second-handoff");
        handoffFrame = requestAnimationFrame(settle);
      };
      // Moving the fullscreen overlay reveals the stationary document like an upward
      // scroll, without collapsing an in-flow viewport or changing native scroll position.
      handoffFrame = requestAnimationFrame(settle);
    };
    const maybeHandoff = () => {
      if (!initialized || consumed || handingOff || video.paused || video.ended || document.hidden || !isClosingSecond(video.currentTime, video.duration)) return;
      const bounds = track.getBoundingClientRect();
      if (bounds.bottom > 0 && bounds.top < window.innerHeight) startHandoff();
    };
    const finish = () => {
      if (disposed || consumed || failed || !initialized || !video.ended || video.readyState < 2) return;
      naturalEnded = true;
      track.dataset.filmNaturalEnded = "true";
      finalPaintFrame = requestAnimationFrame(() => {
        finalPaintFrame = requestAnimationFrame(() => {
          finalPaintFrame = 0;
          if (disposed || consumed || failed || !video.ended) return;
          stage.dataset.filmFinalFrame = String(lastFrameTime);
          stage.dataset.filmFinalFrameConfirmed = String(lastFrameTime >= Math.max(0, video.duration - 1 / FRAME_RATE - 0.005));
          stage.dataset.filmPhase = "complete";
          publish("complete", 1, true);
          cancelFrames();
          if (!handingOff) startHandoff();
        });
      });
    };
    const observeFrame = () => {
      if (disposed || consumed || failed || typeof video.requestVideoFrameCallback !== "function") return;
      videoFrame = video.requestVideoFrameCallback((_now, metadata) => {
        videoFrame = 0; lastFrameTime = metadata.mediaTime;
        maybeHandoff();
        if (!video.ended) observeFrame();
      });
    };
    const exposeManualPlayback = () => {
      if (disposed || consumed) return;
      video.controls = true; video.tabIndex = 0;
      video.dataset.manual = "true";
      video.removeAttribute("aria-hidden");
      video.setAttribute("aria-label", lang === "en" ? "Play Shah Restaurant film" : "Film van Shah Restaurant afspelen");
      stage.removeAttribute("aria-hidden");
      stage.dataset.filmPhase = "blocked";
      publish("blocked", progress(), false);
    };
    const fallback = (reason: string) => {
      if (disposed || consumed || failed) return;
      if (document.documentElement.getAttribute(INTRO_ACTIVE_ATTRIBUTE) === "true") {
        track.dataset.filmFallback = reason;
        consume(reason);
        return;
      }
      controller.abort(); clearTimeout(deadline);
      video.pause(); cancelFrames();
      failed = true;
      video.removeAttribute("src"); video.load(); video.remove();
      staticState(reason);
    };
    const resume = () => {
      if (disposed || consumed || failed || !initialized || video.ended || document.hidden || window.scrollY > 1 || window.location.hash) return;
      void video.play().catch(() => { if (!disposed && !consumed && !failed && !document.hidden && window.scrollY <= 1 && !window.location.hash) exposeManualPlayback(); });
    };
    const scrolled = () => {
      if (!handingOff && window.scrollY > 1) consume("scroll-navigation");
    };
    const skipped = () => consume("explicit-navigation");
    const hashChanged = () => { if (window.location.hash) consume("hash-navigation"); };
    const departed = () => consume("page-departure");
    const interrupt = (event: Event) => {
      if (!handingOff) return;
      if (event instanceof KeyboardEvent && !["ArrowDown","ArrowUp","PageDown","PageUp","Home","End"," ","Escape","Tab"].includes(event.key)) return;
      consume("handoff-interrupted");
    };
    const visibility = () => {
      if (document.hidden) { if (handingOff) return consume("handoff-backgrounded"); resumeAfterVisibility = !video.paused && !video.ended; video.pause(); }
      else if (resumeAfterVisibility) { resumeAfterVisibility = false; resume(); }
    };
    const playing = () => {
      if (!initialized || disposed || consumed || failed) return;
      stage.dataset.filmPhase = handingOff ? "handoff" : "playing";
      if (!videoFrame) observeFrame();
      if (!handingOff) publish("playing", progress(), false);
    };
    const timeUpdated = () => { if (initialized && !consumed && !handingOff && !video.paused && !video.ended) { publish("playing", progress(), false); maybeHandoff(); } };
    const paused = () => { if (initialized && !consumed && !handingOff && !video.ended && !failed && !disposed) publish("paused", progress(), false); };
    const mediaError = () => fallback("media-error");
    window.addEventListener("scroll", scrolled, { passive: true });
    window.addEventListener("hashchange", hashChanged);
    window.addEventListener("pagehide", departed);
    window.addEventListener("shah:film-skip", skipped);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("wheel", interrupt, { passive: true });
    window.addEventListener("touchstart", interrupt, { passive: true });
    window.addEventListener("pointerdown", interrupt, { passive: true });
    window.addEventListener("keydown", interrupt);
    window.addEventListener("resize", fitVariant, { passive: true });
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
      if (disposed || consumed || failed) return;
      try {
        stage.dataset.filmPhase = "loading"; publish("loading", 0, false);
        const compact = window.matchMedia("(max-width: 767px)").matches;
        selectedCompact = compact;
        // Keep full-file buffering: the approved master exceeds a slow 4G link.
        // The longer deadline allows that download; visitors can scroll away at any time.
        deadline = window.setTimeout(() => fallback("download-timeout"), compact ? 180000 : 300000);
        const source = getIntroMedia(lang)[compact ? "mobileVideo" : "desktopVideo"];
        video.dataset.locale = lang;
        video.dataset.variant = compact ? "mobile" : "desktop";
        stage.dataset.filmLocale = lang;
        fitVariant();
        video.dataset.source = source;
        video.dataset.transport = nativeWebKit ? "native-prebuffered-autoplay" : "blob-prebuffered-autoplay";
        stage.dataset.filmSource = source; stage.dataset.filmTransport = video.dataset.transport;
        const response = await fetch(source, { signal: controller.signal, cache: "force-cache" });
        if (!response.ok) throw new Error("Video unavailable");
        const blob = await response.blob();
        if (disposed || consumed || failed || controller.signal.aborted) return;
        if (!blob.size) throw new Error("Empty video");
        video.dataset.downloaded = String(blob.size); stage.dataset.filmDownloaded = String(blob.size);
        if (!nativeWebKit) url = URL.createObjectURL(blob);
        stage.dataset.filmPhase = "decoding"; publish("decoding", 0, false);
        video.preload = "auto"; video.src = nativeWebKit ? source : url;
        stage.appendChild(video); observeFrame(); video.load();
        const started = video.play().then(() => true, () => false);
        await firstFrame();
        if (disposed || consumed || failed || controller.signal.aborted) return;
        if (window.scrollY > 1 || window.location.hash) { consume("early-navigation"); return; }
        initialized = true; clearTimeout(deadline);
        delete track.dataset.unavailable;
        video.dataset.ready = "true";
        const didStart = await started;
        if (disposed || consumed || failed || controller.signal.aborted || window.scrollY > 1 || window.location.hash) return;
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
      if (disposed || consumed || failed) return;
      const scheduleIdle = window.requestIdleCallback;
      if (typeof scheduleIdle === "function") idle = scheduleIdle.call(window, () => { void load(); }, { timeout: 1500 });
      else idleFallback = window.setTimeout(() => { void load(); }, 250);
    };
    const afterPosterPaint = () => {
      const decoded = poster && typeof poster.decode === "function" ? poster.decode().catch(() => {}) : Promise.resolve();
      void decoded.then(() => {
        if (disposed || consumed || failed) return;
        posterPaintFrame = requestAnimationFrame(() => { posterPaintFrame = requestAnimationFrame(() => { posterPaintFrame = 0; if (!disposed && !consumed && !failed) queueFilm(); }); });
      });
    };
    const posterSettled = () => { poster?.removeEventListener("load", posterSettled); poster?.removeEventListener("error", posterSettled); afterPosterPaint(); };
    if (initialNavigation) consume("initial-navigation");
    else if (staticReason) {
      if (document.documentElement.getAttribute(INTRO_ACTIVE_ATTRIBUTE) === "true") consume(staticReason);
      else staticState(staticReason);
    }
    else if (!poster || poster.complete) afterPosterPaint();
    else { poster.addEventListener("load", posterSettled, { once: true }); poster.addEventListener("error", posterSettled, { once: true }); }

    return () => {
      if (track.dataset.filmDismissal === "language-change" && !consumed) consume("language-change");
      else if (handingOff && !consumed) consume("handoff-preference-change");
      disposed = true; failed = true; controller.abort();
      clearTimeout(deadline); clearTimeout(idleFallback); cancelAnimationFrame(posterPaintFrame); cancelAnimationFrame(handoffFrame); cancelFrames();
      if (idle && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      poster?.removeEventListener("load", posterSettled); poster?.removeEventListener("error", posterSettled);
      window.removeEventListener("scroll", scrolled); window.removeEventListener("hashchange", hashChanged); window.removeEventListener("shah:film-skip", skipped);
      window.removeEventListener("pagehide", departed);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("wheel", interrupt); window.removeEventListener("touchstart", interrupt);
      window.removeEventListener("pointerdown", interrupt); window.removeEventListener("keydown", interrupt);
      window.removeEventListener("resize", fitVariant);
      video.removeEventListener("playing", playing); video.removeEventListener("timeupdate", timeUpdated); video.removeEventListener("pause", paused); video.removeEventListener("ended", finish); video.removeEventListener("error", mediaError);
      video.pause(); video.removeAttribute("src"); video.load(); video.remove();
      stage.setAttribute("aria-hidden", "true");
      if (url) URL.revokeObjectURL(url);
      // A preference-effect rerun keeps this entry; a real route departure does not.
      queueMicrotask(() => { if (!track.isConnected) markIntroConsumed(); });
    };
  }, [trackRef, allowed, lang]);

  return <div ref={stageRef} className={styles.stage} aria-hidden="true" />;
}
