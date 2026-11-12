"use client";
import { useEffect, useRef, type ReactNode } from "react";
import workspace from "./Workspace.module.css";
let openDialogs = 0;
let savedBodyOverflow = "";
let savedHtmlOverflow = "";
/** Native modality keeps keyboard focus inside and restores the invoking control. */
export function WorkspaceDialog({ children, titleId, onClose }: { children: ReactNode; titleId: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (openDialogs++ === 0) {
      savedBodyOverflow = document.body.style.overflow;
      savedHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }
    dialog.showModal();
    return () => {
      dialog.close();
      if (--openDialogs === 0) {
        document.body.style.overflow = savedBodyOverflow;
        document.documentElement.style.overflow = savedHtmlOverflow;
      }
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={ref} className={workspace.dialog} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    {children}
  </dialog>;
}
