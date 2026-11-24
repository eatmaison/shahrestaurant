// Interprets strictly scoped *visible* label strings after a verified DOM adapter
// identifies the dedicated fields. Never scan an entire page for prices or counts.
export function readArticleLabel(value) {
  if (typeof value !== 'string') return null;
  return /^Artikelnummer:\s*([0-9]{5,12})$/i.exec(value.trim())?.[1] ?? null;
}
export function readBeveragePackLabel(value) {
  if (typeof value !== 'string' || value.length > 160) return null;
  const pattern = /^(?:krat\s+|doos\s+|tray\s+)?(?:(\d{1,3})\s+multipacks?\s*x\s*)?(\d{1,3})\s+(?:fles(?:je)?s?|flessen|blikken|blikjes)\s*x\s*[0-9]+(?:[.,][0-9]+)?\s*(?:cl|ml|l)$/i;
  const match = pattern.exec(value.trim().replaceAll('×','x'));
  if (!match) return /^(?:fles|blik)\s*[1-9][0-9]*(?:[.,][0-9]+)?\s*(?:cl|ml|l)$/i.test(value.trim()) ? 1 : null;
  const units = +(match[1] ?? 1) * +match[2];
  return units >= 1 && units <= 10000 ? units : null;
}

const months = {jan:1,feb:2,mrt:3,apr:4,mei:5,jun:6,jul:7,aug:8,sep:9,okt:10,nov:11,dec:12};
function calendar(y,m,d) {
  const s = [y, String(m).padStart(2,'0'), String(d).padStart(2,'0')].join('-');
  const parsed = new Date(s+'T00:00:00Z');
  return !Number.isNaN(+parsed) && parsed.toISOString().slice(0,10) === s ? s : null;
}
function rangeDays(from,through) {
  return (Date.parse(through)-Date.parse(from))/86400000;
}
export function readPromoRange(value,today) {
  if (typeof value !== 'string' || !/^20\d\d-\d\d-\d\d$/.test(today)) return null;
  const m = /^Geldig van (\d{1,2}) ([a-z]{3})(?:\.? (20\d\d))? t\/m (\d{1,2}) ([a-z]{3})(?:\.? (20\d\d))?$/i.exec(value.trim());
  if (!m) return null;
  const [,fd,fm,fy,td,tm,ty] = m;
  const mf = months[fm.toLowerCase()], mt = months[tm.toLowerCase()];
  if (!mf || !mt || Boolean(fy) !== Boolean(ty)) return null;
  if (fy && ty) {
    const from=calendar(+fy,mf,+fd), through=calendar(+ty,mt,+td);
    return from && through && from <= through && rangeDays(from,through) <= 366 ? {from,through} : null;
  }
  // When the year is omitted, infer it only for a single calendar interval
  // containing today's Amsterdam date. Never guess an expired / future one.
  const year=Number(today.slice(0,4));
  const candidates=[];
  for (const y of [year-1,year,year+1]) {
    const from=calendar(y,mf,+fd), through=calendar(y+(mt<mf?1:0),mt,+td);
    if (from && through && from <= today && today <= through && rangeDays(from,through)<=180) candidates.push({from,through});
  }
  return candidates.length===1 ? candidates[0] : null;
}
const only = values => Array.isArray(values) && values.length===1 ? values[0] : null;
const priceAsDisplay = value => {
  if (typeof value !== 'string') return null;
  const m = /^(?:€\s*)?((?:0|[1-9]\d{0,5}|[1-9]\d{0,2}(?:\.\d{3}){1,2})\s*,\s*\d{2})$/.exec(value.trim());
  return m ? '€'+m[1].replace(/\s+/g,'') : null;
};
export function normalizeRenderedProduct(value,today) {
  if (value?.state !== 'rendered-product') return value;
  const sku=readArticleLabel(only(value.articleLabels)), units=readBeveragePackLabel(only(value.packLabels));
  const tax=only(value.taxLabels);
  const deposit=only(value.depositLabels);
  const ambiguous=()=>({state:'ambiguous-rendered-labels'});
  if (!sku || !units || tax !== 'Alle prijzen zijn in EUR en exclusief BTW'
      || !Array.isArray(value.depositLabels) || (value.depositLabels.length
        && (typeof deposit !== 'string' || !/^Emballage:\s*\d+,\d{2}$/i.test(deposit)))) return ambiguous();
  const base = {state:'authenticated-product',sku,units,currency:'EUR',priceUnit:'pack',vat:'excluded',deposit:'excluded'};
  const promoLists=[value.regularPromoLabels,value.currentPromoLabels,value.promoDateLabels];
  if (!promoLists.every(Array.isArray) || !Array.isArray(value.standaloneLabels)) return ambiguous();
  if (value.hasPromoLayout === false && promoLists.every(v=>v.length===0)) {
    const standalone=priceAsDisplay(only(value.standaloneLabels));
    return standalone ? {...base,standard:[standalone],promo:{state:'confirmed-none'}} : ambiguous();
  }
  if (value.hasPromoLayout !== true || value.standaloneLabels.length) return ambiguous();
  const standard=priceAsDisplay(only(value.regularPromoLabels));
  const current=priceAsDisplay(only(value.currentPromoLabels));
  const interval=readPromoRange(only(value.promoDateLabels),today);
  if (!standard || !current || !interval) return ambiguous();
  return {...base,standard:[standard],promo:{state:'present',prices:[current],...interval}};
}
