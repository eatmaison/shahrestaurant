/* eslint-disable @typescript-eslint/no-require-imports -- Offline tests execute the real TypeScript/JSX with isolated data dependencies. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { NextRequest } = require('next/server');
const root = path.resolve(__dirname, '..');
let passed = 0;
function source(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function load(file, mocks = {}) {
  const code = ts.transpileModule(source(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (['react', 'react/jsx-runtime', 'next/server', 'react-icons/fa6'].includes(id)) return require(id);
    const iconPack = id.match(/(?:^|\/)icons\/(fa6|si|md)$/)?.[1];
    if (iconPack) {
      const resolved = path.relative(root, path.resolve(root, path.dirname(file), id + '.tsx')).replaceAll('\\', '/');
      assert.equal(resolved, `app/components/icons/${iconPack}.tsx`);
      return load(resolved, { '../SpriteIcon': load('app/components/SpriteIcon.tsx') });
    }
    throw new Error(`Unexpected dependency ${id} in ${file}`);
  }, mod, mod.exports);
  return mod.exports;
}
async function test(name, run) { await run(); passed++; console.log(`PASS ${name}`); }
const eventRoutes = ['/events', ...fs.readdirSync(path.join(root, 'app/events'), { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => '/events/' + entry.name)];
const locale = load('app/lib/locale.ts');
const site = load('app/lib/seo.ts', { './locale': locale });
const eventSeo = load('app/lib/eventSeo.ts', { './locale': locale, './seo': site });
const eventShell = load('app/components/EventsShell.tsx', { '../lib/seo': site, '../events/events.module.css': { default: { pages: 'events-review' } } });
const translations = load('app/lib/translations.ts').translations;
let role = null;
let state = [];
const hooks = { ...React, useState: initial => [state.length ? state.shift() : initial, () => {}], useRef: () => ({ current: null }), useEffect: () => {} };
const providers = {
  useStore: () => ({ currentUser: role ? { role, name: 'Fixture visitor' } : null, cart: {}, socialLinks: [] }),
  useLang: () => ({ lang: 'nl', t: translations.nl, setLang: () => {} }),
  useTheme: () => ({ theme: 'light', toggleTheme: () => {} }),
};
const Link = ({ href, children, ...props }) => { delete props.prefetch; return React.createElement('a', { ...props, href }, children); };
const styles = new Proxy({}, { get: (_target, key) => key === '__esModule' ? false : String(key) });
const header = load('app/components/header.tsx', {
  react: hooks, './LocaleLink': { default: Link }, '../lib/locale': locale,
  './BrandLogo': { BrandLogo: () => null }, 'next/navigation': { usePathname: () => '/events', useRouter: () => ({ push: () => {} }) },
  '../lib/clientStorage': { writeSessionValue: () => true }, '../providers': providers, './header.module.css': { default: styles },
}).Header;
const footer = load('app/components/footer.tsx', {
  react: hooks, './LocaleLink': { default: Link }, './BrandLogo': { BrandLogo: () => null }, '../providers': providers, './socialIcons': { SOCIAL_PLATFORMS: [] },
}).Footer;
const denied = () => { throw new Error('NOT_FOUND'); };
(async () => {
  const jose = await import('jose');
  const secret = 'offline-events-test-secret-not-for-use-outside-tests';
  const oldSecret = process.env.SESSION_SECRET;
  const oldNodeEnv = process.env.NODE_ENV;
  process.env.SESSION_SECRET = secret;
  process.env.NODE_ENV = 'production';
  let dbCalls = 0;
  let unavailable = false;
  const roles = new Map([['user-fixture', 'user'], ['admin-fixture', 'admin']]);
  const { hasEventAdminAccess } = load('app/lib/eventAccess.ts', { jose, './db': { sql: { query: async (query, values) => {
    dbCalls++; assert.equal(query, 'SELECT role FROM users WHERE id = $1');
    if (unavailable) throw new Error('Offline fixture database failure');
    return roles.has(values[0]) ? [{ role: roles.get(values[0]) }] : [];
  } } } });
  const sign = (userId, expires = '1h', key = secret) => new jose.SignJWT({ userId, role: 'admin' }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime(expires).sign(new TextEncoder().encode(key));
  const tokens = { guest: undefined, user: await sign('user-fixture'), admin: await sign('admin-fixture') };
  const { proxy } = load('proxy.ts', { './app/lib/eventAccess': { hasEventAdminAccess }, './app/lib/locale': locale });
  function request(route, token, method = 'GET', extra = {}) {
    return new NextRequest('https://shahrestaurant.nl' + route, { method, headers: { host: 'shahrestaurant.nl', ...(token ? { cookie: `etg_session=${token}` } : {}), ...extra } });
  }
  try {
    await test('all seven event routes permit guests, registered users and admins without a role lookup', async () => {
      assert.equal(eventRoutes.length, 7);
      for (const token of Object.values(tokens)) for (const route of eventRoutes) for (const method of ['GET', 'HEAD']) {
        const before = dbCalls; const response = await proxy(request(route, token, method));
        assert.equal(response.status, 200, `${route} ${method}`); assert.equal(response.headers.get('x-middleware-next'), '1');
        assert.equal(response.headers.get('x-robots-tag'), null); assert.equal(dbCalls, before);
      }
    });
    await test('parties, nested routes and APIs remain denied to guests and registered users, including RSC navigation', async () => {
      for (const token of [tokens.guest, tokens.user]) for (const method of ['GET', 'HEAD']) for (const route of ['/parties', '/parties/complete', '/parties/future/nested']) {
        const response = await proxy(request(route, token, method, { RSC: '1', 'x-middleware-subrequest': 'proxy:proxy:proxy' }));
        assert.equal(response.status, 404); assert.match(response.headers.get('cache-control'), /private, no-store/); assert.match(response.headers.get('x-robots-tag'), /noindex/);
      }
      for (const token of [tokens.guest, tokens.user]) for (const route of ['/api/parties', '/api/parties/admin', '/api/parties/booking', '/api/parties/checkout', '/api/parties/future']) for (const method of ['GET', 'POST']) {
        assert.equal((await proxy(request(route, token, method))).status, 403, route);
      }
    });
    await test('valid admin sessions retain private page/API access with no-store and noindex', async () => {
      for (const route of ['/parties', '/parties/complete', '/api/parties', '/api/parties/admin', '/api/parties/booking', '/api/parties/checkout']) {
        const response = await proxy(request(route, tokens.admin)); assert.equal(response.status, 200);
        assert.match(response.headers.get('cache-control'), /private, no-store/); assert.match(response.headers.get('x-robots-tag'), /noindex/);
      }
    });
    await test('real JWT verification rejects forged, expired, deleted/demoted users and fails closed', async () => {
      for (const token of ['invalid', await sign('admin-fixture', '1h', 'wrong-test-key'), await sign('admin-fixture', -1), await sign('missing-fixture'), tokens.user]) assert.equal(await hasEventAdminAccess(token), false);
      roles.set('admin-fixture', 'user'); assert.equal(await hasEventAdminAccess(tokens.admin), false); roles.set('admin-fixture', 'admin');
      unavailable = true; assert.equal(await hasEventAdminAccess(tokens.admin), false); unavailable = false;
      delete process.env.SESSION_SECRET; assert.equal(await hasEventAdminAccess(tokens.admin), false); process.env.SESSION_SECRET = secret;
    });
    await test('payment webhook exception is exact; canonical redirects retain privacy after navigation', async () => {
      const before = dbCalls; assert.equal((await proxy(request('/api/parties/webhook', undefined, 'POST'))).status, 200); assert.equal(dbCalls, before);
      assert.equal((await proxy(request('/api/parties/webhook/extra', undefined, 'POST'))).status, 403);
      for (const route of ['/parties/', '/events/', '/events/gallery/']) {
        const redirect = await proxy(request(route)); assert.equal(redirect.status, 308);
        const target = new URL(redirect.headers.get('location')); assert.equal((await proxy(request(target.pathname))).status, route.startsWith('/parties') ? 404 : 200);
      }
    });
  } finally {
    if (oldSecret === undefined) delete process.env.SESSION_SECRET; else process.env.SESSION_SECRET = oldSecret;
    if (oldNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldNodeEnv;
  }
  await test('event layouts render all children publicly and override inherited noindex', () => {
    const layout = load('app/events/layout.tsx', { '../lib/eventSeo': eventSeo, '../components/EventsShell': eventShell }); assert.equal(layout.metadata.robots.index, true); assert.equal(layout.metadata.robots.follow, true);
    const html = renderToStaticMarkup(layout.default({ children: 'PUBLIC_EVENT' }));
    assert.match(html, /PUBLIC_EVENT/);
    const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.equal(scripts.length, 1);
    assert.deepEqual(JSON.parse(scripts[0][1]), site.siteSchema('nl'));
    for (const route of eventRoutes.slice(1)) {
      const nested = load(`app${route}/layout.tsx`, { '../../lib/eventSeo': eventSeo }); assert.match(renderToStaticMarkup(nested.default({ children: 'PUBLIC_EVENT' })), /PUBLIC_EVENT/);
      assert.equal(nested.metadata.alternates.canonical, route); assert.notEqual(nested.metadata.robots?.index, false);
    }
  });
  await test('parties layout independently enforces admin role', async () => {
    for (const userRole of [null, 'user', 'admin']) {
      const layout = load('app/parties/layout.tsx', { 'next/navigation': { notFound: denied }, '../lib/serverStore': { getCurrentUser: async () => userRole ? { role: userRole } : null } });
      if (userRole === 'admin') assert.equal(await layout.default({ children: 'PRIVATE' }), 'PRIVATE');
      else await assert.rejects(() => layout.default({ children: 'PRIVATE' }), /NOT_FOUND/);
      assert.equal(layout.metadata.robots.index, false);
    }
  });
  await test('party handlers reject unauthorised requests before any data read or checkout write', async () => {
    class PartyError extends Error { constructor(message, status) { super(message); this.status = status; } }
    const failData = () => { throw new Error('DATA_FUNCTION_CALLED'); };
    const partyStore = { PartyError, partyAdmin: async () => { throw new PartyError('Administrator access required', 403); }, listParties: failData, listPartyGuests: failData, getPartyBooking: failData, beginPartyCheckout: failData, saveParty: failData, retryPartyPayments: failData };
    for (const [file, method, route] of [['route.ts', 'GET', '/api/parties'], ['admin/route.ts', 'GET', '/api/parties/admin'], ['admin/route.ts', 'POST', '/api/parties/admin'], ['booking/route.ts', 'POST', '/api/parties/booking'], ['checkout/route.ts', 'POST', '/api/parties/checkout']]) {
      const prefix = file === 'route.ts' ? '../../lib/' : '../../../lib/';
      const handler = load('app/api/parties/' + file, { [prefix + 'partyStore']: partyStore, [prefix + 'rateLimit']: { enforceRateLimit: () => null }, [prefix + 'serverStore']: { publicOrigin: failData } });
      assert.equal((await handler[method](new NextRequest('https://shahrestaurant.nl' + route, { method }))).status, 403);
    }
  });
  await test('desktop and expanded mobile event menus appear for every role, parties only for admins', () => {
    for (role of [null, 'user', 'admin']) {
      state = [true, true, false];
      const html = renderToStaticMarkup(React.createElement(header));
      assert.match(html, /id="mobile-events"/);
      const anchors = [...html.matchAll(/<a\b[^>]*>/g)].map(match => match[0]);
      const navigationAnchors = anchors.filter(tag => !tag.includes('data-language-link'));
      for (const route of eventRoutes) assert.equal(navigationAnchors.filter(tag => tag.includes(`href="${route}"`)).length, 2, route);
      const languageAnchors = anchors.filter(tag => tag.includes('data-language-link'));
      assert.equal(languageAnchors.length, 4);
      assert.equal(languageAnchors.filter(tag => tag.includes('href="/events"')).length, 2);
      assert.equal(languageAnchors.filter(tag => tag.includes('href="/en/events"')).length, 2);
      assert.equal(html.includes('href="/parties"'), role === 'admin');
      state = [];
      assert.match(renderToStaticMarkup(React.createElement(footer)), /href="\/events\/gallery"/);
    }
  });
  await test('homepage event links, three-card layout and celebrations FAQ are public', () => {
    const page = source('app/page.tsx'); assert.doesNotMatch(page, /isAdmin|adminOnly|data-admin|href\.startsWith\("\/events"\)/);
    for (const route of ['/events', '/events/gallery', '/events/about', '/events/birthdays', '/events/celebrations', '/events/company-catering']) assert.ok(page.includes(`"${route}"`));
    const content = load('app/lib/homeContent.ts').homeContent;
    for (const lang of ['nl', 'en']) assert.ok(content[lang].questions.some(question => /evenementenpagina|events pages/.test(question.answer) && !question.adminOnly));
    assert.match(source('app/home.module.css'), /\.home \.eveningGrid \{ grid-template-columns: repeat\(3/);
  });
  await test('sitemap and robots expose all event marketing pages but no private parties', () => {
    const urls = load('app/sitemap.ts', { './lib/locale': locale, './lib/seo': site }).default().map(item => item.url);
    for (const route of eventRoutes) assert.ok(urls.includes(site.SITE_URL + route));
    assert.ok(urls.every(url => !url.includes('/parties')));
    const robots = load('app/robots.ts', { './lib/seo': site }).default();
    assert.ok(!robots.rules.disallow.includes('/events')); assert.ok(robots.rules.disallow.includes('/parties'));
  });
  console.log(JSON.stringify({ passed, eventRoutes, realJWTAndNextRequest: true, networkCalls: 0, productionDatabaseCalls: 0, browserVerification: false }));
})().catch(error => { console.error(error); process.exitCode = 1; });
