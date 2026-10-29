import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { getCurrentUser } from "../../../lib/serverStore";
import { z } from "zod";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };
const policySchema = z.object({
  date: z.iso.date(),
  capacity: z.number().int().min(0).max(35),
  externalGuests: z.number().int().min(0).max(1000),
  limitEnabled: z.boolean(),
});
async function secret() {
  if (process.env.PHONE_AGENT_INTERNAL_SECRET) return process.env.PHONE_AGENT_INTERNAL_SECRET;
  const text = await readFile(".env.phone-agent", "utf8").catch(() => "");
  return text.match(/^PHONE_AGENT_INTERNAL_SECRET=([a-f0-9]{64})\r?$/m)?.[1] || "";
}
async function proxy(request: NextRequest) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ ok: false }, { status: 403, headers });
  if (request.method === "POST") {
    const origin = request.headers.get("origin");
    const expectedOrigin = new URL(process.env.APP_URL || request.url).origin;
    if ((origin && origin !== expectedOrigin) || request.headers.get("sec-fetch-site") === "cross-site") {
      return NextResponse.json({ ok: false }, { status: 403, headers });
    }
  }
  const key = await secret();
  if (key.length < 32) return NextResponse.json({ ok: true, enabled: false, ready: false, missing: ["Server connection"], configured: false }, { headers });
  let path = "/internal/status";
  let body: string | undefined;
  if (request.method === "POST") {
    const raw = await request.text();
    if (raw.length > 4096) return NextResponse.json({ ok: false }, { status: 413, headers });
    const input = policySchema.safeParse(JSON.parse(raw));
    if (!input.success) return NextResponse.json({ ok: false, error: "invalid_policy" }, { status: 400, headers });
    path = "/internal/day"; body = JSON.stringify(input.data);
  } else if (request.nextUrl.searchParams.has("date")) {
    const date = z.iso.date().safeParse(request.nextUrl.searchParams.get("date"));
    if (!date.success) return NextResponse.json({ ok: false }, { status: 400, headers });
    path = "/internal/day?date=" + encodeURIComponent(date.data);
  }
  const response = await fetch("http://127.0.0.1:3010" + path, {
    method: request.method, headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body, cache: "no-store", signal: AbortSignal.timeout(8000),
  });
  return NextResponse.json(await response.json(), { status: response.status, headers });
}
export async function GET(request: NextRequest) {
  try { return await proxy(request); } catch { return NextResponse.json({ ok: false, error: "phone_service_unavailable" }, { status: 503, headers }); }
}
export async function POST(request: NextRequest) {
  try { return await proxy(request); } catch (error) { return NextResponse.json({ ok: false, error: error instanceof SyntaxError ? "invalid_input" : "phone_service_unavailable" }, { status: error instanceof SyntaxError ? 400 : 503, headers }); }
}
