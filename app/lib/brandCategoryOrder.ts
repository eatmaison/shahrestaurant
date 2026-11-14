import { z } from "zod";
import type { BrandCategory } from "./types";

const categoryName = z.string().min(1).max(60);
export const categoryOrderSchema = z.object({
  brandId: z.string().trim().min(1).max(80),
  name: categoryName,
  targetName: categoryName,
  placement: z.enum(["before", "after"]),
  expectedOrder: z.array(categoryName).min(1).max(500),
}).strict().refine(input => new Set(input.expectedOrder).size === input.expectedOrder.length);

export type CategoryOrderInput = z.infer<typeof categoryOrderSchema>;
export type CategoryOrderQuery = (text: string, values: string[]) => Promise<{ id: string; categories: BrandCategory[] | string }[]>;

/** Reorder existing objects only: category names, icons and nested menus stay intact. */
export function moveMenuCategory<T extends { name: string }>(categories: T[], name: string, targetName: string, placement: "before" | "after"): T[] | undefined {
  const names = categories.map(category => category.name);
  if (new Set(names).size !== names.length || !names.includes(name) || !names.includes(targetName)) return undefined;
  if (name === targetName) return [...categories];
  const next = categories.filter(category => category.name !== name);
  const target = next.findIndex(category => category.name === targetName);
  next.splice(target + (placement === "after" ? 1 : 0), 0, categories[names.indexOf(name)]);
  return next;
}

/** Compare both the visible order and the full JSON snapshot to avoid overwriting another editor. */
export async function moveBrandCategory(query: CategoryOrderQuery, input: CategoryOrderInput) {
  const rows = await query("SELECT id, categories FROM brands WHERE id = $1", [input.brandId]);
  if (!rows[0]) return { ok: false as const, error: "invalidInput" };
  const raw = rows[0].categories;
  const categories: BrandCategory[] = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!Array.isArray(categories) || categories.some(category => !category || typeof category.name !== "string")) return { ok: false as const, error: "invalidInput" };
  if (JSON.stringify(categories.map(category => category.name)) !== JSON.stringify(input.expectedOrder)) return { ok: false as const, error: "menuChanged" };
  const next = moveMenuCategory(categories, input.name, input.targetName, input.placement);
  if (!next) return { ok: false as const, error: "invalidInput" };
  const updated = await query(
    "UPDATE brands SET categories = $2::jsonb WHERE id = $1 AND categories = $3::jsonb RETURNING id, categories",
    [input.brandId, JSON.stringify(next), JSON.stringify(categories)],
  );
  if (!updated[0]) return { ok: false as const, error: "menuChanged" };
  return { ok: true as const, brandId: input.brandId, categories: next };
}
