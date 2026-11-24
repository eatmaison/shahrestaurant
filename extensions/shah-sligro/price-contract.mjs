// Offline contract only. Input is a normalized observation, not production HTML.
const sku = value => typeof value === 'string' && /^[0-9]{5,12}$/.test(value);
const pack = value => Number.isSafeInteger(value) && value >= 1 && value <= 10000;
const cents = value => {
  if (typeof value !== 'string') return null;
  const groups = /^€[ \u00a0]?([1-9]\d{0,5}|0|[1-9]\d{0,2}(?:\.\d{3}){1,2}),(\d{2})$/.exec(value);
  if (!groups) return null;
  const amount = Number(groups[1].replaceAll('.', '')) * 100 + Number(groups[2]);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
};
const date = value => {
  if (typeof value !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(+parsed) && parsed.toISOString().slice(0, 10) === value;
};
const onePrice = values => Array.isArray(values) && values.length === 1 ? cents(values[0]) : null;
const stop = reason => ({ status: 'unchanged', reason });

export function previewPrice(expected, observed, amsterdamDate) {
  if (!sku(expected?.sku) || !pack(expected?.units) || !date(amsterdamDate)) return stop('invalid-request');
  if (observed?.state !== 'authenticated-product') return stop('unavailable');
  if (observed.sku !== expected.sku || observed.units !== expected.units) return stop('product-mismatch');
  if (observed.priceUnit !== 'pack' || observed.currency !== 'EUR'
      || observed.vat !== 'excluded' || observed.deposit !== 'excluded') return stop('ambiguous-price-basis');
  const standardCents = onePrice(observed.standard);
  if (standardCents === null) return stop('ambiguous-standard-price');
  if (observed.promo?.state === 'not-observed') return stop('ambiguous-promotion');
  const result = { status: 'preview', sku: expected.sku, units: expected.units, standardCents, promotion: null };
  // Distinguish explicit confirmation of no promotion from missing UI data.
  if (observed.promo?.state === 'confirmed-none' && Object.keys(observed.promo).length === 1) return result;
  if (observed.promo?.state !== 'present') return stop('ambiguous-promotion');
  const { from, through } = observed.promo;
  const promoCents = onePrice(observed.promo.prices);
  if (!date(from) || !date(through) || from > through || promoCents === null || promoCents >= standardCents) {
    return stop('invalid-promotion');
  }
  return {
    ...result,
    promotion: {
      cents: promoCents, from, through,
      active: from <= amsterdamDate && amsterdamDate <= through,
    },
  };
}
