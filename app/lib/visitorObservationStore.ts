import type { RecentVisitor } from "./types";
import { sql } from "./db";
import { SITE_ID } from "./data";
import { normalizeVisitorSource, type VisitorObservation, type VisitorTelemetryStatus } from "./visitorSignals";

type ObservationRow = { visitor_id: string; user_id?: string | null; source: unknown; classification: VisitorObservation["classification"]; reasons?: string[]; first_observed_at: string | Date; last_observed_at: string | Date; last_path: string };
const millis = (value: string | Date) => new Date(value).getTime();
let lastPrune = 0;

/** No DDL here: absence of the optional table is a supported state. */
export async function visitorObservationCapability(): Promise<VisitorTelemetryStatus> {
  try {
    const rows = await sql.query("SELECT to_regclass('public.visitor_observations') IS NOT NULL AS available");
    return rows[0]?.available ? "available" : "not-configured";
  } catch { return "unavailable"; }
}
async function prune() {
  if (Date.now() - lastPrune < 60 * 60_000) return;
  await sql.query("DELETE FROM visitor_observations WHERE expires_at <= now()");
  lastPrune = Date.now();
}
function observation(row: ObservationRow): VisitorObservation {
  const raw = row.source && typeof row.source === "object" ? row.source as Record<string, unknown> : {};
  const source = normalizeVisitorSource({ source: raw.kind === "campaign" ? raw.label : undefined, referrerHost: raw.referrerHost, campaign: raw.campaign, medium: raw.medium });
  return { source, classification: ["possible-automation", "interaction-reported", "unknown"].includes(row.classification) ? row.classification : "unknown",
    reasons: Array.isArray(row.reasons) ? row.reasons.filter(value => typeof value === "string").slice(0, 4) : [],
    firstObservedAt: millis(row.first_observed_at), lastObservedAt: millis(row.last_observed_at),
    lastPath: row.last_path };
}
export async function loadVisitorObservations(visitors: RecentVisitor[]): Promise<{ visitors: RecentVisitor[]; status: VisitorTelemetryStatus }> {
  const status = await visitorObservationCapability();
  if (status !== "available") return { visitors, status };
  try {
    await prune();
    const rows = await sql.query(`SELECT visitor_id, user_id, source, classification, reasons,
      first_observed_at, last_observed_at, last_path
      FROM visitor_observations WHERE site = $1 AND expires_at > now()
      ORDER BY last_observed_at DESC`, [SITE_ID]) as ObservationRow[];
    const accounts = new Map<string, ObservationRow>(), guests = new Map<string, ObservationRow>();
    for (const row of rows) {
      if (row.user_id) { if (!accounts.has(row.user_id)) accounts.set(row.user_id, row); }
      else if (!guests.has(row.visitor_id)) guests.set(row.visitor_id, row);
    }
    return { visitors: visitors.map(visitor => {
      const row = visitor.kind === "user" ? accounts.get(visitor.id) : guests.get(visitor.sessionId || visitor.id);
      return row ? { ...visitor, observation: observation(row) } : visitor;
    }), status: "available" };
  } catch { return { visitors, status: "unavailable" }; }
}

export type ObservationInput = { visitorId: string; userId: string | null; path: string; source: ReturnType<typeof normalizeVisitorSource>; classification: VisitorObservation["classification"]; reasons: string[] };
export async function recordVisitorObservation(input: ObservationInput): Promise<VisitorTelemetryStatus> {
  const status = await visitorObservationCapability();
  if (status !== "available") return status;
  try {
    // Fixed lifetime, not an indefinitely sliding retention period.
    await sql.query("DELETE FROM visitor_observations WHERE site = $1 AND visitor_id = $2 AND subject_key = $3 AND expires_at <= now()", [SITE_ID, input.visitorId, input.userId || "guest"]);
    await prune();
    await sql.query(`INSERT INTO visitor_observations
      (site,visitor_id,subject_key,user_id,source,classification,reasons,last_path)
      VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7::text[],$8)
      ON CONFLICT (site,visitor_id,subject_key) DO UPDATE SET
        last_observed_at = now(), last_path = EXCLUDED.last_path,
        classification = CASE WHEN EXCLUDED.classification = 'possible-automation' THEN EXCLUDED.classification
          WHEN visitor_observations.classification = 'possible-automation' THEN visitor_observations.classification
          WHEN EXCLUDED.classification = 'interaction-reported' THEN EXCLUDED.classification ELSE visitor_observations.classification END,
        reasons = CASE WHEN EXCLUDED.classification = 'possible-automation' OR visitor_observations.classification <> 'possible-automation' AND EXCLUDED.classification = 'interaction-reported' THEN EXCLUDED.reasons ELSE visitor_observations.reasons END`,
    [SITE_ID, input.visitorId, input.userId || "guest", input.userId, JSON.stringify(input.source), input.classification, input.reasons,
      input.path]);
    if (input.userId) await sql.query("UPDATE users SET last_seen_at = now(), last_seen_site = $2 WHERE id = $1", [input.userId, SITE_ID]);
    else await sql.query("UPDATE visitor_sessions SET last_seen_at = now() WHERE id = $1 AND last_seen_site = $2", [input.visitorId, SITE_ID]);
    return "available";
  } catch { return "unavailable"; }
}
export async function forgetVisitorObservations(visitorId: string): Promise<void> {
  if (await visitorObservationCapability() === "available") await sql.query("DELETE FROM visitor_observations WHERE site = $1 AND visitor_id = $2", [SITE_ID, visitorId]);
}
