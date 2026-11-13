/* eslint-disable @typescript-eslint/no-require-imports -- Offline execution of real route/metadata/JSX modules with isolated browser/data dependencies. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { NextRequest } = require("next/server");
const root = path.resolve(__dirname, "..");
globalThis.fetch = () => { throw new Error("Network requests are forbidden in this offline test"); };
const source = file => fs.readFileSync(path.join(root, file), "utf8");
function load(file, imports = {}) {
  const output = ts.transpileModule(source(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const evaluated = { exports: {} };
  new Function("require", "module", "exports", output)(id => {
    if (Object.hasOwn(imports, id)) return imports[id];
    if (["react", "react/jsx-runtime", "react-icons/fa6", "next/server"].includes(id)) return require(id);
    const iconPack = id.match(/(?:^|\/)icons\/(fa6|si|md)$/)?.[1];
    if (iconPack) {
      const resolved = path.relative(root, path.resolve(root, path.dirname(file), id + ".tsx")).replaceAll("\\", "/");
      assert.equal(resolved, `app/components/icons/${iconPack}.tsx`);
      return load(resolved, { "../SpriteIcon": load("app/components/SpriteIcon.tsx") });
    }
    if (id.endsWith(".css")) return { default: new Proxy({}, { get: (_target, key) => String(key) }) };
    throw new Error(`Unexpected dependency ${id} in ${file}`);
  }, evaluated, evaluated.exports);
  return evaluated.exports;
}
const locale = load("app/lib/locale.ts");
const site = load("app/lib/seo.ts", { "./locale": locale });
const eventSeo = load("app/lib/eventSeo.ts", { "./locale": locale, "./seo": site });
const shell = load("app/components/EventsShell.tsx", { "../lib/seo": site });
const cookieNotice = load("app/lib/cookieNotice.ts");
const translations = load("app/lib/translations.ts").translations;
const allPairs = { ...locale.PUBLIC_PATHS, ...locale.EVENT_PATHS };
const allRoutes = Object.values(allPairs).flatMap(Object.values);
let pathname = "/events", renderedLanguage = "nl", guardCalls = 0;
const providers = {
  useLang: () => ({ lang: renderedLanguage, t: translations[renderedLanguage], setLang: () => {} }),
  useStore: () => ({ cart: {}, currentUser: null, socialLinks: [] }),
  useTheme: () => ({ theme: "light", toggleTheme: () => {} }),
};
const NativeLink = ({ href, children, ...props }) => { delete props.prefetch; return React.createElement("a", { ...props, href }, children); };
const Link = load("app/components/LocaleLink.tsx", { "next/link": { default: NativeLink }, "../providers": providers, "../lib/locale": locale }).default;
const crumbs = load("app/components/EventBreadcrumbs.tsx", { "./LocaleLink": { default: Link }, "../providers": providers, "../lib/locale": locale });
const cta = load("app/components/EventsContactCta.tsx", { "./LocaleLink": { default: Link }, "../providers": providers });
const galleryPhotos = load("app/lib/eventGalleryPhotos.ts");
const galleryFallbacks = load("app/lib/eventGalleryJpegFallbacks.ts");
const editedPhotos = load("app/lib/editedRestaurantPhotos.ts");
const galleryPhoto = load("app/components/EventGalleryPhoto.tsx", {
  "../lib/editedRestaurantPhotos": editedPhotos,
  "../lib/eventGalleryPhotos": galleryPhotos,
  "../lib/eventGalleryJpegFallbacks": galleryFallbacks,
  "next/image": { default: ({ src, alt }) => React.createElement("img", { src, alt }) },
});
const navigation = { usePathname: () => pathname, useRouter: () => ({ push: () => {} }) };
const header = load("app/components/header.tsx", {
  "./LocaleLink": { default: Link }, "../lib/locale": locale, "./BrandLogo": { BrandLogo: () => null },
  "next/navigation": navigation, "../lib/clientStorage": { writeSessionValue: () => true }, "../providers": providers,
});
const footer = load("app/components/footer.tsx", { "./LocaleLink": { default: Link }, "./BrandLogo": { BrandLogo: () => null }, "../providers": providers, "./socialIcons": { SOCIAL_PLATFORMS: [] } });
const consent = load("app/components/CookieConsent.tsx", { "./LocaleLink": { default: Link }, "../providers": providers, "../lib/cookieNotice": cookieNotice });
const { proxy } = load("proxy.ts", { "./app/lib/locale": locale, "./app/lib/eventAccess": { hasEventAdminAccess: async () => { guardCalls++; return false; } } });
const request = url => new NextRequest(url, { headers: { host: new URL(url).host, "x-shah-locale": "forged", "x-shah-path": "/forged" } });
const rootLayout = load("app/layout.tsx", {
  "./lib/introSession": load("app/lib/introSession.ts"),
  "./lib/introMedia": load("app/lib/introMedia.ts", {
    "./capcutLuxuryPosters": load("app/lib/capcutLuxuryPosters.ts"),
    "./capcutDutchPosters": load("app/lib/capcutDutchPosters.ts"),
  }),
  "next/headers": {
    headers: async () => new Headers({ "x-shah-path": pathname, "x-shah-locale": locale.getLocalizedRoute(pathname)?.locale || "nl" }),
    cookies: async () => ({ get: () => undefined }),
  },
  "./lib/locale": locale, "./lib/seo": site, "./lib/cookieNotice": cookieNotice, "./lib/translations": { translations },
  "./components/CinematicSections": { CinematicSections: () => null },
  "./providers": { Providers: ({ initialLang, initialDictionaries, children }) => {
    assert.deepEqual(Object.keys(initialDictionaries), [initialLang]);
    assert.deepEqual(initialDictionaries[initialLang], translations[initialLang]);
    renderedLanguage = initialLang; return children;
  } },
  "./components/header": header, "./components/footer": footer, "./components/CookieConsent": consent,
}).default;
const expectedHeadings = {
  events: { nl: "Momenten die het vieren waard zijn", en: "Occasions worth celebrating" },
  eventsAbout: { nl: "Over Shah Restaurant Amsterdam", en: "About Shah Restaurant Amsterdam" },
  eventsGallery: { nl: "Sfeer, gerechten en momenten", en: "Ambiance, dishes and moments" },
  eventsBirthdays: { nl: "Vier uw verjaardag bij Shah Restaurant", en: "Celebrate your birthday at Shah Restaurant" },
  eventsCelebrations: { nl: "Bruiloften & vieringen bij Shah Restaurant", en: "Weddings & celebrations at Shah Restaurant" },
  eventsCompanyCatering: { nl: "Bedrijfscatering", en: "Corporate catering" },
  eventsCompanyLunches: { nl: "Bedrijfslunches & kantoor-catering in Amsterdam", en: "Company lunches & office catering in Amsterdam" },
};
const decode = text => text.replaceAll("&amp;", "&").replaceAll("&#x27;", "'").replaceAll("&quot;", '"');
const plain = text => decode(text.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
const stats = { publicRoutes: 0, slashRedirects: 0, caseRedirects: 0, eventMetadata: 0, eventServerRenders: 0 };
(async () => {
  assert.equal(allRoutes.length, 24);
  assert.equal(new Set(allRoutes).size, 24);
  assert.equal(Object.keys(locale.PUBLIC_PATHS).length, 5, "Root core/chapter route API stays unchanged");
  assert.equal(locale.getPublicRoute("/events"), null);
  assert.equal(locale.getPublicRoute("/en/events"), null);
  for (const [key, paths] of Object.entries(allPairs)) for (const lang of ["nl", "en"]) {
    const route = paths[lang], info = locale.getLocalizedRoute(route);
    assert.equal(info.key, key); assert.equal(info.locale, lang); assert.equal(info.canonical, route);
    assert.equal(locale.resolveSiteLocale(route, lang === "nl" ? "en" : "nl"), lang, "URL wins over the opposite saved preference");
    assert.equal(locale.localePath(paths.nl + "?q=one%20two#target", lang), route + "?q=one%20two#target");
    assert.equal(locale.localePath(paths.en, lang), route);
    const response = await proxy(request(site.SITE_URL + route));
    assert.equal(response.status, 200); assert.equal(response.headers.get("location"), null);
    assert.equal(response.headers.get("x-middleware-request-x-shah-locale"), lang);
    assert.equal(response.headers.get("x-middleware-request-x-shah-path"), route);
    stats.publicRoutes++;
    if (route !== "/") {
      const slash = await proxy(request(site.SITE_URL + route + "/?q=one%20two"));
      assert.equal(slash.status, 308); assert.equal(slash.headers.get("location"), site.SITE_URL + route + "?q=one%20two"); stats.slashRedirects++;
      const upper = await proxy(request(site.SITE_URL + route.toUpperCase() + "/?q=one%20two"));
      assert.equal(upper.status, 308); assert.equal(upper.headers.get("location"), site.SITE_URL + route + "?q=one%20two"); stats.caseRedirects++;
    }
  }
  assert.equal(guardCalls, 0);
  const www = await proxy(request("https://www.shahrestaurant.nl/EN/EVENTS/GALLERY/?q=one%20two"));
  assert.equal(www.headers.get("location"), site.SITE_URL + "/en/events/gallery?q=one%20two");
  assert.equal(locale.localePath("/parties", "en"), "/parties");
  assert.equal(locale.getLocalizedRoute("/en/parties"), null);
  assert.equal((await proxy(request(site.SITE_URL + "/parties"))).status, 404);
  assert.equal((await proxy(request(site.SITE_URL + "/api/parties"))).status, 403);
  assert.equal((await proxy(request(site.SITE_URL + "/api/parties/webhook"))).status, 200);
  assert.equal(guardCalls, 2);
  const titles = [], descriptions = [];
  for (const [key, paths] of Object.entries(locale.EVENT_PATHS)) for (const lang of ["nl", "en"]) {
    const m = eventSeo.eventMetadata(key, lang), title = m.title.absolute;
    assert.ok(title.length >= 50 && title.length <= 60); assert.ok(m.description.length >= 140 && m.description.length <= 158);
    assert.equal(m.alternates.canonical, paths[lang]);
    assert.deepEqual(m.alternates.languages, { "nl-NL": paths.nl, en: paths.en, "x-default": paths.nl });
    assert.equal(m.robots.index, true); assert.equal(m.robots.follow, true);
    assert.equal(m.openGraph.title, title); assert.equal(m.openGraph.description, m.description); assert.equal(m.openGraph.url, paths[lang]);
    assert.equal(m.openGraph.locale, lang === "nl" ? "nl_NL" : "en_GB");
    assert.deepEqual(m.openGraph.images, [{ url: site.SOCIAL_IMAGE, width: 1200, height: 630, alt: "Shah Restaurant in Amsterdam-Noord" }]);
    assert.equal(m.twitter.title, title); assert.equal(m.twitter.description, m.description); assert.equal(m.twitter.card, "summary_large_image"); assert.deepEqual(m.twitter.images, [site.SOCIAL_IMAGE]);
    titles.push(title); descriptions.push(m.description); stats.eventMetadata++;
    const segment = paths.nl.slice("/events".length), base = "app" + paths.nl + "/page.tsx";
    const view = load(base, {
      [segment ? "../../components/EventBreadcrumbs" : "../components/EventBreadcrumbs"]: crumbs,
      [segment ? "../../components/LocaleLink" : "../components/LocaleLink"]: { default: Link },
      [segment ? "../../providers" : "../providers"]: providers,
      "../../lib/locale": locale, "../../lib/seo": site, "../../lib/editedRestaurantPhotos": editedPhotos,
      "../../components/EventsContactCta": cta, "../../components/EventGalleryPhoto": galleryPhoto, "../../lib/eventGalleryPhotos": galleryPhotos,
    });
    let Page = view.default;
    if (lang === "en") {
      const wrapped = load("app" + paths.en + "/page.tsx", {
        [segment ? "../../../events" + segment + "/page" : "../../events/page"]: view,
        "../../../lib/eventSeo": eventSeo,
      });
      if (segment) assert.equal(wrapped.metadata.alternates.canonical, paths.en);
      Page = wrapped.default;
    }
    const parent = lang === "en"
      ? load("app/en/events/layout.tsx", { "../../lib/eventSeo": eventSeo, "../../components/EventsShell": shell })
      : load("app/events/layout.tsx", { "../lib/eventSeo": eventSeo, "../components/EventsShell": shell });
    pathname = paths[lang];
    const html = renderToStaticMarkup(await rootLayout({ children: React.createElement(parent.default, null, React.createElement(Page)) }));
    assert.ok(html.includes('<html lang="' + lang + '"'));
    const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map(x => plain(x[1]));
    assert.deepEqual(h1, [expectedHeadings[key][lang]], "Existing translated page heading is server-rendered");
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(x => JSON.parse(x[1]));
    const graph = schemas.find(x => x["@graph"]); assert.deepEqual(graph, site.siteSchema(lang));
    assert.equal(schemas.filter(x => x["@graph"]).length, 1);
    assert.equal(schemas.filter(x => x["@type"] === "Restaurant").length, 0);
    const breadcrumb = schemas.find(x => x["@type"] === "BreadcrumbList");
    const crumbLabel = lang === "nl" ? "Kruimelpad" : "Breadcrumb";
    assert.equal((html.match(new RegExp('<nav\\b[^>]*aria-label="' + crumbLabel + '"', "g")) || []).length, 1);
    assert.equal(breadcrumb.itemListElement.at(-1).item, site.SITE_URL + paths[lang]);
    assert.equal(breadcrumb.itemListElement[0].item, site.SITE_URL + locale.PUBLIC_PATHS.home[lang]);
    if (segment) assert.equal(breadcrumb.itemListElement[1].item, site.SITE_URL + locale.EVENT_PATHS.events[lang]);
    for (const schema of schemas.filter(x => ["Service", "ImageGallery"].includes(x["@type"]))) assert.equal(schema.url, site.SITE_URL + paths[lang]);
    for (const match of html.matchAll(/<a\b[^>]*>/g)) {
      if (match[0].includes("data-language-link")) continue;
      const href = decode(match[0].match(/href="([^"]*)"/)?.[1] || "");
      if (!href.startsWith("/") || href.startsWith("//")) continue;
      const target = locale.getLocalizedRoute(href.split(/[?#]/, 1)[0]);
      if (target) assert.equal(target.locale, lang, `${pathname} href ${href}`);
    }
    const languageLinks = [...html.matchAll(/<a\b[^>]*>/g)].map(match => match[0]).filter(tag => tag.includes("data-language-link"));
    assert.ok(languageLinks.some(tag => tag.includes('href="' + paths[lang === "en" ? "nl" : "en"] + '"')));
    stats.eventServerRenders++;
  }
  for (const key of Object.keys(locale.PUBLIC_PATHS)) for (const lang of ["nl", "en"]) {
    const metadata = site.publicMetadata(key, lang);
    titles.push(metadata.title.absolute); descriptions.push(metadata.description);
  }
  assert.equal(new Set(titles).size, 24); assert.equal(new Set(descriptions).size, 24);
  const sitemap = load("app/sitemap.ts", { "./lib/locale": locale, "./lib/seo": site }).default();
  assert.equal(sitemap.length, 24); assert.equal(new Set(sitemap.map(x => x.url)).size, 24);
  for (const [key, paths] of Object.entries(allPairs)) for (const lang of ["nl", "en"]) {
    const row = sitemap.find(x => x.url === site.SITE_URL + paths[lang]); assert.ok(row, key);
    assert.deepEqual(row.alternates.languages, { "nl-NL": site.SITE_URL + paths.nl, en: site.SITE_URL + paths.en, "x-default": site.SITE_URL + paths.nl });
  }
  assert.ok(sitemap.every(x => !x.url.includes("/parties")));
  const robots = load("app/robots.ts", { "./lib/seo": site }).default();
  assert.ok(robots.rules.disallow.includes("/parties")); assert.ok(!robots.rules.disallow.includes("/events")); assert.ok(!robots.rules.disallow.includes("/en/events"));
  console.log(JSON.stringify({ ...stats, uniqueMetadataSets: 24, sitemapUrls: 24, sitemapAlternates: 72, eventPairs: 7, privatePartyGuestChecksPass: true, coreOnlyRouteApiPreserved: true, networkCalls: 0, productionDatabaseCalls: 0, compiledHttpVerification: "pending coordinated build" }));
})().catch(error => { console.error(error); process.exitCode = 1; });
