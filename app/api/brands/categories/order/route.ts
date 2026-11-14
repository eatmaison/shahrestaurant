import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/serverStore";
import { sql } from "../../../../lib/db";
import { categoryOrderSchema, moveBrandCategory } from "../../../../lib/brandCategoryOrder";
import { enforceRateLimit } from "../../../../lib/rateLimit";

const reply = (body: object, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    if (origin && new URL(origin).host !== req.headers.get("host")) return reply({ ok: false, error: "forbidden" }, 403);
    const limited = enforceRateLimit(req, "brands:category-order", 60, 10 * 60_000);
    if (limited) return limited;
    const user = await getCurrentUser();
    if (!user) return reply({ ok: false, error: "Unauthorized" }, 401);
    if (user.role !== "admin") return reply({ ok: false, error: "forbidden" }, 403);
    const text = await req.text();
    if (text.length > 40_000) return reply({ ok: false, error: "invalidInput" }, 413);
    const input = categoryOrderSchema.safeParse(JSON.parse(text));
    if (!input.success) return reply({ ok: false, error: "invalidInput" }, 400);
    const result = await moveBrandCategory(async (query, values) => {
      const rows = await sql.query(query, values);
      return rows.map(row => ({ id: String(row.id), categories: row.categories }));
    }, input.data);
    return reply(result, result.ok ? 200 : result.error === "menuChanged" ? 409 : 400);
  } catch (error) {
    return reply({ ok: false, error: error instanceof SyntaxError ? "invalidInput" : "temporarilyUnavailable" }, error instanceof SyntaxError ? 400 : 500);
  }
}
