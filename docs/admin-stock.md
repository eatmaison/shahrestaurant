# Admin drinks stock

Open **Stock** in the admin workspace or visit **/admin/stock**. The list starts with the lowest stock. Use **Edit count** beside a product, change full cases, units per case or loose units, and save. The draft total updates immediately; the row moves only after the change is saved. Regular and 0% beers are separate products. Use the **Out of stock** filter during restocking.

Use **Add product** for new items, **Product details** to rename or reclassify a product, and **Archived** to restore a removed product. **Manage categories** lets an admin add a named category or remove an empty one. Removing an occupied category requires a destination; active and archived products move together with their counts and photos. If two active products would end up with the same name in the destination, the entire move is canceled. Choose a different destination or rename one product under **Product details** first. Counts are shared by admins through Postgres. If two admins edit the same record, the later save prompts the admin to compare with the current entry before retrying.

## Database setup

Review the release, verify the intended database, and keep a backup. Apply the additive schema with your normal migration process before enabling Stock.

    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/20261122_shah_stock.sql

    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/20261123_shah_stock_categories.sql

Apply the category migration before deploying this app version. It creates the three existing category records once and keeps all inventory rows. Reapplying it does not recreate categories an admin has removed.

The public migration creates an empty table. Add products as an admin, or apply a separately provided, private stock import to the same database afterward. Keep operational counts and any import files out of Git. The app never runs the migration automatically and checkout never deducts from this manual list.

## Local checks

    node --test scripts/test-admin-stock.cjs

The tests use synthetic data, a temporary in-memory PGlite database, and mocked UI transport. No database credentials are required.

## Supplier purchase prices

Under **Edit count → Supplier purchase prices**, optionally enter the number of units in the supplier’s pack, the regular cost in euros and an offer price for that same pack. Use one unit for products bought individually. The pack size for pricing is separate from stock counting. Commas and decimal points are accepted. A lower offer shows the current price and saving per pack on the product row. Clear the offer field when it ends. These private prices do not change menu prices or place orders.

Before releasing this feature, apply `db/migrations/20261123_shah_stock_purchase_prices.sql` to the intended database. Existing stock, photos and categories are not modified; costs start unset.

### Sligro product shortcuts

Paste a direct Sligro product page into the optional **Sligro product link** field in the same editor. The product link appears on that Stock row and opens Sligro in a new tab. Only direct HTTPS product pages on sligro.nl are accepted; copied tracking and fragments are discarded. Clear the field to remove it. Links do not fetch prices or buy products.

Before releasing the shortcut, apply `db/migrations/20261123_shah_stock_sligro_links.sql` to the intended database. No link is populated automatically.
