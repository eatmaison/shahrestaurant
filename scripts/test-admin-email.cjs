/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve, dirname } = require("node:path");
const { randomUUID } = require("node:crypto");
const { PGlite } = require("@electric-sql/pglite");
const { SignJWT } = require("jose");
const { NextRequest } = require("next/server");
const ts = require("typescript");
const root = resolve(__dirname, "..");
const origin = "https://shahrestaurant.nl";
const secret = "local-fixture-no-real-session-secret";
const loadSource = path => readFileSync(resolve(root, path), "utf8");

async function fixture(t) {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    CREATE TABLE users (id uuid PRIMARY KEY, name text, email text, phone text, address text, postcode text, role text, last_seen_site text, created_at timestamptz DEFAULT now());
    CREATE TABLE orders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, customer_name text, customer_email text, phone text, address text, postcode text, fulfillment text, created_at timestamptz DEFAULT now());
    CREATE TABLE order_items (order_id uuid,brand text);
    CREATE TABLE reservations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, guest_name text,email text,phone text,site text,created_at timestamptz DEFAULT now());
  `);
  const migration = loadSource("db/migrations/20261124_shah_admin_email.sql");
  await db.exec(migration);
  await db.exec(migration);
  const id = randomUUID(), staff = randomUUID(), sister = randomUUID();
  await db.query("INSERT INTO users(id,name,email,role,last_seen_site) VALUES ($1,'Avery Example','AVERY@example.test','user','tandoor'),($2,'Test admin','admin@example.test','admin','tandoor'),($3,'Sister guest','sister@example.test','user','themaison')",[id,staff,sister]);
  await db.exec(`
    INSERT INTO reservations(guest_name,email,phone,site) VALUES
      ('Avery booking',' avery@example.test ','06111','tandoor'),('Guest without email','','06222','tandoor'),
      ('Guest subscriber','guest@example.test',NULL,'tandoor'),('External','outside@example.test',NULL,'themaison');
    WITH orders_added AS (
      INSERT INTO orders(customer_name,customer_email,phone,address,postcode,fulfillment) VALUES
      ('Avery Order','avery@example.test',NULL,'Teststraat 1','1000 AA','delivery'),
      ('Pickup guest','pickup@example.test',NULL,'Restaurant address','1000 AA','pickup'),
      ('Sister order','otherorder@example.test',NULL,'Teststraat 2','2000 AA','delivery') RETURNING id,customer_name
    ) INSERT INTO order_items SELECT id,CASE WHEN customer_name='Sister order' THEN 'themaison' ELSE 'tandoor' END FROM orders_added;
  `);
  const cache = new Map(), sends = [];
  const sim = { status: 200 };
  const env = { NODE_ENV: "production", SESSION_SECRET: secret, APP_URL: origin };
  function load(file) {
    const path = resolve(root, file);
    if (file.endsWith("/db.ts")) return { sql: { query: async (stmt, params) => (await db.query(stmt, params)).rows } };
    if (file.endsWith("/data.ts")) return { SITE_ID: "tandoor" };
    if (cache.has(path)) return cache.get(path).exports;
    const mod = { exports: {} };
    cache.set(path, mod);
    const js = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    new Function("module","exports","require","process","fetch",js)(mod, mod.exports, name => name.startsWith(".") ? load(resolve(dirname(path),name+".ts")) : require(name), { env }, async (url, options) => {
      assert.equal(url,"https://api.resend.com/emails");
      sends.push({ ...JSON.parse(options.body), idempotency: options.headers["Idempotency-Key"] });
      if (sim.status === "lost") throw Error("simulated dropped response");
      return Response.json({ id: "synthetic" }, { status: sim.status });
    });
    return mod.exports;
  }
  const route = load("app/api/admin/email/route.ts");
  const unsub = load("app/api/email/unsubscribe/route.ts");
  const token = userId => new SignJWT({ userId }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("12m").sign(new TextEncoder().encode(secret));
  const auth = await token(staff);
  const call = async (method, body, { jwt = auth, params = "", from = origin } = {}) => {
    const res = await route[method](new NextRequest(origin+"/api/admin/email"+params,{method,headers:{
      ...(jwt ? { Cookie: "etg_session="+jwt } : {}),
      ...(method === "POST" ? { Origin: from, "Content-Type": "application/json" } : {}),
    }, ...(method === "POST" ? { body: JSON.stringify(body) } : {})}));
    return { status: res.status, cache: res.headers.get("cache-control"), data: await res.json() };
  };
  const consent = email => call("POST", { action: "consent", email, evidence: "Explicit form approval 2026-11-24", confirmed: true });
  const enable = () => Object.assign(env,{ RESEND_API_KEY:"fixture-only",SHAH_CAMPAIGN_EMAIL_ENABLED:"true",SHAH_CAMPAIGN_FROM:"info@shahrestaurant.nl" });
  return { db, id, call, auth, token, unsub, consent, enable, sends, sim };
}

test("private directory deduplicates email, keeps blanks, and excludes unrelated sites", async t => {
  const f = await fixture(t);
  assert.equal((await f.call("GET", null, { jwt: "" })).status,403);
  assert.equal((await f.call("GET", null, { jwt: await f.token(f.id) })).status,403);
  assert.equal((await f.call("POST", { action:"dispatch",id:randomUUID() }, {from:"https://example.test"})).status,403);
  const {status, cache, data} = await f.call("GET");
  assert.equal(status,200); assert.match(cache,/no-store/);
  assert.equal(data.total,4); assert.equal(data.sendingEnabled,false);
  assert.deepEqual(data.eligible,[]);
  const avery=data.items.find(v=>v.email==="avery@example.test");
  assert.equal(avery.name,"Avery Example"); assert.equal(avery.phone,"06111"); assert.equal(avery.address,"Teststraat 1 1000 AA");
  assert.deepEqual(avery.sources,["account","order","reservation"]);
  assert.equal(data.items.find(v=>v.email==="pickup@example.test").address,null);
  assert.equal(data.items.find(v=>v.email===null).address,null);
  assert.equal((await f.call("GET", null,{params:"?q=1000"})).data.total,1);
  assert.equal((await f.call("GET", null,{params:"?subscribed=1"})).data.total,0);
});

test("send requires explicit permission and snapshot; each recipient is private and deduplicated", async t => {
  const f = await fixture(t);
  assert.equal((await f.consent("outside@example.test")).status,409);
  assert.equal((await f.call("POST",{action:"consent",email:"avery@example.test",confirmed:false,evidence:"Some evidence"})).status,400);
  assert.equal((await f.consent("AVERY@example.test")).status,200);
  assert.equal((await f.consent("guest@example.test")).status,200);
  const {data}=await f.call("GET");
  assert.equal(data.eligible.length,2);
  const create={ action:"create",id:randomUUID(),subject:"Fixture",body:"<img src=x onerror=alert(1)>",recipients:data.eligible };
  assert.equal((await f.call("POST",create)).status,503);
  f.enable();
  assert.equal((await f.call("POST",{...create,recipients:[...data.eligible,randomUUID()]})).status,409);
  assert.equal((await f.call("POST",create)).data.campaign.pending,2);
  assert.equal((await f.call("POST",create)).data.campaign.pending,2);
  assert.equal((await f.call("POST",{...create,body:"different"})).status,409);
  assert.equal(f.sends.length,0);
  await f.call("POST",{action:"dispatch",id:create.id});
  await f.call("POST",{action:"dispatch",id:create.id});
  const final=await f.call("POST",{action:"dispatch",id:create.id});
  assert.equal(final.data.campaign.accepted,2);
  assert.equal(f.sends.length,2);
  for (const send of f.sends) {
    assert.equal(send.to.length,1);
    assert.match(send.html,/&lt;img/);
    assert.equal(send.headers["List-Unsubscribe-Post"],"List-Unsubscribe=One-Click");
    assert.match(send.html,/\/email\/unsubscribe/);
  }
  assert.notEqual(f.sends[0].idempotency,f.sends[1].idempotency);
});

test("unsubscribe and transport interruption are respected by pending dispatch", async t => {
  const f=await fixture(t); f.enable(); await f.consent("guest@example.test"); await f.consent("avery@example.test");
  const {data}=await f.call("GET");
  const create={action:"create",id:randomUUID(),subject:"Sample",body:"Example message",recipients:data.eligible};
  assert.equal((await f.call("POST",create)).status,200);
  const [{unsubscribe_token:token}]=(await f.db.query("SELECT unsubscribe_token FROM shah_email_permissions WHERE email='guest@example.test'")).rows;
  const url=origin+"/api/email/unsubscribe?token="+token;
  const rejected=await f.unsub.POST(new Request(url,{method:"POST",body:new URLSearchParams({"List-Unsubscribe":"not one click"})}));
  assert.equal(rejected.status,400);
  assert.equal((await f.unsub.POST(new Request(url,{method:"POST",body:new URLSearchParams({"List-Unsubscribe":"One-Click"})}))).status,200);
  assert.equal((await f.consent("guest@example.test")).status,409);
  const dispatch={action:"dispatch",id:create.id};
  f.sim.status=429;
  for (let i=0;i<2;i++) {
    const result=await f.call("POST",dispatch);
    if (result.status===503) break;
  }
  assert.equal((await f.call("GET")).data.campaigns[0].pending>=1,true);
  f.sim.status="lost";
  await f.call("POST",dispatch); await f.call("POST",dispatch);
  const final=await f.call("POST",dispatch);
  assert.equal(final.data.campaign.uncertain,1);
  assert.equal(final.data.campaign.notSent,1);
  assert.equal(final.data.campaign.pending,0);
  assert.deepEqual(f.sends.map(x=>x.to[0]),["avery@example.test","avery@example.test"]);
  assert.equal(f.sends[0].idempotency,f.sends[1].idempotency);
});
