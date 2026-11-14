/* eslint-disable @typescript-eslint/no-require-imports -- Offline regression tests load TypeScript with stubbed side effects. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const plain = value => JSON.parse(JSON.stringify(value));
const now = Date.parse("2026-11-11T12:00:00Z");

function modules(stubs = {}) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(root, file);
    if (cache.has(file)) return cache.get(file).exports;
    const compiledModule = { exports: {} }; cache.set(file, compiledModule);
    const resolve = name => {
      if (Object.hasOwn(stubs, name)) return stubs[name];
      if (name === "@neondatabase/serverless" || name === "./db") throw new Error("Real database forbidden");
      if (name === "next/server") return { after: () => {} };
      if (name === "./email") return { emailEnabled: () => false, sendMail: () => { throw new Error("Email forbidden"); } };
      if (name === "./spaces" || name === "./tokens" || name === "./mollie" || name === "./orderPersistence") return {};
      if (!name.startsWith(".")) return require(name);
      const base = path.resolve(path.dirname(file), name);
      const target = [base, `${base}.ts`, `${base}.tsx`].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      if (!target) throw new Error(`Missing local import ${name}`);
      return load(target);
    };
    const output = ts.transpileModule(fs.readFileSync(file,"utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    vm.runInNewContext(output, { module: compiledModule, exports: compiledModule.exports, require: resolve, process: { env: {} }, Date, Map, Set, URL, Buffer, TextEncoder, console, fetch: () => { throw new Error("Network forbidden"); } }, { filename: file });
    return compiledModule.exports;
  }
  return load;
}
const load = modules();
const { buildGuestOrderHistory, buildGuestVisitors, buildRegisteredVisitors, visitorActivityAt } = load("app/lib/guestRecognition.ts");
const { filterVisitors, paginateVisitors } = load("app/lib/visitorList.ts");
const { reservationInsert, RESERVATION_SESSION_CAPABILITY_SQL } = load("app/lib/reservationSessionLink.ts");
const session = (id="session-a") => ({ id, last_seen_at: now-1000, created_at: now-100000, last_seen_site:"tandoor", visit_count:4 });
const order = (id, extra={}) => ({ id, visitor_session_id:"session-a", user_id:null, customer_name:"Anna Example", customer_email:"anna@example.invalid", address:"Example Street 12 A", postcode:"1032 KL", fulfillment:"delivery", paid:true, ...extra });
const reservation = (extra={}) => ({ id:"reservation-a", user_id:null, visitor_session_id:"session-a", guest_name:"Anna Example", email:"anna@example.invalid", ...extra });
const guest = (orders=[], reservations=[]) => buildGuestVisitors([session()], orders, reservations, now)[0];
const filters = extra => ({ kind:"all", search:"", onlineOnly:false, sort:"recent", ...extra });

test("real customer bootstrap SQL retains old order-linked sessions without adding old unrelated browsers", async () => {
  const { PGlite } = require("@electric-sql/pglite"), db = new PGlite();
  try {
    await db.exec(`CREATE TABLE visitor_sessions(id text,created_at timestamptz,last_seen_at timestamptz,last_seen_site text,visit_count int,active_seconds int); CREATE TABLE orders(id text,user_id text,visitor_session_id text);
      INSERT INTO visitor_sessions VALUES ('recent',now(),now(),'tandoor',1,0),('old-customer',now()-interval '3 days',now()-interval '3 days','tandoor',1,0),('old-anonymous',now()-interval '3 days',now()-interval '3 days','tandoor',1,0),('other-site-customer',now()-interval '4 days',now()-interval '4 days','themaison',1,0),('registered-only',now()-interval '5 days',now()-interval '5 days','tandoor',1,0);
      INSERT INTO orders VALUES ('a',NULL,'old-customer'),('b',NULL,'other-site-customer'),('c','account','registered-only');`);
    const text=fs.readFileSync(path.join(root,"app/lib/serverStore.ts"),"utf8");
    const match=text.match(/sql\.query\(`(SELECT id, created_at, last_seen_at, last_seen_site, visit_count, active_seconds FROM visitor_sessions[\s\S]+?)`, \[SITE_ID\]\)/);
    assert(match); const rows=(await db.query(match[1],["tandoor"])).rows;
    assert.deepEqual(rows.map(row=>row.id).sort(),["old-customer","other-site-customer","recent"]);
  } finally { await db.close(); }
});

test("order-only contacts remain searchable without assigning any session, online signal or traffic source", () => {
  const rows=[order("old-a",{visitor_session_id:null,order_number:111,created_at:now-3*86400000}),order("old-b",{visitor_session_id:null,order_number:222,created_at:now-1000})];
  const before=JSON.stringify(rows), result=buildGuestOrderHistory(rows,[]);assert.equal(JSON.stringify(rows),before);assert.equal(result.length,1);
  const contact=result[0];assert.equal(contact.name,"Anna Example");assert.equal(contact.recordKind,"order-history");assert.equal(contact.orderCount,2);assert.equal(contact.isOnline,false);assert.equal(contact.lastSeenAt,0);assert.equal(contact.sessionId,undefined);assert.equal(contact.visitCount,undefined);assert.equal(contact.activeSeconds,undefined);assert.equal(contact.observation,undefined);
  for(const search of ["Anna","example street 12","1032","ETG-222","old-a"])assert.equal(filterVisitors(result,filters({search})).length,1);
  assert.equal(filterVisitors(result,filters({kind:"history"})).length,1);assert.equal(filterVisitors(result,filters({onlineOnly:true})).length,0);
  assert.equal(visitorActivityAt(contact),now-1000);assert.equal(contact.firstOrderAt,now-3*86400000);
});

test("history does not duplicate identified sessions, but ambiguous cookies retain separate submitted contacts", () => {
  const a=order("a",{created_at:now-1000,order_number:111}), b=order("b",{created_at:now-2000,order_number:222,customer_name:"Someone Else",customer_email:"else@example.invalid"});
  assert.equal(buildGuestOrderHistory([a],buildGuestVisitors([session()],[a],[],now)).length,0);
  const ambiguous=buildGuestVisitors([session()],[a,b],[],now);assert.equal(ambiguous[0].identityStatus,"ambiguous");
  const contacts=buildGuestOrderHistory([a,b],ambiguous);assert.equal(contacts.length,2);assert(contacts.every(row=>row.recordKind==="order-history"&&!row.isOnline&&!row.sessionId));
  assert.equal(filterVisitors([...ambiguous,...contacts],filters({search:"Someone Else"})).length,1);
  assert.equal(buildGuestOrderHistory([order("registered",{user_id:"account"})],[]).length,0);
});

test("history grouping preserves contacts and delivery units; pickup names alone never merge", () => {
  for(const change of [{address:"Example Street 12 B"},{customer_email:"different@example.invalid"},{fulfillment:"pickup",customer_email:null}]){
    const rows=[order("a",{visitor_session_id:null,customer_email:change.fulfillment?null:"anna@example.invalid",fulfillment:change.fulfillment||"delivery"}),order("b",{visitor_session_id:null,...change})];
    assert.equal(buildGuestOrderHistory(rows,[]).length,2);
  }
  assert.equal(buildGuestOrderHistory([order("a",{visitor_session_id:null}),order("a",{visitor_session_id:null})],[])[0].orderCount,1);
});

test("linked order activity and references are retained; old orders do not become current activity", () => {
  const a=order("a",{order_number:111,created_at:now-86400000}), b=order("b",{visitor_session_id:"session-b",order_number:222,created_at:now-2*86400000});
  const result=buildGuestVisitors([{...session(),last_seen_at:now-3*86400000}],[a,b],[],now)[0];
  assert.equal(result.isOnline,false);assert.equal(result.lastOrderAt,now-86400000);assert.deepEqual(plain(result.orderIds),["a"]);assert.deepEqual(plain(result.matchingOrderIds),["b"]);
  assert.equal(filterVisitors([result],filters({search:"ETG-111"})).length,1);assert.equal(filterVisitors([result],filters({search:"b"})).length,1);
  const recent=buildGuestVisitors([{...session(),last_seen_at:now-3600000}],[order("fresh",{created_at:now-1000})],[],now)[0];assert.equal(recent.isOnline,true);assert.equal(visitorActivityAt(recent),now-1000);
  const res=guest([], [reservation({site:"tandoor",status:"arrived"}),reservation({id:"second",site:"themaison",status:"confirmed"})]);assert.equal(res.tandoorArrivedCount,1);assert.equal(res.maisonReservationCount,1);
});

test("an order-history contact can never inherit an unrelated browser observation",async()=>{
  const contact=buildGuestOrderHistory([order("history",{visitor_session_id:null})],[])[0];
  const sql={query:async text=>text.includes("to_regclass")?[{available:true}]:text.startsWith("SELECT visitor_id")?[{visitor_id:contact.id,source:{kind:"search",referrerHost:"google.nl"},classification:"interaction-reported",reasons:[],first_observed_at:new Date(now),last_observed_at:new Date(now),last_path:"/en"}]:[]};
  const store=modules({"./db":{sql}})("app/lib/visitorObservationStore.ts"), result=await store.loadVisitorObservations([contact]);
  assert.equal(result.status,"available");assert.equal(result.visitors[0].observation,undefined);assert.equal(result.visitors[0].isOnline,false);
});

test("exact session link supplies name/email and retains session ID", () => {
  const result=guest([order("o1")]);
  assert.equal(result.name,"Anna Example"); assert.equal(result.email,"anna@example.invalid");
  assert.equal(result.sessionId,"session-a"); assert.equal(result.identityStatus,"identified");
  assert.equal(result.identitySource,"order"); assert.equal(result.orderCount,1); assert.equal(result.paidOrderCount,1);
});
test("linked reservation identifies session; unlinked historical reservation does not", () => {
  assert.equal(guest([], [reservation()]).identitySource,"reservation");
  assert.equal(guest([], [reservation()]).reservationCount,1);
  const old=guest([], [reservation({visitor_session_id:null})]);
  assert.equal(old.identityStatus,"unknown"); assert.equal(old.email,undefined); assert.equal(old.name,"Guest");
});
test("conflicting names or contacts, including unpaid submissions/reservations, suppress attributed PII", () => {
  for (const extra of [{customer_name:"Someone Else"}, {customer_email:"other@example.invalid"}, {customer_name:""}]) {
    const result=guest([order("o1"),order("o2",{...extra,paid:false})]);
    assert.equal(result.identityStatus,"ambiguous"); assert.equal(result.name,"Guest"); assert.equal(result.email,undefined);
    assert.equal(result.matchingOrderCount,undefined); assert.equal(result.orderCount,2);
  }
  assert.equal(guest([order("o1")],[reservation({guest_name:"Someone Else"})]).identityStatus,"ambiguous");
});
test("Unicode/case/whitespace normalize conservatively and contacts are not guessed", () => {
  const result=guest([order("o1",{customer_name:"Am\u00e9lie Example",customer_email:" ANNA@EXAMPLE.INVALID "}),order("o2",{customer_name:"  Ame\u0301lie   Example  ",customer_email:null})]);
  assert.equal(result.identityStatus,"identified");
  assert.equal(guest([order("o1"),order("o2",{customer_email:"anna+food@example.invalid"})]).identityStatus,"ambiguous");
  assert.equal(guest([order("o1",{customer_name:"Guest"})]).identityStatus,"ambiguous");
});
test("same complete delivery identity yields non-additive match counts and separate paid count", () => {
  const a=order("o1"), b=order("o2",{visitor_session_id:"session-b",paid:false,address:" example street 12 a ",postcode:"1032kl"});
  const result=guest([a,b,a]);
  assert.equal(result.orderCount,1); assert.equal(result.matchingOrderCount,2); assert.equal(result.matchingPaidOrderCount,1);
  assert.equal(result.sessionId,"session-a");
});
test("address units, name accents, pickup, incomplete address or postcode never create a match", () => {
  for(const extra of [{address:"Example Street 12 B"},{address:"Example Street 12"},{customer_name:"\u00c1nna Example"},{fulfillment:"pickup"},{address:""},{address:"Example Street"},{postcode:""}]) {
    assert.equal(guest([order("o1"),order("o2",{visitor_session_id:"session-b",...extra})]).matchingOrderCount,undefined);
  }
});
test("conflicting email rejects entire address group, including unknown-email bridge", () => {
  const result=guest([order("o1"),order("o2",{visitor_session_id:"session-b",customer_email:null}),order("o3",{visitor_session_id:"session-c",customer_email:"other@example.invalid"})]);
  assert.equal(result.identityStatus,"identified"); assert.equal(result.matchingOrderCount,undefined);
});
test("missing email permits only descriptive matches and never invents an email", () => {
  const result=guest([order("o1",{customer_email:null}),order("o2",{visitor_session_id:"session-b",customer_email:null})]);
  assert.equal(result.email,undefined); assert.equal(result.matchingOrderCount,2);
  const translations=load("app/lib/translations.ts");
  assert(Object.values(translations).length > 0);
  const source=fs.readFileSync(path.join(root,"app/lib/translations.ts"),"utf8");
  assert.match(source,/Possible matches, not a verified person/);
});
test("account-owned submissions cannot identify or count as guest orders", () => {
  const result=guest([order("o1",{user_id:"account-a"})],[reservation({user_id:"account-a"})]);
  assert.equal(result.identityStatus,"unknown"); assert.equal(result.orderCount,0); assert.equal(result.reservationCount,0);
});
test("recognition never mutates input records and cannot add unrequested raw history", () => {
  const sessions=[session()], orders=[order("o1")], reservations=[reservation()], before=JSON.stringify([sessions,orders,reservations]);
  const result=buildGuestVisitors(sessions,orders,reservations,now)[0];
  assert.equal(JSON.stringify([sessions,orders,reservations]),before);
  assert.equal(result.address,undefined); assert.equal(result.orders,undefined); assert.equal(result.phone,undefined);
});
const users=Array.from({length:175},(_,i)=>({id:`user-${String(i).padStart(3,"0")}`,name:`Registered ${i}`,email:`u${i}@example.invalid`,createdAt:now-100000000,role:"user",accountType:"personal",orderCount:0,lastSeenAt:i<3?now-1000:i===3?undefined:now-200000000}));
test("all 175 registered accounts remain reachable despite 206 guests and old/no activity", () => {
  const accounts=buildRegisteredVisitors(users,new Map(),now), guests=Array.from({length:206},(_,i)=>({...guest(),id:`g-${i}`,sessionId:`g-${i}`}));
  const all=[...accounts,...guests], filtered=filterVisitors(all,filters({kind:"user"}));
  assert.equal(filtered.length,175); assert.equal(filterVisitors(all,filters({kind:"guest"})).length,206);
  assert.equal(filterVisitors(all,filters({kind:"user",onlineOnly:true})).length,3);
  assert.equal(accounts.find(user=>user.id==="user-003").lastSeenAt,0); assert.equal(accounts.find(user=>user.id==="user-003").isOnline,false);
  const ids=[]; for(let page=1;page<=4;page++)ids.push(...paginateVisitors(filtered,page).entries.map(entry=>entry.id));
  assert.equal(new Set(ids).size,175); assert.equal(ids.length,175);
});
test("filter/search precede pagination, stable tie ordering, and refresh clamps shrinking pages", () => {
  const accounts=buildRegisteredVisitors(users,new Map(),now);
  const one=filterVisitors(accounts,filters({kind:"user",search:"u174@example.invalid"}));
  assert.equal(one.length,1); assert.equal(paginateVisitors(one,99).page,1);
  assert.deepEqual(plain(filterVisitors([...accounts].reverse(),filters()).map(u=>u.id)),plain(filterVisitors(accounts,filters()).map(u=>u.id)));
  assert.equal(paginateVisitors([],3).from,0); assert.equal(paginateVisitors([],3).to,0);
  assert.equal(paginateVisitors(accounts,NaN).page,1); assert.equal(paginateVisitors(accounts,-10).page,1);
  assert.equal(paginateVisitors(accounts,99).to,175);
});
function server(role) {
  const calls=[];
  const accountRows=users.map(user=>({id:user.id,name:user.name,email:user.email,role:"user",account_type:"personal",created_at:new Date(user.createdAt),last_seen_at:user.lastSeenAt?new Date(user.lastSeenAt):null,order_count:0}));
  const current=role?{...accountRows[0],id:"current",role}:null;
  const query=async(text,params=[])=>{
    calls.push({text,params});
    if(text.includes("FROM app_migrations"))return [{exists:true}];
    if(text.includes("FROM users WHERE id"))return current?[current]:[];
    if(text.includes("SELECT * FROM users ORDER BY"))return accountRows;
    if(text.includes("FROM restaurant_open_overrides"))return [{mode:"auto",local_date:"2026-11-11"}];
    if(text.includes("FROM visitor_sessions")&&text.includes("count(*)"))return [{n:206}];
    if(text.includes("FROM visitor_sessions")&&text.trim().startsWith("SELECT"))return Array.from({length:206},(_,i)=>session(`g-${i}`));
    if(text.includes("FROM orders WHERE user_id IS NULL"))return [order("identity",{visitor_session_id:"g-0"})];
    return [];
  };
  return {calls,api:modules({"./db":{ensureReady:async()=>{},sql:{query}},"./session":{getSessionUserId:async()=>current?.id??null,getOrCreateVisitorId:async()=>"server-session"}})("app/lib/serverStore.ts")};
}
test("real bootstrap admin branch has no combined cap and enriches identities only there",async()=>{
  const {calls,api}=server("admin"),result=await api.bootstrap("customers");
  assert.equal(result.recentVisitors.length,381); assert.equal(result.recentVisitors.filter(v=>v.kind==="user").length,175);
  assert.equal(result.recentVisitors.find(v=>v.id==="g-0").email,"anna@example.invalid");
  const query=calls.find(call=>call.text.includes("FROM visitor_sessions")&&call.text.includes("ORDER BY"));
  assert.doesNotMatch(query.text,/LIMIT/); assert.match(query.text,/last_seen_site = \$1/); assert.equal(query.params[0],"tandoor");
});
test("anonymous and non-admin bootstrap never fetch or return guest identities or user directory",async()=>{
  for(const role of [null,"user"]){
    const {calls,api}=server(role),result=await api.bootstrap();
    assert.deepEqual(plain(result.recentVisitors),[]); assert.deepEqual(plain(result.users),[]);
    assert(!calls.some(call=>call.text.includes("FROM orders WHERE user_id IS NULL")));
    assert(!JSON.stringify(result).includes("anna@example.invalid"));
  }
});
test("existing public order/reservation mappers do not leak new admin-only email/session fields",()=>{
  const mappers=load("app/lib/mappers.ts");
  const result=mappers.rowToOrder({...order("o1"),created_at:new Date(now)},[]);
  assert.equal(result.customerEmail,undefined); assert.equal(result.customer_email,undefined);
  const booking=mappers.rowToReservation({...reservation(),created_at:new Date(now)});
  assert.equal(booking.visitorSessionId,undefined); assert.equal(booking.visitor_session_id,undefined);
});
test("reservation SQL is parameterized and account bookings never inherit a guest session",()=>{
  const values=[null,"Guest Person","guest@example.invalid","000","2026-11-12","18:00",2,"",null,"tandoor"];
  const old=reservationInsert(false,values,"server-cookie"); assert.equal(old.params.length,10); assert.doesNotMatch(old.text,/visitor_session_id/);
  const linked=reservationInsert(true,values,"server-cookie"); assert.equal(linked.params[10],"server-cookie"); assert(!linked.text.includes("server-cookie"));
  assert.equal(reservationInsert(true,["account",...values.slice(1)],"server-cookie").params[10],null);
  assert.equal(values.length,10);
});
test("optional SQL migration and legacy/new inserts work in isolated in-memory PostgreSQL",async()=>{
  const {PGlite}=require("@electric-sql/pglite"), db=new PGlite();
  try{
    await db.exec("CREATE TABLE reservations (id integer GENERATED ALWAYS AS IDENTITY, user_id text, guest_name text, email text, phone text, date text, time text, guests int, occasion text, note text, status text, site text)");
    assert.equal((await db.query(RESERVATION_SESSION_CAPABILITY_SQL)).rows[0].supported,false);
    const values=[null,"Synthetic Guest","synthetic@example.invalid","000","2026-11-12","18:00",2,"",null,"tandoor"];
    const old=reservationInsert(false,values,"server-cookie"); await db.query(old.text,old.params);
    const migration=fs.readFileSync(path.join(root,"db/migrations/20261111_reservation_visitor_session.sql"),"utf8");
    await db.exec(migration); await db.exec(migration);
    assert.equal((await db.query(RESERVATION_SESSION_CAPABILITY_SQL)).rows[0].supported,true);
    const linked=reservationInsert(true,values,"server-cookie"); await db.query(linked.text,linked.params);
    const rows=(await db.query("SELECT visitor_session_id FROM reservations ORDER BY id")).rows;
    assert.equal(rows[0].visitor_session_id,null); assert.equal(rows[1].visitor_session_id,"server-cookie");
  }finally{await db.close();}
});
test("migration is not auto-registered and bootstrap remains private/no-store",()=>{
  const ddl=fs.readFileSync(path.join(root,"app/lib/db.ts"),"utf8");
  assert.doesNotMatch(ddl,/ALTER TABLE reservations ADD COLUMN IF NOT EXISTS visitor_session_id/);
  const route=fs.readFileSync(path.join(root,"app/api/bootstrap/route.ts"),"utf8"); assert.match(route,/private, no-store/);
  const page=fs.readFileSync(path.join(root,"app/admin/RecentVisitors.tsx"),"utf8");
  assert.match(page,/setPage\(1\)/); assert.match(page,/No visitors/);
});
test("reservation creation uses server session, ignores forged form identity, and remains compatible with legacy schema",async()=>{
  for(const supports of [true,false,"metadata-unavailable"]){
    const calls=[];let cookieReads=0;
    const query=async(text,params=[])=>{
      calls.push({text,params});
      if(text.includes("information_schema.columns")){
        if(supports==="metadata-unavailable")throw new Error("Synthetic restricted metadata");
        return [{supported:supports}];
      }
      if(text.startsWith("INSERT INTO reservations"))return [{id:"r1",reservation_number:501,guest_name:params[1],email:params[2],phone:params[3],date:params[4],time:params[5],guests:params[6],site:params[9],visitor_session_id:params[10],created_at:new Date(now)}];
      return [];
    };
    const api=modules({"./db":{ensureReady:async()=>{},sql:{query}},"./session":{getSessionUserId:async()=>null,getOrCreateVisitorId:async()=>{cookieReads++;return "server-cookie";}},"./openingHours":{timeToMinutes:()=>1080,isOpenAt:()=>true,amsterdamNow:()=>({localDate:"2026-11-11",minutes:720})},"./email":{reservationEmail:()=>({subject:"Synthetic",html:"Synthetic"}),sendMail:()=>{throw new Error("Email forbidden");}}})("app/lib/serverStore.ts");
    const result=await api.createReservation({guestName:"Synthetic Guest",email:"synthetic@example.invalid",phone:"000",date:"2026-11-12",time:"18:00",guests:2,visitorSessionId:"forged-form-id"});
    assert.equal(result.ok,true);assert.equal(result.reservation.visitorSessionId,undefined);
    const insert=calls.find(call=>call.text.startsWith("INSERT INTO reservations"));
    assert.equal(insert.params.length,supports===true?11:10);
    assert.equal(insert.params[10],supports===true?"server-cookie":undefined);
    assert.equal(cookieReads,supports===true?1:0);
    assert(!calls.some(call=>/\b(CREATE|ALTER|DROP)\b/i.test(call.text)));
    assert(!JSON.stringify(calls).includes("forged-form-id"));
  }
});
test("multiple delivery addresses in one session never union separate households/contact groups",()=>{
  const result=guest([
    order("o1",{customer_email:null}),
    order("o2",{customer_email:null,address:"Other Street 22"}),
    order("o3",{visitor_session_id:"session-b",customer_email:"one@example.invalid"}),
    order("o4",{visitor_session_id:"session-c",address:"Other Street 22",customer_email:"two@example.invalid"}),
  ]);
  assert.equal(result.identityStatus,"identified");assert.equal(result.orderCount,2);
  assert.equal(result.matchingOrderCount,undefined);assert.equal(result.matchingPaidOrderCount,undefined);
});

test("scoped bootstrap only loads required private collections; requested scope never grants authorization",async()=>{for(const view of ["operations","stats","customers","events"]){const {calls,api}=server("admin"),result=await api.bootstrap(view);assert.equal(result.adminView,view);if(view==="events"){assert.deepEqual(plain(result.orders),[]);assert.deepEqual(plain(result.users),[]);assert.deepEqual(plain(result.reservations),[]);assert(!calls.some(c=>c.text.includes("SELECT * FROM users ORDER BY")));}if(view!=="customers")assert(!calls.some(c=>c.text.includes("FROM orders WHERE user_id IS NULL")));for(const role of [null,"user"]){const privateResult=await server(role).api.bootstrap(view);assert.deepEqual(plain(privateResult.users),[]);assert.deepEqual(plain(privateResult.recentVisitors),[]);assert.equal(privateResult.adminView,undefined);}}});
