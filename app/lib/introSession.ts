// A per-tab presentation preference shared by the approved English/Dutch intros, never a cookie.
export const INTRO_SESSION_KEY = "shah:intro:desktop-v3-mobile-v2:1";
export const INTRO_CONSUMED_ATTRIBUTE = "data-shah-intro-consumed";
export const INTRO_ACTIVE_ATTRIBUTE = "data-shah-intro-active";
type IntroWindow = Window & { __shahIntroSeen?: boolean };

/** Claim once per mounted homepage, including when media preferences change. */
export function claimIntroEntry(): boolean {
  const current = window as IntroWindow;
  let seen = current.__shahIntroSeen === true;
  try { seen ||= sessionStorage.getItem(INTRO_SESSION_KEY) === "1"; } catch { /* In-memory fallback for this document. */ }
  current.__shahIntroSeen = true;
  try { sessionStorage.setItem(INTRO_SESSION_KEY, "1"); } catch { /* Storage may be disabled. */ }
  return seen;
}

export function markIntroConsumed(): void {
  document.documentElement.setAttribute(INTRO_CONSUMED_ATTRIBUTE, "true");
}

/** Keep this decision identical to the head bootstrap, including data saving. */
export function prepareIntroPresentation(): void {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (!window.location.hash && window.matchMedia("(prefers-reduced-motion: no-preference)").matches && !connection?.saveData && !/^(slow-)?2g$/.test(connection?.effectiveType ?? "")) {
    document.documentElement.setAttribute(INTRO_ACTIVE_ATTRIBUTE, "true");
  }
}

// Establish the overlay before body paint, so dismissal never removes layout space.
export const INTRO_RETURN_CSS = `html[${INTRO_ACTIVE_ATTRIBUTE}="true"] [data-cinematic-home] [data-film-track]{position:fixed;inset:0;z-index:40;height:100svh;pointer-events:auto}html[${INTRO_CONSUMED_ATTRIBUTE}="true"] [data-cinematic-home] [data-film-track]{display:none!important}`;
export function introSessionBootstrap(): string {
  return `(function(){var s=false;try{s=sessionStorage.getItem(${JSON.stringify(INTRO_SESSION_KEY)})==="1";}catch(e){}if(s||location.hash){if(s)window.__shahIntroSeen=true;document.documentElement.setAttribute(${JSON.stringify(INTRO_CONSUMED_ATTRIBUTE)},"true");}else{var c=navigator.connection;if(matchMedia("(prefers-reduced-motion: no-preference)").matches&&!(c&&c.saveData)&&!/^(slow-)?2g$/.test(c&&c.effectiveType||""))document.documentElement.setAttribute(${JSON.stringify(INTRO_ACTIVE_ATTRIBUTE)},"true");}})();`;
}

/** Invalid/streaming durations must never trigger the closing-second handoff. */
export function isClosingSecond(currentTime: number, duration: number): boolean {
  return Number.isFinite(currentTime) && Number.isFinite(duration) && duration > 1 && currentTime >= duration - 1;
}
