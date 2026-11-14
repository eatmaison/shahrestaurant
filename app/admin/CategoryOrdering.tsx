"use client";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { FaArrowDown, FaArrowUp, FaGripVertical } from "react-icons/fa6";
import type { BrandCategory } from "../lib/types";
import styles from "./CategoryOrdering.module.css";

type Placement = "before" | "after";
type Target = { name: string; placement: Placement };
type Drag = { name: string; pointerId: number; startX: number; startY: number; x: number; y: number; active: boolean; target?: Target };

export function CategoryOrdering({ categories, busy, nl, onMove, renderCategory }: {
  categories: BrandCategory[]; busy: boolean; nl: boolean;
  onMove: (name: string, targetName: string, placement: Placement) => Promise<boolean>;
  renderCategory: (category: BrandCategory) => ReactNode;
}) {
  const root = useRef<HTMLOListElement>(null), drag = useRef<Drag | null>(null), frame = useRef<number | null>(null), saving = useRef(false);
  const [dragging, setDragging] = useState<string>(), [target, setTarget] = useState<Target>(), [message, setMessage] = useState("");
  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);

  const clear = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null; drag.current = null; setDragging(undefined); setTarget(undefined);
  };
  const move = async (name: string, destination: Target, focus?: HTMLButtonElement) => {
    if (busy || saving.current || name === destination.name) return;
    saving.current = true;
    setMessage(nl ? "Volgorde opslaan…" : "Saving category order…");
    try {
      const ok = await onMove(name, destination.name, destination.placement);
      setMessage(ok ? (nl ? `${name}: volgorde opgeslagen voor het bestelmenu.` : `${name}: category order saved for the ordering menu.`) : (nl ? "Volgorde niet opgeslagen. Controleer de melding en probeer opnieuw." : "Order not saved. Check the message and try again."));
    } finally {
      saving.current = false;
      requestAnimationFrame(() => {
        if (focus?.isConnected && !focus.disabled) focus.focus({ preventScroll: true });
        else root.current?.querySelector<HTMLButtonElement>(`[data-sort-handle="${CSS.escape(name)}"]`)?.focus({ preventScroll: true });
      });
    }
  };
  const findTarget = () => {
    const current = drag.current;
    if (!current?.active || !root.current) return;
    const row = document.elementFromPoint(current.x, current.y)?.closest<HTMLElement>("[data-sort-category]");
    if (!row || !root.current.contains(row) || row.dataset.sortCategory === current.name) {
      current.target = undefined;
      setTarget(previous => previous === undefined ? previous : undefined);
      return;
    }
    const bounds = row.getBoundingClientRect();
    const next: Target = { name: row.dataset.sortCategory!, placement: current.y < bounds.top + bounds.height / 2 ? "before" : "after" };
    current.target = next;
    setTarget(previous => previous?.name === next.name && previous.placement === next.placement ? previous : next);
  };
  const scrollWhileDragging = () => {
    const current = drag.current;
    if (!current?.active) return;
    const scroller = root.current?.closest<HTMLElement>("[data-category-scroll]");
    if (scroller) {
      const bounds = scroller.getBoundingClientRect();
      const distance = current.y < bounds.top + 45 ? -10 : current.y > bounds.bottom - 45 ? 10 : 0;
      if (distance) scroller.scrollTop += distance;
    }
    findTarget(); frame.current = requestAnimationFrame(scrollWhileDragging);
  };
  const start = (event: PointerEvent<HTMLButtonElement>, name: string) => {
    if (busy || saving.current || !event.isPrimary || event.button !== 0) return;
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { name, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, active: false };
  };
  const travel = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    current.x = event.clientX; current.y = event.clientY;
    if (!current.active && Math.hypot(current.x - current.startX, current.y - current.startY) >= 6) {
      current.active = true; setDragging(current.name); scrollWhileDragging();
    }
    if (current.active) { event.preventDefault(); findTarget(); }
  };
  const finish = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const focus = event.currentTarget;
    clear();
    if (focus.hasPointerCapture(event.pointerId)) focus.releasePointerCapture(event.pointerId);
    if (current.active && current.target) void move(current.name, current.target, focus);
  };

  return <div>
    <p className={styles.instructions}>{nl ? "Sleep aan de handgreep of gebruik de pijlen. De volgorde wordt automatisch opgeslagen en gebruikt in het bestelmenu. Esc annuleert het slepen." : "Drag the grip or use the arrows. Changes save automatically and set the category order in the ordering menu. Escape cancels dragging."}</p>
    <ol ref={root} className={styles.list} aria-label={nl ? "Categorievolgorde" : "Category order"} aria-busy={busy}>
      {categories.map((category, index) => <li key={category.name} className={styles.item} data-sort-category={category.name} data-dragging={dragging === category.name} data-drop={target?.name === category.name ? target.placement : undefined}>
        <button type="button" className={styles.handle} data-sort-handle={category.name} disabled={busy || categories.length < 2} aria-label={`${nl ? "Versleep categorie" : "Drag category"}: ${category.name}`} title={nl ? "Sleep om te verplaatsen" : "Drag to move"} onPointerDown={event => start(event, category.name)} onPointerMove={travel} onPointerUp={finish} onPointerCancel={clear} onLostPointerCapture={() => { if (drag.current) clear(); }} onKeyDown={event => { if (event.key === "Escape" && drag.current) { event.preventDefault(); clear(); } }}>
          <FaGripVertical aria-hidden="true" /><small aria-hidden="true">{index + 1}</small>
        </button>
        <div className={styles.content}>{renderCategory(category)}</div>
        <div className={styles.arrows}>
          <button type="button" disabled={busy || index === 0} aria-label={`${nl ? "Omhoog" : "Move up"}: ${category.name}`} onClick={event => void move(category.name, { name: categories[index - 1].name, placement: "before" }, event.currentTarget)}><FaArrowUp aria-hidden="true" /></button>
          <button type="button" disabled={busy || index === categories.length - 1} aria-label={`${nl ? "Omlaag" : "Move down"}: ${category.name}`} onClick={event => void move(category.name, { name: categories[index + 1].name, placement: "after" }, event.currentTarget)}><FaArrowDown aria-hidden="true" /></button>
        </div>
      </li>)}
    </ol>
    <p className={styles.status} role="status" aria-live="polite">{message}</p>
  </div>;
}
