import { z } from "zod";
import type { NextRequest } from "next/server";
import { eventAdminId } from "../../../lib/eventAccess";
import { stockJson as json, readStockPayload, sameOriginJson, stockDatabaseCode } from "../../../lib/stockRequest";
import { campaignAction } from "../../../lib/campaignContacts";
import { campaignSummaries, claimCampaignRecipient, createCampaign, loadCampaignDirectory, permissionStillActive, recordPermission, setDelivery } from "../../../lib/campaignStore";
import { campaignSender, deliverCampaign } from "../../../lib/campaignDelivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const adminFor = (request: NextRequest) => eventAdminId(request.cookies.get("etg_session")?.value);
function unavailable(error: unknown) {
  return json({ error: stockDatabaseCode(error) === "42P01" ? "migration_required" : "unavailable" }, 503);
}
export async function GET(request: NextRequest) {
  if (!await adminFor(request)) return json({ error: "forbidden" }, 403);
  try {
    const params = request.nextUrl.searchParams;
    const search = (params.get("q") || "").trim().slice(0, 160);
    const page = z.coerce.number().int().min(0).max(100_000).safeParse(params.get("page") ?? 0);
    if (!page.success) return json({ error: "invalid_input" }, 400);
    const [directory, campaigns] = await Promise.all([
      loadCampaignDirectory(search, page.data, params.get("subscribed") === "1"),
      campaignSummaries(),
    ]);
    return json({ ...directory, campaigns, sendingEnabled: !!campaignSender() });
  } catch (error) { return unavailable(error); }
}

export async function POST(request: NextRequest) {
  const admin = await adminFor(request);
  if (!admin || !request.headers.get("origin") || !sameOriginJson(request)) return json({ error: "forbidden" }, 403);
  try {
    const parsed = campaignAction.safeParse(await readStockPayload(request, 860_000));
    if (!parsed.success) return json({ error: "invalid_input" }, 400);
    const action = parsed.data;
    if (action.action === "consent") {
      return await recordPermission(action.email, action.evidence, admin) ? json({ ok: true }) : json({ error: "permission_not_added" }, 409);
    }
    const sender = campaignSender();
    if (!sender) return json({ error: "sender_not_configured" }, 503);
    if (action.action === "create") {
      if (!await createCampaign(action, admin)) return json({ error: "audience_changed" }, 409);
    } else {
      const row = await claimCampaignRecipient(action.id);
      if (row) {
        let status: "not_sent" | "accepted" | "uncertain" | "deferred" = "not_sent";
        if (row.allowed && await permissionStillActive(row.id)) {
          try { status = await deliverCampaign({ ...row, campaign: action.id }, sender); }
          catch { status = "uncertain"; } // Never automatically resend after an ambiguous provider response.
        }
        await setDelivery(action.id, row.id, status === "deferred" ? "pending" : status);
        if (status === "deferred") return json({ error: "provider_unavailable" }, 503);
      }
    }
    const [campaign] = await campaignSummaries(action.id);
    return campaign ? json({ campaign }) : json({ error: "not_found" }, 404);
  } catch (error) { return unavailable(error); }
}
