import {adminSender, PORT, validateRequest} from './protocol.mjs';
import {runPreview} from './run.mjs';

let activeRun;
chrome.runtime.onConnect.addListener(port => {
  if (port.name !== PORT || !adminSender(port.sender)) { port.disconnect(); return; }
  const controller = new AbortController();
  const send = msg => { if (!controller.signal.aborted) port.postMessage(msg); };
  port.onDisconnect.addListener(() => controller.abort());
  let started = false;
  port.onMessage.addListener(async msg => {
    if (started || msg?.type === 'heartbeat') return;
    started = true;
    const req = validateRequest(msg);
    if (!req) { port.disconnect(); return; }
    // Only one run may use a dedicated tab at once, including across Shah windows.
    if (activeRun) { activeRun.controller.abort(); activeRun.port.disconnect(); }
    activeRun = {controller,port};
    try { await runPreview(req, chrome, send, controller.signal); }
    catch { if (!controller.signal.aborted) port.disconnect(); }
    finally { if (activeRun?.controller === controller) activeRun = undefined; }
  });
});
