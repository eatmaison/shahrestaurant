import { z } from "zod";

/* ------------------------------------------------------------------ auth */

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(6).max(200);

export const authSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("register"),
    name: z.string().trim().min(1).max(100),
    email,
    password,
    phone: z.string().trim().max(30).optional(),
    adminCode: z.string().max(100).optional(),
    accountType: z.enum(["personal", "company"]).optional(),
    btw: z.string().trim().max(30).optional(),
    kvk: z.string().trim().max(30).optional(),
    agreementAccepted: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("login"),
    email,
    password: z.string().min(1).max(200),
  }),
  z.object({ action: z.literal("logout") }),
  z.object({
    action: z.literal("verifyEmail"),
    token: z.string().min(1).max(2048),
  }),
  z.object({ action: z.literal("resendVerification") }),
  z.object({
    action: z.literal("requestReset"),
    email,
  }),
  z.object({
    action: z.literal("resetPassword"),
    token: z.string().min(1).max(2048),
    password,
  }),
]);

export type AuthInput = z.infer<typeof authSchema>;

/* ------------------------------------------------------------------ orders */

const orderSchedule = z.object({
  type: z.enum(["once", "workdays"]),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

export const placeOrderSchema = z.object({
  customerName: z.string().trim().min(1).max(100),
  address: z.string().trim().min(1).max(300),
  postcode: z.string().trim().min(4).max(10),
  phone: z.string().trim().min(5).max(30),
  note: z.string().trim().max(500).optional(),
  cart: z.record(z.string().max(100), z.number().int().min(0).max(99)),
  pointsToUse: z.number().int().min(0).max(100000).optional(),
  schedule: orderSchedule.optional(),
  fulfillment: z.enum(["delivery", "pickup"]).optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export const updateOrderSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "preparing", "delivery", "delivered"]).optional(),
  paid: z.boolean().optional(),
  invoiceSent: z.boolean().optional(),
});

export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

/* ------------------------------------------------------------------ social links */

export const socialLinkSchema = z.object({
  platform: z.enum([
    "instagram",
    "facebook",
    "tiktok",
    "youtube",
    "snapchat",
    "telegram",
    "linkedin",
    "x",
    "pinterest",
    "whatsapp",
    "googlemaps",
    "applemaps",
    "tripadvisor",
    "yelp",
  ]),
  // Empty clears the link; otherwise require http(s) so no javascript: URLs
  // can ever be injected into footer anchors.
  url: z
    .string()
    .trim()
    .max(500)
    .refine((u) => u === "" || /^https?:\/\//i.test(u), "URL must start with http(s)://"),
  enabled: z.boolean(),
});

export type SocialLinkInput = z.infer<typeof socialLinkSchema>;

/* ------------------------------------------------------------------ brands & categories */

export const brandsActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("addBrand"),
    name: z.string().trim().min(1).max(60),
  }),
  z.object({
    action: z.literal("removeBrand"),
    id: z.string().trim().min(1).max(80),
  }),
  z.object({
    action: z.literal("addCategory"),
    brandId: z.string().trim().min(1).max(80),
    name: z.string().trim().min(1).max(60),
    icon: z.string().trim().min(1).max(40),
  }),
  z.object({
    action: z.literal("removeCategory"),
    brandId: z.string().trim().min(1).max(80),
    name: z.string().trim().min(1).max(60),
  }),
]);

export type BrandsActionInput = z.infer<typeof brandsActionSchema>;
