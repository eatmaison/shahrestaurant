"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./HeroFilm.module.css";

type Props = { enabled: boolean; theme: "light" | "dark" };

export function HeroFilm({ enabled, theme }: Props) {
  const [ready, setReady] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!enabled || !stage) return;
    let idle = 0;
    let timer = 0;
    let visible = false;
    const start = () => {
      idle = 0;
      timer = 0;
      if (visible && !document.hidden) setReady(true);
    };
    const schedule = () => {
      if (!visible || document.readyState !== "complete" || idle || timer) return;
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(start, { timeout: 2500 });
      else timer = window.setTimeout(start, 700);
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); });
    observer.observe(stage);
    window.addEventListener("load", schedule, { once: true });
    document.addEventListener("visibilitychange", schedule);
    return () => {
      observer.disconnect();
      window.removeEventListener("load", schedule);
      document.removeEventListener("visibilitychange", schedule);
      if (idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, [enabled]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let visible = true;
    const sync = () => {
      if (visible && !document.hidden) void video.play().catch(() => {});
      else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0.05 });
    observer.observe(video);
    document.addEventListener("visibilitychange", sync);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync); video.pause(); };
  }, [enabled, ready, theme]);

  return <div ref={stageRef} className={styles.stage} aria-hidden="true">{enabled && ready && <video key={theme} ref={videoRef} className={styles.film} src={`/brand/shah-arrival-${theme === "dark" ? "night" : "day"}-v1.mp4`} autoPlay loop muted playsInline preload="none" tabIndex={-1} onLoadedData={event => { event.currentTarget.dataset.ready = "true"; }} onError={event => { event.currentTarget.style.display = "none"; }} />}</div>;
}
