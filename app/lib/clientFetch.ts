/** The deadline also covers JSON decoding, and cancellation survives until the body is read. */
export async function fetchJSON<T>(url: string, init: RequestInit = {}, timeoutMs = 15_000): Promise<{ response: Response; data: T }> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  const timer = setTimeout(cancel, timeoutMs);
  init.signal?.addEventListener("abort", cancel, { once: true });
  if (init.signal?.aborted) cancel();
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const data = await response.json() as T;
    return { response, data };
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener("abort", cancel);
  }
}
