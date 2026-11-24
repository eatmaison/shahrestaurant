export const SHAH_ORIGIN = 'https://shahrestaurant.nl';
export const SLIGRO_ORIGIN = 'https://www.sligro.nl';
export const LOGIN = SLIGRO_ORIGIN + '/inloggen.html';
export const PORT = 'shah-sligro-preview-v1';
export const REQUEST = 'SLIGRO_PRICE_PREVIEW_REQUEST';
export const RESULT = 'SLIGRO_PRICE_PREVIEW_RESULT';
export const PROGRESS = 'SLIGRO_PRICE_PREVIEW_PROGRESS';
export const MAX = 50;
export function productSku(value) {
  if (typeof value !== 'string' || value.length > 320) return null;
  try {
    const u = new URL(value);
    if (u.origin !== SLIGRO_ORIGIN || u.username || u.password || u.search || u.hash) return null;
    const p = /^\/p\.([0-9]{5,12})\.html\/[a-z0-9-]+\.html$/.exec(u.pathname);
    return p?.[1] ?? null;
  } catch { return null; }
}
export function adminSender(sender) {
  if (sender?.frameId !== 0 || !Number.isSafeInteger(sender.tab?.id) ||
      (sender.origin !== undefined && sender.origin !== SHAH_ORIGIN)) return false;
  try {
    const u = new URL(sender.url);
    // Chrome may retain the initial document URL after a same-document route
    // transition. Allow that admin shell here; the extension's isolated bridge
    // independently requires current location to be exactly /admin/stock.
    return u.origin === SHAH_ORIGIN && /^\/admin(?:\/|$)/.test(u.pathname);
  } catch { return false; }
}
export function validateRequest(message) {
  if (message?.type !== REQUEST || typeof message.requestId !== 'string' || !/^[\w-]{8,80}$/.test(message.requestId)
      || !Array.isArray(message.products) || !message.products.length || message.products.length > MAX) return null;
  const seen = new Set();
  const products = [];
  const skipped = [];
  for (const p of message.products) {
    if (typeof p?.id !== 'string' || !/^[\w-]{1,120}$/.test(p.id) || seen.has(p.id)) return null;
    seen.add(p.id);
    const sku = productSku(p.url);
    if (!sku || !Number.isSafeInteger(p.packUnits) || p.packUnits < 1 || p.packUnits > 10000
      || typeof p.revision !== 'string' || !/^[0-9]{1,15}$/.test(p.revision)) {
      skipped.push({ id: p.id, reason: 'invalid-product-link-or-pack' }); continue;
    }
    products.push({ id: p.id, url: p.url, packUnits: p.packUnits, revision: p.revision, sku });
  }
  return { requestId: message.requestId, products, skipped };
}
