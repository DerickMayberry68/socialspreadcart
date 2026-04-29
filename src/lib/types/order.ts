export type OrderStatus =
  | "draft"
  | "payment_pending"
  | "paid"
  | "payment_failed"
  | "cancelled"
  | "preparing"
  | "fulfilled";

export type PaymentStatus =
  | "not_started"
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

export type FulfillmentType = "pickup" | "delivery" | "event" | "other";

export type OrderTrayItem = {
  menuItemId: string;
  quantity: number;
  notes?: string;
  options?: Record<string, unknown>;
};

export type OrderLineItem = {
  id?: string;
  menu_item_id: string;
  name: string;
  slug: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
  notes: string | null;
  options: Record<string, unknown>;
};

export type GuestOrder = {
  id: string;
  tenant_id: string;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  fulfillment_type: FulfillmentType;
  fulfillment_requested_at: string | null;
  fulfillment_notes: string | null;
  subtotal_cents: number;
  tax_cents: number;
  fee_cents: number;
  total_cents: number;
  currency: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
};

export type PaymentRecord = {
  id: string;
  tenant_id: string;
  order_id: string;
  provider: string;
  provider_session_id: string | null;
  provider_payment_intent_id: string | null;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  raw_event_id: string | null;
  created_at: string;
  updated_at: string;
};

export type GuestOrderSummary = GuestOrder & {
  items: OrderLineItem[];
  payment?: PaymentRecord | null;
};

export type CheckoutSessionResult = {
  orderId: string;
  paymentStatus: PaymentStatus;
  checkoutUrl: string;
};
