/* eslint-disable @typescript-eslint/no-require-imports -- Executes the real JSX functions in an isolated fixture. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
function compile(source, bindings = {}, filename = 'fixture.tsx') {
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const mod = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports,${Object.keys(bindings).join(',')}){${code}\n})`, { filename })(require, mod, mod.exports, ...Object.values(bindings));
  return mod.exports;
}
const text = fs.readFileSync(path.join(root, 'app/admin/page.tsx'), 'utf8');
const ast = ts.createSourceFile('admin.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const functions = ast.statements.filter(ts.isFunctionDeclaration);
const chartCode = ['smoothPath', 'DailySalesChart'].map(name => functions.find(node => node.name?.text === name).getText(ast)).join('\n');
const chart = compile(chartCode + '\nexports.Chart = DailySalesChart;').Chart;
const data = Array.from({length: 316}, (_, index) => { const date = new Date('2025-12-31T00:00:00Z'); date.setUTCDate(date.getUTCDate() + index); return {date: date.toISOString().slice(0,10), revenue: index === 0 ? 25 : 0, orders: index === 0 ? 1 : 0}; });
const props = { data, title: 'Daily progress', revenueLabel: 'Revenue', ordersLabel: 'Orders', noData: 'No data' };
const html = renderToStaticMarkup(React.createElement(chart, props));
assert.equal((html.match(/<title>/g) || []).length, 316);
assert.equal((html.match(/<circle/g) || []).length, 632);
assert.match(html, /2025/); assert.match(html, /2026/); assert.match(html, /overflow-x-auto/);
assert.match(renderToStaticMarkup(React.createElement(chart, {...props, data: []})), /No data/);
assert.equal((renderToStaticMarkup(React.createElement(chart, {...props, data: [data[0]]})).match(/<circle/g) || []).length, 2);
const page = functions.find(node => node.name?.text === 'AdminPage');
const declaration = page.body.statements.filter(ts.isVariableStatement).flatMap(node => [...node.declarationList.declarations]).find(node => node.name.getText(ast) === 'renderRangeFilter');
const translations = compile(fs.readFileSync(path.join(root, 'app/lib/translations.ts'), 'utf8')).translations;
const now = Date.parse('2026-11-11T12:00:00Z');
for (const lang of ['en','nl']) {
  const render = compile('exports.render = ' + declaration.initializer.getText(ast), {t: translations[lang], now, amsterdamDateKey: () => '2026-11-11', rangeFilterError: filter => filter.preset !== 'date' ? null : !filter.startDate || !filter.endDate ? 'incomplete' : filter.startDate > filter.endDate ? 'invalid' : null}).render;
  let updated;
  const tree = render({preset: 'date', startDate: '2026-01-01', endDate: '2026-09-01'}, value => {updated=value;});
  const elements = [];
  function walk(node) { if (Array.isArray(node)) node.forEach(walk); else if (React.isValidElement(node)) { elements.push(node); walk(node.props.children); } }
  walk(tree);
  const inputs = elements.filter(node => node.type === 'input');
  assert.equal(inputs.length, 2); assert.equal(inputs[0].props.value, '2026-01-01'); assert.equal(inputs[1].props.value, '2026-09-01');
  inputs[1].props.onChange({target:{value:'2026-09-30'}}); assert.deepEqual(updated, {preset:'date',startDate:'2026-01-01',endDate:'2026-09-30'});
  inputs[0].props.onChange({target:{value:'2025-12-31'}}); assert.deepEqual(updated, {preset:'date',startDate:'2025-12-31',endDate:'2026-09-01'});
  inputs[0].props.onChange({target:{value:''}}); assert.equal(updated.preset,'date'); assert.equal(updated.startDate,''); assert.equal(updated.endDate,'2026-09-01');
  elements.find(node => node.type === 'button').props.onClick(); assert.deepEqual(updated, {preset:'all'});
  assert.match(renderToStaticMarkup(render({preset:'date',startDate:'2026-11-01'},()=>{})), /role="status"/);
  assert.match(renderToStaticMarkup(render({preset:'date',startDate:'2026-11-02',endDate:'2026-11-01'},()=>{})), /aria-invalid="true"/);
  assert.match(renderToStaticMarkup(render({preset:'all'},()=>{})), /max="2026-11-11"/);
}
console.log('PASS actual admin JSX fixture: 316 daily chart points + year labels, empty/single-day charts, EN/NL two date inputs, independent start/end changes, clearing validation, invalid range status, All time reset. Component render/event checks only; not browser verification.');
