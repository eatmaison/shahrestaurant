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
      URL, Response, TextEncoder,
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
  if (migrate) { await db.exec(migration); await insertFixture(db); await db.exec(categoryMigration); }
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
  const { stockValues, visibleStockItems, stockUnits, stockCategoryLabel, STOCK_MAX_COUNT, STOCK_MAX_CASE_SIZE } =
    loader(null)("app/lib/stock.ts");
  const libs = { stockValues, visibleStockItems, stockUnits, stockCategoryLabel, STOCK_MAX_COUNT, STOCK_MAX_CASE_SIZE };
  const item = (id, name, cases, caseSize, loose) => ({
    id, name, category: "beer", cases, caseSize, loose, totalUnits: stockUnits(cases, caseSize, loose), revision: 1, archived: false,
  });
  const sourceItems = [item("a", "A bottle", 1, 12, 0), item("b", "B bottle", 2, 12, 0)];
  const state = [], effects = [], calls = [];
  let slot = 0, reject = true;
  const react = {
    useState(initial) {
      const i = slot++;
      if (!(i in state)) state[i] = initial;
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

  render(); effects.shift()(); await tick();
  const order = ["Edit count: A bottle", "Edit count: B bottle"];
  let tree = render();
  assert.deepEqual(countButtons(tree), order);
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
