const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { PGlite } = require('@electric-sql/pglite');
const { NextRequest } = require('next/server');

function loadTypeScript(file, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  const wrapper = vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file });
  wrapper(name => Object.hasOwn(mocks, name) ? mocks[name] : require(name), mod, mod.exports);
  return mod.exports;
}

(async () => {
  const root = path.resolve(__dirname, '..');
  const names = loadTypeScript(path.join(root, 'app/lib/brandNames.ts'));
  const db = new PGlite();
  let queries = 0, user = null;
  const query = async (text, values) => { queries++; return (await db.query(text, values)).rows; };
  try {
    await db.exec(`CREATE TABLE brands(id text PRIMARY KEY,name text NOT NULL,logo text,categories jsonb);
      CREATE TABLE products(id text PRIMARY KEY,brand text REFERENCES brands(id));
      INSERT INTO brands VALUES('tandoor','The Tandoor Company','/logo.svg','[{"name":"Mains"}]'),('eattogo','EatToGo','','[]');
      INSERT INTO products VALUES('dish','tandoor');`);
    const valid = names.brandNameSchema.parse({ brandId: 'tandoor', name: '  Shah Restaurant  ', expectedName: 'The Tandoor Company' });
    assert.equal(valid.name, 'Shah Restaurant');
    for (const name of ['', '  ', 'x'.repeat(61), 'bad\nname']) assert.equal(names.brandNameSchema.safeParse({ ...valid, name }).success, false);

    const route = loadTypeScript(path.join(root, 'app/api/brands/name/route.ts'), {
      '../../../lib/serverStore': { getCurrentUser: async () => user },
      '../../../lib/db': { sql: { query } },
      '../../../lib/brandNames': names,
      '../../../lib/rateLimit': { enforceRateLimit: () => null },
    });
    const request = (body, origin = 'http://localhost:3395') => new NextRequest('http://localhost:3395/api/brands/name', { method: 'POST', headers: { host: 'localhost:3395', origin, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const before = queries;
    assert.equal((await route.POST(request(valid))).status, 401);
    user = { role: 'user' }; assert.equal((await route.POST(request(valid))).status, 403);
    user = { role: 'admin' }; assert.equal((await route.POST(request(valid, 'https://unrelated.example'))).status, 403);
    assert.equal((await route.POST(request({ ...valid, name: ' ' }))).status, 400);
    assert.equal(queries, before, 'Rejected requests must not touch catalogue data');
    const success = await route.POST(request(valid)); assert.equal(success.status, 200); assert.equal((await success.json()).brand.name, 'Shah Restaurant');
    const brand = (await db.query('SELECT * FROM brands WHERE id=$1', ['tandoor'])).rows[0];
    assert.equal(brand.id, 'tandoor'); assert.equal(brand.logo, '/logo.svg'); assert.equal(brand.categories[0].name, 'Mains');
    assert.equal((await db.query('SELECT brand FROM products')).rows[0].brand, 'tandoor');
    assert.equal((await names.renameBrand(query, { brandId: 'tandoor', name: 'eattogo', expectedName: 'Shah Restaurant' })).error, 'brandExists');
    const stale = await route.POST(request({ brandId: 'tandoor', name: 'New', expectedName: 'The Tandoor Company' })); assert.equal(stale.status, 409);
    assert.equal((await names.renameBrand(query, { brandId: 'missing', name: 'New', expectedName: 'Old' })).error, 'invalidInput');
    const injection = "'; DROP TABLE brands; --";
    assert.equal((await names.renameBrand(query, { brandId: 'tandoor', name: injection, expectedName: 'Shah Restaurant' })).ok, true);
    assert.equal((await db.query('SELECT name FROM brands WHERE id=$1', ['tandoor'])).rows[0].name, injection);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM brands')).rows[0].n, 2);
    console.log('PASS: validation; anonymous/user/origin rejection; admin persistence; stable IDs/logo/categories/products; duplicate/stale/missing protection; parameterized SQL. Isolated in-memory PostgreSQL only.');
  } finally { await db.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
