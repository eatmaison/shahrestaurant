/* node scripts/generate-icon-sprites.mjs
 * Copies installed glyph geometry verbatim; never optimizes/reorders paths or edits brand artwork.
 */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import zlib from "node:zlib";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url), React = require("react"), { renderToStaticMarkup } = require("react-dom/server"), ts = require("typescript");
const ROOT = process.cwd(), VERSION = "icon-sprites-v1", OUTPUT = path.join(ROOT, "public", "brand", VERSION), MODULES = path.join(ROOT, "app", "components", "icons");
const COMMON = new Set(["FaEnvelope","FaPhone","FaLocationDot","FaClock","FaArrowUp","FaChevronDown","FaMoon","FaSun","FaCartShopping","FaUser","FaCalendarCheck","FaXmark","FaBars","FaInstagram","FaFacebookF","FaTiktok","FaYoutube","FaSnapchat","FaTelegram","FaLinkedinIn","FaXTwitter","FaPinterestP","FaWhatsapp","FaApple","FaYelp"].map(name => "fa6/" + name));
const sha = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const esc = value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));
const excluded = /^app\/(?:admin|terminal|account|parties|pay|forgot-password|reset-password|verify-email)\//;
async function walk(dir) { const out = []; for (const e of await fs.readdir(dir, { withFileTypes: true })) { const p = path.join(dir,e.name); if (e.isDirectory()) out.push(...await walk(p)); else if (/\.tsx?$/.test(e.name)) out.push(p); } return out; }
function tree(node) { if (Array.isArray(node)) return node.map(tree); if (node == null) return null; if (!React.isValidElement(node) || typeof node.type !== "string") throw new Error("Unexpected glyph node"); const { children, ...attributes } = node.props; if (!["path","g","circle","rect","ellipse","polygon","polyline","line","title"].includes(node.type) || Object.keys(attributes).some(k => /^on/i.test(k) || /href/i.test(k))) throw new Error("Unexpected active glyph content"); return { tag: node.type, attributes, children: tree(children) }; }
async function main() {
  const pkg = JSON.parse(await fs.readFile(path.join(ROOT,"node_modules/react-icons/package.json"),"utf8")); if (pkg.version !== "5.7.0") throw new Error("Expected react-icons5.7.0; review geometry/license before upgrading");
  const usage = new Map(), imports = [];
  for (const file of await walk(path.join(ROOT,"app"))) {
    const rel = path.relative(ROOT,file).replaceAll("\\","/");
    if (excluded.test(rel) || rel === "app/components/RichTextEditor.tsx" || rel.startsWith("app/components/icons/")) continue;
    const source = await fs.readFile(file,"utf8"), ast = ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
    for (const st of ast.statements) {
      if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier) || st.importClause?.isTypeOnly) continue;
      const specifier = st.moduleSpecifier.text, pack = specifier.match(/^react-icons\/(fa6|si|md)$/)?.[1] || specifier.match(/(?:^|\/)icons\/(fa6|si|md)$/)?.[1]; if (!pack) continue;
      if (!st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings)) throw new Error("Expected named icon imports: " + rel);
      const names = st.importClause.namedBindings.elements.filter(e => !e.isTypeOnly).map(e => (e.propertyName || e.name).text);
      imports.push({ file: rel, pack, names });
      for (const name of names) { const key = pack + "/" + name; if (!usage.has(key)) usage.set(key,[]); usage.get(key).push(rel); }
    }
  }
  if ([...COMMON].some(k => !usage.has(k))) throw new Error("Measured common25 no longer matches public source usage");
  // Keep the accepted group stable when components move between source files.
  const CATALOG = new Set(["fa6/FaAppleWhole","fa6/FaArrowDown","fa6/FaArrowLeft","fa6/FaArrowRight","fa6/FaBacon","fa6/FaBagShopping","fa6/FaBottleDroplet","fa6/FaBowlFood","fa6/FaBowlRice","fa6/FaBreadSlice","fa6/FaBurger","fa6/FaCakeCandles","fa6/FaCalendarDays","fa6/FaCarrot","fa6/FaChampagneGlasses","fa6/FaCheese","fa6/FaChevronLeft","fa6/FaChevronRight","fa6/FaCircleCheck","fa6/FaCircleExclamation","fa6/FaCookieBite","fa6/FaDrumstickBite","fa6/FaEgg","fa6/FaExpand","fa6/FaFire","fa6/FaFireBurner","fa6/FaFish","fa6/FaGlassWater","fa6/FaHotdog","fa6/FaIceCream","fa6/FaLeaf","fa6/FaLemon","fa6/FaLock","fa6/FaMagnifyingGlass","fa6/FaMartiniGlassCitrus","fa6/FaMinus","fa6/FaMugHot","fa6/FaPepperHot","fa6/FaPizzaSlice","fa6/FaPlateWheat","fa6/FaPlus","fa6/FaSeedling","fa6/FaShrimp","fa6/FaStar","fa6/FaStore","fa6/FaTrash","fa6/FaTruck","fa6/FaUsers","fa6/FaUtensils","fa6/FaWheatAwn","fa6/FaWineBottle","fa6/FaX","md/MdMenuBook"]);
  await fs.mkdir(OUTPUT,{recursive:true}); await fs.mkdir(MODULES,{recursive:true});
  const icons = [], groups = { common: [], catalog: [], features: [] }, packs = {};
  for (const [key, files] of [...usage].sort(([a],[b]) => a.localeCompare(b))) {
    const [pack,name] = key.split("/"); packs[pack] ||= require("react-icons/" + pack); const source = packs[pack][name]; if (typeof source !== "function") throw new Error("Missing installed glyph: " + key);
    const element = source({}), attributes = element.props.attr; if (!attributes || !attributes.viewBox) throw new Error("Missing root viewBox: " + key);
    const canonicalTree = tree(element.props.children), wrapped = renderToStaticMarkup(React.createElement("svg",null,element.props.children)); const inner = wrapped.slice(wrapped.indexOf(">")+1,wrapped.lastIndexOf("</svg>"));
    const group = COMMON.has(key) ? "common" : CATALOG.has(key) ? "catalog" : "features", id = pack + "-" + name;
    const item = { key, pack, name, id, group, attributes, files, sourceTreeSha256: sha(JSON.stringify(canonicalTree)), serializedChildrenSha256: sha(inner), href: "/brand/" + VERSION + "/" + group + ".svg#" + id };
    icons.push(item); groups[group].push({ item, inner });
  }
  const spriteFiles = [];
  for (const [group, entries] of Object.entries(groups)) {
    const svg = '<?xml version="1.0" encoding="UTF-8"?>\n<!-- Glyphs copied without geometry changes from react-icons5.7.0. Attribution/licenses: LICENSES.txt -->\n<svg xmlns="http://www.w3.org/2000/svg"><defs>' + entries.map(({item,inner}) => '<g id="' + esc(item.id) + '">' + inner + '</g>').join("") + '</defs></svg>\n';
    const file = path.join(OUTPUT,group+".svg");
    try { const existing = await fs.readFile(file,"utf8"); if (existing !== svg) throw new Error("Existing sprite differs; bump VERSION before replacing cached asset"); } catch (e) { if (e.code !== "ENOENT") throw e; await fs.writeFile(file,svg,{flag:"wx"}); }
    spriteFiles.push({ src: "/brand/" + VERSION + "/" + group + ".svg", glyphs: entries.length, bytes: Buffer.byteLength(svg), gzipBytes: zlib.gzipSync(svg).length, sha256: sha(svg) });
  }
  const moduleFiles = [];
  for (const pack of Object.keys(packs).sort()) {
    const code = '// Generated by scripts/generate-icon-sprites.mjs. Geometry/license evidence: docs/icon-sprites-v1.json\nimport { createSpriteIcon } from "../SpriteIcon";\n' + icons.filter(i => i.pack === pack).map(i => 'export const ' + i.name + ' = /* @__PURE__ */ createSpriteIcon(' + JSON.stringify(i.href) + ', ' + JSON.stringify(i.attributes) + ');').join("\n") + "\n";
    const file = path.join(MODULES,pack+".tsx"); await fs.writeFile(file,code); moduleFiles.push({ file: path.relative(ROOT,file).replaceAll("\\","/"), bytes: Buffer.byteLength(code), gzipBytes: zlib.gzipSync(code).length, sha256: sha(code) });
  }
  const report = { version: VERSION, generatedAtUTC: new Date().toISOString(), package: { name: "react-icons", version: pkg.version }, groups: spriteFiles, modules: moduleFiles, icons, imports, policy: "Exact ordered vendor SVGchild markup copied into external defs/g fragments; root viewBox/attrs remain on outer SVG. No SVGO, path simplification, coordinate changes or individual-icon HTTP requests. Common is measured legal25; catalog is public home/menu/category usage; features is remaining public events/reservation/social-extra usage.", validation: { publicGlyphs: icons.length, commonGlyphs: groups.common.length, sourceTreesRecorded: icons.length, unchangedGlyphGeometry: true }, limitations: ["Generator evidence is not a production payload saving measurement or browser render/interaction pass. Combined-build initial JS and native SVG network transfer must be measured separately."] };
  await fs.writeFile("docs/icon-sprites-v1.json",JSON.stringify(report,null,2)+"\n");
  console.log(JSON.stringify({ complete: true, publicGlyphs: icons.length, groups: spriteFiles, modules: moduleFiles.map(f=>({file:f.file,gzipBytes:f.gzipBytes})) }));
}
await main();
