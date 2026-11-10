import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/serverStore";
import { sql } from "../../../lib/db";
import { brandNameSchema, renameBrand } from "../../../lib/brandNames";
import { enforceRateLimit } from "../../../lib/rateLimit";

const reply = (body: object, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");
    if (origin && new URL(origin).host !== req.headers.get("host")) return reply({ ok: false, error: "forbidden" }, 403);
    const limited = enforceRateLimit(req, "brands:rename", 30, 10 * 60_000);
    if (limited) return limited;
    const user = await getCurrentUser();
    if (!user) return reply({ ok: false, error: "Unauthorized" }, 401);
    if (user.role !== "admin") return reply({ ok: false, error: "forbidden" }, 403);
    const input = brandNameSchema.safeParse(await req.json().catch(() => null));
    if (!input.success) return reply({ ok: false, error: "invalidInput" }, 400);
    const result = await renameBrand(async (text, values) => {
      const rows = await sql.query(text, values);
      return rows.map(row => ({ id: String(row.id), name: String(row.name) }));
    }, input.data);
    return reply(result, result.ok ? 200 : result.error === "stale" ? 409 : 400);
  } catch {
    return reply({ ok: false, error: "temporarilyUnavailable" }, 500);
  }
}
