/* eslint-disable @typescript-eslint/no-require-imports -- Synthetic PostgreSQL and API tests never connect to production. */
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), ts = require("typescript");
const { PGlite } = require("@electric-sql/pglite"), { NextRequest, NextResponse } = require("next/server");
const root = path.resolve(__dirname, "..");
function load(file, stubs = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", code)(name => Object.hasOwn(stubs, name) ? stubs[name] : require(name), mod, mod.exports);
  return mod.exports;
}
const order = load("app/lib/brandCategoryOrder.ts"), views = load("app/lib/adminView.ts");
const categories = [
  { name: "Soups", icon: "mug-hot" }, { name: "Vegetarian Starters", icon: "leaf" },
  { name: "Tandoori Starters", icon: "fire" }, { name: "Curries", icon: "bowl-food", subcategories: [{ name: "Jalfrezi", icon: "utensils" }] },
  { name: "Drinks", icon: "glass-water" },
];
const names = rows => rows.map(row => row.name);
const input = extra => ({ brandId: "tandoor", name: "Tandoori Starters", targetName: "Soups", placement: "before", expectedOrder: names(categories), ...extra });
async function database() {
  const db = new PGlite();
  await db.exec("CREATE TABLE brands(id text PRIMARY KEY,name text,logo text,categories jsonb); CREATE TABLE products(id text,brand text,category text,price numeric);");
  await db.query("INSERT INTO brands VALUES ($1,$2,$3,$4::jsonb)", ["tandoor", "Shah Restaurant", "/original.svg", JSON.stringify(categories)]);
  await db.query("INSERT INTO brands VALUES ('other','Other','','[{\"name\":\"Wraps\",\"icon\":\"wrap\"}]')");
  await db.query("INSERT INTO products VALUES ('existing','tandoor','Tandoori Starters',25.95)");
  return db;
}

test("Category moves preserve nested menus and objects, support either direction and reject unknown/duplicate entries", () => {
  const before = JSON.stringify(categories), next = order.moveMenuCategory(categories, "Tandoori Starters", "Soups", "before");
  assert.deepEqual(names(next), ["Tandoori Starters", "Soups", "Vegetarian Starters", "Curries", "Drinks"]);
  assert.equal(next[0], categories[2]); assert.equal(JSON.stringify(categories), before);
  assert.deepEqual(names(order.moveMenuCategory(next, "Tandoori Starters", "Drinks", "after")), ["Soups", "Vegetarian Starters", "Curries", "Drinks", "Tandoori Starters"]);
  assert.equal(order.moveMenuCategory(categories, "Unknown", "Soups", "before"), undefined);
  assert.equal(order.moveMenuCategory([...categories, categories[0]], "Soups", "Drinks", "after"), undefined);
  assert.deepEqual(order.moveMenuCategory(categories, "Soups", "Soups", "before"), categories);
});

test("Reordering PostgreSQL JSON persists across reads without changing products, brands, logos or nested subcategories", async () => {
  const db = await database();
  try {
    const query = async (text, values) => (await db.query(text, values)).rows;
    const other = (await db.query("SELECT * FROM brands WHERE id='other'")).rows;
    const products = (await db.query("SELECT * FROM products")).rows;
    const result = await order.moveBrandCategory(query, input()); assert.equal(result.ok, true);
    const saved = (await db.query("SELECT * FROM brands WHERE id='tandoor'")).rows[0];
    assert.equal(saved.categories[0].name, "Tandoori Starters"); assert.equal(saved.logo, "/original.svg"); assert.equal(saved.name, "Shah Restaurant");
    assert.deepEqual(saved.categories.find(c => c.name === "Curries"), categories[3]);
    assert.deepEqual((await db.query("SELECT * FROM products")).rows, products);
    assert.deepEqual((await db.query("SELECT * FROM brands WHERE id='other'")).rows, other);
    assert.equal((await order.moveBrandCategory(query, input())).error, "menuChanged");
    assert.equal((await order.moveBrandCategory(query, input({ brandId: "missing" }))).error, "invalidInput");
    assert.equal((await order.moveBrandCategory(query, input({ name: "missing", expectedOrder: names(saved.categories) }))).error, "invalidInput");
  } finally { await db.close(); }
});

test("A concurrent icon edit between read and write is preserved and reported as a conflict", async () => {
  const db = await database(); let raced = false;
  try {
    const query = async (text, values) => {
      const rows = (await db.query(text, values)).rows;
      if (text.startsWith("SELECT") && !raced) {
        raced = true;
        await db.query("UPDATE brands SET categories=jsonb_set(categories,'{0,icon}','\"new-icon\"'::jsonb) WHERE id='tandoor'");
      }
      return rows;
    };
    assert.equal((await order.moveBrandCategory(query, input())).error, "menuChanged");
    const saved = (await db.query("SELECT categories FROM brands WHERE id='tandoor'")).rows[0].categories;
    assert.deepEqual(names(saved), names(categories)); assert.equal(saved[0].icon, "new-icon");
  } finally { await db.close(); }
});

test("Order API rejects guests, ordinary users, foreign origins and malformed data before catalogue queries", async () => {
  let user = null, queries = 0, limited = false;
  const api = load("app/api/brands/categories/order/route.ts", {
    "../../../../lib/serverStore": { getCurrentUser: async () => user },
    "../../../../lib/db": { sql: { query: async () => { queries++; throw Error("Unexpected catalogue query"); } } },
    "../../../../lib/brandCategoryOrder": order,
    "../../../../lib/rateLimit": { enforceRateLimit: () => limited ? NextResponse.json({ error: "rate" }, { status: 429 }) : null },
  });
  const req = (body = input(), origin = "http://localhost:3397") => new NextRequest("http://localhost:3397/api/brands/categories/order", { method: "POST", headers: { origin, host: "localhost:3397" }, body: typeof body === "string" ? body : JSON.stringify(body) });
  assert.equal((await api.POST(req())).status, 401); user = { role: "user" }; assert.equal((await api.POST(req())).status, 403);
  user = { role: "admin" }; assert.equal((await api.POST(req(input(), "https://untrusted.invalid"))).status, 403);
  for (const value of ["{", input({ placement: "sideways" }), input({ expectedOrder: ["Soups", "Soups"] }), input({ expectedOrder: [] }), { ...input(), role: "admin" }]) assert.equal((await api.POST(req(value))).status, 400);
  assert.equal((await api.POST(req(" ".repeat(40_001)))).status, 413); limited = true; assert.equal((await api.POST(req())).status, 429);
  assert.equal(queries, 0);
});

test("Authorized API persists valid moves, reports stale order as 409 and retains no-store responses", async () => {
  const db = await database();
  try {
    const api = load("app/api/brands/categories/order/route.ts", {
      "../../../../lib/serverStore": { getCurrentUser: async () => ({ role: "admin" }) },
      "../../../../lib/db": { sql: { query: async (text, values) => (await db.query(text, values)).rows } },
      "../../../../lib/brandCategoryOrder": order,
      "../../../../lib/rateLimit": { enforceRateLimit: () => null },
    });
    const req = () => new NextRequest("http://localhost:3397/api/brands/categories/order", { method: "POST", headers: { host: "localhost:3397", origin: "http://localhost:3397" }, body: JSON.stringify(input()) });
    const success = await api.POST(req()); assert.equal(success.status, 200); assert.equal((await success.json()).categories[0].name, "Tandoori Starters");
    assert.equal(success.headers.get("cache-control"), "private, no-store"); assert.equal((await api.POST(req())).status, 409);
  } finally { await db.close(); }
});

test("Product workspace selects its lean bootstrap without loading orders, customer lists or reservations", async () => {
  assert.equal(views.adminDataView("/admin/products"), "products"); assert.equal(views.parseAdminDataView("products"), "products");
  const file = path.join(root, "app/lib/serverStore.ts"), source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const fn = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "bootstrap");
  const queries = [], sql = { query: async text => { queries.push(text); if (/SELECT.*(?:FROM users|FROM orders|FROM reservations|FROM payments|FROM vip_requests)/i.test(text)) throw Error("Private list queried by product workspace"); return []; } };
  const stubs = { ensureReady: async () => {}, getCurrentUser: async () => ({ id: "synthetic-admin", role: "admin" }), backfillPaymentAttemptOrders: async () => {}, getOrCreateVisitorId: async () => "synthetic-session", SITE_ID: "tandoor", sql, loadBrands: async () => [{ id: "tandoor", categories }], loadRestaurantStatus: async () => ({}), rowToProduct: x => x, rowToReview: x => x };
  const code = ts.transpileModule(fn.getText(source), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} }; new Function(...Object.keys(stubs), "exports", code)(...Object.values(stubs), mod.exports);
  const result = await mod.exports.bootstrap("products"); assert.equal(result.adminView, "products"); assert.equal(result.brands.length, 1);
  for (const key of ["orders", "users", "vipRequests", "vipPurchases", "reservations", "recentVisitors"]) assert.deepEqual(result[key], []);
  assert(queries.some(text => /FROM products/.test(text)));
});
