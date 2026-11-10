"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useLang } from "../providers";
import { BrandLogo } from "./BrandLogo";
import { useRichMedia } from "./HomeDepth";
import styles from "./HeroFilm.module.css";

type Phase = "loading" | "decoding" | "gesture" | "ready" | "static" | "error";
const subscribeClient = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function HeroFilm({ trackRef }: { trackRef: RefObject<HTMLDivElement | null> }) {
  const { lang } = useLang();
  const client = useSyncExternalStore(subscribeClient, clientSnapshot, serverSnapshot);
  const allowed = useRichMedia();
  const [state, setPhase] = useState<Phase>("loading");
  const [progress, setProgress] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [forceStatic, setForceStatic] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const unlockRef = useRef<() => void>(() => {});
  const phase: Phase = client && (!allowed || forceStatic) ? "static" : state;
  const complete = phase === "ready" || phase === "static";

  useEffect(() => {
    if (complete) { const timer = window.setTimeout(() => setRevealed(true), 650); return () => clearTimeout(timer); }
  }, [complete]);

  useEffect(() => {
    if (revealed) return;
    const body = document.body;
    const previous = body.style.overflow;
    body.style.overflow = "hidden";
    const surfaces = [...body.children].filter(element => element instanceof HTMLElement && !element.contains(document.querySelector('[data-shah-film-gate]'))) as HTMLElement[];
    const inert = surfaces.map(element => [element, element.inert] as const);
    for (const [element] of inert) element.inert = true;
    return () => { body.style.overflow = previous; for (const [element, value] of inert) element.inert = value; };
  }, [revealed, client]);

  useEffect(() => {
    const video = videoRef.current, track = trackRef.current, stage = stageRef.current;
    if (!video || !track || !stage || !client) return;
    let disposed = false, url = "", frame = 0, visible = true, distance = 1, initialized = false, initializing = false, requested = -1;
    const nativeWebKit = /AppleWebKit/.test(navigator.userAgent) && !/(Chrome|Chromium|Edg|OPR|Android)/.test(navigator.userAgent);
    const controller = new AbortController();
    const deadline = window.setTimeout(() => { controller.abort(); if (!disposed && !initialized) { video.pause(); setPhase("error"); } }, 60000);
    if (forceStatic || !allowed) {
      clearTimeout(deadline); track.dataset.unavailable = "true";
      return;
    }
    delete track.dataset.unavailable;
    delete video.dataset.ready;
    const measure = () => { distance = Math.max(1, track.offsetHeight - stage.offsetHeight); };
    const sync = () => {
      frame = 0;
      if (!initialized || !visible || document.hidden || video.seeking || video.readyState < 1 || !Number.isFinite(video.duration)) return;
      const progress = Math.max(0, Math.min(1, -track.getBoundingClientRect().top / distance));
      const end = Math.max(0, video.duration - 1 / 24), target = Math.min(end, Math.round(progress * end * 24) / 24);
      if (target === requested) return;
      requested = target;
      if (Math.abs(video.currentTime - target) > 1 / 48) video.currentTime = target;
    };
    const schedule = () => { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(sync); };
    const resized = () => { measure(); schedule(); };
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; video.pause(); } else schedule(); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); });
    observer.observe(stage);
    const resize = new ResizeObserver(resized); resize.observe(track); resize.observe(stage);
    window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", resized);
    document.addEventListener("visibilitychange", visibility); video.addEventListener("seeked", schedule);

    function firstFrame(target = 0) {
      return new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => { cleanup(); reject(new Error("Decode timeout")); }, 8000);
        const cleanup = () => { clearTimeout(timeout); video?.removeEventListener("seeked", check); video?.removeEventListener("loadeddata", check); video?.removeEventListener("canplay", check); controller.signal.removeEventListener("abort", aborted); };
        const aborted = () => { cleanup(); reject(new DOMException("Aborted", "AbortError")); };
        const check = () => { if (video && video.readyState >= 2 && !video.seeking) { cleanup(); resolve(); } };
        video?.addEventListener("seeked", check); video?.addEventListener("loadeddata", check); video?.addEventListener("canplay", check); controller.signal.addEventListener("abort", aborted, { once: true });
        if (video && Math.abs(video.currentTime - target) > 1 / 48) video.currentTime = target;
        check();
      });
    }
    async function initialize(playback?: Promise<void>) {
      if (initializing || initialized || disposed) return;
      initializing = true;
      try {
        await (playback ?? video!.play());
        if (disposed) return;
        if (nativeWebKit) await firstFrame(Math.max(0, video!.duration - 1 / 24));
        if (disposed) return;
        video!.pause(); await firstFrame();
        if (disposed) return;
        clearTimeout(deadline); initialized = true; measure(); video!.dataset.ready = "true"; schedule(); setProgress(100); setPhase("ready");
      } catch (error) {
        if (disposed) return;
        video!.pause();
        if (error instanceof DOMException && error.name === "NotAllowedError") setPhase("gesture");
        else if (!controller.signal.aborted) setPhase("error");
      } finally { initializing = false; }
    }
    unlockRef.current = () => { if (!initializing && !initialized) { const playback = video.play(); void initialize(playback); } };

    async function load() {
      try {
        const compact = window.matchMedia("(max-width: 767px)").matches;
        const source = `/brand/shah-hero-scroll-${compact ? "mobile" : "desktop"}-v4.mp4`;
        const metadata = () => new Promise<void>((resolve, reject) => {
          const finish = () => { video!.removeEventListener("loadedmetadata", loaded); video!.removeEventListener("error", failed); controller.signal.removeEventListener("abort", aborted); };
          const loaded = () => { finish(); resolve(); }, failed = () => { finish(); reject(new Error("Unsupported video")); }, aborted = () => { finish(); reject(new DOMException("Aborted", "AbortError")); };
          video!.addEventListener("loadedmetadata", loaded, { once: true }); video!.addEventListener("error", failed, { once: true }); controller.signal.addEventListener("abort", aborted, { once: true });
        });
        video!.dataset.source = source; video!.dataset.transport = nativeWebKit ? "native" : "blob";
        video!.muted = true; video!.defaultMuted = true; video!.playsInline = true; video!.setAttribute("webkit-playsinline", "");
        const response = await fetch(source, { signal: controller.signal, cache: "force-cache" });
        if (!response.ok) throw new Error("Video unavailable");
        if (disposed) return;
        setPhase("loading"); setProgress(0); setRevealed(false);
        const size = Number(response.headers.get("content-length")) || 0;
        const chunks: Uint8Array<ArrayBuffer>[] = [];
        let received = 0;
        if (response.body) {
          const reader = response.body.getReader();
          while (true) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); received += value.byteLength; if (size) setProgress(previous => Math.max(previous, Math.min(95, Math.floor(received / size * 95)))); }
        } else { const buffer = await response.arrayBuffer(); chunks.push(new Uint8Array(buffer)); received = buffer.byteLength; }
        if (!received || (size && received !== size)) throw new Error("Incomplete video");
        if (disposed) return;
        if (!nativeWebKit) url = URL.createObjectURL(new Blob(chunks, { type: "video/mp4" }));
        video!.dataset.downloaded = String(received);
        setProgress(95); setPhase("decoding");
        const loaded = metadata(); video!.src = nativeWebKit ? source : url; video!.load(); await loaded; if (!disposed) await initialize();
      } catch { if (!disposed) { video!.pause(); setPhase("error"); } }
    }
    void load();
    return () => {
      disposed = true; controller.abort(); clearTimeout(deadline); cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect();
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", resized); document.removeEventListener("visibilitychange", visibility); video.removeEventListener("seeked", schedule);
      unlockRef.current = () => {}; video.pause(); video.removeAttribute("src"); video.load(); if (url) URL.revokeObjectURL(url);
    };
  }, [attempt, forceStatic, trackRef, allowed, client]);

  const nl = lang === "nl";
  const gate = !revealed && <div data-shah-film-gate="" className={styles.gate} data-complete={complete ? "true" : "false"} role="status" aria-live="polite" aria-busy={!complete}>
    <div className={styles.gateContent}>
      <BrandLogo variant="landscape" tone="teal" eager className={styles.loadingLogo} />
      <div className={styles.loadingLabel}>{phase === "error" ? (nl ? "De video kon niet worden geladen" : "The video could not be loaded") : phase === "gesture" ? (nl ? "Welkom bij Shah" : "Welcome to Shah") : nl ? "Website wordt geladen" : "Website is loading"}</div>
      {phase !== "error" && phase !== "gesture" && <><div className={styles.progress} role="progressbar" aria-label={nl ? "Video laden" : "Loading video"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ transform: `scaleX(${progress / 100})` }} /></div><span className={styles.percentage} aria-hidden="true">{progress}%</span></>}
      {phase === "gesture" && <button type="button" className={styles.enter} onClick={() => unlockRef.current()}>{nl ? "Tik om de website te openen" : "Tap to open the website"}</button>}
      {phase === "error" && <div className={styles.errorActions}><button type="button" onClick={() => { setPhase("loading"); setProgress(0); setRevealed(false); setAttempt(value => value + 1); }}>{nl ? "Opnieuw proberen" : "Try again"}</button><button type="button" onClick={() => setForceStatic(true)}>{nl ? "Website openen" : "Open website"}</button></div>}
    </div>
  </div>;

  return <div ref={stageRef} className={styles.stage} data-film-phase={phase}>
    <video ref={videoRef} className={styles.film} muted playsInline preload="auto" tabIndex={-1} aria-hidden="true" disablePictureInPicture disableRemotePlayback />
    {client ? createPortal(gate, document.body) : gate}
    <noscript><style>{`[data-shah-film-gate] { display: none !important; }`}</style></noscript>
  </div>;
}
