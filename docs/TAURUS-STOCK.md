# Taurus Easy4U → Shah sales and drink inventory

## Export a day

1. In Taurus open **Management → Bonnen → Afrekenregels** (settled receipt lines). Set both dates to the same **closed sales day**, then select **Zoeken**.
2. Verify the report is restricted to Shah, right-click the results and choose **Export table to Excel…**. Do not use the aggregated .xls from **Omzet per periode**. The receipt XLSX does not reliably identify the venue and a tested export had accounting groups with another brand's name. Do not use a mixed report or assume an accounting group is a venue ID.
3. In **Shah → Admin → Stock → Import Taurus sales**, choose the .xlsx. The date comes from the report, not upload time, so a missing Wednesday can be imported on Thursday. Choose **Sales only** if your physical count already reflects that day's sales.
4. Match only drinks with a 1:1 stock unit. Example: select the stock product **Fanta** for till item **Fanta X**. Unmatched items, glasses, bundles or taps are still counted in sales but never deducted unless you map them. The app remembers a mapping after a confirmed new stock deduction. A changed mapping applies to new lines only; previously deducted lines are not rewritten.
5. Check the date, total, receipts and every before/after count. Confirm that only Shah sales are present and any pending deductions aren't already in stock. Discounts and negative return quantities are included in sales but never restore or reduce physical stock automatically. Start deducting against an accurate stock baseline. In Stock, products with one case or less (or six units for loose-only stock) are marked Reorder; zero stays Out of stock.

## What the figures mean

**Admin → Stats → Taurus till sales** shows imported days, receipt count, sales value by day, adjustments and items by original Taurus accounting group. Item values omit separate receipt-level adjustments; the daily total includes them. The source amount is **Bedrag**, which extends **Prijs** by **Aantal**; it is neither multiplied again nor treated as a repeated receipt total. The app compares the sum of distinct receipt-line amounts with the export's **Totaal** footer and refuses a mismatch. In the inspected sample both were €125.10 (including two discount rows). This only validates the XLSX arithmetic, not its venue, completeness, accounting/VAT treatment, or bank reconciliation. No profit or VAT calculation, no addition to website order totals. Missing calendar days are marked as not imported rather than shown as €0.

The workbook is parsed locally; customer, staff, payment, cost price and address columns are not sent. The server records only sales fields and selected inventory movements. Exact repeated lines are skipped; changed previously recorded rows, stale inventory or insufficient stock stop the transaction. A fully new sales-only import can be made without altering stock.

## Release

Apply `db/migrations/20261126_shah_taurus_stock.sql`, then `db/migrations/20261127_shah_taurus_sales.sql` with an SQL client (not Prisma schema push). Both are additive; no historical backfill. Test on an isolated database first and take a production backup before following your normal build and deploy process. Test the first live run using one verified Shah-only closed day, starting in preview, and compare its final amount with the Taurus total before confirming. Do not enable per-receipt sync without a supported, verified, venue-scoped settlement feed.
