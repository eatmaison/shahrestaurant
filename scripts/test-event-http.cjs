/* eslint-disable @typescript-eslint/no-require-imports -- Local-only production-build HTTP regression test. */
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const [dist, appUrl, previewUrl, evidence = 'docs/events-visibility-http-20261111.json'] = process.argv.slice(2);
if (!/^\.next-review-[a-z0-9-]+$/.test(dist || '')) throw new Error('Use an isolated .next-review-<name> build.');
function loopback(value) {
  const url = new URL(value);
  assert.equal(url.protocol, 'http:'); assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname));
  assert.equal(url.pathname, '/'); assert.ok(!url.username && !url.password && !url.search && !url.hash);
  return url.origin;
}
const origin = loopback(appUrl), preview = loopback(previewUrl);
const target = path.resolve(root, evidence), relative = path.relative(root, target);
assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative), 'Evidence must remain inside the checkout');
const buildId = fs.readFileSync(path.join(root, dist, 'BUILD_ID'), 'utf8').trim();
const nlRoutes = ['/events', '/events/about', '/events/birthdays', '/events/celebrations', '/events/company-catering', '/events/company-lunches', '/events/gallery'];
const routes = [...nlRoutes, ...nlRoutes.map(route => '/en' + route)];
const publicRoutes = ['/', '/en', '/menukaart', '/en/menu', '/reserveren', '/en/reservations', '/privacy', '/en/privacy', '/voorwaarden', '/en/terms', ...routes];
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(match => [match[1].toLowerCase(), match[2]]));
const results = [];
(async () => {
  for (const cookie of ['', 'etg_session=invalid-offline-fixture']) for (const route of routes) {
    const response = await fetch(origin + route, { headers: cookie ? { cookie } : {}, redirect: 'manual' }), html = await response.text();
    assert.equal(response.status, 200, route); assert.ok(html.includes(buildId)); assert.equal((html.match(/<h1\b/g) || []).length, 1);
    const locale = route.startsWith('/en/') ? 'en' : 'nl';
    assert.match(html, new RegExp('<html\\b[^>]*\\blang="' + locale + '"'));
    const links = [...html.matchAll(/<link\b[^>]*>/g)].map(match => attributes(match[0]));
    assert.equal(links.find(link => link.rel === 'canonical')?.href, 'https://shahrestaurant.nl' + route);
    const nl = locale === 'en' ? route.slice(3) : route;
    const alternates = links.filter(link => link.rel === 'alternate' && link.hreflang);
    assert.equal(alternates.length, 3);
    assert.deepEqual(Object.fromEntries(alternates.map(link => [link.hreflang, link.href])), {
      'nl-NL': 'https://shahrestaurant.nl' + nl, en: 'https://shahrestaurant.nl/en' + nl, 'x-default': 'https://shahrestaurant.nl' + nl,
    });
    assert.doesNotMatch(html, /<meta name="robots" content="[^"]*noindex/); assert.match(html, /<meta name="robots" content="index, follow"/);
    assert.ok(!html.includes('href="/parties"')); results.push({ route, locale, session: cookie ? 'invalid' : 'guest', status: response.status, indexable: true, selfCanonical: true, reciprocalAlternates: 3 });
  }
  for (const route of ['/parties', '/parties/complete', '/parties/future/nested']) for (const method of ['GET', 'HEAD']) {
    const response = await fetch(origin + route, { method, headers: { RSC: '1', 'x-middleware-subrequest': 'proxy:proxy:proxy' }, redirect: 'manual' });
    assert.equal(response.status, 404); assert.match(response.headers.get('cache-control'), /private, no-store/); assert.match(response.headers.get('x-robots-tag'), /noindex/);
    results.push({ route, method, status: response.status });
  }
  // These local unauthenticated requests must stop at the proxy, before any transaction logic.
  for (const route of ['/api/parties', '/api/parties/admin', '/api/parties/booking', '/api/parties/checkout']) {
    const response = await fetch(origin + route, { method: 'POST' }); assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: 'Administrator access required' }); results.push({ route, method: 'POST', status: response.status });
  }
  for (const route of ['/PARTIES', '/parties%2fcomplete', '/events/not-a-real-page', '/en/events/not-a-real-page', '/en/parties']) {
    const response = await fetch(origin + route, { redirect: 'manual' }); assert.equal(response.status, 404); results.push({ route, status: response.status });
  }
  for (const route of ['/events/', '/events/gallery/', '/en/events/', '/en/events/gallery/', '/EVENTS', '/EN/EVENTS', '/parties/']) {
    const response = await fetch(origin + route, { redirect: 'manual' }); assert.equal(response.status, 308);
    const destination = new URL(response.headers.get('location'), origin); assert.equal(destination.origin, origin);
    assert.equal(destination.pathname, route.toLowerCase().replace(/\/$/, ''));
    const redirected = await fetch(destination, { redirect: 'manual' }); assert.equal(redirected.status, route === '/parties/' ? 404 : 200);
    results.push({ route, status: 308, destination: destination.pathname, destinationStatus: redirected.status });
  }
  const sitemap = await (await fetch(origin + '/sitemap.xml')).text();
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.deepEqual(new Set(sitemapUrls), new Set(publicRoutes.map(route => 'https://shahrestaurant.nl' + route)));
  assert.equal(sitemapUrls.length, 24); assert.equal((sitemap.match(/<xhtml:link\b/g) || []).length, 72);
  assert.ok(!sitemap.includes('/parties'));
  const robots = await (await fetch(origin + '/robots.txt')).text(); assert.ok(!robots.includes('Disallow: /events')); assert.ok(!robots.includes('Disallow: /en/events')); assert.ok(robots.includes('Disallow: /parties'));
  for (const prefix of ['', '/en']) {
    const home = await (await fetch(origin + (prefix || '/'))).text();
    for (const route of ['/events', '/events/gallery', '/events/about', '/events/birthdays', '/events/celebrations', '/events/company-catering']) assert.ok(home.includes(`href="${prefix + route}"`));
    assert.ok(!home.includes('href="/parties"')); assert.equal((home.match(/data-evening-card="true"/g) || []).length, 3);
    const response = await fetch(preview + prefix + '/events'); assert.equal(response.status, 200); assert.match(response.headers.get('x-preview-data'), /read-only/);
  }
  const blocked = await fetch(preview + '/api/parties/checkout', { method: 'POST' }); assert.equal(blocked.status, 405);
  const snapshot = JSON.parse(fs.readFileSync(path.join(root, dist + '.source.json'), 'utf8'));
  const sourceChanges = snapshot.files.filter(item => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, item.file))).digest('hex') !== item.sha256).map(item => item.file);
  const report = { checkedAt: new Date().toISOString(), buildId, dist, sourceSha256: snapshot.sha256, sourceUnchangedAfterBuild: sourceChanges.length === 0, sourceChanges, loopbackOnly: true, browserVerification: false, results, eventUrls: routes.length, publicUrls: publicRoutes.length, sitemapUrls: sitemapUrls.length, sitemapAlternates: 72, sitemap: true, robots: true, publicHomeCardsPerLocale: 3, readOnlyPreview: preview + '/events' };
  fs.writeFileSync(target, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ ...report, results: results.length }, null, 2));
  assert.equal(sourceChanges.length, 0, `Build is not final source: ${sourceChanges.join(', ')}`);
})().catch(error => { console.error(error); process.exitCode = 1; });
