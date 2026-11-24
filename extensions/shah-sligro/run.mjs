import {LOGIN, productSku, RESULT, PROGRESS} from './protocol.mjs';
import {previewPrice} from './price-contract.mjs';
import {normalizeRenderedProduct} from './visible-labels.mjs';

// Selectors were derived from the approved rendered promo page. Unverified price formats are skipped.
export const verifiedDomAdapter = true;
const after = (ms, signal) => new Promise(resolve => {
  if (signal.aborted) { resolve(); return; }
  let timer;
  const end = () => {
    clearTimeout(timer);
    signal.removeEventListener('abort', end);
    resolve();
  };
  timer = setTimeout(end, ms);
  signal.addEventListener('abort', end, {once:true});
});
const amsterdamDate = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Amsterdam', year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts();
  const get = t => parts.find(p=>p.type === t)?.value;
  return [get('year'), get('month'), get('day')].join('-');
};
const defaults = { adapterReady: verifiedDomAdapter, now: Date.now, today: amsterdamDate, sleep: after };
const official = value => {
  if (typeof value !== 'string') return false;
  try { return new URL(value).origin === new URL(LOGIN).origin; }
  catch { return false; }
};
async function readProduct(chrome, tabId, p, signal, deps, navigate = true) {
  if (signal.aborted) return {state:'aborted'};
  // tabs.update() can resolve before Chrome has replaced the old committed
  // document. Its URL might be unavailable without the broad tabs permission.
  const previous = navigate ? (await chrome.tabs.get(tabId)).url : undefined;
  if (signal.aborted) return {state:'aborted'};
  if (navigate) await chrome.tabs.update(tabId,{url:p.url});
  const started = deps.now();
  const until = started + 10000;
  while (!signal.aborted && deps.now() < until) {
    const tab = await chrome.tabs.get(tabId);
    if (signal.aborted) return {state:'aborted'};
    if (tab.pendingUrl && !official(tab.pendingUrl)) return {state:'blocked'};
    const transitional = navigate && deps.now() - started < 1750 &&
      (!tab.url || tab.url === 'about:blank' || (tab.url === previous && tab.url !== p.url));
    if (transitional || tab.pendingUrl || tab.status !== 'complete') { await deps.sleep(350, signal); continue; }
    if (!official(tab.url)) return {state:'blocked'};
    if (new URL(tab.url).pathname === new URL(LOGIN).pathname) return {state:'logged-out'};
    if (productSku(tab.url) !== p.sku) return {state:'unavailable'};
    // Inject only in the official tab's main frame, never on authentication pages.
    const [response] = await chrome.scripting.executeScript({
      target: {tabId, frameIds:[0]},
      files: ['sligro-dom.js']
    });
    if (response?.result && response.result.state !== 'loading') return response.result;
    await deps.sleep(350, signal);
  }
  return {state:'blocked'};
}
async function login(chrome, tabId, p, signal, deps) {
  const path = new URL(p.url).pathname;
  const signIn = new URL(LOGIN);
  signIn.searchParams.set('target', path);
  await chrome.tabs.update(tabId,{url:signIn.href, active:true});
  const until = deps.now() + 180000;
  let seenLogin = false;
  while (!signal.aborted && deps.now() < until) {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === 'complete' && official(tab.url)) {
      const onLogin = new URL(tab.url).pathname === new URL(LOGIN).pathname;
      seenLogin ||= onLogin;
      // Never read authentication form or other auth DOM. A possible successful sign-in
      // only permits one product reload; product DOM independently establishes availability.
      if (seenLogin && !onLogin && new URL(tab.url).pathname === path && productSku(tab.url) === p.sku) return true;
    }
    await deps.sleep(1000,signal);
  }
  return false;
}
export async function runPreview(req, chrome, emit, signal, overrides={}) {
  const deps = {...defaults,...overrides};
  const results = [];
  const skipped = [...req.skipped];
  let state = 'reading', completed = skipped.length, tab;
  const total = req.products.length + skipped.length;
  const post = (type, data) => { if (!signal.aborted) emit({type, requestId:req.requestId, ...data}); };
  const report = () => post(PROGRESS,{state,completed,total});
  const finish = () => post(RESULT,{results,skipped});
  const skipRest = (i,reason) => req.products.slice(i).forEach(p=>skipped.push({id:p.id,reason}));
  report();
  if (!deps.adapterReady || !req.products.length) {
    skipRest(0,'adapter-unverified');
    finish(); return;
  }

  const progress = setInterval(report, 10000);
  try {
    tab = await chrome.tabs.create({active:false,url:'about:blank'});
    const deadline = deps.now() + 480000;
    let attemptedLogin = false;
    for (let i=0; i<req.products.length && !signal.aborted; i++) {
      if (deps.now() >= deadline) { skipRest(i, 'time-limit'); break; }
      const p = req.products[i];
      const observation = (navigate = true) => readProduct(chrome,tab.id,p,signal,deps,navigate);
      let obs = await observation();
      if (obs?.state === 'logged-out') {
        if (attemptedLogin) { skipRest(i,'login-needed'); break; }
        attemptedLogin = true;
        state = 'waiting-login';
        report();
        if (!await login(chrome,tab.id,p,signal,deps)) { skipRest(i,'login-needed'); break; }
        state = 'reading';
        report();
        obs = await observation(false);
        if (obs?.state === 'logged-out') { skipRest(i,'login-needed'); break; }
      }
      if (obs?.state === 'blocked') { skipRest(i,'supplier-blocked'); break; }
      const day = deps.today();
      if (obs?.state === 'rendered-product') obs = normalizeRenderedProduct(obs,day);
      const row = previewPrice({sku:p.sku, units:p.packUnits},obs,day);
      if (signal.aborted) break;
      if (row.status === 'preview') {
        const promo = row.promotion;
        results.push({
          id:p.id,url:p.url,packUnits:p.packUnits,revision:p.revision,sku:p.sku,
          regularCents:row.standardCents,
          offerCents:promo?.cents ?? null, offerStart:promo?.from ?? null, offerEnd:promo?.through ?? null
        });
      } else {
        skipped.push({id:p.id,reason:row.reason});
      }
      completed++;
      report();
      if (i+1 < req.products.length) await deps.sleep(600,signal);
    }
    finish();
  } catch {
    // Losing the product tab aborts the run; do not expose errors or partial data.
    for (const p of req.products) if (!skipped.some(s=>s.id===p.id)) skipped.push({id:p.id,reason:'connection-lost'});
    results.length=0;
    finish();
  } finally {
    clearInterval(progress);
    if (tab?.id != null) { try { await chrome.tabs.remove(tab.id); } catch {} }
  }
}
