"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { FaXmark } from "react-icons/fa6";
import styles from "../home.module.css";

export function HomeDialog({ children, titleId, closeLabel, onClose, onKeyDown }: {
  children: ReactNode;
  titleId: string;
  closeLabel: string;
  onClose: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDialogElement>) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      trigger?.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId}
      onCancel={onClose} onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        } else {
          onKeyDown?.(event);
        }
      }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={styles.dialogBody}>
        <button type="button" className={styles.dialogClose} onClick={onClose} aria-label={closeLabel} title={closeLabel} autoFocus>
          <FaXmark aria-hidden="true" />
        </button>
        {children}
      </div>
    </dialog>
  );
}