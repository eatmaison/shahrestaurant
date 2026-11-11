"use client";

import { useEffect, type RefObject } from "react";
import { usePathname } from "next/navigation";
import type { PublicPageKey } from "./locale";

type SecondaryPage = Exclude<PublicPageKey, "home">;
const mountedPages = new Map<HTMLElement, { page: SecondaryPage; pathname: string }>();
export const CINEMATIC_PAGE_READY = "shah:cinematic-page-ready";

/** A root-layout effect must never annotate a streamed page before that page hydrates. */
export function useCinematicPageReady<T extends HTMLElement>(rootRef: RefObject<T | null>, page: SecondaryPage) {
  const pathname = usePathname();
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    mountedPages.set(root, { page, pathname });
    window.dispatchEvent(new Event(CINEMATIC_PAGE_READY));
    return () => {
      mountedPages.delete(root);
      window.dispatchEvent(new Event(CINEMATIC_PAGE_READY));
    };
  }, [rootRef, page, pathname]);
}

/** The registry also handles child effects firing before the root observer subscribes. */
export function getReadyCinematicRoot(container: HTMLElement, page: SecondaryPage, pathname: string): HTMLElement | null {
  for (const [root, mounted] of mountedPages) {
    if (mounted.page === page && mounted.pathname === pathname && root.isConnected && container.contains(root)) return root;
  }
  return null;
}
