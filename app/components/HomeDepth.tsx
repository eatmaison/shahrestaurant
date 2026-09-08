"use client";

import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import styles from "../home.module.css";

const MOTION_KEY = "shah-home-motion";
const MOTION_EVENT = "shah-motion-change";

function subscribeMotion(listener: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", listener);
  window.addEventListener("storage", listener);
  window.addEventListener(MOTION_EVENT, listener);
  return () => {
    query.removeEventListener("change", listener);
    window.removeEventListener("storage", listener);
    window.removeEventListener(MOTION_EVENT, listener);
  };
}

let motionPreference = "on";

function motionSnapshot() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "reduced";
  try {
    const stored = window.localStorage.getItem(MOTION_KEY);
    return stored === "on" || stored === "off" ? stored : motionPreference;
  }
  catch { return motionPreference; }
}

export function useHomeMotion() {
  const mode = useSyncExternalStore(subscribeMotion, motionSnapshot, () => "off");
  function toggleMotion() {
    motionPreference = mode === "on" ? "off" : "on";
    try { window.localStorage.setItem(MOTION_KEY, motionPreference); } catch {}
    window.dispatchEvent(new Event(MOTION_EVENT));
  }
  return { enabled: mode === "on", reduced: mode === "reduced", toggleMotion };
}

export function HomeDepth({ enabled, rootRef }: { enabled: boolean; rootRef: RefObject<HTMLDivElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    const hero = canvas?.parentElement;
    const image = hero?.querySelector<HTMLImageElement>("img");
    if (!enabled || !canvas || !root || !hero || !image) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) return;
    let disposed = false;
    let cleanupScene = () => {};

    async function createScene() {
      try {
        await image!.decode();
        if (disposed) return;
        const THREE = await import("three");
        if (disposed) return;
        const renderer = new THREE.WebGLRenderer({ canvas: canvas!, alpha: true, antialias: false, powerPreference: "low-power" });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 30);
        camera.position.z = 6;
        const textureSource = document.createElement("canvas");
        const textureScale = Math.min(1, Math.min(2048, renderer.capabilities.maxTextureSize) / Math.max(image!.naturalWidth, image!.naturalHeight));
        textureSource.width = Math.max(1, Math.round(image!.naturalWidth * textureScale));
        textureSource.height = Math.max(1, Math.round(image!.naturalHeight * textureScale));
        const textureContext = textureSource.getContext("2d");
        if (!textureContext) { renderer.dispose(); return; }
        textureContext.drawImage(image!, 0, 0, textureSource.width, textureSource.height);
        const texture = new THREE.CanvasTexture(textureSource);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        const geometry = new THREE.PlaneGeometry(1, 1, 24, 16);
        const positions = geometry.attributes.position;
        for (let index = 0; index < positions.count; index++) {
          const horizontal = positions.getX(index);
          const vertical = positions.getY(index);
          positions.setZ(index, -horizontal * horizontal * 0.48 - vertical * vertical * 0.18);
        }
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const photo = new THREE.Mesh(geometry, material);
        scene.add(photo);
        let frame = 0;
        let visible = false;
        let targetHorizontal = 0;
        let targetVertical = 0;
        let targetScroll = 0;
        let currentHorizontal = 0;
        let currentVertical = 0;
        let currentScroll = 0;
        let verified = false;
        let bounds = hero!.getBoundingClientRect();

        const resize = () => {
          bounds = hero!.getBoundingClientRect();
          const width = Math.max(bounds.width, 1);
          const height = Math.max(bounds.height, 1);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 701 ? 1 : 1.5));
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(21)) * camera.position.z;
          const viewWidth = viewHeight * camera.aspect;
          const imageAspect = image!.naturalWidth / image!.naturalHeight;
          const photoHeight = Math.max(viewHeight, viewWidth / imageAspect) * 1.12;
          photo.scale.set(photoHeight * imageAspect, photoHeight, 1);
          render();
        };
        const render = () => {
          frame = 0;
          if (disposed || !visible || document.hidden) return;
          currentHorizontal += (targetHorizontal - currentHorizontal) * 0.065;
          currentVertical += (targetVertical - currentVertical) * 0.065;
          currentScroll += (targetScroll - currentScroll) * 0.065;
          camera.position.x = currentHorizontal * 0.19;
          camera.position.y = -currentVertical * 0.12 - currentScroll * 0.15;
          camera.lookAt(0, 0, 0);
          photo.rotation.y = currentHorizontal * 0.038;
          photo.rotation.x = currentVertical * 0.026;
          photo.position.x = currentHorizontal * 0.08;
          photo.position.y = -currentVertical * 0.04 + currentScroll * 0.1;
          hero!.style.setProperty("--hero-shift-x", `${-currentHorizontal * 7}px`);
          hero!.style.setProperty("--hero-shift-y", `${currentVertical * 5}px`);
          hero!.style.setProperty("--hero-scroll", `${currentScroll * 18}px`);
          renderer.render(scene, camera);
          if (!verified && renderer.getContext().getError() !== renderer.getContext().NO_ERROR) {
            canvas!.dataset.ready = "false";
            visible = false;
            return;
          }
          verified = true;
          canvas!.dataset.ready = "true";
          if (Math.abs(targetHorizontal - currentHorizontal) + Math.abs(targetVertical - currentVertical) + Math.abs(targetScroll - currentScroll) > 0.001) {
            frame = requestAnimationFrame(render);
          }
        };
        const schedule = () => { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render); };
        const pointerMove = (event: PointerEvent) => {
          if (event.pointerType !== "mouse") return;
          targetHorizontal = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
          targetVertical = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
          schedule();
        };
        const pointerLeave = () => { targetHorizontal = 0; targetVertical = 0; schedule(); };
        const scroll = () => {
          if (!visible) return;
          bounds = hero!.getBoundingClientRect();
          targetScroll = Math.max(0, Math.min(1, -bounds.top / Math.max(bounds.height, 1)));
          schedule();
        };
        const visibility = () => {
          if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
          else schedule();
        };
        const observer = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible) scroll();
          else { cancelAnimationFrame(frame); frame = 0; }
        });
        const resizeObserver = new ResizeObserver(() => { cancelAnimationFrame(frame); resize(); });
        const resetDepth = () => {
          hero!.style.removeProperty("--hero-shift-x");
          hero!.style.removeProperty("--hero-shift-y");
          hero!.style.removeProperty("--hero-scroll");
        };
        const contextLost = (event: Event) => { event.preventDefault(); canvas!.dataset.ready = "false"; cancelAnimationFrame(frame); frame = 0; visible = false; resetDepth(); };
        observer.observe(hero!);
        resizeObserver.observe(hero!);
        hero!.addEventListener("pointermove", pointerMove, { passive: true });
        hero!.addEventListener("pointerleave", pointerLeave);
        window.addEventListener("scroll", scroll, { passive: true });
        document.addEventListener("visibilitychange", visibility);
        canvas!.addEventListener("webglcontextlost", contextLost);
        cleanupScene = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          resizeObserver.disconnect();
          hero!.removeEventListener("pointermove", pointerMove);
          hero!.removeEventListener("pointerleave", pointerLeave);
          window.removeEventListener("scroll", scroll);
          document.removeEventListener("visibilitychange", visibility);
          canvas!.removeEventListener("webglcontextlost", contextLost);
          geometry.dispose();
          material.dispose();
          texture.dispose();
          renderer.dispose();
          if (!renderer.getContext().isContextLost()) renderer.forceContextLoss();
          canvas!.dataset.ready = "false";
          resetDepth();
        };
        resize();
      } catch {
        cleanupScene();
      }
    }

    const startObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      startObserver.disconnect();
      void createScene();
    });
    startObserver.observe(hero);
    return () => { disposed = true; startObserver.disconnect(); cleanupScene(); };
  }, [enabled, rootRef]);

  return <canvas key={enabled ? "on" : "off"} ref={canvasRef} className={styles.depthCanvas} aria-hidden="true" />;
}

export function useHomeTilt(rootRef: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let frame = 0;
    let active: HTMLElement | null = null;
    let pointerHorizontal = 0;
    let pointerVertical = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      active?.style.removeProperty("--tilt-x");
      active?.style.removeProperty("--tilt-y");
      active?.style.removeProperty("--light-x");
      active?.style.removeProperty("--light-y");
      active = null;
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-tilt]") : null;
      if (target !== active) { reset(); active = target; }
      if (!active) return;
      pointerHorizontal = event.clientX;
      pointerVertical = event.clientY;
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0;
        if (!active) return;
        const bounds = active.getBoundingClientRect();
        const horizontal = Math.max(-0.5, Math.min(0.5, (pointerHorizontal - bounds.left) / Math.max(bounds.width, 1) - 0.5));
        const vertical = Math.max(-0.5, Math.min(0.5, (pointerVertical - bounds.top) / Math.max(bounds.height, 1) - 0.5));
        active.style.setProperty("--tilt-x", `${-vertical * 8}deg`);
        active.style.setProperty("--tilt-y", `${horizontal * 10}deg`);
        active.style.setProperty("--light-x", `${(horizontal + 0.5) * 100}%`);
        active.style.setProperty("--light-y", `${(vertical + 0.5) * 100}%`);
      });
    };
    root.addEventListener("pointermove", move, { passive: true });
    root.addEventListener("pointerleave", reset);
    window.addEventListener("blur", reset);
    window.addEventListener("scroll", reset, { passive: true });
    return () => {
      reset();
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", reset);
      window.removeEventListener("blur", reset);
      window.removeEventListener("scroll", reset);
    };
  }, [enabled, rootRef]);
}