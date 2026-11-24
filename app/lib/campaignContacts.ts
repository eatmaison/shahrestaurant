import { z } from "zod";

export const campaignEmail = z.email().max(254).transform(value => value.toLowerCase());
export const campaignConsent = z.strictObject({
  action: z.literal("consent"), email: campaignEmail, evidence: z.string().trim().min(12).max(500),
  confirmed: z.literal(true),
});
export const campaignDraft = z.strictObject({
  action: z.literal("create"), id: z.uuid(), subject: z.string().trim().min(1).max(160).refine(s => !/[\r\n\u0000]/.test(s)),
  body: z.string().trim().min(1).max(12000).refine(s => !s.includes("\u0000")),
  recipients: z.array(z.uuid()).min(1).max(20_000).refine(ids => ids.length === new Set(ids).size),
});
export const campaignDispatch = z.strictObject({ action: z.literal("dispatch"), id: z.uuid() });
export const campaignAction = z.discriminatedUnion("action", [campaignConsent, campaignDraft, campaignDispatch]);

export type EmailContact = {
  key: string; name: string | null; email: string | null; phone: string | null; address: string | null;
  sources: ("account" | "order" | "reservation")[];
  permissionId: string | null; optedOut: boolean;
};
export type CampaignSummary = {
  id: string; subject: string; createdAt: string; pending: number; sending: number;
  accepted: number; notSent: number; uncertain: number;
};
