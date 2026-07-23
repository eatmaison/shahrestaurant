/** A menu category. Each brand defines its own set of category names. */
export type Category = string;

/** The restaurant a product belongs to (a brand id, e.g. "eattogo"). */
export type Brand = string;

export interface BrandSubcategory {
  name: string;
  /** Icon key from CATEGORY_ICON_CHOICES in app/lib/data.ts. */
  icon: string;
}

/** A category inside a brand's menu, with the icon key it is displayed with. */
export interface BrandCategory {
  name: string;
  /** Icon key from CATEGORY_ICON_CHOICES in app/lib/data.ts. */
  icon: string;
  subcategories?: BrandSubcategory[];
}

/** Admin-managed restaurant/brand stored in the database. */
export interface BrandConfig {
  id: string;
  name: string;
  /** Logo path or data URL; empty string when the brand has no logo. */
  logo: string;
  categories: BrandCategory[];
}

export type Lang = "en" | "nl";

export interface Product {
  id: string;
  /** Which restaurant/brand this product belongs to. */
  brand: Brand;
  category: Category;
  subcategory?: Category;
  name: string;
  /** Short card description (English / default). */
  description: string;
  /** Short card description in Dutch (falls back to `description` when empty). */
  descriptionNl?: string;
  price: number;
  /** Optional image as a data URL or public path */
  image?: string;
  /** Detailed product description for "read more" modal */
  detailedDescription?: {
    en: string;
    nl: string;
  };
  /** Ingredients list (English / default) */
  ingredients?: string[];
  /** Ingredients list in Dutch (falls back to `ingredients` when empty) */
  ingredientsNl?: string[];
  /** Allergen information (English / default) */
  allergens?: string[];
  /** Allergen information in Dutch (falls back to `allergens` when empty) */
  allergensNl?: string[];
}

export type Role = "user" | "admin";

export type AccountType = "personal" | "company";

export interface User {
  id: string;
  name: string;
  email: string;
  /** Demo-only plain value stored locally. Never do this in production. */
  password: string;
  phone?: string;
  /** Last used delivery street + house number (auto-filled on the next order). */
  address?: string;
  /** Last used delivery postcode (auto-filled on the next order). */
  postcode?: string;
  role: Role;
  createdAt: number;
  /** Loyalty points earned from orders (1 point = €1, earned per €10 spent) */
  points: number;
  /** Number of completed orders */
  orderCount: number;
  /** VIP membership: permanent 10% discount on food (personal accounts only) */
  isVip: boolean;
  /** Personal customer or business (company) account */
  accountType: AccountType;
  /** VAT number - required for company accounts */
  btw?: string;
  /** Chamber of Commerce number - required for company accounts */
  kvk?: string;
  /** Whether the customer confirmed their email address via the verification link. */
  emailVerified: boolean;
  /** Last time the user was active on the site (epoch ms). */
  lastSeenAt?: number;
  /** Website where the user was last active. */
  lastSeenSite?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  /** Restaurant/brand the item belongs to (so the right kitchen prepares it). */
  brand: Brand;
  /** Menu category of the item at order time. */
  category: Category;
}

/** Full-menu upgrades keyed by the food product id, with the chosen free soft-drink product id as the value. */
export type MenuUpgrades = Record<string, string>;

export interface OrderSchedule {
  /** "once" = single scheduled delivery, "workdays" = repeats every working day (Mon–Fri) */
  type: "once" | "workdays";
  /** Delivery date for one-time scheduled orders (YYYY-MM-DD) */
  date?: string;
  /** Delivery time (HH:mm) */
  time: string;
}

/** Fulfilment lifecycle of an order, advanced by the admin. */
export type OrderStatus = "new" | "preparing" | "delivery" | "delivered";

/** How the customer receives the order: delivered to their address, or picked up in person. */
export type OrderFulfillment = "delivery" | "pickup";

export interface Order {
  id: string;
  /** Human-readable sequential order number shown to the customer and admin. */
  orderNumber: number;
  userId?: string;
  customerName: string;
  address: string;
  /** Dutch postcode of the delivery address (e.g. "1032 KL") */
  postcode: string;
  phone: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  /** Loyalty points redeemed on this order (1 point = €1) */
  pointsUsed: number;
  /** Loyalty points earned with this order */
  pointsEarned: number;
  delivery: number;
  total: number;
  createdAt: number;
  /** Current fulfilment status, updated by the admin. */
  status: OrderStatus;
  /** Whether the order has been fully paid. Personal orders are paid upfront; company orders are invoiced. */
  paid: boolean;
  /** Account type used to place the order (separates personal vs company orders). */
  accountType: AccountType;
  /** For company orders: whether the invoice has been sent to the customer. */
  invoiceSent: boolean;
  /** Optional customer note (delivery instructions, allergies, etc.). */
  note?: string;
  /** Optional planned delivery (company accounts) */
  schedule?: OrderSchedule;
  /** Whether the customer wants the order delivered or will pick it up themselves. */
  fulfillment: OrderFulfillment;
}

export interface Review {
  id: string;
  /** Set when the review is tied to a delivered order. */
  orderId?: string;
  /** Set when the review is tied to a table reservation that already took place. */
  reservationId?: string;
  userId: string;
  userName: string;
  /** Star rating from 1 to 5 */
  rating: number;
  text: string;
  createdAt: number;
  /** Website the review was written on ("eattogo", "themaison", ...). */
  site: string;
}

/** Lifecycle of a table reservation. */
export type ReservationStatus = "pending" | "confirmed" | "declined" | "cancelled";

/** A table reservation at the restaurant. */
export interface Reservation {
  id: string;
  /** Human-readable sequential number shown to the guest and admin (RSV-501...). */
  reservationNumber: number;
  /** Account that made the booking (guests can also book while signed out). */
  userId?: string;
  guestName: string;
  email: string;
  phone: string;
  /** Reservation date (YYYY-MM-DD). */
  date: string;
  /** Arrival time (HH:mm). */
  time: string;
  /** Party size. */
  guests: number;
  /** Optional occasion (birthday, business, romantic, family, other). */
  occasion?: string;
  /** Special requests: allergies, seating preference, celebrations... */
  note?: string;
  status: ReservationStatus;
  createdAt: number;
}

export type VipRequestStatus = "pending" | "approved" | "rejected";

/** A customer's request to activate VIP by uploading a photo of their physical VIP card. */
export interface VipRequest {
  id: string;
  userId: string;
  userName: string;
  /** Uploaded VIP card photo as a data URL. */
  image: string;
  status: VipRequestStatus;
  createdAt: number;
}

/** Social media platforms the admin can link from the footer. */
export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "snapchat"
  | "telegram"
  | "linkedin"
  | "x"
  | "pinterest"
  | "whatsapp"
  | "googlemaps"
  | "applemaps"
  | "tripadvisor"
  | "yelp";

/** An admin-managed social media link shown in the site footer when enabled. */
export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  enabled: boolean;
}

/** An admin-uploaded photo shown on the public gallery page (stored in DigitalOcean Spaces). */
export interface GalleryImage {
  id: string;
  /** Public URL of the stored photo (Spaces/CDN) or a data URL fallback. */
  url: string;
  /** Descriptive alt text (English). */
  alt: string;
  /** Descriptive alt text (Dutch). */
  altNl: string;
  /** Category key: "dishes" | "interior" | "bar" | "ambiance" (free text allowed). */
  category: string;
  /** True for tall (portrait) photos. */
  portrait: boolean;
  createdAt: number;
}
