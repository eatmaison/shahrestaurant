/** Optional, consented observations. No raw referrer URLs, IPs or user agents are stored. */
export type VisitorSource = {
  kind: "campaign" | "search" | "social" | "referral" | "unknown";
  label: string; referrerHost?: string; campaign?: string; medium?: string;
};
export type VisitorObservation = {
  source: VisitorSource;
  classification: "possible-automation" | "interaction-reported" | "unknown";
  reasons: string[];
  firstObservedAt: number; lastObservedAt: number;
  lastPath: string;
};
export type VisitorTelemetryStatus = "available" | "not-configured" | "unavailable";

export const VISIT_ANALYTICS_COOKIE = "shah_visit_analytics_v1";
export const VISIT_ANALYTICS_CHANGE = "shah:visit-analytics-change";
export const PRIVACY_PREFERENCES_EVENT = "shah:privacy-preferences";
export const OBSERVATION_RETENTION_DAYS = 30;
export const ANALYTICS_MAX_AGE = 60 * 60 * 24 * 180;

const paths = new Set(["/", "/en", "/menukaart", "/en/menu", "/reserveren", "/en/reservations",
  ...["/events", "/events/about", "/events/birthdays", "/events/celebrations", "/events/company-catering", "/events/company-lunches", "/events/gallery"].flatMap(path => [path, "/en" + path])]);
export function observedPublicPath(value: unknown): string | undefined {
  return typeof value === "string" && paths.has(value) ? value : undefined;
}
const slug = (value: unknown) => typeof value === "string" && /^[a-z][a-z0-9_-]{0,63}$/i.test(value.trim()) ? value.trim().toLowerCase() : undefined;
const within = (host: string, domain: string) => host === domain || host.endsWith("." + domain);

/** Referrer host is descriptive and may be spoofed; paths, query strings and credentials are discarded. */
export function normalizeVisitorSource(input: unknown): VisitorSource {
  const raw = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const source = slug(raw.source), medium = slug(raw.medium), campaign = slug(raw.campaign);
  let referrerHost: string | undefined;
  if (typeof raw.referrerHost === "string" && raw.referrerHost.length <= 253 && /^[a-z0-9.-]+$/i.test(raw.referrerHost)) {
    const host = raw.referrerHost.toLowerCase().replace(/\.$/, "");
    if (!within(host, "shahrestaurant.nl") && !["localhost", "127.0.0.1"].includes(host) && host.includes(".") && !/^[\d.]+$/.test(host)) referrerHost = host;
  }
  if (source) return { kind: "campaign", label: source, ...(medium ? { medium } : {}), ...(campaign ? { campaign } : {}), ...(referrerHost ? { referrerHost } : {}) };
  if (referrerHost) {
    const search = [["google.com", "Google"], ["google.nl", "Google"], ["google.co.uk", "Google"], ["bing.com", "Bing"], ["duckduckgo.com", "DuckDuckGo"], ["search.yahoo.com", "Yahoo"]].find(([domain]) => within(referrerHost!, domain));
    if (search) return { kind: "search", label: search[1], referrerHost };
    const social = [["facebook.com", "Facebook"], ["instagram.com", "Instagram"], ["linkedin.com", "LinkedIn"], ["t.co", "X"], ["x.com", "X"], ["tiktok.com", "TikTok"]].find(([domain]) => within(referrerHost!, domain));
    return { kind: social ? "social" : "referral", label: social?.[1] || referrerHost, referrerHost };
  }
  return { kind: "unknown", label: "Direct / unavailable", ...(campaign ? { campaign } : {}), ...(medium ? { medium } : {}) };
}

/** Signals describe possible automation; a browser claim is never proof of a human. */
export function classifyVisitorAgent(userAgent: string, webdriver: boolean, interaction: boolean) {
  const ua = userAgent.slice(0, 512), reasons: string[] = [];
  if (/googlebot|bingbot|duckduckbot|yandexbot|baiduspider|applebot|facebookexternalhit|twitterbot|linkedinbot|slurp|crawler|spider/i.test(ua)) reasons.push("crawler-user-agent");
  if (/headlesschrome|playwright|puppeteer|selenium|python-requests|curl\/|wget\//i.test(ua)) reasons.push("automation-user-agent");
  if (webdriver) reasons.push("browser-automation-reported");
  if (reasons.length) return { classification: "possible-automation" as const, reasons };
  if (interaction) return { classification: "interaction-reported" as const, reasons: ["browser-interaction-reported"] };
  return { classification: "unknown" as const, reasons: [] };
}

export function readVisitAnalyticsChoice(): "allowed" | "denied" | undefined {
  if (typeof document === "undefined") return;
  try {
    const value = document.cookie.split(";").map(item => item.trim()).find(item => item.startsWith(VISIT_ANALYTICS_COOKIE + "="))?.split("=")[1];
    return value === "allowed" || value === "denied" ? value : undefined;
  } catch { return; }
}
