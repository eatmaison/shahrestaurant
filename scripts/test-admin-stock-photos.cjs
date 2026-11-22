/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node tests load the TypeScript handlers. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { NextRequest } = require("next/server");
const { PGlite } = require("@electric-sql/pglite");
const { SignJWT } = require("jose");
const sharp = require("sharp");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const origin = "http://stock.test";
const secret = "local-fixture-secret-not-used-outside-this-test";
const admin = "22e4b2d0-6cfe-4ec6-ab18-08017518d0bd";
const customer = "42e4b2d0-6cfe-4ec6-ab18-08017518d0bd";
const item = "52e4b2d0-6cfe-4ec6-ab18-08017518d0bd";
const unknown = "62e4b2d0-6cfe-4ec6-ab18-08017518d0bd";
const endpoint = origin + "/api/admin/stock/photos";
const migrate = name => fs.readFileSync(path.join(root, "db/migrations", name), "utf8");

function loadRoutes(db) {
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
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    vm.runInNewContext(compiled, {
      module: mod, exports: mod.exports,
      require: name => name.startsWith(".") ? load(path.resolve(path.dirname(file), name + ".ts")) : require(name),
      URL, Response, TextEncoder, Uint8Array, Buffer,
      process: { env: { APP_URL: origin, SESSION_SECRET: secret, NODE_ENV: "production" } },
      fetch: () => { throw new Error("External fetch is forbidden"); },
    }, { filename: file });
    return mod.exports;
  }
  return { index: load("app/api/admin/stock/photos/route.ts"), image: load("app/api/admin/stock/photos/[id]/route.ts") };
}
const token = id => new SignJWT({ userId: id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("10m")
  .sign(new TextEncoder().encode(secret));

async function setup(t, withPhotos = true) {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec("CREATE TABLE users (id uuid PRIMARY KEY, role text NOT NULL)");
  await db.query("INSERT INTO users VALUES ($1, 'admin'), ($2, 'user')", [admin, customer]);
  await db.exec(migrate("20261122_shah_stock.sql"));
  await db.query("INSERT INTO shah_stock_items (id, name, category, cases_count, case_size, loose_count) VALUES ($1, 'Fixture juice', 'soft-drinks', 2, 8, 4)", [item]);
  if (withPhotos) await db.exec(migrate("20261122_shah_stock_photos.sql"));
  return { db, ...loadRoutes(db), adminToken: await token(admin), customerToken: await token(customer) };
}

function call(route, method, cookie, { id = item, version = "", body, headers = {} } = {}) {
  const request = new NextRequest(route.GET && !route.PUT ? endpoint : endpoint + "/" + id + "?v=" + version, {
    method,
    headers: {
      ...(cookie ? { Cookie: "etg_session=" + cookie } : {}),
      ...(method === "GET" ? {} : { Origin: origin }),
      ...(method === "PUT" ? { "Content-Type": "image/png" } : {}),
      ...headers,
    },
    ...(body ? { body, duplex: "half" } : {}),
  });
  return route[method](request, { params: Promise.resolve({ id }) });
}

const makePng = (background, width = 400, height = 200) => sharp({
  create: { width, height, channels: 3, background },
}).png().withMetadata().toBuffer();

test("photo index and all image operations require a current admin; writes reject cross-origin", async t => {
  const { db, index, image, adminToken, customerToken } = await setup(t);
  const body = await makePng("#111");
  for (const auth of [undefined, "unverified", customerToken]) {
    assert.equal((await call(index, "GET", auth)).status, 403);
    assert.equal((await call(image, "GET", auth)).status, 403);
    assert.equal((await call(image, "PUT", auth, { body })).status, 403);
    assert.equal((await call(image, "DELETE", auth)).status, 403);
  }
  for (const headers of [{ Origin: "https://elsewhere.test" }, { "Sec-Fetch-Site": "cross-site" }]) {
    assert.equal((await call(image, "PUT", adminToken, { body, headers })).status, 403);
    assert.equal((await call(image, "DELETE", adminToken, { headers })).status, 403);
  }
  await db.query("UPDATE users SET role = 'user' WHERE id = $1", [admin]);
  assert.equal((await call(index, "GET", adminToken)).status, 403);
  assert.equal((await call(image, "PUT", adminToken, { body })).status, 403);
});

test("rejects oversized, unsupported, spoofed and invalid images without changing stock", async t => {
  const { db, index, image, adminToken } = await setup(t);
  const huge = Buffer.alloc(768 * 1024 + 1);
  const valid = await makePng("#222");
  const oversizedStream = new ReadableStream({
    start(controller) {
      controller.enqueue(huge.subarray(0, 400_000));
      controller.enqueue(huge.subarray(400_000));
      controller.close();
    },
  });
  assert.equal((await call(image, "PUT", adminToken, { body: huge, headers: { "Content-Length": String(huge.length) } })).status, 413);
  assert.equal((await call(image, "PUT", adminToken, { body: oversizedStream })).status, 413);
  assert.equal((await call(image, "PUT", adminToken, { body: valid, headers: { "Content-Type": "image/svg+xml" } })).status, 415);
  assert.equal((await call(image, "PUT", adminToken, { body: valid, headers: { "Content-Type": "image/jpeg" } })).status, 422);
  assert.equal((await call(image, "PUT", adminToken, { body: Buffer.from("not an image") })).status, 422);
  assert.equal((await call(image, "PUT", adminToken, { body: await makePng("#fff", 5000, 5000) })).status, 422);
  assert.equal((await call(image, "PUT", adminToken, { body: valid, id: unknown })).status, 404);
  assert.deepEqual(await (await call(index, "GET", adminToken)).json(), { photos: [] });
  assert.deepEqual((await db.query("SELECT total_units, revision FROM shah_stock_items")).rows, [{ total_units: 20, revision: 1 }]);
});

test("add, load, replace and remove; only version IDs in index and counts remain untouched", async t => {
  const { db, index, image, adminToken } = await setup(t);
  const first = await call(image, "PUT", adminToken, { body: await makePng("#4e9") });
  assert.equal(first.status, 200);
  const version1 = (await first.json()).version;
  assert.match(version1, /^[0-9a-f-]+$/);
  let listed = await call(index, "GET", adminToken);
  assert.deepEqual(await listed.json(), { photos: [{ id: item, version: version1 }] });
  const response = await call(image, "GET", adminToken, { version: version1 });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/webp");
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  const result = Buffer.from(await response.arrayBuffer());
  assert.ok(result.length < 128 * 1024);
  const metadata = await sharp(result).metadata();
  assert.deepEqual([metadata.format, metadata.width, metadata.height, metadata.exif], ["webp", 192, 96, undefined]);
  const replacement = await call(image, "PUT", adminToken, { body: await makePng("#b45") });
  assert.equal(replacement.status, 200);
  const version2 = (await replacement.json()).version;
  assert.notEqual(version1, version2);
  assert.equal((await call(image, "GET", adminToken, { version: version1 })).status, 404);
  assert.equal((await call(image, "GET", adminToken, { version: version2 })).status, 200);
  await db.exec(migrate("20261122_shah_stock_photos.sql"));
  listed = await call(index, "GET", adminToken);
  assert.deepEqual(await listed.json(), { photos: [{ id: item, version: version2 }] });
  assert.equal((await call(image, "DELETE", adminToken)).status, 200);
  assert.equal((await call(image, "GET", adminToken, { version: version2 })).status, 404);
  listed = await call(index, "GET", adminToken);
  assert.deepEqual(await listed.json(), { photos: [] });
  assert.deepEqual((await db.query("SELECT total_units, revision FROM shah_stock_items")).rows, [{ total_units: 20, revision: 1 }]);
});

test("missing optional photo migration leaves stock intact and returns a usable error", async t => {
  const { db, index, adminToken } = await setup(t, false);
  const response = await call(index, "GET", adminToken);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "migration_required" });
  assert.deepEqual((await db.query("SELECT total_units, revision FROM shah_stock_items")).rows, [{ total_units: 20, revision: 1 }]);
});
