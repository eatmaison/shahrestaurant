/* eslint-disable @typescript-eslint/no-require-imports -- Node-only transport tests compile local TypeScript without contacting a database. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const plain = value => JSON.parse(JSON.stringify(value));

function modules(env = {}, neon = () => { throw new Error("No database driver call allowed"); }) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(root, file);
    if (/[/\\](db|serverStore)\.ts$/.test(file)) throw new Error("Side-effecting database imports are forbidden");
    if (cache.has(file)) return cache.get(file).exports;
    const compiledModule = { exports: {} }; cache.set(file, compiledModule);
    const resolve = name => {
      if (name === "server-only") return {};
      if (name === "@neondatabase/serverless") return { neon };
      if (!name.startsWith(".")) return require(name);
      const base = path.resolve(path.dirname(file), name);
      const target = [base, `${base}.ts`, `${base}.tsx`].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      if (!target) throw new Error(`Missing local module ${name}`);
      return load(target);
    };
    const source = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    vm.runInNewContext(source, { module: compiledModule, exports: compiledModule.exports, require: resolve, process: { env }, URL, Buffer, AbortController, setTimeout, clearTimeout, queueMicrotask, fetch: () => { throw new Error("Network forbidden in catalogue tests"); } }, { filename: file });
    return compiledModule.exports;
  }
  return load;
}

const productRows = () => [
  { id: "mock-curry", brand: "tandoor", category: "Curries", name: "Mock curry", description: "Mock English", description_nl: "Mock Nederlands", price: "26.00", sort_order: 3, image: "/mock.webp", ingredients: ["mock ingredient"], allergens: ["mock allergen"] },
  { id: "mock-lassi", brand: "tandoor", category: "Lassi", name: "Mock lassi", description: "Mock drink", price: "5.00", sort_order: 4 },
];
const brandRows = () => [{ id: "tandoor", name: "Mock brand", logo: "/mock.svg", categories: JSON.stringify([{ name: "Curries", icon: "bowl-rice" }, { name: "Lassi", icon: "mug-hot" }]) }];

test("only bounded SELECTs are sent in a read-only transaction", async () => {
  const calls = [];
  const load = modules({ DATABASE_URL: "postgresql://mock:mock@catalogue-test.invalid/mock" }, () => ({
    query(text, params) { return { text, params }; },
    async transaction(queries, options) { calls.push({ queries, options }); return [productRows(), brandRows()]; },
  }));
  const result = await load("app/lib/publicCatalog.server.ts").loadPublicCatalog();
  assert(result); assert.equal(calls.length, 1); assert.equal(calls[0].queries.length, 2);
  for (const query of calls[0].queries) {
    assert.match(query.text, /^SELECT\s/); assert.match(query.text, /LIMIT \$1$/);
    assert.doesNotMatch(query.text, /\b(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|CALL)\b/i);
  }
  assert.deepEqual(plain(calls[0].queries.map(query => query.params)), [[1001], [101]]);
  assert.equal(calls[0].options.readOnly, true); assert.equal(calls[0].options.isolationLevel, "RepeatableRead");
  assert.equal(calls[0].options.fetchOptions.cache, "no-store"); assert(calls[0].options.fetchOptions.signal instanceof AbortSignal);
});

test("existing mapper keeps prices/copy and normalizes legacy drinks without mutating rows", async () => {
  const load = modules(), rows = productRows(), brands = brandRows(), before = JSON.stringify([rows, brands]);
  const result = await load("app/lib/catalogSnapshot.ts").readCatalogSnapshot(async () => [rows, brands]);
  assert(result); assert.equal(result.products[0].price, 26); assert.equal(result.products[0].descriptionNl, "Mock Nederlands");
  assert.equal(result.products[1].category, "Drinks"); assert.equal(result.products[1].subcategory, "Indian Lassi");
  assert.equal(result.brands[0].categories[0].name, "Curries"); assert(result.brands[0].categories.some(category => category.name === "Drinks"));
  assert.equal(JSON.stringify([rows, brands]), before);
  assert.deepEqual(plain(result.products[0]), plain(load("app/lib/mappers.ts").rowToProduct(rows[0])));
});

test("unconfigured, malformed and loopback URLs never construct a driver", async () => {
  for (const DATABASE_URL of [undefined, "invalid", "postgresql://mock@127.0.0.1:1/mock", "postgresql://mock@localhost/mock", "postgresql://mock@[::1]/mock"]) {
    let called = false;
    const result = await modules({ DATABASE_URL }, () => { called = true; throw new Error("Unexpected driver"); })("app/lib/publicCatalog.server.ts").loadPublicCatalog();
    assert.equal(result, null); assert.equal(called, false);
  }
});

test("empty is authoritative, while failed, malformed or oversized results are unavailable", async () => {
  const { readCatalogSnapshot } = modules()("app/lib/catalogSnapshot.ts");
  assert.deepEqual(plain(await readCatalogSnapshot(async () => [[], []])), { products: [], brands: [] });
  assert.equal(await readCatalogSnapshot(async () => { throw new Error("Mock missing table"); }), null);
  for (const result of [null, [[], [] , []], [[{}], brandRows()], [productRows(), [{ ...brandRows()[0], categories: "broken JSON" }]], [productRows(), []], [Array.from({ length: 1001 }, () => productRows()[0]), brandRows()], [[], Array.from({ length: 101 }, () => brandRows()[0])]]) {
    assert.equal(await readCatalogSnapshot(async () => result), null);
  }
  for (const price of ["NaN", "Infinity", "-1"]) assert.equal(await readCatalogSnapshot(async () => [[{ ...productRows()[0], price }], brandRows()]), null);
  assert.equal(await readCatalogSnapshot(async () => [[{ ...productRows()[0], description: "x".repeat(512001) }], brandRows()]), null);
});

test("timeout aborts even a transport that never settles", async () => {
  const { readCatalogSnapshot } = modules()("app/lib/catalogSnapshot.ts");
  let signal;
  const result = await readCatalogSnapshot((_queries, current) => { signal = current; return new Promise(() => {}); }, 5);
  assert.equal(result, null); assert.equal(signal.aborted, true);
});

test("ready empty replaces snapshot; later refresh/error never revives it", () => {
  const { catalogForDisplay, initialCatalogSelection } = modules()("app/lib/catalogDisplay.ts");
  const snapshot = { products: [{ id: "snapshot", brand: "tandoor", category: "Curries" }], brands: [{ id: "tandoor", categories: [{ name: "Curries" }] }] };
  assert.equal(catalogForDisplay(snapshot, [], [], "loading", false).usingInitial, true);
  assert.equal(catalogForDisplay(snapshot, [], [], "error", false).usingInitial, true);
  assert.deepEqual(catalogForDisplay(snapshot, [], [], "ready", false).products, []);
  assert.equal(catalogForDisplay(snapshot, [], [], "ready", false).usingInitial, false);
  assert.equal(catalogForDisplay(snapshot, [], [], "loading", true).usingInitial, false);
  assert.equal(catalogForDisplay(snapshot, [], [], "error", true).usingInitial, false);
  assert.equal(catalogForDisplay(null, [], [], "loading", false).usingInitial, false);
  assert.deepEqual(plain(initialCatalogSelection(snapshot)), { brand: "tandoor", category: "Curries" });
});
