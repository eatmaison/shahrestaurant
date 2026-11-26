/* eslint-disable @typescript-eslint/no-require-imports -- Node-only tests load route code in a network-free fixture. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { NextRequest } = require("next/server");
const { PGlite } = require("@electric-sql/pglite");
const { SignJWT } = require("jose");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const migration = fs.readFileSync(path.join(root, "db/migrations/20261122_shah_stock.sql"), "utf8");
const categoryMigration = fs.readFileSync(path.join(root, "db/migrations/20261123_shah_stock_categories.sql"), "utf8");
const priceMigration = fs.readFileSync(path.join(root, "db/migrations/20261123_shah_stock_purchase_prices.sql"), "utf8");
const sligroMigration = fs.readFileSync(path.join(root, "db/migrations/20261123_shah_stock_sligro_links.sql"), "utf8");
const dateMigration = fs.readFileSync(path.join(root, "db/migrations/20261124_shah_stock_offer_dates.sql"), "utf8");
const syntheticStock = [
  ["soft-drinks", "fixture-soda", "Fixture soda", 2, 10, 3],
  ["beer", "fixture-lager", "Fixture lager", 0, null, 0],
  ["beer", "fixture-lager-zero", "Fixture lager 0%", 1, 8, 2],
  ["syrups", "fixture-syrup", "Fixture syrup", 0, null, 4],
];
async function insertFixture(db) {
  for (const row of syntheticStock) {
    await db.query(
      "INSERT INTO shah_stock_items (category, seed_key, name, cases_count, case_size, loose_count) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING",
      row,
    );
  }
}
const origin = "http://stock.test";
const secret = "local-only-fixture-secret-never-used-outside-tests";
const admin = "22e4b2d0-6cfe-4ec6-ab18-08017518d0bd";
const customer = "42e4b2d0-6cfe-4ec6-ab18-08017518d0bd";
const unknown = "52e4b2d0-6cfe-4ec6-ab18-08017518d0bd";
const sample = { name: "Test soda", category: "soft-drinks", cases: 2, caseSize: 6, loose: 3 };

function loader(db) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(root, file);
    if (file.endsWith(path.join("lib", "db.ts"))) {
      return { sql: { query: async (statement, args) => (await db.query(statement, args)).rows } };
    }
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} };
    cache.set(file, mod);
    const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(compiled, {
      module: mod, exports: mod.exports,
      require: name => name.startsWith(".") ? load(path.resolve(path.dirname(file), name + ".ts")) : require(name),
      URL, Response, TextEncoder, TextDecoder, Date,
      process: { env: { APP_URL: origin, SESSION_SECRET: secret, NODE_ENV: "production" } },
      fetch: () => { throw new Error("External fetch is forbidden"); },
    }, { filename: file });
    return mod.exports;
  }
  return load;
}

async function token(userId) {
  return new SignJWT({ userId }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("10m")
    .sign(new TextEncoder().encode(secret));
}

async function fixture(t, migrate = true) {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec("CREATE TABLE users (id uuid PRIMARY KEY, role text NOT NULL)");
  await db.query("INSERT INTO users VALUES ($1, 'admin'), ($2, 'user')", [admin, customer]);
  if (migrate) { await db.exec(migration); await insertFixture(db); await db.exec(categoryMigration); await db.exec(priceMigration); await db.exec(sligroMigration); await db.exec(dateMigration); }
  const load = loader(db);
  const route = load("app/api/admin/stock/route.ts");
  const categoryRoute = load("app/api/admin/stock/categories/route.ts");
  return { db, load, route, categoryRoute, auth: await token(admin) };
}

function call(route, method, auth, payload, customHeaders = {}) {
  const headers = new Headers({
    ...(auth ? { Cookie: "etg_session=" + auth } : {}),
    ...(method === "GET" ? {} : { "Content-Type": "application/json", Origin: origin }),
    ...customHeaders,
  });
  return route[method](new NextRequest(origin + "/api/admin/stock", {
    method, headers, ...(payload === undefined ? {} : { body: typeof payload === "string" ? payload : JSON.stringify(payload) }),
  }));
}

test("public schema starts empty and optional seed keys protect existing counts and archives", async t => {
  const { db } = await fixture(t, false);
  const read = async () => (await db.query("SELECT name, category, cases_count, case_size, loose_count, total_units FROM shah_stock_items")).rows;
  await db.exec(migration);
  assert.deepEqual(await read(), []);
  await insertFixture(db);
  const rows = await read();
  assert.equal(rows.length, syntheticStock.length);
  assert.equal(rows.filter(row => row.total_units === 0).length, 1);
  for (const [category, , name, cases, caseSize, loose] of syntheticStock) {
    const item = rows.find(row => row.name === name && row.category === category);
    assert.ok(item, name);
    assert.deepEqual([item.cases_count, item.case_size, item.loose_count, item.total_units], [cases, caseSize, loose, cases * (caseSize || 0) + loose]);
  }
  await db.exec("UPDATE shah_stock_items SET name = 'Edited fixture', loose_count = 99, archived_at = now(), revision = 2 WHERE seed_key = 'fixture-soda'");
  await db.exec(migration);
  await insertFixture(db);
  const retried = await read();
  assert.equal(retried.length, syntheticStock.length);
  assert.equal(retried.find(row => row.name === "Edited fixture").loose_count, 99);
  assert.ok((await db.query("SELECT archived_at FROM shah_stock_items WHERE seed_key = 'fixture-soda'")).rows[0].archived_at);
});

test("every method checks current signed server-side admin role and mutations reject cross-origin", async t => {
  const { route, auth, db } = await fixture(t);
  for (const denied of [undefined, "bad-token", await token(customer), await token(unknown)]) {
    for (const method of ["GET", "POST", "PATCH"]) {
      const response = await call(route, method, denied, method === "GET" ? undefined : sample);
      assert.equal(response.status, 403, method);
      assert.match(response.headers.get("cache-control"), /no-store/);
    }
  }
  for (const method of ["POST", "PATCH"]) {
    assert.equal((await call(route, method, auth, sample, { Origin: "https://other.test" })).status, 403);
    assert.equal((await call(route, method, auth, sample, { "Sec-Fetch-Site": "cross-site" })).status, 403);
    assert.equal((await call(route, method, auth, sample, { "Content-Type": "text/plain" })).status, 403);
  }
  await db.query("UPDATE users SET role = 'user' WHERE id = $1", [admin]);
  assert.equal((await call(route, "GET", auth)).status, 403);
  assert.equal((await db.query("SELECT count(*)::int AS count FROM shah_stock_items")).rows[0].count, syntheticStock.length);
});

test("authorized shared stock supports validation, CRUD, conflict protection, sort and filters", async t => {
  const { route, auth, load } = await fixture(t);
  for (const change of [{ name: " " }, { category: "wine" }, { cases: -1 }, { cases: 0.5 }, { caseSize: null }, { loose: "3" }, { loose: 1000001 }, { legacy: true }]) {
    assert.equal((await call(route, "POST", auth, { ...sample, ...change })).status, 400);
  }
  assert.equal((await call(route, "POST", auth, "{")).status, 400);
  const create = await call(route, "POST", auth, { ...sample, name: " Test soda " });
  assert.equal(create.status, 201);
  const { item } = await create.json();
  assert.deepEqual([item.name, item.totalUnits, item.revision, item.archived], ["Test soda", 15, 1, false]);
  assert.equal((await call(route, "POST", auth, { ...sample, name: "TEST SODA" })).status, 409);
  const getItems = async () => {
    const response = await call(route, "GET", auth);
    assert.equal(response.status, 200);
    return (await response.json()).items;
  };
  const original = await getItems();
  assert.equal(original.length, syntheticStock.length + 1);
  assert.deepEqual(original.map(row => row.totalUnits), [0, 4, 10, 15, 23]);
  assert.ok(original.every((row, i) => i === 0 || row.totalUnits >= original[i - 1].totalUnits));
  const { visibleStockItems } = load("app/lib/stock.ts");
  assert.equal(visibleStockItems(original, "zero", "all", "").length, 1);
  assert.deepEqual(Array.from(visibleStockItems(original, "active", "beer", "0%"), row => row.name).sort(), [
    "Fixture lager 0%",
  ]);
  const patch = (action, revision, values, id = item.id) => call(route, "PATCH", auth, { id, revision, action, ...(values ? { values } : {}) });
  const edited = await patch("edit", 1, { name: "Renamed bottle", category: "beer", cases: 0, caseSize: null, loose: 0 });
  assert.equal(edited.status, 200);
  const actual = (await edited.json()).item;
  assert.deepEqual([actual.name, actual.category, actual.totalUnits, actual.revision], ["Renamed bottle", "beer", 0, 2]);
  const conflict = await patch("edit", 1, sample);
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).item.name, "Renamed bottle");
  assert.equal((await patch("edit", 2, { ...sample, cases: -1 })).status, 400);
  assert.equal((await patch("archive", 2)).status, 200);
  assert.equal(visibleStockItems(await getItems(), "archived", "all", "").length, 1);
  assert.equal((await patch("restore", 3)).status, 200);
  assert.equal(visibleStockItems(await getItems(), "archived", "all", "").length, 0);
  assert.equal((await patch("archive", 1, undefined, unknown)).status, 404);
  assert.equal((await patch("archive", 1, undefined, "invalid-id")).status, 400);
});

test("before migration, the private API reports setup needed rather than an empty inventory", async t => {
  const { route, auth } = await fixture(t, false);
  const response = await call(route, "GET", auth);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "migration_required" });
});

test("the admin workspace resolves /admin/stock through its own bootstrap view", () => {
  const { adminBootstrapView, parseAdminDataView } = loader(null)("app/lib/adminView.ts");
  assert.equal(adminBootstrapView("/admin/stock"), "stock");
  assert.equal(parseAdminDataView("stock"), "stock");
});

// This exercises rendered JSX handlers without a browser or any network.
test("inline editing previews units, retains rejected values and only reorders after a successful save", async () => {
  const libs = { ...loader(null)("app/lib/stock.ts"), stockAmsterdamDate: () => "2026-11-24" };
  const { stockUnits } = libs;
  const item = (id, name, cases, caseSize, loose) => ({
    id, name, category: "beer", cases, caseSize, loose, totalUnits: stockUnits(cases, caseSize, loose), revision: 1, archived: false,
  });
  const sourceItems = [
    { ...item("a", "A bottle", 1, 12, 0), purchasePrice: { packUnits: 24, regularCents: 2700, offerCents: 2000, offerStart: "2026-11-19", offerEnd: "2026-12-07" },
      sligroUrl: "https://www.sligro.nl/p.123456.html/fixture-bottle.html" },
    item("b", "B bottle", 2, 12, 0),
  ];
  const state = [], effects = [], calls = [];
  let slot = 0, reject = true;
  const react = {
    useState(initial) {
      const i = slot++;
      if (!(i in state)) state[i] = typeof initial === "function" ? initial() : initial;
      return [state[i], value => { state[i] = typeof value === "function" ? value(state[i]) : value; }];
    },
    useRef(initial) {
      const i = slot++;
      if (!(i in state)) state[i] = { current: initial };
      return state[i];
    },
    useEffect(effect) {
      const i = slot++;
      if (!(i in state)) { state[i] = true; effects.push(effect); }
    },
  };
  const transport = async (_url, init) => {
    if (!init.method) return { response: { ok: true }, data: { items: sourceItems, categories: [{ id: "beer", name: "Beer" }] } };
    const payload = JSON.parse(init.body);
    calls.push(payload);
    if (reject) return { response: { ok: false }, data: { error: "unavailable" } };
    const values = payload.values;
    return { response: { ok: true }, data: {
      item: { ...sourceItems[0], ...values, revision: 2, totalUnits: stockUnits(values.cases, values.caseSize, values.loose) },
    } };
  };
  const filename = path.join(root, "app/admin/stock/AdminStock.tsx");
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} }, stylesheet = new Proxy({}, { get: (_value, key) => String(key) });
  vm.runInNewContext(compiled, {
    module: mod, exports: mod.exports, AbortController,
    require: name => {
      if (name === "react") return react;
      if (name === "../../providers") return { useLang: () => ({ lang: "en" }) };
      if (name === "../../lib/clientFetch") return { fetchJSON: transport };
      if (name === "../../lib/stock") return libs;
      if (name === "./StockPhoto") return { StockPhoto: () => null, useStockPhotos: () => ({ versions: {}, indexReady: true, update() {} }) };
      if (name === "./SligroPrices" || name === "./TaurusStock") return { __esModule: true, default: () => null };
      if (name === "./StockCategories") return { __esModule: true, default: () => null };
      if (name.endsWith(".css")) return { __esModule: true, default: stylesheet };
      return require(name);
    },
  }, { filename });
  const render = () => { slot = 0; return mod.exports.default(); };
  function children(value, predicate) {
    if (Array.isArray(value)) return value.flatMap(part => children(part, predicate));
    if (!value || typeof value !== "object" || !value.props) return [];
    return [...(predicate(value) ? [value] : []), ...children(value.props.children, predicate)];
  }
  const find = (node, predicate) => children(node, predicate)[0];
  const countButtons = node => children(node, el => el.type === "button" &&
    el.props["aria-label"]?.startsWith("Edit count")).map(el => el.props["aria-label"]);
  const editor = node => find(node, el => typeof el.type === "function" && el.type.name === "StockEditor").type(
    find(node, el => typeof el.type === "function" && el.type.name === "StockEditor").props,
  );
  const input = (node, label) => find(find(node, el => el.type === "label" && el.props.children[0] === label), el => el.type === "input");
  const tick = () => new Promise(resolve => setImmediate(resolve));
  const priceSummary = node => {
    const summary = find(node, el => typeof el.type === "function" && el.type.name === "PurchaseSummary");
    return summary.type(summary.props);
  };
  const text = value => Array.isArray(value) ? value.map(text).join("") :
    value?.props ? text(value.props.children) : ["number", "string"].includes(typeof value) ? String(value) : "";

  render(); effects.shift()(); await tick();
  const order = ["Edit count: A bottle", "Edit count: B bottle"];
  let tree = render();
  assert.deepEqual(countButtons(tree), order);
  assert.match(text(priceSummary(tree)), /€27\.00 €20\.00 per pack of 24/);
  assert.match(text(priceSummary(tree)), /Good time to order · Save €7\.00/);
  const sligroButton = find(tree, el => el.type === "a" && el.props["aria-label"] === "Open in Sligro: A bottle");
  assert.equal(sligroButton.props.href, sourceItems[0].sligroUrl);
  assert.equal(sligroButton.props.target, "_blank");
  assert.match(sligroButton.props.rel, /noreferrer/);
  find(tree, el => el.type === "button" && el.props["aria-label"] === order[0]).props.onClick();
  tree = render();
  let form = editor(tree);
  assert.equal(input(form, "Full cases").props.inputMode, "numeric");
  input(form, "Full cases").props.onChange({ target: { value: "3" } });
  tree = render(); form = editor(tree);
  assert.equal(find(form, el => el.type === "output").props.children, "36");
  assert.deepEqual(countButtons(tree), order);
  form.props.onSubmit({ preventDefault() {} }); await tick();
  tree = render(); form = editor(tree);
  assert.equal(input(form, "Full cases").props.value, "3");
  assert.ok(find(form, el => el.props.role === "alert"));
  assert.deepEqual(countButtons(tree), order);
  assert.equal(calls[0].values.cases, 3);
  reject = false;
  form.props.onSubmit({ preventDefault() {} }); await tick();
  tree = render();
  assert.equal(find(tree, el => typeof el.type === "function" && el.type.name === "StockEditor"), undefined);
  assert.deepEqual(countButtons(tree), order.slice().reverse());
  assert.equal(Object.hasOwn(calls[1].values, "purchasePrice"), false);
  assert.equal(Object.hasOwn(calls[1].values, "sligroUrl"), false);
  find(tree, el => el.type === "button" && el.props["aria-label"] === order[0]).props.onClick();
  form = editor(render());
  assert.equal(input(form, "Units in purchase pack").props.value, "24");
  assert.equal(input(form, "Offer starts (optional)").props.value, "2026-11-19");
  assert.equal(input(form, "Offer ends (optional)").props.value, "2026-12-07");
  input(form, "Offer ends (optional)").props.onChange({ target: { value: "2026-11-23" } });
  form = editor(render());
  form.props.onSubmit({ preventDefault() {} }); await tick();
  tree = render();
  assert.deepEqual(calls[2].values.purchasePrice, { packUnits: 24, regularCents: 2700, offerCents: 2000, offerStart: "2026-11-19", offerEnd: "2026-11-23" });
  assert.match(text(priceSummary(tree)), /€27\.00 per pack of 24/);
  assert.doesNotMatch(text(priceSummary(tree)), /Good time to order/);
  find(tree, el => el.type === "button" && el.props["aria-label"] === order[0]).props.onClick();
  form = editor(render());
  input(form, "Offer price (€)").props.onChange({ target: { value: "" } });
  form = editor(render());
  form.props.onSubmit({ preventDefault() {} }); await tick();
  tree = render();
  assert.deepEqual(calls[3].values.purchasePrice, { packUnits: 24, regularCents: 2700, offerCents: null });
  assert.match(text(priceSummary(tree)), /€27\.00 per pack of 24/);
  assert.doesNotMatch(text(priceSummary(tree)), /Good time to order/);
});

test("Stock categories support custom names and safely reclassify active and archived rows", async t => {
  const { route, categoryRoute, auth, db, load } = await fixture(t);
  const get = async () => (await (await call(route, "GET", auth)).json());
  const add = name => call(categoryRoute, "POST", auth, { name });
  const remove = (id, replacement = null) => call(categoryRoute, "DELETE", auth, { id, replacement });
  const { items, categories } = await get();
  assert.deepEqual(categories.map(category => category.id).sort(), ["beer", "soft-drinks", "syrups"]);
  const { stockCategoryLabel } = load("app/lib/stock.ts");
  assert.equal(stockCategoryLabel({ id: "beer", name: "Beer" }, { beer: "Bier" }), "Bier");
  assert.equal((await add(" ")).status, 400);
  assert.equal((await add("x".repeat(61))).status, 400);
  assert.equal((await add("a\u0001b")).status, 400);
  assert.equal((await add("BEER")).status, 409);
  const created = await add("  Wines  ");
  assert.equal(created.status, 201);
  const { category } = await created.json();
  assert.equal(category.name, "Wines");
  assert.equal(stockCategoryLabel(category, {}), "Wines");
  assert.equal((await add("wines")).status, 409);
  assert.equal((await remove(category.id, category.id)).status, 400);
  assert.equal((await remove("beer", unknown)).status, 404);
  const selected = items.find(item => item.name === "Fixture lager");
  assert.equal((await call(route, "PATCH", auth, { id: selected.id, revision: selected.revision, action: "archive" })).status, 200);
  assert.equal((await remove("beer")).status, 409);
  assert.equal((await remove("beer", category.id)).status, 200);
  const updated = (await get()).items;
  assert.equal(updated.length, items.length);
  for (const old of items.filter(item => item.category === "beer")) {
    const item = updated.find(item => item.id === old.id);
    assert.equal(item.category, category.id);
    assert.equal(item.totalUnits, old.totalUnits);
    assert.equal(item.revision, old.revision + (item.id === selected.id ? 2 : 1));
    assert.equal(item.archived, item.id === selected.id);
  }
  assert.equal((await call(route, "POST", auth, { ...sample, category: "beer" })).status, 409);
  assert.equal((await call(route, "POST", auth, { ...sample, category: category.id })).status, 201);
  await db.exec(categoryMigration);
  assert.ok(!(await get()).categories.some(option => option.id === "beer"), "rerun does not resurrect removed defaults");
  const empty = (await (await add("Empty category")).json()).category;
  assert.equal((await remove(empty.id)).status, 200);
});

test("overlapping active product names cancel the whole category move", async t => {
  const { categoryRoute, route, auth } = await fixture(t);
  const get = async () => (await (await call(route, "GET", auth)).json());
  assert.equal((await call(route, "POST", auth, { ...sample, name: "Fixture lager" })).status, 201);
  const before = await get();
  const response = await call(categoryRoute, "DELETE", auth, { id: "beer", replacement: "soft-drinks" });
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: "category_product_duplicate" });
  assert.deepEqual(await get(), before);
});

test("category creation and removal require current admin and same origin", async t => {
  const { categoryRoute, auth, route } = await fixture(t);
  for (const [method, payload] of [["POST", { name: "Denied" }], ["DELETE", { id: "beer", replacement: "syrups" }]]) {
    assert.equal((await call(categoryRoute, method, await token(customer), payload)).status, 403);
    assert.equal((await call(categoryRoute, method, auth, payload, { Origin: "https://elsewhere.test" })).status, 403);
  }
  const response = await call(route, "GET", auth);
  assert.equal((await response.json()).categories.length, 3);
});

test("purchase prices accept comma or point cents and reject ambiguous or invalid amounts", async t => {
  const { load } = await fixture(t, false);
  const { parseStockEuro } = load("app/lib/stock.ts");
  for (const [raw, cents] of [[" 27 ", 2700], ["20,05", 2005], ["20.5", 2050], ["0", 0], ["", null]]) {
    assert.equal(parseStockEuro(raw), cents);
  }
  for (const raw of ["-", "-2", "4.555", "20,05.2", "2e3", "100000", "€2"]) {
    assert.ok(Number.isNaN(parseStockEuro(raw)), raw);
  }
});

test("private purchase pricing persists separately from counts and clears without touching legacy values", async t => {
  const { route, auth, db } = await fixture(t);
  const values = { ...sample, cases: 0, caseSize: null, loose: 3 };
  const price = { packUnits: 24, regularCents: 2700, offerCents: 2000 };
  const payload = { ...values, purchasePrice: price };
  for (const bad of [
    { ...price, regularCents: 0 }, { ...price, offerCents: 2700 }, { ...price, offerCents: 2750 },
    { ...price, packUnits: 0 }, { ...price, packUnits: 1001 }, { ...price, regularCents: 2700.5 },
    { ...price, regularCents: null }, { ...price, offerCents: -1 }, { ...price, extra: true },
  ]) {
    assert.equal((await call(route, "POST", auth, { ...values, purchasePrice: bad })).status, 400);
  }
  assert.equal((await call(route, "POST", await token(customer), payload)).status, 403);
  const create = await call(route, "POST", auth, payload);
  assert.equal(create.status, 201);
  let { item } = await create.json();
  assert.deepEqual(item.purchasePrice, price);
  assert.equal(item.totalUnits, 3);
  assert.equal(item.caseSize, null);
  const update = (data, revision = item.revision) => call(route, "PATCH", auth, {
    action: "edit", id: item.id, revision, values: data,
  });
  const legacy = await update({ ...values, cases: 1, caseSize: 6 });
  item = (await legacy.json()).item;
  assert.deepEqual(item.purchasePrice, price);
  assert.equal(item.totalUnits, 9);
  assert.equal((await update({ ...values, purchasePrice: null }, 1)).status, 409);
  const removeOffer = await update({ ...values, cases: 1, caseSize: 6, purchasePrice: { ...price, offerCents: null } });
  item = (await removeOffer.json()).item;
  assert.deepEqual(item.purchasePrice, { ...price, offerCents: null });

  await db.exec(priceMigration);
  const read = await call(route, "GET", auth);
  const saved = (await read.json()).items.find(other => other.id === item.id);
  assert.deepEqual(saved.purchasePrice, { ...price, offerCents: null });
  assert.equal(saved.totalUnits, 9);

  const clear = await update({ ...values, cases: 1, caseSize: 6, purchasePrice: null });
  assert.deepEqual((await clear.json()).item.purchasePrice, null);
  await assert.rejects(db.query(
    "UPDATE shah_stock_items SET purchase_offer_cents = 1200 WHERE id = $1", [item.id],
  ), error => error.code === "23514");
});

test("Sligro shortcut canonicalizes official product links, strips tracking and isolates changes", async t => {
  const { route, auth, db, load } = await fixture(t);
  const { normalizeStockSligroLink } = load("app/lib/stock.ts");
  const canonical = "https://www.sligro.nl/p.123456.html/fixture-bottle.html";
  const copied = "https://sligro.nl/p.123456.html/fixture-bottle.html?utm_source=fixture#details";
  assert.equal(normalizeStockSligroLink(copied), canonical);
  for (const denied of [
    "http://www.sligro.nl/p.123456.html/fixture-bottle.html",
    "https://www.sligro.nl.evil.test/p.123456.html/fixture-bottle.html",
    "https://www.sligro.nl@evil.test/p.123456.html/fixture-bottle.html",
    "https://someone:password@www.sligro.nl/p.123456.html/fixture-bottle.html",
    "https://www.sligro.nl:8543/p.123456.html/fixture-bottle.html",
    "https://www.sligro.nl/login",
    "https://www.sligro.nl/c.123.html/fixture-bottle.html",
    "https://www.sligro.nl/p.123456.html/../fixture-bottle.html",
  ]) {
    assert.equal(normalizeStockSligroLink(denied), null, denied);
    assert.equal((await call(route, "POST", auth, { ...sample, sligroUrl: denied })).status, 400);
  }
  const price = { packUnits: 24, regularCents: 2700, offerCents: 2000 };
  const saved = await call(route, "POST", auth, { ...sample, purchasePrice: price, sligroUrl: copied });
  assert.equal(saved.status, 201);
  let { item } = await saved.json();
  assert.equal(item.sligroUrl, canonical);
  assert.deepEqual(item.purchasePrice, price);
  const update = values => call(route, "PATCH", auth, { action: "edit", id: item.id, revision: item.revision, values });
  item = (await (await update({ ...sample, loose: 1 })).json()).item;
  assert.equal(item.sligroUrl, canonical);
  const otherPrice = { ...price, offerCents: null };
  item = (await (await update({ ...sample, loose: 1, purchasePrice: otherPrice })).json()).item;
  assert.equal(item.sligroUrl, canonical);
  item = (await (await update({ ...sample, loose: 1, sligroUrl: null })).json()).item;
  assert.deepEqual(item.purchasePrice, otherPrice);
  assert.equal(item.sligroUrl, null);
  const both = await update({ ...sample, loose: 1, sligroUrl: copied, purchasePrice: price });
  assert.equal(both.status, 200);
  item = (await both.json()).item;
  assert.equal(item.sligroUrl, canonical);
  assert.deepEqual(item.purchasePrice, price);
  await db.exec(sligroMigration);
  const read = await call(route, "GET", auth);
  assert.deepEqual((await read.json()).items.find(row => row.id === item.id), item);
  await assert.rejects(db.query("UPDATE shah_stock_items SET sligro_url = 'javascript:alert(1)' WHERE id = $1", [item.id]),
    error => error.code === "23514");
});

test("offer dates survive API updates and use inclusive Amsterdam civil-day boundaries", async t => {
  const { db, load, route, auth } = await fixture(t);
  const { activeStockOffer, stockAmsterdamDate } = load("app/lib/stock.ts");
  const purchasePrice = { packUnits: 24, regularCents: 3200, offerCents: 3000, offerStart: "2026-11-19", offerEnd: "2026-12-07" };
  for (const bad of [
    { ...purchasePrice, offerStart: "2026-02-29" },
    { ...purchasePrice, offerEnd: "2026-11-18" },
    { ...purchasePrice, offerCents: null },
    { ...purchasePrice, offerStart: "0000-01-01" },
    { ...purchasePrice, offerEnd: "2026-12-07T23:59:59Z" },
  ]) {
    assert.equal((await call(route, "POST", auth, { ...sample, purchasePrice: bad })).status, 400);
  }
  const created = await call(route, "POST", auth, { ...sample, purchasePrice });
  assert.ok(created.ok, await created.clone().text());
  let { item } = await created.json();
  assert.deepEqual(item.purchasePrice, purchasePrice);
  for (const [instant, date, offer] of [
    ["2026-11-18T22:59:59Z", "2026-11-18", null],
    ["2026-11-18T23:00:00Z", "2026-11-19", 3000],
    ["2026-12-07T22:59:59Z", "2026-12-07", 3000],
    ["2026-12-07T23:00:00Z", "2026-12-08", null],
  ]) {
    assert.equal(stockAmsterdamDate(new Date(instant)), date);
    assert.equal(activeStockOffer(item.purchasePrice, date), offer);
  }
  assert.equal(stockAmsterdamDate(new Date("2026-07-07T22:00:00Z")), "2026-07-08");
  await db.exec(dateMigration);
  const fetched = await call(route, "GET", auth);
  assert.deepEqual((await fetched.json()).items.find(row => row.id === item.id).purchasePrice, purchasePrice);
  const patch = values => call(route, "PATCH", auth, { id: item.id, revision: item.revision, action: "edit", values });
  const counts = { ...sample, loose: 4 };
  ({ item } = await (await patch(counts)).json());
  assert.deepEqual(item.purchasePrice, purchasePrice);
  await assert.rejects(db.query("UPDATE shah_stock_items SET purchase_offer_end = '2026-11-18' WHERE id = $1", [item.id]), /shah_stock_purchase_offer_dates_valid/);
  const clear = { packUnits: 24, regularCents: 3200, offerCents: null };
  ({ item } = await (await patch({ ...counts, purchasePrice: clear })).json());
  assert.deepEqual(item.purchasePrice, clear);
});

test("Sligro apply is admin-only, atomically compares revision, URL and pack, and preserves counts", async t => {
  const { db, load, route, auth } = await fixture(t);
  const applyRoute = load("app/api/admin/stock/sligro-prices/route.ts");
  const slug = "https://www.sligro.nl/p.123456.html/fixture-bottle.html";
  const otherSlug = "https://www.sligro.nl/p.223456.html/fixture-lager.html";
  const stock = { ...sample, sligroUrl: slug };
  const firstResponse = await call(route, "POST", auth, stock);
  const secondResponse = await call(route, "POST", auth, { ...stock, name: "Second fixture", sligroUrl: otherSlug });
  const first = (await firstResponse.json()).item, second = (await secondResponse.json()).item;
  const purchasePrice = { packUnits: 6, regularCents: 1595, offerCents: 1495, offerStart: "2026-11-19", offerEnd: "2026-12-07" };
  const current = { id: first.id, revision: first.revision, sku: "123456", url: slug, purchasePrice };
  const validSecond = { id: second.id, revision: second.revision, sku: "223456", url: otherSlug, purchasePrice };
  const update = (rows, token = auth, headers) => call(applyRoute, "POST", token, { updates: rows }, headers);
  assert.equal((await update([current], null)).status, 403);
  assert.equal((await update([current], await token(customer))).status, 403);
  assert.equal((await update([current], auth, { Origin: "https://attacker.test" })).status, 403);
  assert.equal((await update([current, current])).status, 400);
  assert.equal((await update([{ ...current, sku: "33333" }])).status, 400);
  assert.equal((await update([{ ...current, purchasePrice: { ...purchasePrice, offerEnd: undefined } }])).status, 400);
  assert.equal((await update([{ ...current, purchasePrice: { ...purchasePrice, packUnits: 24 } }])).status, 200);
  assert.equal((await db.query("SELECT revision FROM shah_stock_items WHERE id=$1", [first.id])).rows[0].revision, first.revision);
  const changed = await call(route, "PATCH", auth, { id: second.id, revision: second.revision, action: "edit", values: { ...sample, name: second.name, loose: 7 } });
  assert.equal(changed.status, 200);
  const applied = await update([current, validSecond]);
  assert.ok(applied.ok, await applied.clone().text());
  assert.equal(applied.headers.get("cache-control"), "private, no-store");
  const result = await applied.json();
  assert.deepEqual(result.skipped, [second.id]);
  assert.equal(result.items[0].totalUnits, first.totalUnits);
  assert.equal(result.items[0].revision, first.revision + 1);
  assert.deepEqual(result.items[0].purchasePrice, purchasePrice);
  const replay = await update([current]);
  assert.deepEqual(await replay.json(), { skipped: [first.id], items: [] });
  const wrongCurrentUrl = { ...current, revision: first.revision + 1, url: otherSlug, sku: "223456" };
  assert.deepEqual((await (await update([wrongCurrentUrl])).json()).skipped, [first.id]);
  const list = await call(route, "GET", auth);
  const untouched = (await list.json()).items.find(row => row.id === second.id);
  assert.equal(untouched.loose, 7);
  assert.equal(untouched.purchasePrice, null);
});

test("Sligro preview discards mismatches and duplicates before an admin can save any prices", () => {
  const { sligroReviewBatch } = loader(null)("app/lib/stockSligro.ts");
  const id = "8b1b3e01-15b9-4bb7-b460-106ae67d4899";
  const requestId = "f3530d10-8d67-4524-b046-70b61deaa7dd";
  const product = { id, revision: "3", packUnits: 24, url: "https://www.sligro.nl/p.12345.html/fixture-bottle.html" };
  const valid = { ...product, sku: "12345", regularCents: 2500, offerCents: 2100, offerStart: "2026-11-19", offerEnd: "2026-12-07" };
  const result = (results, override = {}) => ({
    source: "shah-sligro-extension", type: "SLIGRO_PRICE_PREVIEW_RESULT", requestId, results, skipped: [], ...override,
  });
  assert.equal(sligroReviewBatch(result([valid]), [product], requestId).rows.length, 1);
  for (const change of [
    { revision: "4" }, { packUnits: 6 }, { sku: "67890" },
    { offerEnd: null }, { url: product.url + "?tracking=example" }, { regularCents: 100 },
  ]) assert.equal(sligroReviewBatch(result([{ ...valid, ...change }]), [product], requestId).rows.length, 0);
  assert.equal(sligroReviewBatch(result([valid, valid]), [product], requestId).rows.length, 0);
  assert.equal(sligroReviewBatch(result([valid], { requestId: id }), [product], requestId), null);
});

test("Shah bridge waits for login, reviews verified prices, and never saves automatically", async () => {
  const id = "8b1b3e01-15b9-4bb7-b460-106ae67d4899";
  const requestId = "f3530d10-8d67-4524-b046-70b61deaa7dd";
  const url = "https://www.sligro.nl/p.12345.html/fixture-bottle.html";
  const item = { id, name: "Fixture", revision: 5, caseSize: 24, sligroUrl: url, archived: false };
  const window = { postMessage(data) { posted.push(data); }, clearTimeout() {}, setTimeout() { return 1; },
    addEventListener(_type, listener) { receive = listener; }, removeEventListener() {} };
  const location = { origin: "https://shahrestaurant.nl" };
  const posted = [], calls = [], saved = [];
  let slot = 0, receive;
  const state = [], react = {
    useState(initial) { const i = slot++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = value; }]; },
    useRef(initial) { const i = slot++; if (!(i in state)) state[i] = { current: initial }; return state[i]; },
    useEffect(effect) { const i = slot++; if (!(i in state)) state[i] = effect(); },
  };
  const stylesheet = new Proxy({}, { get: (_value, key) => String(key) });
  const filename = path.join(root, "app/admin/stock/SligroPrices.tsx");
  const mod = { exports: {} };
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const load = loader(null);
  vm.runInNewContext(compiled, {
    module: mod, exports: mod.exports, window, location, crypto: { randomUUID: () => requestId },
    require(name) {
      if (name === "react") return react;
      if (name === "../../lib/clientFetch") return { fetchJSON: async (path, init) => {
        calls.push({ path, body: JSON.parse(init.body) });
        return { response: { ok: true }, data: { items: [{ id, revision: 6 }], skipped: [] } };
      } };
      if (name === "../../lib/stock") return load("app/lib/stock.ts");
      if (name === "../../lib/stockSligro") return load("app/lib/stockSligro.ts");
      if (name.endsWith(".css")) return { __esModule: true, default: stylesheet };
      return require(name);
    },
  }, { filename });
  const render = () => { slot = 0; return mod.exports.default({ items: [item], disabled: false, lang: "en", onSaved: records => saved.push(records) }); };
  const text = value => Array.isArray(value) ? value.map(text).join("") :
    value?.props ? text(value.props.children) : ["number", "string"].includes(typeof value) ? String(value) : "";
  const button = (value, label) => {
    if (Array.isArray(value)) return value.map(part => button(part, label)).find(Boolean);
    if (!value || typeof value !== "object" || !value.props) return;
    return value.type === "button" && text(value) === label ? value : button(value.props.children, label);
  };
  button(render(), "Refresh Sligro prices").props.onClick();
  const request = posted[0];
  assert.equal(request.type, "SLIGRO_PRICE_PREVIEW_REQUEST");
  assert.equal(request.products[0].url, url);
  const deliver = (data, origin = location.origin) => receive({ data: { source: "shah-sligro-extension", requestId, ...data }, source: window, origin });
  deliver({ type: "SLIGRO_PRICE_PREVIEW_PROGRESS", state: "waiting-login" }, "https://attacker.test");
  assert.doesNotMatch(text(render()), /official Sligro tab/);
  deliver({ type: "SLIGRO_PRICE_PREVIEW_PROGRESS", state: "waiting-login" });
  assert.match(text(render()), /official Sligro tab/);
  // Feed the actual extension runner's result back into the real Shah JSX bridge.
  const { validateRequest } = await import("../extensions/shah-sligro/protocol.mjs");
  const { runPreview } = await import("../extensions/shah-sligro/run.mjs");
  let tabUrl = "", tabRemoved = false;
  await runPreview(validateRequest(request), {
    tabs: {
      async create() { return { id: 14 }; },
      async update(_id, props) { tabUrl = props.url; },
      async get() { return { status: "complete", url: tabUrl }; },
      async remove() { tabRemoved = true; },
    },
    scripting: { async executeScript() {
      return [{ result: {
        state: "rendered-product", articleLabels: ["Artikelnummer: 12345"], packLabels: ["24 flesjes x 30 cl"],
        regularPromoLabels: ["32,00"], currentPromoLabels: ["30,00"],
        offerStart: null, hasPromoLayout: true, standaloneLabels: [], promoDateLabels: ["Geldig van 19 nov t/m 7 dec"],
        depositLabels: ["Emballage: 2,40"], taxLabels: ["Alle prijzen zijn in EUR en exclusief BTW"],
      } }];
    } },
  }, deliver, new AbortController().signal, { today: () => "2026-11-24" });
  assert.equal(tabRemoved, true);
  const preview = render();
  assert.match(text(preview), /Current: Not set → Sligro: Regular €32\.00 · Offer €30\.00/);
  assert.match(text(preview), /2026-12-07/);
  assert.equal(calls.length, 0);
  button(preview, "Save reviewed prices").props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, "/api/admin/stock/sligro-prices");
  assert.equal(calls[0].body.updates[0].purchasePrice.regularCents, 3200);
  assert.equal(saved.length, 1);
  assert.match(text(render()), /Prices saved: 1\./);
});

test("Taurus Excel rows preserve distinct receipt lines and exclude corrections and personal columns",async t=>{
  const {load}=await fixture(t);
  const {parseTaurusRows}=load("app/lib/taurusStock.ts");
  const header=["Datum","Tijd","Bonnummer","Regel","Aantal","Omschrijving","Contactpersoon"];
  const first=[46351,0.85,"202611250001",2,"1","Coke Zero","not allowed"];
  const other=[new Date("2026-11-25T00:00:00Z"),0.85,"202611250001",4,"2","Peach ice tea","not allowed"];
  const results=parseTaurusRows([header,first,first,other,[46351,0,"202611250001",777777,"1","Korting btw"],["Totaal"]]);
  assert.equal(results.lines.length,2);
  assert.equal(results.ignored,1);
  assert.equal(results.lines[0].day,"2026-11-25");
  assert.equal(results.lines[1].qty,2);
  assert.doesNotMatch(JSON.stringify(results),/not allowed/);
  assert.throws(()=>parseTaurusRows([header,first,[...first.slice(0,4),"3","Coke Zero"]]),/duplicate_conflict/);
});

test("Taurus import is admin-only, previews box deductions, rejects stale stock atomically and retries once", async t=>{
  const {db,load,auth}=await fixture(t);
  await db.exec(fs.readFileSync(path.join(root,"db/migrations/20261126_shah_taurus_stock.sql"),"utf8"));
  const route=load("app/api/admin/stock/taurus/route.ts");
  const stock=await db.query("SELECT id, seed_key, revision FROM shah_stock_items");
  const soda=stock.rows.find(x=>x.seed_key==="fixture-soda");
  const zero=stock.rows.find(x=>x.seed_key==="fixture-lager-zero");
  const now=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Amsterdam",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const lines=[{day:now,receipt:"202611250001",line:2,qty:5,name:"Taurus soda",id:soda.id,rev:soda.revision},
    {day:now,receipt:"202611250001",line:4,qty:1,name:"Taurus zero",id:zero.id,rev:zero.revision}];
  const callT=async (mode,rows=lines,login=auth)=>route.POST(new NextRequest(origin+"/api/admin/stock/taurus",{method:"POST",headers:{Cookie:"etg_session="+login,"Content-Type":"application/json",Origin:origin},body:JSON.stringify({mode,rows})}));
  assert.equal((await callT("preview",lines,await token(customer))).status,403);
  assert.equal((await callT("apply",[lines[0],lines[0]])).status,400);
  const before=await callT("preview");assert.equal(before.status,200);
  assert.deepEqual((await before.json()).changes.map(x=>[x.before,x.after]),[[23,18],[10,9]]);
  assert.equal((await callT("apply",[lines[0],{...lines[1],rev:99}])).status,409);
  assert.equal((await db.query("SELECT total_units FROM shah_stock_items WHERE id=$1",[soda.id])).rows[0].total_units,23);
  const applied=await callT("apply");assert.equal(applied.status,200);assert.equal((await applied.json()).imported,2);
  const check=await db.query("SELECT cases_count,loose_count,total_units FROM shah_stock_items WHERE id=$1",[soda.id]);
  assert.deepEqual(check.rows[0],{cases_count:1,loose_count:8,total_units:18});
  assert.equal((await (await callT("apply")).json()).imported,0);
  assert.equal((await callT("apply",[{...lines[0],qty:6}])).status,409);
  const tstats=await route.GET(new NextRequest(origin+"/api/admin/stock/taurus",{headers:{Cookie:"etg_session="+auth}}));
  assert.equal(tstats.status,200);
  const data=await tstats.json();
  assert.equal(data.stats.reduce((n,x)=>n+x.units,0),6);
  assert.ok(data.mappings.some(x=>x.name==="taurus soda"&&x.id===soda.id));
});

test("Taurus parser reads a synthetic XLSX with the verified Easy4U cell types", async () => {
  const {parseTaurusRows}=loader({})("app/lib/taurusStock.ts");
  const read=require("read-excel-file/node").default;
  const p=path.join(__dirname,"fixtures/taurus-receipt-lines-synthetic.xlsx");
  const result=parseTaurusRows(await read(p));
  assert.equal(result.lines.length,2);
  assert.equal(result.lines[0].day,"2026-11-25");
  assert.equal(result.lines[0].qty,1);
  assert.equal(result.lines[1].qty,2);
  assert.equal(result.ignored,1);
  assert.doesNotMatch(JSON.stringify(result),/do not import/);
});

test("Taurus full-day parser reconciles extended amounts, duplicate lines and both discount sentinels", () => {
  const {parseTaurusSales,stockEligible}=loader({})("app/lib/taurusStock.ts");
  const heads=["Datum","Bonnummer","Regel","Aantal","Omschrijving","Prijs","BTW","Bedrag","Omschrijving omzetgroep","Contactpersoon"];
  const a=[46351,"202611250001",2,"2","Fanta X",4,9,"8,00","Drinks","private"];
  const b=[46351,"202611250001",4,"1","Dal",18,9,18,"Food","private"];
  const c=[46351,"202611250001",777777,"1","Korting 9%",-1,9,-1,"Korting","private"];
  const d=[46351,"202611250001",777778,"1","Korting 21%",-0.3,21,-0.3,"Korting","private"];
  const foot=["Totaal",null,null,null,null,null,null,"24,70"];
  const report=parseTaurusSales([heads,a,a,b,c,d,foot]);
  assert.equal(report.footerCents,2470);
  assert.deepEqual(Array.from(report.lines,x=>x.cents),[800,1800,-100,-30]);
  assert.deepEqual(Array.from(report.lines.filter(stockEligible),x=>x.name),["Fanta X","Dal"]);
  assert.doesNotMatch(JSON.stringify(report),/private|Korting 9%/);
  assert.throws(()=>parseTaurusSales([heads,a,b,c,d]),/reconcile/);
  assert.throws(()=>parseTaurusSales([heads,a,b,c,d,[...foot.slice(0,7),2470]]),/reconcile/);
  assert.throws(()=>parseTaurusSales([heads,a,[...b.slice(0,7),"bad money"],foot]),/amount/);
  assert.throws(()=>parseTaurusSales([heads,a,[46350,...b.slice(1)],c,d,foot]),/reconcile/);
});

test("Taurus sales and stock are atomic, include all items, ignore duplicates and retain late dates",async t=>{
  const {db,load,auth}=await fixture(t);
  const {stockAmsterdamDate}=load("app/lib/stock.ts");
  for(const name of ["20261126_shah_taurus_stock.sql","20261127_shah_taurus_sales.sql","20261127_shah_taurus_sales.sql"])
    await db.exec(fs.readFileSync(path.join(root,"db/migrations",name),"utf8"));
  const route=load("app/api/admin/stock/taurus/route.ts"), stats=load("app/api/admin/stock/taurus/sales/route.ts");
  const soda=(await db.query("SELECT id,name,revision FROM shah_stock_items WHERE seed_key='fixture-soda'")).rows[0];
  const zero=(await db.query("SELECT id,revision FROM shah_stock_items WHERE seed_key='fixture-lager-zero'")).rows[0];
  const today=stockAmsterdamDate(), earlier=new Date(Date.parse(today)-86400000*2).toISOString().slice(0,10);
  const date1={day:today,receipt:"777777001"}, date2={day:earlier,receipt:"777777002"};
  const drink={...date1,line:2,name:"Fanta X",qty:2,group:"Drinks",cents:800,adjustment:false};
  const food={...date1,line:4,name:"Dal",qty:1,group:"Food",cents:1800,adjustment:false};
  const disc={...date1,line:777777,name:"Adjustment",qty:1,group:"",cents:-200,adjustment:true};
  const returnLine={...date1,line:6,name:"Fanta X",qty:-1,group:"Drinks",cents:-400,adjustment:false};
  const all=[drink,food,disc,returnLine];
  const toStock=({day,receipt,line,name,qty})=>({day,receipt,line,name,qty});
  const drinkStock=toStock(drink);
  const row={...drinkStock,id:soda.id,rev:soda.revision};
  const payload={rows:[row],sales:{lines:all,footerCents:2000}};
  const session=await token(customer);
  const get=(url,login=auth)=>new NextRequest(origin+url,{headers:{Cookie:"etg_session="+login}});
  const tpath="/api/admin/stock/taurus", spath=tpath+"/sales";
  const request=(mode,p=payload,login=auth,from=origin)=>route.POST(new NextRequest(origin+tpath,{method:"POST",headers:{Cookie:"etg_session="+login,"Content-Type":"application/json",Origin:from},body:JSON.stringify({mode,...mode==="apply"?{confirmed:true}:{},...p})}));
  const body=async response=>({status:response.status,body:await response.json()});
  assert.equal((await request("preview",payload,session)).status,403);
  assert.equal((await request("preview",payload,auth,"https://other.test")).status,403);
  assert.equal((await stats.GET(get(spath,session))).status,403);
  assert.equal((await request("apply",{...payload,confirmed:false})).status,400);
  assert.equal((await request("preview",{...payload,sales:{...payload.sales,footerCents:0}})).status,400);

  const preview=await body(await request("preview"));
  assert.equal(preview.status,200);
  assert.deepEqual(preview.body.saleSummary,{cents:2000,receipts:1,lines:4,duplicates:0});
  assert.deepEqual(preview.body.changes.map(x=>[x.before,x.after]),[[23,21]]);
  assert.equal((await request("apply",{...payload,rows:[{...row,rev:999}]})).status,409);
  assert.equal((await db.query("SELECT count(*)::int AS n FROM shah_taurus_sale_lines")).rows[0].n,0);
  assert.equal((await db.query("SELECT total_units FROM shah_stock_items WHERE id=$1",[soda.id])).rows[0].total_units,23);
  assert.deepEqual(await body(await request("apply")),{status:200,body:{imported:1,salesImported:4}});
  assert.deepEqual(await body(await request("apply")),{status:200,body:{imported:0,salesImported:0}});

  const duplicateChanged={...payload,sales:{lines:[{...drink,cents:900},food,disc,returnLine],footerCents:2100}};
  assert.equal((await request("preview",duplicateChanged)).status,409);
  assert.equal((await request("apply",duplicateChanged)).status,409);

  const extra={...date1,line:8,name:"Water",qty:11,group:"Drinks",cents:300,adjustment:false};
  const shortage={...date1,line:8,name:"Water",qty:11,id:zero.id,rev:zero.revision};
  const overlap={rows:[row,shortage],sales:{lines:[...all,extra],footerCents:2300}};
  assert.equal((await request("apply",overlap)).status,409);
  assert.equal((await db.query("SELECT count(*)::int AS n FROM shah_taurus_sale_lines")).rows[0].n,4);
  assert.deepEqual(await body(await request("apply",{...overlap,rows:[row]})),{status:200,body:{imported:0,salesImported:1}});

  const pastDrink={...drink,...date2}, pastFood={...food,...date2};
  const past={rows:[],sales:{lines:[pastDrink,pastFood],footerCents:2600}};
  assert.deepEqual(await body(await request("apply",past)),{status:200,body:{imported:0,salesImported:2}});
  assert.equal((await db.query("SELECT total_units FROM shah_stock_items WHERE id=$1",[soda.id])).rows[0].total_units,21);
  const saved=await (await route.GET(get(tpath))).json();
  assert.ok(saved.mappings.some(x=>x.name==="fanta x"&&x.id===soda.id));

  const result=await body(await stats.GET(get(spath+"?days=7&day="+today)));
  assert.equal(result.status,200);
  assert.deepEqual(result.body.daily,[
    {day:earlier,cents:2600,receipts:1,adjustments:0},
    {day:today,cents:2300,receipts:1,adjustments:-200},
  ]);
  assert.ok(result.body.products.some(x=>x.name==="Dal"&&x.cents===1800));
  assert.ok(result.body.products.some(x=>x.name===soda.name&&x.cents===800));
  assert.ok(result.body.products.some(x=>x.name==="Fanta X"&&x.units===-1));
  assert.ok(!result.body.products.some(x=>x.name==="Adjustment"));
  // Reuse the saved alias on another receipt; then edit it on a new line
  // of an overlapping export. The first receipt remains on the first product.
  const fresh={...drink,receipt:"777777009"};
  const freshStock=toStock(fresh);
  const applyFresh=await body(await request("apply",{
    rows:[{...freshStock,id:saved.mappings.find(x=>x.name==="fanta x").id,rev:soda.revision+1}],
    sales:{lines:[fresh],footerCents:800},
  }));
  assert.deepEqual(applyFresh,{status:200,body:{imported:1,salesImported:1}});
  const newLine={...fresh,line:4};
  const edited=await body(await request("apply",{
    rows:[{...freshStock,id:zero.id,rev:zero.revision},{...freshStock,line:4,id:zero.id,rev:zero.revision}],
    sales:{lines:[fresh,newLine],footerCents:1600},
  }));
  assert.deepEqual(edited,{status:200,body:{imported:1,salesImported:1}});
  const appliedLines=(await db.query("SELECT line,item_id FROM shah_taurus_stock_lines WHERE receipt='777777009' ORDER BY line")).rows;
  assert.deepEqual(appliedLines,[{line:2,item_id:soda.id},{line:4,item_id:zero.id}]);
  assert.ok((await (await route.GET(get(tpath))).json()).mappings.some(x=>x.name==="fanta x"&&x.id===zero.id));
});

test("Taurus sales reads a genuine XLSX shape locally, including the discount footer", async () => {
  const {parseTaurusSales}=loader({})("app/lib/taurusStock.ts");
  const read=require("read-excel-file/node").default;
  const parsed=parseTaurusSales(await read(path.join(__dirname,"fixtures/taurus-sales-synthetic.xlsx")));
  assert.equal(parsed.footerCents,2470);
  assert.equal(parsed.lines.length,4);
  assert.equal(parsed.lines.filter(x=>x.adjustment).length,2);
  assert.equal(parsed.lines[0].name,"Fanta X");
  assert.doesNotMatch(JSON.stringify(parsed),/private dummy/);
});

test("Taurus Stock UI asks before changing counts and reports the confirmed result",async t=>{
  const {db,load,auth}=await fixture(t);
  for(const file of ["20261126_shah_taurus_stock.sql","20261127_shah_taurus_sales.sql"])
    await db.exec(fs.readFileSync(path.join(root,"db/migrations",file),"utf8"));
  const route=load("app/api/admin/stock/taurus/route.ts");
  const {items}=await (await call(load("app/api/admin/stock/route.ts"),"GET",auth)).json();
  const item=items.find(x=>x.name==="Fixture soda");
  const source=path.join(root,"app/admin/stock/TaurusStock.tsx");
  const file=path.join(root,"scripts/fixtures/taurus-sales-synthetic.xlsx");
  const parsed=await require("read-excel-file/node").default(file);
  const snapshot=load("app/lib/taurusStock.ts");
  const state=[], calls=[], work=[];
  let hook=0, saves=0;
  const react={
    useState(initial){const i=hook++;if(!(i in state))state[i]=initial;return [state[i],v=>{state[i]=typeof v==="function"?v(state[i]):v;}];},
    useMemo(f){return f();},
    useEffect(){},
  };
  const mod={exports:{}};
  const code=ts.transpileModule(fs.readFileSync(source,"utf8"),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2022},
  }).outputText;
  vm.runInNewContext(code,{
    module:mod,exports:mod.exports,
    require(name){
      if(name==="react")return react;
      if(name==="read-excel-file")return {__esModule:true,default:async()=>parsed};
      if(name.endsWith(".css"))return {__esModule:true,default:new Proxy({},{get:(_o,key)=>String(key)})};
      if(name.endsWith("/taurusStock"))return snapshot;
      return require(name);
    },
    fetch:(url,init)=>{
      const body=JSON.parse(init.body);calls.push(body);
      const result=route.POST(new NextRequest(origin+url,{method:"POST",
        headers:{...init.headers,Cookie:"etg_session="+auth,Origin:origin},body:init.body}));
      work.push(result);return result;
    },
  },{filename:source});
  const render=()=>{hook=0;return mod.exports.default({items:[item],lang:"en",disabled:false,onSaved:()=>saves++});};
  const texts=x=>Array.isArray(x)?x.map(texts).join(""):x?.props?texts(x.props.children):typeof x==="string"||typeof x==="number"?String(x):"";
  function find(x,f){
    if(Array.isArray(x))return x.map(y=>find(y,f)).find(Boolean);
    if(!x?.props)return;
    return f(x)?x:find(x.props.children,f);
  }
  const click=(tree,label)=>find(tree,x=>x.type==="button"&&texts(x)===label);
  const spin=async predicate=>{
    for(let i=0;i<100;i++){if(predicate())return;await new Promise(r=>setTimeout(r,5));}
    assert.fail("Taurus UI state did not update");
  };
  find(render(),x=>x.type==="input"&&x.props.type==="file").props.onChange({target:{files:[{name:"taurus-sales-synthetic.xlsx",size:2024}]},currentTarget:{}});
  await spin(()=>Boolean(find(render(),x=>x.props["aria-label"]==="Match to Stock product: Fanta X")));
  find(render(),x=>x.props["aria-label"]==="Match to Stock product: Fanta X").props.onChange({target:{value:item.id}});
  click(render(),"Preview import").props.onClick();
  await spin(()=>Boolean(click(render(),"Confirm import")));
  assert.match(texts(render()),/Before: 23 → After: 21/);
  assert.equal(click(render(),"Confirm import").props.disabled,true);
  assert.equal(calls.length,1);
  assert.deepEqual(calls[0].rows.map(x=>x.name),["Fanta X"]);
  assert.equal(calls[0].sales.lines.length,4);
  assert.doesNotMatch(JSON.stringify(calls[0]),/private dummy/);
  const confirm=find(render(),x=>x.type==="label"&&texts(x).includes("This file contains only Shah sales"));
  find(confirm,x=>x.type==="input").props.onChange({target:{checked:true}});
  assert.equal(click(render(),"Confirm import").props.disabled,false);
  click(render(),"Confirm import").props.onClick();
  await spin(()=>saves===1);
  assert.match(texts(render()),/Sales lines saved: 4 · stock lines: 1/);
  assert.equal((await db.query("SELECT total_units FROM shah_stock_items WHERE id=$1",[item.id])).rows[0].total_units,21);
  assert.equal((await db.query("SELECT sum(cents)::int n FROM shah_taurus_sale_lines")).rows[0].n,2470);
  await Promise.all(work);
});
