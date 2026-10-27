export function readStoredJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch { return fallback; }
}

export function writeStoredJSON(key: string, value: unknown): void {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private browsing or full storage. */ }
}

export function readStoredCart(key: string): Record<string, number> {
  const value = readStoredJSON<unknown>(key, {});
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, number> = {};
  for (const [id, quantity] of Object.entries(value)) {
    if (id.length > 150 || ["__proto__", "constructor", "prototype"].includes(id)) continue;
    if (typeof quantity === "number" && Number.isFinite(quantity) && Number.isInteger(quantity) && quantity > 0) {
      result[id] = Math.min(99, quantity);
    }
  }
  return result;
}

export function readSessionValue(key: string): string | null {
  try { return window.sessionStorage.getItem(key); } catch { return null; }
}
export function writeSessionValue(key: string, value: string): boolean {
  try { window.sessionStorage.setItem(key, value); return true; } catch { return false; }
}
export function removeSessionValue(key: string): void {
  try { window.sessionStorage.removeItem(key); } catch { /* Optional navigation hint. */ }
}
