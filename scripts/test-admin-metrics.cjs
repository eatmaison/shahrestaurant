/* eslint-disable @typescript-eslint/no-require-imports -- Isolated TypeScript fixture runner. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { performance } = require('node:perf_hooks');

function load(file) {
  const filename = path.resolve(__dirname, '..', file);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename })(
    name => name === './restaurantClock' ? load('app/lib/restaurantClock.ts') : require(name), mod, mod.exports,
  );
  return mod.exports;
}
const { buildDailyMetrics, makeRangeCheck, amsterdamDateKey, rangeFilterError } = load('app/lib/adminMetrics.ts');
const now = Date.parse('2026-11-11T12:00:00Z');
const order = (date, total = 10, paid = true, accountType = 'individual') => ({ createdAt: Date.parse(date), total, paid, accountType });
const orders = [
  order('2025-12-30T23:30:00Z', 100, false), // First received order, even unpaid.
  order('2026-01-01T12:00:00Z', 20),
  order('2026-09-01T12:00:00Z', 30),
  order('2026-11-10T23:00:00Z', 40, false, 'company'),
  order('2026-11-11T12:00:00Z', 50),
  order('2026-11-11T14:00:00Z', 500), // Impossible future order is ignored.
  { ...order('2026-11-10T12:00:00Z'), createdAt: NaN },
];
const all = buildDailyMetrics(orders, { preset: 'all' }, now);
assert.equal(all[0].date, '2025-12-31');
assert.equal(all.at(-1).date, '2026-11-11');
assert.equal(all.length, 316);
assert.deepEqual(all[0], { date: '2025-12-31', revenue: 0, orders: 0 });
assert.equal(all.reduce((sum, day) => sum + day.revenue, 0), 140);
assert.equal(all.reduce((sum, day) => sum + day.orders, 0), 4);
const month = buildDailyMetrics(orders, { preset: '30d' }, now);
assert.equal(month.length, 30); assert.equal(month[0].date, '2026-10-13');
assert.equal(month.reduce((sum, day) => sum + day.revenue, 0), 90);
assert.equal(buildDailyMetrics(orders, { preset: '7d' }, now).length, 7);
assert.equal(buildDailyMetrics(orders, { preset: 'today' }, now).length, 1);
assert.deepEqual(buildDailyMetrics([], { preset: 'all' }, now), []);
assert.equal(buildDailyMetrics([], { preset: '30d' }, now).length, 30);
const empty = buildDailyMetrics(orders, { preset: 'date', startDate: '2026-06-01', endDate: '2026-06-03' }, now);
assert.equal(empty.length, 3); assert.ok(empty.every(day => day.revenue === 0 && day.orders === 0));

for (const filter of [
  { preset: 'date' }, { preset: 'date', startDate: '2026-10-01' },
  { preset: 'date', startDate: '2026-10-05', endDate: '2026-10-01' },
  { preset: 'date', startDate: '2026-02-30', endDate: '2026-03-01' },
  { preset: 'date', startDate: 'invalid', endDate: '2026-03-01' },
  { preset: 'date', startDate: '0001-01-01', endDate: '2026-03-01' },
  { preset: 'date', startDate: '9999-12-31', endDate: '9999-12-31' },
]) {
  assert.ok(rangeFilterError(filter));
  assert.equal(makeRangeCheck(filter, now)(now), false);
  assert.deepEqual(buildDailyMetrics(orders, filter, now), []);
}

// Amsterdam spring day has 23 hours and autumn day has 25. End day is inclusive.
for (const [day, start, end, hours] of [
  ['2026-03-29', '2026-03-28T23:00:00Z', '2026-03-29T22:00:00Z', 23],
  ['2026-10-25', '2026-10-24T22:00:00Z', '2026-10-25T23:00:00Z', 25],
]) {
  const filter = { preset: 'date', startDate: day, endDate: day };
  const matches = makeRangeCheck(filter, now);
  const startMs = Date.parse(start), endMs = Date.parse(end);
  assert.equal((endMs - startMs) / 3600000, hours);
  assert.equal(matches(startMs - 1), false); assert.equal(matches(startMs), true);
  assert.equal(matches(endMs - 1), true); assert.equal(matches(endMs), false);
  const metrics = buildDailyMetrics([order(start, 10), { ...order(end, 20), createdAt: endMs - 1 }, order(end, 100)], filter, now);
  assert.deepEqual(metrics, [{ date: day, revenue: 30, orders: 2 }]);
}
const custom = { preset: 'date', startDate: '2025-12-31', endDate: '2026-01-01' };
assert.equal(buildDailyMetrics(orders, custom, now).length, 2);
assert.equal(amsterdamDateKey(Date.parse('2026-03-31T22:30:00Z')), '2026-04-01');
// A long-lived tab recomputes both filtering and daily buckets after local midnight.
assert.equal(makeRangeCheck({ preset: 'today' }, Date.parse('2026-11-11T22:59:59Z'))(Date.parse('2026-11-11T12:00:00Z')), true);
assert.equal(makeRangeCheck({ preset: 'today' }, Date.parse('2026-11-11T23:00:00Z'))(Date.parse('2026-11-11T12:00:00Z')), false);
for (const preset of ['all', 'today', '7d', '30d']) {
  const filter = { preset };
  const matches = makeRangeCheck(filter, now);
  const selected = orders.filter(item => (item.paid || item.accountType === 'company') && matches(item.createdAt));
  const metrics = buildDailyMetrics(orders, filter, now);
  assert.equal(metrics.reduce((sum, item) => sum + item.orders, 0), selected.length);
  assert.equal(metrics.reduce((sum, item) => sum + item.revenue, 0), selected.reduce((sum, item) => sum + item.total, 0));
}
// Database/admin pagination must not cap chart history. Helpers process all 100k rows.
const large = Array.from({ length: 100_000 }, (_, index) => ({ ...order('2017-01-01T12:00:00Z', 1), createdAt: Date.parse('2017-01-01T12:00:00Z') + index * 3_000_000 }));
const started = performance.now();
const longSeries = buildDailyMetrics(large, { preset: 'all' }, now);
const elapsedMs = Math.round(performance.now() - started);
assert.equal(longSeries[0].date, '2017-01-01'); assert.equal(longSeries.at(-1).date, '2026-11-11');
assert.equal(longSeries.reduce((sum, item) => sum + item.orders, 0), 100_000);
assert.equal(longSeries.reduce((sum, item) => sum + item.revenue, 0), 100_000);
assert.ok(elapsedMs < 5000, `100k order aggregation exceeded 5s: ${elapsedMs}ms`);
console.log(`PASS admin daily metrics (${process.env.TZ || 'system timezone'}): full history, 1/7/30 day windows, inclusive custom range, zero days, invalid/incomplete range, Amsterdam DST boundaries, midnight refresh, aggregate parity; 100k orders / ${longSeries.length} days in ${elapsedMs}ms. No database or network access.`);
