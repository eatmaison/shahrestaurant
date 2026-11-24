/* eslint-disable @typescript-eslint/no-require-imports -- local synthetic component and protocol fixture. */
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { resolve, dirname } = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

function fixture(size) {
  const cache = new Map();
  const hooks = [];
  const requests = [];
  const saves = [];
  const saved = [];
  const listeners = new Set();
  const origin = "https://shahrestaurant.nl";
  const window = {
    setTimeout, clearTimeout,
    addEventListener(_, cb) { listeners.add(cb); },
    removeEventListener(_, cb) { listeners.delete(cb); },
    postMessage(msg) { requests.push(msg); },
  };
  const state = { failSave: 0 };
  let cursor = 0, cleanup;
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in hooks)) hooks[i] = initial;
      return [hooks[i], set => { hooks[i] = typeof set === "function" ? set(hooks[i]) : set; }];
    },
    useRef(initial) {
      const i = cursor++;
      return hooks[i] ??= { current: initial };
    },
    useEffect(cb) { cleanup ??= cb(); },
  };
  const vnode = (type, props) => ({ type, ...props });
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} };
    cache.set(file, mod);
    const compiled = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    new Function("module", "exports", "require", "window", "location", "crypto", compiled)(mod, mod.exports, name => {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsx: vnode, jsxs: vnode, Fragment: "fragment" };
      if (name.endsWith(".css")) return { default: {} };
      if (name.endsWith("/clientFetch")) return { fetchJSON: async (route, init) => {
        assert.equal(route, "/api/admin/stock/sligro-prices");
        const updates = JSON.parse(init.body).updates;
        saves.push(updates);
        if (saves.length === state.failSave) throw Error("fixture network failure");
        return { response: { ok: true }, data: { items: updates, skipped: [] } };
      } };
      return name.startsWith(".") ? load(resolve(dirname(file), name + ".ts")) : require(name);
    }, window, { origin }, { randomUUID });
    return mod.exports;
  }
  const component = load(resolve(__dirname, "../app/admin/stock/SligroPrices.tsx")).default;
  const items = Array.from({ length: size }, (_, i) => ({
    id: randomUUID(), name: "Product " + i, archived: false, caseSize: 24, revision: 1, purchasePrice: null,
    sligroUrl: `https://www.sligro.nl/p.${10000 + i}.html/test-item.html`,
  }));
  const props = { items, disabled: false, lang: "en", onSaved: rows => saved.push(...rows) };
  function render() { cursor = 0; return component(props); }
  function flat(node) {
    if (node == null || typeof node === "boolean") return [];
    if (Array.isArray(node)) return node.flatMap(flat);
    if (typeof node !== "object") return [node];
    return [node, ...flat(node.children)];
  }
  const button = name => flat(render()).find(node => node.type === "button" && node.children === name);
  const previews = () => requests.filter(msg => msg.type === "SLIGRO_PRICE_PREVIEW_REQUEST");
  function receive(req, fields) {
    for (const cb of listeners) cb({ origin, source: window, data: {
      source: "shah-sligro-extension", requestId: req.requestId, ...fields,
    } });
  }
  function complete(req, stop) {
    const products = stop ? req.products.slice(0, 2) : req.products;
    receive(req, {
      type: "SLIGRO_PRICE_PREVIEW_RESULT",
      results: products.map(p => ({ ...p, sku: p.url.split(".")[3], regularCents: 1200,
        offerCents: null, offerStart: null, offerEnd: null })),
      skipped: stop ? req.products.slice(2).map(({ id }) => ({ id, reason: "supplier-blocked" })) : [],
    });
  }
  return { items, button, previews, complete, save: async () => {
    button("Save reviewed prices").onClick();
    await new Promise(resolve => setImmediate(resolve));
  }, receive, requests, saves, saved, state, close: () => cleanup?.(),
  text: () => flat(render()).filter(node => typeof node !== "object").join(" ").replace(/\s+/g, " ") };
}

for (const size of [64, 100, 127]) test(`one click reviews and saves ${size} products sequentially`, async t => {
  const f = fixture(size);
  t.after(f.close);
  const start = f.button("Refresh Sligro prices");
  assert.equal(start.disabled, false);
  start.onClick();
  assert.equal(f.previews().length, 1);
  const expectedSizes = Array.from({ length: Math.ceil(size / 50) }, (_, i) => Math.min(50, size - 50 * i));
  for (const [i, expected] of expectedSizes.entries()) {
    const req = f.previews()[i];
    assert.equal(req.products.length, expected);
    f.receive(req, { type: "SLIGRO_PRICE_PREVIEW_PROGRESS", state: "reading", completed: 1 });
    assert.match(f.text(), new RegExp((50 * i + 1) + " / " + size));
    f.complete(req);
  }
  assert.deepEqual(f.previews().flatMap(req => req.products.map(p => p.id)), f.items.map(p => p.id));
  assert.equal(f.saves.length, 0);
  await f.save();
  assert.deepEqual(f.saves.map(batch => batch.length), expectedSizes);
  assert.equal(f.saved.length, size);
});

test("stops on supplier interruption and preserves only verified rows", async t => {
  const f = fixture(127);
  t.after(f.close);
  f.button("Refresh Sligro prices").onClick();
  f.complete(f.previews()[0]);
  f.complete(f.previews()[1], true);
  assert.equal(f.previews().length, 2);
  assert.match(f.text(), /stopped early/);
  await f.save();
  assert.deepEqual(f.saves.map(batch => batch.length), [50, 2]);
});

test("retry after partial save never resends an acknowledged batch", async t => {
  const f = fixture(64);
  t.after(f.close);
  f.button("Refresh Sligro prices").onClick();
  f.complete(f.previews()[0]);
  f.complete(f.previews()[1]);
  f.state.failSave = 2;
  await f.save();
  assert.equal(f.saved.length, 50);
  assert.match(f.text(), /remaining prices/);
  await f.save();
  assert.deepEqual(f.saves.map(batch => batch.length), [50, 14, 14]);
  assert.equal(f.saved.length, 64);
});

test("cancel drops in-flight and earlier partial preview without sending further requests", t => {
  const f = fixture(127);
  t.after(f.close);
  f.button("Refresh Sligro prices").onClick();
  f.complete(f.previews()[0]);
  const current = f.previews()[1];
  f.button("Cancel").onClick();
  assert.equal(f.requests.at(-1).requestId, current.requestId);
  assert.match(f.requests.at(-1).type, /CANCEL/);
  f.complete(current);
  assert.equal(f.previews().length, 2);
  assert.equal(f.button("Save reviewed prices"), undefined);
});
