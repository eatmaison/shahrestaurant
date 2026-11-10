"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import styles from "./HeroFilm.module.css";

type Props = { enabled: boolean; theme: "light" | "dark"; trackRef: RefObject<HTMLDivElement | null> };

export function HeroFilm({ enabled, theme, trackRef }: Props) {
  const [ready, setReady] = useState(false);
  const [compact, setCompact] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!enabled || !stage) return;
    let idle = 0;
    let timer = 0;
    let visible = false;
    const sizeQuery = window.matchMedia("(max-width: 767px)");
    const sizeChanged = () => setCompact(sizeQuery.matches);
    const start = () => {
      idle = 0;
      timer = 0;
      if (visible && !document.hidden) { setCompact(sizeQuery.matches); setReady(true); }
    };
    const schedule = () => {
      if (!visible || document.readyState !== "complete" || idle || timer) return;
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(start, { timeout: 2000 });
      else timer = window.setTimeout(start, 400);
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); });
    observer.observe(stage);
    window.addEventListener("load", schedule, { once: true });
    document.addEventListener("visibilitychange", schedule);
    sizeQuery.addEventListener("change", sizeChanged);
    return () => {
      observer.disconnect();
      window.removeEventListener("load", schedule);
      document.removeEventListener("visibilitychange", schedule);
      sizeQuery.removeEventListener("change", sizeChanged);
      if (idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, [enabled]);

  useEffect(() => {
    const video = videoRef.current;
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!enabled || !ready || !video || !stage || !track) return;
    let frame = 0;
    let visible = true;
    let distance = 1;
    const measure = () => { distance = Math.max(1, track.offsetHeight - stage.offsetHeight); };
    const sync = () => {
      frame = 0;
      if (!visible || document.hidden || video.seeking || !Number.isFinite(video.duration) || !video.duration || video.readyState < 2) return;
      const progress = Math.max(0, Math.min(1, -track.getBoundingClientRect().top / distance));
      const lastFrame = Math.max(0, video.duration - 1 / 24);
      const target = Math.min(lastFrame, Math.round(progress * lastFrame * 24) / 24);
      if (Math.abs(video.currentTime - target) > 1 / 48) video.currentTime = target;
    };
    const schedule = () => { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(sync); };
    const resized = () => { measure(); schedule(); };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule(); else { cancelAnimationFrame(frame); frame = 0; }
    });
    observer.observe(stage);
    const resize = new ResizeObserver(resized);
    resize.observe(track);
    resize.observe(stage);
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else schedule(); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resized);
    document.addEventListener("visibilitychange", visibility);
    video.addEventListener("loadedmetadata", resized);
    video.addEventListener("loadeddata", schedule);
    video.addEventListener("seeked", schedule);
    video.pause();
    measure();
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", resized);
      document.removeEventListener("visibilitychange", visibility);
      video.removeEventListener("loadedmetadata", resized);
      video.removeEventListener("loadeddata", schedule);
      video.removeEventListener("seeked", schedule);
      video.pause();
    };
  }, [enabled, ready, compact, theme, trackRef]);

  return <div ref={stageRef} className={styles.stage} aria-hidden="true">{enabled && ready && <video key={`${theme}-${compact}`} ref={videoRef} className={styles.film} src={`/brand/shah-scroll-${theme === "dark" ? "night" : "day"}-${compact ? "mobile" : "desktop"}-v2.mp4`} muted playsInline preload="auto" tabIndex={-1} onLoadedData={event => { event.currentTarget.dataset.ready = "true"; }} onError={event => { event.currentTarget.style.display = "none"; trackRef.current?.setAttribute("data-unavailable", "true"); }} />}</div>;
}
