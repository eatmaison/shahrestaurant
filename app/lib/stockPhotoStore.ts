import { sql } from "./db";

export async function loadStockPhotoVersions() {
  return await sql.query(
    "SELECT stock_item_id AS id, version FROM public.shah_stock_photos",
  ) as { id: string; version: string }[];
}

export async function loadStockPhoto(id: string, version: string) {
  const rows = await sql.query(
    "SELECT encode(image_webp, 'base64') AS image FROM public.shah_stock_photos WHERE stock_item_id = $1 AND version = $2",
    [id, version],
  ) as { image: string }[];
  return rows[0] && Buffer.from(rows[0].image, "base64");
}

export async function saveStockPhoto(id: string, bytes: Buffer) {
  const rows = await sql.query(
    `INSERT INTO public.shah_stock_photos (stock_item_id, image_webp)
       SELECT id, decode($2, 'base64') FROM public.shah_stock_items WHERE id = $1
       ON CONFLICT (stock_item_id) DO UPDATE SET image_webp = EXCLUDED.image_webp, version = gen_random_uuid()
       RETURNING version`,
    [id, bytes.toString("base64")],
  ) as { version: string }[];
  return rows[0]?.version;
}

export async function removeStockPhoto(id: string) {
  await sql.query("DELETE FROM public.shah_stock_photos WHERE stock_item_id = $1", [id]);
}
