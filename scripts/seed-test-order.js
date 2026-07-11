/**
 * One-off helper: inserts a paid test order (status "new") so the staff
 * terminal has something to show and print. Run from the project root:
 *   node scripts/seed-test-order.js
 */
const fs = require("fs");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

// Read DATABASE_URL from .env.local (dev) without extra dependencies.
const envFile = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const match = envFile.match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
if (!match) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}
const sql = neon(match[1]);

async function main() {
  const products = await sql.query(
    `SELECT id, name, price, brand, category FROM products ORDER BY created_at ASC LIMIT 3`
  );
  if (products.length === 0) {
    console.error("No products in the database yet - open the site once to seed them.");
    process.exit(1);
  }

  const items = products.map((p, i) => ({ ...p, qty: i === 0 ? 2 : 1 }));
  const subtotal = items.reduce((s, it) => s + Number(it.price) * it.qty, 0);
  const delivery = 2.5;
  const total = subtotal + delivery;

  const orderRows = await sql.query(
    `INSERT INTO orders (customer_name, address, postcode, phone, subtotal, discount, delivery, total, status, paid, fulfillment, note)
     VALUES ($1,$2,$3,$4,$5,0,$6,$7,'new',true,'delivery',$8)
     RETURNING id, order_number`,
    [
      "TEST - Jan de Vries",
      "Klaprozenweg 10",
      "1032 KL",
      "+31 6 12345678",
      subtotal.toFixed(2),
      delivery.toFixed(2),
      total.toFixed(2),
      "TEST ORDER - please ring the bell, no onions",
    ]
  );
  const order = orderRows[0];

  for (const it of items) {
    await sql.query(
      `INSERT INTO order_items (order_id, product_id, name, price, qty, brand, category)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [order.id, it.id, it.name, it.price, it.qty, it.brand, it.category]
    );
  }

  console.log(`Created test order ETG-${order.order_number} (${order.id})`);
  console.log(`Items: ${items.map((i) => `${i.qty}x ${i.name}`).join(", ")} | Total EUR ${total.toFixed(2)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
