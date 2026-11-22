# Admin drinks stock

Open **Stock** in the admin workspace or visit **/admin/stock**. The list starts with the lowest stock. Use **Edit count** beside a product, change full cases, units per case or loose units, and save. The draft total updates immediately; the row moves only after the change is saved. Regular and 0% beers are separate products. Use the **Out of stock** filter during restocking.

Use **Add product** for new items, **Product details** to rename or reclassify a product, and **Archived** to restore a removed product. Counts are shared by admins through Postgres. If two admins edit the same record, the later save prompts the admin to compare with the current entry before retrying.

## Database setup

Review the release, verify the intended database, and keep a backup. Apply the additive schema with your normal migration process before enabling Stock.

    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/20261122_shah_stock.sql

The public migration creates an empty table. Add products as an admin, or apply a separately provided, private stock import to the same database afterward. Keep operational counts and any import files out of Git. The app never runs the migration automatically and checkout never deducts from this manual list.

## Local checks

    node --test scripts/test-admin-stock.cjs

The tests use synthetic data, a temporary in-memory PGlite database, and mocked UI transport. No database credentials are required.
