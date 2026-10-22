/** Stable across reloads and network retries; it contains no customer details. */
export async function checkoutRequestKey(body: unknown): Promise<string> {
  const input = new TextEncoder().encode(JSON.stringify(body));
  const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", input)))
    .map(byte => byte.toString(16).padStart(2, "0")).join("");
  const storageKey = `etg.checkout.${fingerprint}`;
  try {
    const previous = sessionStorage.getItem(storageKey);
    if (previous) return previous;
  } catch { /* Storage may be disabled; the in-memory fallback still protects retries. */ }
  const key = attempts.get(fingerprint) ?? crypto.randomUUID();
  attempts.set(fingerprint, key);
  try { sessionStorage.setItem(storageKey, key); } catch { /* Optional persistence. */ }
  return key;
}

const attempts = new Map<string, string>();

export async function clearCheckoutRequest(body: unknown): Promise<void> {
  const input = new TextEncoder().encode(JSON.stringify(body));
  const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", input)))
    .map(byte => byte.toString(16).padStart(2, "0")).join("");
  attempts.delete(fingerprint);
  try { sessionStorage.removeItem(`etg.checkout.${fingerprint}`); } catch { /* Optional persistence. */ }
}
