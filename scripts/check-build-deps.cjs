/* eslint-disable @typescript-eslint/no-require-imports -- Runs before Next.js and needs no installed packages. */
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const manifest = require("../package.json");
const lock = require("../package-lock.json");

const problems = [];
for (const name of Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }).sort()) {
  const key = "node_modules/" + name;
  const locked = lock.packages[key]?.version;
  let installed;
  try {
    installed = JSON.parse(fs.readFileSync(path.join(root, key, "package.json"), "utf8")).version;
  } catch {
    // Missing or unreadable packages are both repaired by a clean install.
  }
  if (!locked || installed !== locked) {
    problems.push(name + " (installed: " + (installed || "missing") + ", locked: " + (locked || "missing") + ")");
  }
}
if (problems.length) {
  console.error("[Shah build] Dependencies do not match package-lock.json:\n- " + problems.join("\n- "));
  console.error("Run npm run build:server, or npm ci --include=dev && npm run build.");
  process.exitCode = 1;
}
