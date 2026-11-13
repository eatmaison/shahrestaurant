"use client";
import { createContext, useCallback, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "../providers";
type Drafts = Record<string, unknown>;
const cache = new Map<string, Drafts>();
if (typeof window !== "undefined") {
  window.addEventListener("shah:admin-session-reset", () => cache.clear());
  window.addEventListener("beforeunload", event => { if ([...cache.values()].some(value => draftIsDirty(value))) { event.preventDefault(); event.returnValue = ""; } });
}
function draftIsDirty(drafts: Drafts) { const gallery = drafts.gallery as { image?: string; alt?: string; altNl?: string; category?: string; portrait?: boolean } | undefined; return Boolean(gallery && (gallery.image || gallery.alt || gallery.altNl || gallery.portrait || gallery.category && gallery.category !== "ambiance")) || Boolean(drafts.event && JSON.stringify(drafts.event) !== drafts.eventBaseline); }
const Context = createContext<{ drafts: Drafts; setDrafts: Dispatch<SetStateAction<Drafts>>; dirty: boolean } | null>(null);
export function AdminDraftProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const [drafts, setDrafts] = useState<Drafts>(() => cache.get(userId) || {}), { lang } = useLang(), router = useRouter();
  const dirty = draftIsDirty(drafts);
  useEffect(() => { cache.set(userId, drafts); }, [userId, drafts]);
  useEffect(() => { const reset = () => { cache.clear(); setDrafts({}); }; window.addEventListener("shah:admin-session-reset", reset); return () => window.removeEventListener("shah:admin-session-reset", reset); }, []);
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const clicked = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      if (!["http:", "https:"].includes(url.protocol) || url.origin === location.origin && url.pathname === location.pathname && url.search === location.search) return;
      event.preventDefault(); event.stopPropagation();
      if (window.confirm(lang === "nl" ? "Er is een niet-opgeslagen concept. Verlaat deze pagina? Binnen het beheer blijft het concept in dit tabblad bewaard." : "There is an unsaved draft. Leave this page? Within admin, the draft remains in this browser tab.")) {
        if (url.origin === location.origin) router.push(url.pathname + url.search + url.hash); else location.assign(url.href);
      }
    };
    window.addEventListener("beforeunload", unload); document.addEventListener("click", clicked, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", clicked, true); };
  }, [dirty, lang, router]);
  return <Context.Provider value={{ drafts, setDrafts, dirty }}>{children}</Context.Provider>;
}
export function useAdminDraft<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const context = useContext(Context), [fallback] = useState(initial);
  if (!context) throw new Error("Admin draft context is required");
  const { drafts, setDrafts } = context;
  const set = useCallback<Dispatch<SetStateAction<T>>>(next => setDrafts(previous => { const current = Object.hasOwn(previous, key) ? previous[key] as T : fallback; return { ...previous, [key]: typeof next === "function" ? (next as (value: T) => T)(current) : next }; }), [setDrafts, key, fallback]);
  return [Object.hasOwn(drafts, key) ? drafts[key] as T : fallback, set];
}
export function useUnsavedAdminDraft() { return useContext(Context)?.dirty ?? false; }
