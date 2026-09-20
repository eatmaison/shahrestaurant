export interface PartyEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  price_cents: number;
  capacity: number;
  tickets_sold: number;
  remaining: number;
  revenue_cents: number;
  image: string;
  status: "active" | "sold_out" | "cancelled";
  published: boolean;
  sales_open: boolean;
}

export interface PartyBooking {
  id: string;
  event_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  quantity: number;
  price_cents: number;
  total_cents: number;
  event_title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  payment_status: string;
  ticket_status: "pending" | "confirmed" | "refund_pending" | "refunded" | "failed";
  mollie_payment_id: string | null;
  created_at: string;
  email_sent_at: string | null;
}

export const partyMoney = (cents: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(cents / 100);
export const partyDate = (date: string) => new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam" }).format(new Date(`${date.slice(0, 10)}T12:00:00Z`));