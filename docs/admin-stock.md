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

Under **Edit count → Supplier purchase prices**, optionally enter the number of units in the supplier’s pack, the regular cost in euros and an offer price for that same pack. Use one unit for products bought individually. The pack size for pricing is separate from stock counting. Commas and decimal points are accepted. A lower offer shows the current price and saving per pack on the product row. Optionally enter the start and end dates: the offer applies through the end date in Europe/Amsterdam. Clear undated offers yourself. These private prices do not change menu prices or place orders.

Before releasing this feature, apply `db/migrations/20261123_shah_stock_purchase_prices.sql` to the intended database. Existing stock, photos and categories are not modified; costs start unset.

### Sligro product shortcuts

Paste a direct Sligro product page into the optional **Sligro product link** field in the same editor. The product link appears on that Stock row and opens Sligro in a new tab. Only direct HTTPS product pages on sligro.nl are accepted; copied tracking and fragments are discarded. Clear the field to remove it. Links do not fetch prices or buy products.

Before releasing the shortcut, apply `db/migrations/20261123_shah_stock_sligro_links.sql` to the intended database. No link is populated automatically.

Apply `db/migrations/20261124_shah_stock_offer_dates.sql` after the supplier price migrations and before deploying the dated-offer build. Existing prices stay as-is. To verify an automatically hidden discount, use synthetic dates first; live supplier links do not authenticate or read any Sligro data.

### Browser-assisted price preview

The Stock button communicates with the separately installed Shah Chrome extension. The supplier login is completed only in the official Sligro tab; Shah does not receive passwords or sessions. The extension must verify the product SKU, pack size, prices and any offer term; ambiguous items are skipped. Review the previous and new purchase prices before clicking **Save reviewed prices**. The apply route requires admin access, skips archived or changed rows, and updates only purchase price fields. The current limit is 50 linked active products per check. The plain product shortcut and manual entry still work without the extension.

#### Installing the Chrome companion

1. On a desktop computer, get the release's extension directory `extensions/shah-sligro`; extract it to a folder if received as an archive. The folder you load must directly contain `manifest.json`.
2. In the Chrome profile you use for Sligro, open `chrome://extensions`, enable **Developer mode**, and select **Load unpacked**. Select that folder. The extension is not a Chrome Web Store listing.
3. Open or refresh `https://shahrestaurant.nl/admin/stock`. Add your signed-in supplier product URLs. Verify that **Units in purchase pack** matches the supplier case, which can differ from how you count stock. If no purchase price is set, the system uses the counted units per case, or one unit.
4. Click **Refresh Sligro prices**. If asked, sign in on the official Sligro tab. Inspect each price and offer period before saving. Unavailable, ambiguous, or mismatched items preserve their existing prices. If a product link works only when signed in, use that signed-in product's exact direct link.

The extension reads only the rendered Dutch product price, pack, article, deposit/tax information and offer dates from a selected product page on the official Sligro host. It has no permission for cookies or web requests and does not read the sign-in form. It does not place orders. The stock site's server receives only normalized purchase-price changes that an authorized Shah administrator explicitly saves; the client-side preview does not upload raw page data. In the event of any unsupported page layout, compare or enter the supplier price by hand.


## Draught beer (Taurus)

Before enabling draught stock, run `db/migrations/20261127_shah_stock_kegs.sql` on the Shah database **after** the original Taurus stock and sales migrations. It adds keg storage and upgrades the atomic import function without converting any stock records. Do not rerun the old function-defining stock migration after this one. The keg migration is safe to rerun.

1. In **Admin → Stock**, edit the existing draught beer. Choose **Track by → Draught beer / kegs**.
2. Enter litres per keg, the number of sealed kegs and the litres left in the tapped keg. Take the opening count from the actual stock. The old unit count is not converted.
3. In **Import Taurus sales**, match each distinct till item to the beer and enter its millilitres per glass. If two glass sizes share one Taurus name, keep that line sales-only until the till distinguishes them.
4. Check the litres in the import preview. After confirmation the mapping is reused and the same receipt line cannot debit the stock twice. Sales reports still measure glasses. Use **Sales only** when the imported sales are already reflected in your physical count.
5. For waste, line cleaning or a stock count, edit the remaining tapped volume. Sealed kegs open in the calculation only after the tapped stock has been used.
