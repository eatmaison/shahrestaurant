// Local-only compiler comparison. This helper never builds, publishes or submits a transaction.
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS is needed for the checked-in TypeScript fixture loader. */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const zlib = require("node:zlib");
const http = require("node:http");
const os = require("node:os");

const root = path.resolve(__dirname, "..");
const routes = ["/", "/en", "/menukaart", "/en/menu", "/reserveren", "/en/reservations", "/privacy", "/en/privacy", "/voorwaarden", "/en/terms", "/events", "/events/about", "/events/birthdays", "/events/celebrations", "/events/company-catering", "/events/company-lunches", "/events/gallery", "/en/events", "/en/events/about", "/en/events/birthdays", "/en/events/celebrations", "/en/events/company-catering", "/en/events/company-lunches", "/en/events/gallery"];
const sha = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const gzip = bytes => zlib.gzipSync(bytes, { level: 6 }).length;
function reviewDir(value) {
  if (!/^\.next-review-[a-z0-9-]+$/.test(value || "")) throw new Error("Use a task-local .next-review-<name> directory.");
  return value;
}
function localOrigin(value) {
  const url = new URL(value);
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(url.hostname) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("Only a plain HTTP loopback origin is allowed.");
  return url;
}
function outputPath(value) {
  const target = path.resolve(value);
  if (![root, os.tmpdir()].some(base => { const relative = path.relative(base, target); return relative && !relative.startsWith("..") && !path.isAbsolute(relative); })) throw new Error("Keep evidence inside the workspace or temporary directory.");
  return target;
}
function fingerprint() {
  const names = ["next.config.ts", "proxy.ts", "package.json", "package-lock.json", "tsconfig.json", "postcss.config.mjs"];
  function walk(relative) {
    for (const item of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
      const name = `${relative}/${item.name}`;
      if (item.isDirectory()) walk(name);
      else if (item.isFile()) names.push(name);
    }
  }
  walk("app"); walk("public");
  const files = names.sort().map(file => ({ file, sha256: sha(fs.readFileSync(path.join(root, file))) }));
  return { sha256: sha(JSON.stringify(files)), files };
}
function prepare(dist) {
  reviewDir(dist);
  const configPath = path.join(root, `${dist}.tsconfig.json`), snapshotPath = path.join(root, `${dist}.source.json`);
  if (fs.existsSync(configPath) || fs.existsSync(snapshotPath) || fs.existsSync(path.join(root, dist))) throw new Error("Review artifacts already exist; choose a fresh task name.");
  const config = JSON.parse(fs.readFileSync(path.join(root, "tsconfig.json"), "utf8"));
  const otherBuilds = fs.readdirSync(root, { withFileTypes: true }).filter(item => item.isDirectory() && item.name.startsWith(".next-review-")).map(item => item.name);
  config.include = [...(config.include || []).filter(item => !item.startsWith(".next/")), `${dist}/types/**/*.ts`, `${dist}/dev/types/**/*.ts`];
  // Keep this build's generated route validators included while excluding older builds.
  config.exclude = [...new Set([...(config.exclude || []).filter(item => item !== ".next-review-*"), ".next", ...otherBuilds])];
  const source = fingerprint();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", { flag: "wx" });
  fs.writeFileSync(snapshotPath, JSON.stringify({ measuredAt: new Date().toISOString(), ...source }, null, 2) + "\n", { flag: "wx" });
  console.log(JSON.stringify({ distDir: dist, sourceSha256: source.sha256, sourceFiles: source.files.length, tsconfigPath: path.basename(configPath), buildsStarted: false }));
}
async function payload(dist, value, destination) {
  reviewDir(dist);
  const origin = localOrigin(value).origin, output = outputPath(destination);
  if (fs.existsSync(output)) throw new Error("Evidence output already exists; choose a fresh filename.");
  const before = JSON.parse(fs.readFileSync(path.join(root, `${dist}.source.json`), "utf8"));
  if (fingerprint().sha256 !== before.sha256) throw new Error("Source changed since preparation; this is not an identical-source build.");
  const buildId = fs.readFileSync(path.join(root, dist, "BUILD_ID"), "utf8").trim();
  const assets = new Map();
  const attr = (tag, key) => tag.match(new RegExp("\\b" + key + "=[\\\"']([^\\\"']*)[\\\"']", "i"))?.[1];
  async function asset(value) {
    if (assets.has(value)) return assets.get(value);
    const url = new URL(value, origin);
    if (url.origin !== origin || !url.pathname.startsWith("/_next/static/")) throw new Error(`Unexpected initial asset: ${value}`);
    const local = path.resolve(root, dist, url.pathname.slice("/_next/".length));
    if (!local.startsWith(path.join(root, dist, "static") + path.sep)) throw new Error("Asset escaped selected build directory.");
    const bytes = fs.readFileSync(local);
    const response = await fetch(url, { headers: { "Accept-Encoding": "identity" }, redirect: "manual", signal: AbortSignal.timeout(15000) });
    if (response.status !== 200 || !bytes.equals(Buffer.from(await response.arrayBuffer()))) throw new Error(`Served asset differs from selected build: ${value}`);
    const item = { url: value, rawBytes: bytes.length, gzipBytes: gzip(bytes), sha256: sha(bytes), servedMatchesBuild: true };
    assets.set(value, item); return item;
  }
  const measurements = [];
  for (const route of routes) {
    const response = await fetch(origin + route, { redirect: "manual", signal: AbortSignal.timeout(30000) });
    if (response.status !== 200) throw new Error(`${route} returned ${response.status}`);
    const html = await response.text();
    if (!html.includes(buildId)) throw new Error(`${route} lacks expected build ID ${buildId}`);
    const scripts = new Set(), styles = new Set(), legacy = new Set();
    for (const match of html.matchAll(/<script\b[^>]*>/gi)) {
      const src = attr(match[0], "src");
      if (src) (/\bnomodule\b/i.test(match[0]) ? legacy : scripts).add(src);
    }
    for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
      const href = attr(match[0], "href"), rel = attr(match[0], "rel");
      if (!href?.startsWith("/_next/static/")) continue;
      if (rel === "stylesheet") styles.add(href);
      if (rel === "preload" && attr(match[0], "as") === "script" && !legacy.has(href)) scripts.add(href);
    }
    async function sum(items) {
      const rows = await Promise.all([...items].map(asset));
      return { assets: rows.map(item => item.url), rawBytes: rows.reduce((n, item) => n + item.rawBytes, 0), gzipBytes: rows.reduce((n, item) => n + item.gzipBytes, 0) };
    }
    measurements.push({ route, httpStatus: 200, document: { rawBytes: Buffer.byteLength(html, "utf8"), gzipBytes: gzip(Buffer.from(html, "utf8")) }, javascript: await sum(scripts), css: await sum(styles), excludedLegacy: await sum(legacy) });
  }
  if (fingerprint().sha256 !== before.sha256) throw new Error("Source changed during measurement.");
  const manifest = JSON.parse(fs.readFileSync(path.join(root, dist, "build-manifest.json"), "utf8"));
  const rootMain = (manifest.rootMainFiles || []).map(file => { const bytes = fs.readFileSync(path.join(root, dist, file)); return { file, rawBytes: bytes.length, gzipBytes: gzip(bytes) }; });
  const result = { measuredAt: new Date().toISOString(), buildId, distDir: dist, origin, sourceSha256: before.sha256, methodology: "Initial external assets, distinct per cold route; each file gzip level6; byte-matched to selected build. Excludes HTML, inline scripts, fonts, media, APIs, dynamic imports, prefetch and nomodule legacy.", routes: measurements, assets: [...assets.values()], rootMain: { assets: rootMain, gzipBytes: rootMain.reduce((n, item) => n + item.gzipBytes, 0) } };
  fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
  console.log(JSON.stringify({ output, buildId, sourceSha256: before.sha256, rootMainGzipBytes: result.rootMain.gzipBytes, routes: measurements.map(item => ({ route: item.route, jsGzipBytes: item.javascript.gzipBytes, cssGzipBytes: item.css.gzipBytes })) }, null, 2));
}
function proxy(value, requestedPort) {
  const upstream = localOrigin(value), port = Number(requestedPort);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Use a valid nonprivileged loopback preview port.");
  const ts = require("typescript");
  require.extensions[".ts"] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
  const { TANDOOR_PRODUCTS } = require("../app/lib/tandoorProducts.ts");
  const { DEFAULT_BRAND_CONFIGS } = require("../app/lib/brandDefaults.ts");
  const { restaurantStatus } = require("../app/lib/openingHours.ts");
  const clock = process.env.SHAH_REVIEW_NOW ? new Date(process.env.SHAH_REVIEW_NOW) : null;
  if (clock && !Number.isFinite(clock.getTime())) throw new Error("SHAH_REVIEW_NOW must be a valid ISO date.");
  const status = () => restaurantStatus("auto", undefined, clock || new Date());
  const send = (response, code, body) => { response.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Preview-Data": "checked-in-seed-read-only" }); response.end(JSON.stringify(body)); };
  http.createServer((request, response) => {
    if (!["GET", "HEAD"].includes(request.method)) return send(response, 405, { error: "Read-only preview; transactional submissions are disabled." });
    const pathname = new URL(request.url, upstream).pathname;
    if (pathname === "/api/bootstrap") return send(response, 200, { currentUser: null, products: TANDOOR_PRODUCTS, brands: DEFAULT_BRAND_CONFIGS, reviews: [], orders: [], users: [], vipRequests: [], vipPurchases: [], socialLinks: [], reservations: [], restaurantStatus: status(), onlineVisitors: 0, recentVisitors: [] });
    if (pathname === "/api/restaurant-status") return send(response, 200, { restaurantStatus: status() });
    if (pathname.startsWith("/api/")) return send(response, 503, { error: "Unavailable in the read-only fixture." });
    const relay = http.request({ hostname: upstream.hostname, port: upstream.port, path: request.url, method: request.method, headers: { ...request.headers, host: upstream.host } }, result => { response.writeHead(result.statusCode, { ...result.headers, "X-Preview-Data": "checked-in-seed-read-only" }); result.pipe(response); });
    relay.on("error", () => { if (!response.headersSent) send(response, 502, { error: "Loopback application unavailable." }); else response.end(); });
    request.on("aborted", () => relay.destroy()); request.pipe(relay);
  }).listen(port, "127.0.0.1", () => console.log(`Read-only fixture http://127.0.0.1:${port}; upstream ${upstream.origin}`));
}

const [mode, ...args] = process.argv.slice(2);
Promise.resolve().then(() => {
  if (mode === "prepare") return prepare(...args);
  if (mode === "payload") return payload(...args);
  if (mode === "proxy") return proxy(...args);
  throw new Error("Usage: review-build.cjs prepare <dist>; payload <dist> <loopback-origin> <evidence.json>; proxy <upstream-origin> <preview-port>");
}).catch(error => { console.error(error.message); process.exitCode = 1; });
