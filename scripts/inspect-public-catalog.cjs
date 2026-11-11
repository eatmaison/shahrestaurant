/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node diagnostic; executes only with the explicit --execute flag. */
// No business/bootstrap/database initialization module is imported. Never prints records or connection strings.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const startedAt = Date.now();
const diagnostics = { transportReached: false, transportCompleted: false, errorName: null, sqlState: null, httpStatus: null };
let requestSignal;
let stage = "configuration";
function classify(error) {
  const allowedNames = new Set(["AbortError", "TimeoutError", "NeonDbError", "TypeError", "SyntaxError", "Error"]);
  try {
    diagnostics.errorName = allowedNames.has(error?.name) ? error.name : "OtherError";
    diagnostics.sqlState = typeof error?.code === "string" && /^[0-9A-Z]{5}$/.test(error.code) ? error.code : null;
    const status = [error?.status, error?.statusCode, error?.sourceError?.status, error?.cause?.status].find(value => typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 100 && value <= 599);
    diagnostics.httpStatus = status ?? null;
  } catch {
    diagnostics.errorName = "OtherError";
  }
}
function report(result) {
  console.log(JSON.stringify({ ...result, stage, elapsedMs: Date.now() - startedAt, ...diagnostics, signalAborted: requestSignal?.aborted ?? false }));
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(JSON.stringify({ executed: false, action: "With --execute, privately load existing environment and read only the public products/brands catalogue", transaction: "READ ONLY, RepeatableRead", queries: "Two bounded SELECT statements; 750ms abort; no bootstrap, migrations, sessions or cache writes", output: "Counts, mapper acceptance and image-host counts only; no rows, credentials or URLs" }));
    return;
  }
  const timeoutMs = args[1]?.startsWith("--timeout-ms=") ? Number(args[1].slice("--timeout-ms=".length)) : 750;
  if (args[0] !== "--execute" || args.length > 2 || args[1] && !args[1].startsWith("--timeout-ms=") || !Number.isInteger(timeoutMs) || timeoutMs < 750 || timeoutMs > 5000) throw new Error("Use --execute with an optional --timeout-ms=750..5000 for a bounded read-only diagnostic.");
  require("@next/env").loadEnvConfig(root, false, { info() {}, error() {} });
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) { report({ executed: false, configured: false }); return; }
  const url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol) || ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    report({ executed: false, configured: false }); return;
  }
  stage = "module-preparation";
  const ts = require("typescript");
  require.extensions[".ts"] = (module, file) => {
    if (/[/\\](db|serverStore)\.ts$/.test(file)) throw new Error("Side-effecting database imports are forbidden.");
    module._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
  };
  const { readCatalogSnapshot } = require("../app/lib/catalogSnapshot.ts");
  const { neon } = require("@neondatabase/serverless");
  let selectedCounts = null;
  const snapshot = await readCatalogSnapshot(async (queries, signal) => {
    if (queries.length !== 2 || queries.some(query => !/^SELECT\s/.test(query.text) || !/LIMIT \$1$/.test(query.text) || /\b(INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|TRUNCATE|CALL)\b/i.test(query.text))) throw new Error("Unexpected diagnostic query.");
    requestSignal = signal; diagnostics.transportReached = true; stage = "read-only-transport";
    try {
      const sql = neon(connectionString);
      const result = await sql.transaction(queries.map(query => sql.query(query.text, [...query.params])), { readOnly: true, isolationLevel: "RepeatableRead", fetchOptions: { signal, cache: "no-store" } });
      diagnostics.transportCompleted = true; stage = "mapper-validation";
      if (Array.isArray(result) && result.length === 2) selectedCounts = { products: result[0].length, brands: result[1].length };
      return result;
    } catch (error) {
      classify(error); throw error;
    }
  }, timeoutMs);
  if (!snapshot) { report({ executed: true, timeoutMs, snapshotAccepted: false, selectedCounts, reason: "Unavailable, timed out, over budget or failed mapper validation; details suppressed" }); return; }
  const hosts = new Map();
  for (const product of snapshot.products) {
    if (!product.image) continue;
    let host = "relative";
    if (product.image.startsWith("data:")) host = "inline-data";
    else if (/^https?:\/\//i.test(product.image)) {
      try { host = new URL(product.image).hostname; } catch { host = "invalid-reference"; }
    }
    hosts.set(host, (hosts.get(host) || 0) + 1);
  }
  report({ executed: true, timeoutMs, snapshotAccepted: true, selectedCounts, mappedCounts: { products: snapshot.products.length, brands: snapshot.brands.length }, finiteNonnegativePrices: snapshot.products.every(product => Number.isFinite(product.price) && product.price >= 0), imageHosts: [...hosts].map(([host, count]) => ({ host, count })) });
}

main().catch(error => { classify(error); report({ executed: false, failed: true, reason: "Diagnostic failed; sensitive error details suppressed" }); process.exitCode = 1; });
