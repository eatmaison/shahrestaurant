# Shah Stock product photos

1. Apply `db/migrations/20261122_shah_stock_photos.sql` after the original Stock schema on the intended database. It is additive and safe to rerun; it does not update item names, categories or inventory counts.
2. Deploy the application as usual. In **Admin → Stock**, choose the photo square before a product name. Use **Add photo** or **Replace photo** and choose a local image, or use **Remove photo**. Product count editing is separate and behaves as before.

JPG, PNG, WebP and AVIF work. On phones that can decode HEIC, the browser converts it automatically; if the photo cannot open, export it to JPG first. Keep source images at or below 20 MB. Larger compatible source photos are resized in the browser before transfer, and the server accepts at most 768 KiB. Uploaded assets are checked, stripped of metadata, and stored as small WebP thumbnails. They are only served to signed-in administrators, never the public menu or a public storage bucket.

Run `node --test scripts/test-admin-stock-photos.cjs` for the isolated API and database checks.
