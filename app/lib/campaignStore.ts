import { sql } from "./db";
import { SITE_ID } from "./data";
import { type CampaignSummary, type EmailContact, campaignDraft } from "./campaignContacts";
import type { z } from "zod";

// This database contains sister-site data. Orders do not have an originating
// site column: a Shah-owned item is the evidence we have for a Shah customer.
const contacts = `
WITH shah_orders AS (
  SELECT o.id,o.user_id,o.customer_name,o.customer_email,o.phone,o.address,o.postcode,o.fulfillment,o.created_at
  FROM orders o WHERE EXISTS (
    SELECT 1 FROM order_items i WHERE i.order_id=o.id AND i.brand=$1
  )
), shah_reservations AS (
  SELECT id,user_id,guest_name,email,phone,created_at FROM reservations WHERE site=$1
), site_accounts AS (
  SELECT u.* FROM users u WHERE u.role='user' AND (
    u.last_seen_site=$1 OR u.id IN (SELECT user_id FROM shah_orders UNION SELECT user_id FROM shah_reservations)
  )
), source_rows AS (
  SELECT 'account' AS source, id, id AS user_id, email, name,
    phone, concat_ws(' ', nullif(btrim(address),''), nullif(btrim(postcode),'')) AS address, created_at AS observed
  FROM site_accounts
  UNION ALL
  SELECT 'order', o.id, o.user_id, coalesce(nullif(btrim(o.customer_email),''),u.email),
    o.customer_name,o.phone,CASE WHEN o.fulfillment='delivery'
      THEN concat_ws(' ',nullif(btrim(o.address),''),nullif(btrim(o.postcode),'')) END,o.created_at
  FROM shah_orders o LEFT JOIN site_accounts u ON u.id=o.user_id
  UNION ALL
  SELECT 'reservation', r.id,r.user_id,coalesce(nullif(btrim(r.email),''),u.email),r.guest_name,r.phone,NULL,r.created_at
  FROM shah_reservations r LEFT JOIN site_accounts u ON u.id=r.user_id
), normalized AS (
  SELECT *, nullif(lower(btrim(email)),'') AS email_key FROM source_rows
), keyed AS (
  SELECT *, coalesce('email:'||email_key,'account:'||user_id,'row:'||source||':'||id) AS key
  FROM normalized
), merged AS (
  SELECT key, max(email_key) AS email,
    (array_agg(nullif(btrim(name),'') ORDER BY (source='account') DESC,observed DESC,id) FILTER (WHERE nullif(btrim(name),'') IS NOT NULL))[1] AS name,
    (array_agg(nullif(btrim(phone),'') ORDER BY observed DESC,id) FILTER (WHERE nullif(btrim(phone),'') IS NOT NULL))[1] AS phone,
    (array_agg(nullif(btrim(address),'') ORDER BY observed DESC,id) FILTER (WHERE nullif(btrim(address),'') IS NOT NULL))[1] AS address,
    array_agg(DISTINCT source ORDER BY source) AS sources
  FROM keyed GROUP BY key
), directory AS (
  SELECT m.*, CASE WHEN p.revoked_at IS NULL THEN p.id END AS "permissionId",
    (p.revoked_at IS NOT NULL) AS "optedOut"
  FROM merged m LEFT JOIN shah_email_permissions p USING(email)
)`;

export const CONTACT_PAGE_SIZE = 40;
export async function loadCampaignDirectory(search: string, page: number, subscribed: boolean) {
  const rows = await sql.query(contacts + `, filtered AS (
    SELECT * FROM directory WHERE (NOT $4::boolean OR "permissionId" IS NOT NULL)
    AND ($2 = '' OR strpos(lower(concat_ws(' ',name,email,phone,address)),lower($2)) > 0)
  ), paged AS (
    SELECT * FROM filtered ORDER BY lower(coalesce(name,email,'')),key LIMIT 40 OFFSET $3
  )
  SELECT (SELECT count(*)::int FROM filtered) AS total,
    coalesce((SELECT json_agg(paged ORDER BY lower(coalesce(name,email,'')),key) FROM paged),'[]') AS items,
    coalesce((SELECT json_agg("permissionId" ORDER BY "permissionId") FROM filtered WHERE "permissionId" IS NOT NULL),'[]') AS eligible
  `, [SITE_ID, search, page * CONTACT_PAGE_SIZE, subscribed]);
  return rows[0] as { items: EmailContact[]; total: number; eligible: string[] };
}

export async function recordPermission(email: string, evidence: string, admin: string) {
  const rows = await sql.query(contacts + `
    INSERT INTO shah_email_permissions(email,evidence,granted_by)
    SELECT $2,$3,$4 FROM merged WHERE email=$2
    ON CONFLICT(email) DO NOTHING RETURNING id
  `, [SITE_ID, email, evidence, admin]);
  return rows.length === 1;
}

const summary = `
  SELECT c.id,c.subject,c.created_at AS "createdAt",
    count(*) FILTER (WHERE d.status='pending')::int AS pending,
    count(*) FILTER (WHERE d.status='sending' AND d.updated_at>=now()-interval '2 minutes')::int AS sending,
    count(*) FILTER (WHERE d.status='accepted')::int AS accepted,
    count(*) FILTER (WHERE d.status='not_sent')::int AS "notSent",
    count(*) FILTER (WHERE d.status='uncertain' OR (d.status='sending' AND d.updated_at<now()-interval '2 minutes'))::int AS uncertain
  FROM shah_email_campaigns c LEFT JOIN shah_email_deliveries d ON d.campaign_id=c.id
`;
export async function campaignSummaries(id?: string) {
  return await sql.query(summary + (id ? ' WHERE c.id=$1' : '') +
    ' GROUP BY c.id ORDER BY c.created_at DESC,c.id LIMIT 15', id ? [id] : []) as CampaignSummary[];
}

export async function createCampaign(input: z.infer<typeof campaignDraft>, admin: string) {
  const rows = await sql.query(contacts + `, eligible AS (
      SELECT "permissionId" AS id FROM directory WHERE "permissionId"=ANY($5::uuid[])
    ), inserted AS (
      INSERT INTO shah_email_campaigns(id,subject,body,created_by)
      SELECT $2,$3,$4,$6 WHERE (SELECT count(*) FROM eligible)=cardinality($5::uuid[])
      ON CONFLICT(id) DO NOTHING RETURNING id
    ), queued AS (
      INSERT INTO shah_email_deliveries(campaign_id,permission_id)
      SELECT inserted.id,eligible.id FROM inserted CROSS JOIN eligible RETURNING permission_id
    )
    SELECT (SELECT count(*)::int FROM queued) AS added,
      EXISTS(SELECT 1 FROM shah_email_campaigns c WHERE c.id=$2 AND c.subject=$3 AND c.body=$4 AND c.created_by=$6
        AND (SELECT coalesce(array_agg(d.permission_id ORDER BY d.permission_id),ARRAY[]::uuid[]) FROM shah_email_deliveries d WHERE d.campaign_id=c.id)
          = ARRAY(SELECT unnest($5::uuid[]) ORDER BY 1)) AS existing
  `, [SITE_ID, input.id, input.subject, input.body, input.recipients, admin]);
  return rows[0]?.added === input.recipients.length || rows[0]?.existing === true;
}

type Claimed = { id: string; email: string; token: string; subject: string; body: string; allowed: boolean };
export async function claimCampaignRecipient(id: string): Promise<Claimed | undefined> {
  const rows = await sql.query(`WITH next AS (
    SELECT campaign_id,permission_id FROM shah_email_deliveries
    WHERE campaign_id=$1 AND status='pending' ORDER BY permission_id LIMIT 1 FOR UPDATE SKIP LOCKED
  ), claimed AS (
    UPDATE shah_email_deliveries d SET status='sending',updated_at=now()
      FROM next n WHERE d.campaign_id=n.campaign_id AND d.permission_id=n.permission_id RETURNING d.permission_id
  )
  SELECT p.id,p.email,p.unsubscribe_token AS token,c.subject,c.body,
    (p.revoked_at IS NULL) AS allowed
  FROM claimed k JOIN shah_email_permissions p ON p.id=k.permission_id CROSS JOIN shah_email_campaigns c WHERE c.id=$1
  `, [id]);
  return rows[0] as Claimed | undefined;
}
export async function permissionStillActive(id: string) {
  const result = await sql.query('SELECT 1 FROM shah_email_permissions WHERE id=$1 AND revoked_at IS NULL', [id]);
  return result.length === 1;
}
export async function setDelivery(campaign: string, permission: string, status: "accepted" | "not_sent" | "uncertain" | "pending") {
  await sql.query("UPDATE shah_email_deliveries SET status=$3,updated_at=now() WHERE campaign_id=$1 AND permission_id=$2 AND status='sending'", [campaign, permission, status]);
}
export async function unsubscribe(token: string) {
  await sql.query('UPDATE shah_email_permissions SET revoked_at=now() WHERE unsubscribe_token=$1 AND revoked_at IS NULL',[token]);
}
