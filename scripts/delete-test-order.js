const fs = require("fs");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

const envFile = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const match = envFile.match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
if (!match) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}
const sql = neon(match[1]);

const id = process.argv[2];
if (!id) {
  console.error("Usage: node scripts/delete-test-order.js <order-id>");
  process.exit(1);
}

async function main() {
  await sql.query("DELETE FROM order_items WHERE order_id = $1", [id]);
  const rows = await sql.query("DELETE FROM orders WHERE id = $1 RETURNING order_number", [id]);
  console.log(rows.length ? `Deleted order ${rows[0].order_number}` : "Order not found (already deleted)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
