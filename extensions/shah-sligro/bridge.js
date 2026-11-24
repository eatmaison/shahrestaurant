(() => {
  if (location.origin !== 'https://shahrestaurant.nl') return;
  const onStock = () => /^\/admin\/stock\/?$/.test(location.pathname);
  const REQUEST = 'SLIGRO_PRICE_PREVIEW_REQUEST';
  const CANCEL = 'SLIGRO_PRICE_PREVIEW_CANCEL';
  const RESULT = 'SLIGRO_PRICE_PREVIEW_RESULT';
  const PROGRESS = 'SLIGRO_PRICE_PREVIEW_PROGRESS';
  const SOURCE = 'shah-stock';
  const EXTENSION = 'shah-sligro-extension';
  let run;
  function clean(port) {
    if (!run || run.port !== port) return;
    const old = run;
    run = undefined;
    clearInterval(old.timer);
    port.disconnect();
  }
  window.addEventListener('pagehide', () => { if (run) clean(run.port); });
  window.addEventListener('message', ev => {
    const msg = ev.data;
    if (!onStock() || ev.source !== window || ev.origin !== location.origin || msg?.source !== SOURCE
        || typeof msg.requestId !== 'string' || !/^[\w-]{8,80}$/.test(msg.requestId)) return;
    if (msg.type === CANCEL && run?.id === msg.requestId) { clean(run.port); return; }
    if (msg.type !== REQUEST || !Array.isArray(msg.products) || !msg.products.length || msg.products.length > 50) return;
    if (run) clean(run.port);
    const port = chrome.runtime.connect({name: 'shah-sligro-preview-v1'});
    run = {
      port, id: msg.requestId,
      timer: setInterval(() => {
        if (!onStock()) clean(port);
        else if (run?.port === port) port.postMessage({ type: 'heartbeat' });
      }, 10000)
    };
    port.onMessage.addListener(data => {
      if (!onStock()) { clean(port); return; }
      if (!run || run.port !== port || data?.requestId !== run.id
          || ![RESULT, PROGRESS].includes(data.type)) return;
      window.postMessage({...data, source: EXTENSION}, location.origin);
      if (data.type === RESULT) clean(port);
    });
    port.onDisconnect.addListener(() => {
      if (!run || run.port !== port) return;
      const old = run;
      run = undefined;
      clearInterval(old.timer);
      window.postMessage({ source: EXTENSION, type: RESULT, requestId: msg.requestId, results: [],
        skipped: msg.products.map(p => ({ id: p?.id, reason: 'connection-lost' })) }, location.origin);
    });
    port.postMessage({type: REQUEST, requestId: msg.requestId, products: msg.products.map(p => ({
      id: p?.id, url: p?.url, packUnits: p?.packUnits, revision: p?.revision
    }))});
  });
})();
