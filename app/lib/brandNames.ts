import { z } from "zod";

export const brandNameSchema = z.object({
  brandId: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(60).refine(value => !/[\u0000-\u001f\u007f]/.test(value)),
  expectedName: z.string().min(1).max(60),
});

type BrandRow = { id: string; name: string };
export type BrandQuery = (text: string, values: string[]) => Promise<BrandRow[]>;
export type BrandNameInput = z.infer<typeof brandNameSchema>;

/** Rename the display label in the shared catalogue; retain all IDs and relationships. */
export async function renameBrand(query: BrandQuery, input: BrandNameInput) {
  const { brandId, name, expectedName } = input;
  const rows = await query(
    `UPDATE brands SET name = $2
     WHERE id = $1 AND name = $3
       AND NOT EXISTS (SELECT 1 FROM brands other WHERE other.id <> $1 AND lower(btrim(other.name)) = lower($2))
     RETURNING id, name`,
    [brandId, name, expectedName],
  );
  if (rows[0]) return { ok: true as const, brand: rows[0] };
  const existing = await query(`SELECT id, name FROM brands WHERE id = $1 OR lower(btrim(name)) = lower($2)`, [brandId, name]);
  const current = existing.find(brand => brand.id === brandId);
  if (!current) return { ok: false as const, error: "invalidInput" };
  if (current.name !== expectedName) return { ok: false as const, error: "stale" };
  if (existing.some(brand => brand.id !== brandId)) return { ok: false as const, error: "brandExists" };
  return { ok: false as const, error: "invalidInput" };
}
