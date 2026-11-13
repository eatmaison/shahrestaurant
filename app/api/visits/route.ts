import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "../../lib/rateLimit";
import { getSessionUserId } from "../../lib/session";
import { classifyVisitorAgent, normalizeVisitorSource, observedPublicPath, VISIT_ANALYTICS_COOKIE } from "../../lib/visitorSignals";
import { forgetVisitorObservations, recordVisitorObservation } from "../../lib/visitorObservationStore";

const uuid = z.string().uuid();
const eventSchema = z.object({ path: z.string().max(128),
  source: z.object({ source: z.string().max(64).optional(), medium: z.string().max(64).optional(), campaign: z.string().max(64).optional(), referrerHost: z.string().max(253).optional() }).strict(),
  interaction: z.boolean(), webdriver: z.boolean() }).strict();
const response = (status: number) => new NextResponse(null, { status, headers: { "Cache-Control": "private, no-store" } });
function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const supplied = new URL(origin).origin;
    const expected = process.env.APP_URL ? new URL(process.env.APP_URL).origin : request.nextUrl.origin;
    return supplied === expected;
  } catch { return false; }
}
async function readBody(request: NextRequest): Promise<unknown> {
  if (!request.body) return;
  const reader = request.body.getReader(), chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const item = await reader.read();
    if (item.done) break;
    length += item.value.length;
    if (length > 4096) { await reader.cancel(); throw new Error("too-large"); }
    chunks.push(item.value);
  }
  const bytes = new Uint8Array(length); let at = 0;
  for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return response(403);
  if (request.cookies.get(VISIT_ANALYTICS_COOKIE)?.value !== "allowed") return response(403);
  const limited = enforceRateLimit(request, "visit-observation", 90, 60_000); if (limited) return limited;
  const visitorId = request.cookies.get("etg_vid")?.value;
  if (!uuid.safeParse(visitorId).success) return response(400);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return response(415);
  let raw: unknown;
  try { raw = await readBody(request); } catch (error) { return response(error instanceof Error && error.message === "too-large" ? 413 : 400); }
  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) return response(400);
  const path = observedPublicPath(parsed.data.path); if (!path) return response(400);
  try {
    const sessionUserId = await getSessionUserId();
    const userId = uuid.safeParse(sessionUserId).success ? sessionUserId : null;
    const agent = classifyVisitorAgent(request.headers.get("user-agent") || "", parsed.data.webdriver, parsed.data.interaction);
    const status = await recordVisitorObservation({ visitorId: visitorId!, userId, path,
      source: normalizeVisitorSource(parsed.data.source), ...agent });
    return response(status === "available" ? 204 : 503);
  } catch { return response(503); }
}
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return response(403);
  const visitorId = request.cookies.get("etg_vid")?.value;
  if (!visitorId || !uuid.safeParse(visitorId).success) return response(204);
  const limited = enforceRateLimit(request, "visit-observation-delete", 10, 60_000); if (limited) return limited;
  try { await forgetVisitorObservations(visitorId); return response(204); } catch { return response(503); }
}
