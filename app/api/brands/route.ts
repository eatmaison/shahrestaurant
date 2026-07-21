import { NextRequest, NextResponse } from "next/server";
import { addBrand, addBrandCategory, addBrandSubcategory, removeBrand, removeBrandCategory, removeBrandSubcategory, setBrandLogo, updateBrandCategory, updateBrandSubcategory } from "../../lib/serverStore";
import { brandsActionSchema } from "../../lib/validation";
import { enforceRateLimit } from "../../lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, "brands:update", 60, 10 * 60_000);
    if (limited) return limited;

    const raw = await req.json().catch(() => null);
    const parsed = brandsActionSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalidInput" }, { status: 400 });
    }

    const input = parsed.data;
    const result =
      input.action === "addBrand"
        ? await addBrand(input.name)
        : input.action === "removeBrand"
          ? await removeBrand(input.id)
          : input.action === "addCategory"
            ? await addBrandCategory(input.brandId, input.name, input.icon)
            : input.action === "removeCategory"
              ? await removeBrandCategory(input.brandId, input.name)
              : input.action === "updateCategory"
                ? await updateBrandCategory(input.brandId, input.name, input.nextName, input.icon)
                : input.action === "addSubcategory"
                  ? await addBrandSubcategory(input.brandId, input.categoryName, input.name, input.icon)
                  : input.action === "removeSubcategory"
                    ? await removeBrandSubcategory(input.brandId, input.categoryName, input.name)
                    : input.action === "updateSubcategory"
                      ? await updateBrandSubcategory(input.brandId, input.categoryName, input.name, input.nextName, input.icon)
                      : await setBrandLogo(input.brandId, input.logo);

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
