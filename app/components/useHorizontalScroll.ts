"use client";
import { useEffect, useRef } from "react";

/** Native touch scrolling, plus local mouse/wheel and keyboard controls for a clipped row. */
export function useHorizontalScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const row = ref.current;
    if (!row) return;
    let drag: { id: number; x: number; y: number; left: number; moved: boolean } | undefined;
    let suppressClick = false, resetClick: ReturnType<typeof setTimeout> | undefined;
    const down = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0 || row.scrollWidth <= row.clientWidth) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: row.scrollLeft, moved: false };
    };
    const move = (event: PointerEvent) => {
      if (!drag || drag.id !== event.pointerId) return;
      if ((event.buttons & 1) === 0) { drag = undefined; delete row.dataset.dragScroll; return; }
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (!drag.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
        drag.moved = true;
        row.setPointerCapture(event.pointerId);
        row.dataset.dragScroll = "true";
      }
      if (drag.moved) { event.preventDefault(); row.scrollLeft = drag.left - dx; }
    };
    const end = () => {
      if (drag?.moved) {
        suppressClick = true;
        clearTimeout(resetClick);
        resetClick = setTimeout(() => { suppressClick = false; }, 0);
      }
      drag = undefined; delete row.dataset.dragScroll;
    };
    const click = (event: MouseEvent) => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; } };
    const leave = () => { if (drag && !drag.moved) drag = undefined; };
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || row.scrollWidth <= row.clientWidth) return;
      const amount = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const delta = amount * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? row.clientWidth : 1);
      if (!delta || delta < 0 && row.scrollLeft <= 0 || delta > 0 && row.scrollLeft >= row.scrollWidth - row.clientWidth - 1) return;
      event.preventDefault(); row.scrollLeft += delta;
    };
    const key = (event: KeyboardEvent) => {
      // Radio inputs keep their native arrow-key selection behavior.
      if (event.target !== row || row.scrollWidth <= row.clientWidth) return;
      const step = Math.max(80, row.clientWidth * .7);
      if (event.key === "ArrowLeft" || event.key === "PageUp") row.scrollLeft -= step;
      else if (event.key === "ArrowRight" || event.key === "PageDown") row.scrollLeft += step;
      else if (event.key === "Home") row.scrollLeft = 0;
      else if (event.key === "End") row.scrollLeft = row.scrollWidth;
      else return;
      event.preventDefault();
    };
    const reveal = (event: Event) => {
      const label = event.target instanceof Element ? event.target.closest("label") : null;
      if (label && row.contains(label)) label.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    };
    row.addEventListener("pointerdown", down); row.addEventListener("pointermove", move);
    row.addEventListener("pointerleave", leave);
    row.addEventListener("pointerup", end); row.addEventListener("pointercancel", end); row.addEventListener("lostpointercapture", end);
    row.addEventListener("click", click, true); row.addEventListener("wheel", wheel, { passive: false }); row.addEventListener("keydown", key);
    row.addEventListener("focusin", reveal); row.addEventListener("change", reveal);
    return () => {
      clearTimeout(resetClick);
      row.removeEventListener("pointerdown", down); row.removeEventListener("pointermove", move);
      row.removeEventListener("pointerleave", leave);
      row.removeEventListener("pointerup", end); row.removeEventListener("pointercancel", end); row.removeEventListener("lostpointercapture", end);
      row.removeEventListener("click", click, true); row.removeEventListener("wheel", wheel); row.removeEventListener("keydown", key);
      row.removeEventListener("focusin", reveal); row.removeEventListener("change", reveal);
    };
  }, []);
  return ref;
}
