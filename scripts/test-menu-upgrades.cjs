/* eslint-disable @typescript-eslint/no-require-imports -- Offline contracts stub all external effects. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const plain = value => JSON.parse(JSON.stringify(value));

function modules(stubs = {}) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(root, file);
    if (cache.has(file)) return cache.get(file).exports;
    const compiled = { exports: {} }; cache.set(file, compiled);
    const resolve = name => {
      if (Object.hasOwn(stubs, name)) return stubs[name];
      if (["@neondatabase/serverless", "./db"].includes(name)) throw new Error("Real database forbidden");
      if (name === "next/server") return { after: () => {}, NextResponse: { json: (body, options = {}) => ({ body, status: options.status ?? 200 }) } };
      if (name === "./email") return { emailEnabled: () => false, sendMail: () => { throw new Error("Email forbidden"); } };
      if (["./spaces", "./tokens"].includes(name)) return {};
      if (!name.startsWith(".")) return require(name);
      const base = path.resolve(path.dirname(file), name);
      const target = [base, `${base}.ts`, `${base}.tsx`].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      if (!target) throw new Error(`Missing import ${name}`);
      return load(target);
    };
    const output = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    vm.runInNewContext(output, { module: compiled, exports: compiled.exports, require: resolve, process: { env: {} }, Date, Map, Set, URL, Buffer, TextEncoder, console, fetch: () => { throw new Error("Network forbidden"); } }, { filename: file });
    return compiled.exports;
  }
  return load;
}
const load = modules();
const { normalizeMenuUpgrades, softDrinksForMenu, menuUpgradeSubtotal, cartMenuPriceTotals, withMenuCartQuantity, buildMenuUpgradeItems } = load("app/lib/menuUpgrades.ts");
const { placeOrderSchema } = load("app/lib/validation.ts");
const product = (id, extra = {}) => ({ id, name: id, description: "Synthetic", category: "Wraps", brand: "tandoor", price: 9.99, ...extra });
const wrap = product("wrap");
const drinks = ["Cola", "Fanta", "Sprite", "Water", "Ice tea"].map((name, index) => product(`drink-${index}`, { name, category: "Drinks", subcategory: "Soft Drinks", price: 3 }));
const catalog = [wrap, ...drinks];
const choices = drinks.map(drink => drink.id);
const body = extra => ({ customerName: "Synthetic Customer", email: "synthetic@example.invalid", address: "", postcode: "", phone: "000000", fulfillment: "pickup", cart: { wrap: 5 }, menuUpgrades: { wrap: choices }, ...extra });
const subtotal = items => +items.reduce((sum, item) => sum + item.qty * item.price, 0).toFixed(2);
const menuDrinks = items => items.filter(item => item.productId.startsWith("menu-drink:"));

function server(products = catalog, user = null) {
  const saved = [], queries = [];
  const rows = products.map(p => ({ ...p, bogo_enabled: p.bogoEnabled, is_vip: p.isVip }));
  const stubs = {
    "./db": { ensureReady: async () => {}, sql: { query: async (text, params) => {
      queries.push({ text, params });
      if (text.includes("FROM products")) return rows;
      if (text.includes("FROM users WHERE id")) return user ? [{ id: "synthetic-user", role: "user", email: "synthetic@example.invalid", account_type: "personal", points: 0, created_at: new Date(), ...user }] : [];
      throw new Error(`Unexpected query: ${text}`);
    } } },
    "./session": { getSessionUserId: async () => user ? "synthetic-user" : null, getOrCreateVisitorId: async () => "synthetic-session" },
    "./mollie": { mollieEnabled: () => false, createMolliePayment: () => { throw new Error("Payment forbidden"); } },
    "./orderPersistence": { persistOrder: async computed => { saved.push(plain(computed)); return { ...computed, id: "synthetic-order", orderNumber: 1001, newlyCreated: true }; } },
  };
  const api = modules(stubs)("app/lib/serverStore.ts");
  const route = modules({ "../../lib/serverStore": { placeOrder: api.placeOrder, publicOrigin: () => "http://synthetic.invalid" }, "../../lib/rateLimit": { enforceRateLimit: () => null } })("app/api/orders/route.ts");
  return { saved, queries, api, post: input => route.POST({ json: async () => input }) };
}

test("five identical wraps keep five independent drinks at the existing menu price", () => {
  const result = buildMenuUpgradeItems({ wrap: choices }, { wrap: 5 }, catalog);
  assert.equal(result.ok, true);
  assert.equal(menuUpgradeSubtotal({ wrap: choices }), 20);
  assert.equal(subtotal([{ ...wrap, productId: wrap.id, qty: 5 }, ...result.items]), 69.95);
  assert.deepEqual(plain(menuDrinks(result.items).map(item => [item.productId, item.qty, item.price])), choices.map(id => [`menu-drink:wrap:${id}`, 1, 0]));
});

test("mixed plain wraps and menus price only selected combos; repeated drinks retain quantities", () => {
  const result = buildMenuUpgradeItems({ wrap: [choices[0], choices[1], choices[0]] }, { wrap: 5 }, catalog);
  assert.equal(result.ok, true);
  assert.equal(subtotal([{ ...wrap, productId: wrap.id, qty: 5 }, ...result.items]), 61.95);
  assert.deepEqual(plain(menuDrinks(result.items).map(item => item.qty)), [2, 1]);
  assert.equal(result.items.find(item => item.productId === "menu-fries:wrap").qty, 3);
  assert.equal(buildMenuUpgradeItems({}, { wrap: 5 }, catalog).items.length, 0);
});

test("quantity changes clamp atomically, preserve first choices and never resurrect removed menus", () => {
  let state = { cart: { wrap: 5 }, menuUpgrades: { wrap: choices } };
  state = withMenuCartQuantity(state, { wrap: 3 });
  assert.deepEqual(plain(state.menuUpgrades.wrap), choices.slice(0, 3));
  state = withMenuCartQuantity(state, { wrap: 5 });
  assert.deepEqual(plain(state.menuUpgrades.wrap), choices.slice(0, 3));
  state = withMenuCartQuantity(state, {});
  assert.deepEqual(plain(state.menuUpgrades), {});
  assert.deepEqual(plain(withMenuCartQuantity(state, { wrap: 5 }).menuUpgrades), {});
});

test("editing and removing a menu preserves the other indexed drinks through JSON reload", () => {
  const edited = { wrap: [...choices] }; edited.wrap[2] = choices[0]; edited.wrap.splice(1, 1);
  const restored = normalizeMenuUpgrades(JSON.parse(JSON.stringify(edited)), { wrap: 5 });
  assert.deepEqual(plain(restored.wrap), [choices[0], choices[0], choices[3], choices[4]]);
  assert.equal(menuUpgradeSubtotal(restored), 16);
});

test("legacy scalar upgrades expand once to old quantity; empty scalar stays disabled", () => {
  const restored = normalizeMenuUpgrades({ wrap: choices[0] }, { wrap: 3 });
  assert.deepEqual(plain(restored.wrap), Array(3).fill(choices[0]));
  assert.deepEqual(plain(normalizeMenuUpgrades(restored, { wrap: 5 }).wrap), Array(3).fill(choices[0]));
  assert.deepEqual(plain(normalizeMenuUpgrades({ wrap: "" }, { wrap: 5 })), {});
  const legacy = buildMenuUpgradeItems({ wrap: choices[0] }, { wrap: 3 }, catalog);
  assert.equal(legacy.ok, true); assert.equal(menuDrinks(legacy.items)[0].qty, 3);
  assert.equal(buildMenuUpgradeItems({ wrap: "" }, { wrap: 3 }, catalog).items.length, 0);
});

test("invalid or unavailable stored drink choices stay visible for correction", () => {
  assert.deepEqual(plain(normalizeMenuUpgrades({ wrap: ["removed-drink", "", choices[0]] }, { wrap: 5 }).wrap), ["removed-drink", "", choices[0]]);
  assert.deepEqual(plain(normalizeMenuUpgrades(JSON.parse('{"__proto__":["drink-0"]}'), { wrap: 5 })), {});
});

test("same-brand drink rules retain shared fallback only when no local soft drinks exist", () => {
  const foreign = product("foreign-drink", { name: "Cola", category: "Drinks", brand: "other" });
  assert.deepEqual(plain(softDrinksForMenu(wrap, [...catalog, foreign]).map(p => p.id)), choices);
  assert.deepEqual(plain(softDrinksForMenu(wrap, [wrap, foreign]).map(p => p.id)), [foreign.id]);
  assert.equal(buildMenuUpgradeItems({ wrap: [foreign.id] }, { wrap: 1 }, [...catalog, foreign]).ok, false);
  assert.equal(buildMenuUpgradeItems({ wrap: [foreign.id] }, { wrap: 1 }, [wrap, foreign]).ok, true);
});

test("schema accepts old/new shape and rejects malformed counts and drink IDs", () => {
  assert(placeOrderSchema.safeParse(body()).success);
  assert(placeOrderSchema.safeParse(body({ menuUpgrades: { wrap: choices[0] } })).success);
  for (const menuUpgrades of [{ wrap: Array(100).fill(choices[0]) }, { wrap: [""] }, { wrap: [9] }, { wrap: { count: 5 } }]) {
    assert.equal(placeOrderSchema.safeParse(body({ menuUpgrades })).success, false);
  }
  assert.equal(placeOrderSchema.safeParse(body({ cart: { wrap: 1.5 } })).success, false);
});

test("real API validation and store compute canonical prices and preserve every drink choice", async () => {
  const { post, saved } = server();
  const response = await post(body({ price: 0, subtotal: 0 }));
  assert.equal(response.status, 200); assert.equal(response.body.ok, true);
  assert.equal(saved.length, 1); assert.equal(saved[0].subtotal, 69.95); assert.equal(saved[0].total, 69.95);
  assert.equal(menuDrinks(saved[0].items).length, 5);
  assert.equal(saved[0].items.find(item => item.productId === "wrap").price, 9.99);
});

test("real store rejects excess combos, unknown food/drinks and ineligible foods without saving", async () => {
  const pizza = product("pizza", { category: "Pizzas" });
  const curry = product("curry", { category: "Curries" });
  for (const menuUpgrades of [{ wrap: [...choices, choices[0]] }, { wrap: ["missing"] }, { wrap: ["pizza"] }, { missing: [choices[0]] }, { curry: [choices[0]] }, { wrap: [""] }]) {
    const { post, saved } = server([...catalog, pizza, curry]);
    const response = await post(body({ menuUpgrades }));
    assert.equal(response.body.ok, false); assert.equal(response.body.error, "invalidInput"); assert.equal(saved.length, 0);
  }
});

test("server mixed/legacy/BOGO quantities preserve paid wrap and menu rules", async () => {
  for (const [menuUpgrades, count, expected] of [[{ wrap: choices.slice(0, 3) }, 3, 61.95], [{ wrap: choices[0] }, 5, 69.95], [{}, 0, 49.95]]) {
    const { post, saved } = server([product("wrap", { bogoEnabled: true }), ...drinks]);
    const response = await post(body({ menuUpgrades })); assert.equal(response.body.ok, true);
    assert.equal(saved[0].subtotal, expected);
    assert.equal(saved[0].items.find(item => item.productId === "bogo-free:wrap").qty, 5);
    assert.equal(menuDrinks(saved[0].items).reduce((sum, item) => sum + item.qty, 0), count);
  }
});

test("server keeps existing VIP/company discounts, points and delivery rules", async () => {
  for (const [user, discount] of [[{ is_vip: true, points: 10 }, 6.2], [{ account_type: "company", points: 10 }, 12.39]]) {
    const { post, saved } = server(catalog, user);
    const response = await post(body({ menuUpgrades: { wrap: choices.slice(0, 3) }, pointsToUse: 4 }));
    assert.equal(response.body.ok, true); assert.equal(saved[0].subtotal, 61.95); assert.equal(saved[0].discount, discount);
    assert.equal(saved[0].pointsUsed, 4); assert.equal(saved[0].delivery, 0);
    assert.equal(saved[0].total, +(61.95 - discount - 4).toFixed(2));
  }
});

test("server delivery thresholds, minimum order and redeemed points retain existing rules", async () => {
  for (const [user, cart, menus, expected] of [
    [null, { wrap: 2 }, [choices[0]], { subtotal: 23.98, discount: 0, delivery: 2.5, pointsUsed: 0, total: 26.48 }],
    [{ is_vip: true, points: 10 }, { wrap: 2 }, [choices[0]], { subtotal: 23.98, discount: 2.4, delivery: 2.5, pointsUsed: 4, total: 20.08 }],
    [{ account_type: "company", points: 10 }, { wrap: 10 }, choices.slice(0, 3), { subtotal: 111.9, discount: 22.38, delivery: 0, pointsUsed: 4, total: 85.52 }],
  ]) {
    const { post, saved } = server(catalog, user);
    const response = await post(body({ fulfillment: "delivery", address: "Synthetic Street 1", postcode: "1032 KL", cart, menuUpgrades: { wrap: menus }, pointsToUse: 4 }));
    assert.equal(response.body.ok, true);
    for (const [key, value] of Object.entries(expected)) assert.equal(saved[0][key], value, key);
  }
  const { post, saved } = server();
  const response = await post(body({ fulfillment: "delivery", address: "Synthetic Street 1", postcode: "1032 KL", cart: { wrap: 1 }, menuUpgrades: {} }));
  assert.equal(response.body.error, "minOrder"); assert.equal(saved.length, 0);
});

test("real persistence serializes every drink into the existing order_items contract", async () => {
  let recorded;
  const menu = buildMenuUpgradeItems({ wrap: choices }, { wrap: 5 }, catalog);
  const computed = { customerName: "Synthetic", customerEmail: "synthetic@example.invalid", address: "", postcode: "", phone: "00000", items: [{ productId: wrap.id, name: wrap.name, price: wrap.price, qty: 5, brand: wrap.brand, category: wrap.category }, ...menu.items], subtotal: 69.95, discount: 0, pointsUsed: 0, pointsEarned: 6, delivery: 0, total: 69.95, accountType: "personal", fulfillment: "pickup" };
  const sql = {
    query: (text, params) => ({ text, params }),
    transaction: async queries => {
      recorded = queries;
      const id = queries[1].params[0];
      return [[], [{ id }], [], [], [{ id, order_number: 1001, customer_name: computed.customerName, address: "", postcode: "", phone: "00000", subtotal: computed.subtotal, discount: 0, points_used: 0, points_earned: 6, delivery: 0, total: computed.total, created_at: new Date(), status: "new", paid: true, account_type: "personal", fulfillment: "pickup" }]];
    },
  };
  const { persistOrder } = modules({ "./db": { sql } })("app/lib/orderPersistence.ts");
  const order = await persistOrder(computed, true);
  const insert = recorded.find(query => query.text.includes("INSERT INTO order_items"));
  assert(insert); assert.match(insert.text, /jsonb_to_recordset/);
  assert.deepEqual(JSON.parse(insert.params[1]), plain(computed.items));
  assert.equal(menuDrinks(order.items).length, 5); assert.equal(order.total, 69.95);
  assert.equal(recorded.length, 5);
});

test("older flat menu order rows still map unchanged for receipts and admin", () => {
  const { rowToOrderItem } = load("app/lib/mappers.ts");
  const old = rowToOrderItem({ product_id: "menu-drink:wrap:drink-0", name: "Free soft drink: Cola", price: "0", qty: 5, brand: "tandoor", category: "Drinks" });
  assert.equal(old.productId, "menu-drink:wrap:drink-0"); assert.equal(old.qty, 5); assert.equal(old.price, 0); assert.equal(old.name, "Free soft drink: Cola");
});

test("only menu validation reads the bounded full catalog and never accepts a truncated catalog", async () => {
  const plainOrder = server();
  await plainOrder.post(body({ menuUpgrades: {} }));
  const narrow = plainOrder.queries.find(query => query.text.includes("FROM products"));
  assert.match(narrow.text, /WHERE id = ANY/); assert.deepEqual(plain(narrow.params), [["wrap"]]);
  const menuOrder = server();
  await menuOrder.post(body());
  const full = menuOrder.queries.find(query => query.text.includes("FROM products"));
  assert.match(full.text, /LIMIT \$1/); assert.deepEqual(plain(full.params), [1001]);
  const overflow = server([...catalog, ...Array.from({ length: 1000 }, (_, index) => product(`overflow-${index}`))]);
  const response = await overflow.post(body());
  assert.equal(response.body.error, "invalidInput"); assert.equal(overflow.saved.length, 0);
});

test("drink rows preserve food associations when different dishes choose the same drinks", () => {
  const burger = product("burger", { category: "Burgers", price: 8 });
  const result = buildMenuUpgradeItems({ wrap: [choices[0], choices[1]], burger: [choices[0]] }, { wrap: 3, burger: 1 }, [...catalog, burger]);
  assert.equal(result.ok, true);
  assert.deepEqual(plain(menuDrinks(result.items).map(item => item.productId)), ["menu-drink:wrap:drink-0", "menu-drink:wrap:drink-1", "menu-drink:burger:drink-0"]);
  assert.equal(new Set(result.items.map(item => item.productId)).size, result.items.length);
  assert.equal(result.items.filter(item => item.productId.startsWith("menu-upgrade:")).reduce((sum, item) => sum + item.qty, 0), 3);
});

test("actual UI pricing helper matches real route/store at the VIP free-delivery rounding boundary", async () => {
  const foodA = product("food-a", { price: 3.02 });
  const foodB = product("food-b", { price: 3.03 });
  const paidDrink = product("paid-drink", { name: "Paid lassi", category: "Drinks", subcategory: "Indian Lassi", price: 20.95 });
  const products = [foodA, foodB, paidDrink, ...drinks];
  const cart = { "food-a": 1, "food-b": 1, "paid-drink": 1 };
  const menuUpgrades = { "food-a": [choices[0]] };
  const quote = cartMenuPriceTotals(Object.entries(cart).map(([id, qty]) => ({ product: products.find(p => p.id === id), qty })), menuUpgrades);
  const discount = +(quote.foodSubtotal * .1).toFixed(2);
  const payable = +(quote.subtotal - discount).toFixed(2);
  const delivery = payable >= 30 ? 0 : 2.5;
  const total = +(payable + delivery).toFixed(2);
  const { post, saved } = server(products, { is_vip: true });
  const response = await post(body({ cart, menuUpgrades, fulfillment: "delivery", address: "Synthetic Street 1", postcode: "1032 KL" }));
  assert.equal(response.body.ok, true);
  assert.deepEqual(plain(quote), { subtotal: 31, foodSubtotal: 10.05 });
  assert.equal(discount, 1.01); assert.equal(payable, 29.99); assert.equal(delivery, 2.5); assert.equal(total, 32.49);
  for (const [key, value] of Object.entries({ subtotal: quote.subtotal, discount, delivery, total })) assert.equal(saved[0][key], value, key);
  const previousFoodSubtotal = [foodA, foodB].reduce((sum, food) => sum + food.price, 4);
  assert.equal(+(previousFoodSubtotal * .1).toFixed(2), 1); // Detects the former UI aggregation bug.
});

test("actual UI helper preserves per-food menu fee order instead of lumping fees", async () => {
  const foodA = product("food-a", { price: .01, bogoEnabled: true });
  const foodB = product("food-b", { price: .01, category: "Burgers" });
  const paidDrink = product("paid-drink", { name: "Paid lassi", category: "Drinks", price: 20.95 });
  const products = [foodA, foodB, paidDrink, ...drinks];
  const cart = { "food-a": 1, "paid-drink": 1, "food-b": 2 };
  const menuUpgrades = { "food-a": [choices[0]], "food-b": [choices[1], choices[2]] };
  const lines = Object.entries(cart).map(([id, qty]) => ({ product: products.find(p => p.id === id), qty }));
  const quote = cartMenuPriceTotals(lines, menuUpgrades);
  const { post, saved } = server(products, { is_vip: true, points: 10 });
  const response = await post(body({ cart, menuUpgrades, pointsToUse: 4 }));
  assert.equal(response.body.ok, true);
  const serverFoodSubtotal = saved[0].items.reduce((sum, item) => item.category === "Drinks" ? sum : sum + item.price * item.qty, 0);
  assert.equal(quote.foodSubtotal, 12.030000000000001);
  assert.equal(quote.foodSubtotal, serverFoodSubtotal);
  assert.notEqual(quote.foodSubtotal, (.01 + .01 * 2) + 12);
  assert.equal(quote.subtotal, saved[0].subtotal);
  const discount = +(quote.foodSubtotal * .1).toFixed(2);
  assert.equal(discount, saved[0].discount);
  assert.equal(+(quote.subtotal - discount - 4).toFixed(2), saved[0].total);
});

test("ordered UI quote retains priced blank/unavailable menus while correction is required", () => {
  const quote = cartMenuPriceTotals([{ product: wrap, qty: 5 }], { wrap: ["", "removed-drink"] });
  assert.deepEqual(plain(quote), { subtotal: 57.95, foodSubtotal: 57.95 });
});

test("real route rejects unknown positive base product IDs without silently under-ordering", async () => {
  for (const cart of [{ wrap: 1, ghost: 1 }, { wrap: 1, "ghost::side:rice": 1 }]) {
    const { post, saved } = server();
    const response = await post(body({ cart, menuUpgrades: {} }));
    assert.equal(response.body.error, "invalidInput"); assert.equal(saved.length, 0);
  }
});

test("legacy zero quantity keys stay ignored and zero-only orders remain empty", async () => {
  const normal = server();
  const response = await normal.post(body({ cart: { wrap: 1, ghost: 0 }, menuUpgrades: {} }));
  assert.equal(response.body.ok, true); assert.equal(normal.saved.length, 1);
  assert.equal(normal.saved[0].items.length, 1); assert.equal(normal.saved[0].subtotal, 9.99);
  for (const cart of [{ ghost: 0 }, { wrap: 0 }, {}]) {
    const empty = server();
    const result = await empty.post(body({ cart, menuUpgrades: {} }));
    assert.equal(result.body.error, "empty"); assert.equal(empty.saved.length, 0);
  }
});

test("ignored zero food keys cannot smuggle malformed upgrade extras into a valid order", async () => {
  for (const menuUpgrades of [{ ghost: [choices[0]] }, { wrap: ["ghost-drink"] }, { wrap: [choices[0], choices[1]] }]) {
    const { post, saved } = server();
    const response = await post(body({ cart: { wrap: 1, ghost: 0 }, menuUpgrades }));
    assert.equal(response.body.error, "invalidInput"); assert.equal(saved.length, 0);
  }
});
