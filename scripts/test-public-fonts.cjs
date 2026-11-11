/* eslint-disable @typescript-eslint/no-require-imports -- Read-only Node verification of font bytes and server resource hints. */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const manifest = JSON.parse(read("public/fonts/FONT-SOURCES-v1.json"));
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

for (const file of manifest.files) {
  const bytes = fs.readFileSync(path.join(root, file.destination));
  assert.equal(bytes.length, file.rawBytes);
  assert.equal(hash(bytes), file.sha256, `${file.destination} must retain the original font bytes`);
}
assert.equal(manifest.files.length, 8);
assert.equal(manifest.files.reduce((sum, file) => sum + file.rawBytes, 0), 181252);

let css = read("app/fonts.css");
for (const file of manifest.files) {
  const url = `/fonts/${path.basename(file.destination)}`;
  assert.ok(css.includes(`url(${url})`), `The original subset must remain available: ${url}`);
  css = css.replaceAll(url, `/_next/static/media/${file.sourceAsset}`);
}
const faces = [...css.matchAll(/@font-face\{[^}]*\}/g)].map(match => match[0]);
assert.equal(faces.length, 25);
assert.deepEqual(faces, manifest.originalFontFaces, "Preserve every weight, Unicode range and fallback metric");
assert.ok(css.includes('--font-jost: "Jost", "Jost Fallback"'));
assert.ok(css.includes('--font-cormorant: "Cormorant Garamond", "Cormorant Garamond Fallback"'));
for (const license of manifest.licenses) {
  const bytes = fs.readFileSync(path.join(root, license.destination));
  assert.equal(hash(bytes), license.sha256);
  assert.ok(bytes.toString("utf8").includes("SIL OPEN FONT LICENSE Version 1.1"));
}
assert.equal(manifest.licenses.length, 2);

function evaluate(source, imports) {
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const evaluatedModule = { exports: {} };
  new Function("require", "module", "exports", output)(id => {
    if (id.endsWith(".css")) return {};
    if (!(id in imports)) throw new Error(`Unexpected module: ${id}`);
    return imports[id];
  }, evaluatedModule, evaluatedModule.exports);
  return evaluatedModule.exports;
}

let pathname = "/";
const Empty = () => null;
const Transparent = ({ children }) => children;
const { default: RootLayout } = evaluate(read("app/layout.tsx"), {
  "react/jsx-runtime": require("react/jsx-runtime"),
  "next/headers": {
    headers: async () => new Headers({ "x-shah-path": pathname, "x-shah-locale": pathname.startsWith("/en") ? "en" : "nl" }),
    cookies: async () => ({ get: () => undefined }),
  },
  "./lib/locale": evaluate(read("app/lib/locale.ts"), {}),
  "./lib/cookieNotice": evaluate(read("app/lib/cookieNotice.ts"), {}),
  "./lib/seo": { publicMetadata: () => ({}), SITE_URL: "https://shahrestaurant.nl", siteSchema: () => ({}) },
  "./components/CinematicSections": { CinematicSections: Empty },
  "./providers": { Providers: Transparent },
  "./components/header": { Header: Empty },
  "./components/footer": { Footer: Empty },
  "./components/CookieConsent": { CookieConsent: Empty },
});

(async () => {
  const routes = ["/", "/en", "/menukaart", "/en/menu", "/reserveren", "/en/reservations", "/privacy", "/en/privacy", "/voorwaarden", "/en/terms", "/admin", "/terminal", "/unknown-route"];
  for (const route of routes) {
    pathname = route;
    const html = renderToStaticMarkup(await RootLayout({ children: React.createElement("p", null, "Read-only verification") }));
    const links = [...html.matchAll(/<link\b[^>]*>/g)].map(match => match[0]).filter(tag => /\bas="font"/.test(tag));
    const home = route === "/" || route === "/en";
    assert.equal(links.length, home ? 0 : 2, `${route} must follow the film-first/text-first preload policy`);
    for (const url of manifest.preloads) {
      if (home) continue;
      const link = links.find(tag => tag.includes(`href="${url}"`));
      assert.ok(link, `Missing matching CSS font preload on ${route}`);
      assert.ok(link.includes('type="font/woff2"'));
      assert.ok(/crossorigin="anonymous"/i.test(link));
    }
  }
  const { default: config } = evaluate(read("next.config.ts"), {});
  const fontHeaders = (await config.headers()).find(entry => entry.source === "/fonts/:path*");
  assert.ok(fontHeaders?.headers.some(header => header.key === "Cache-Control" && header.value === "public, max-age=31536000, immutable"));
  console.log(JSON.stringify({ byteIdenticalFontFiles: 8, originalFontFaces: 25, preservedLicenses: 2, checkedServerRoutes: routes.length, homeFontPreloads: 0, otherRouteFontPreloads: 2, networkCalls: 0, databaseCalls: 0 }));
})().catch(error => { console.error(error); process.exitCode = 1; });
