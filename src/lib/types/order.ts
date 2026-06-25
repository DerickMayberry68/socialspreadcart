export type OrderStatus =
  | "draft"
  | "payment_pending"
  | "delivery_requested"
  | "delivery_approved_payment_needed"
  | "delivery_declined"
  | "pickup_offered"
  | "approval_withdrawn"
  | "expired"
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

export type PaymentProviderName = "square" | "stripe";

export type FulfillmentType = "pickup" | "delivery" | "event" | "other";

export type DeliveryStatus =
  | "not_required"
  | "requested"
  | "approved_payment_needed"
  | "declined"
  | "pickup_offered"
  | "approval_withdrawn"
  | "expired"
  | "paid";

export type FulfillmentAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

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
  fulfillment_address?: FulfillmentAddress | null;
  delivery_status?: DeliveryStatus;
  delivery_fee_cents?: number;
  approved_total_cents?: number | null;
  delivery_decision_note?: string | null;
  delivery_approved_at?: string | null;
  delivery_approval_expires_at?: string | null;
  delivery_decided_by?: string | null;
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
  provider_order_id?: string | null;
  provider_checkout_id?: string | null;
  provider_refund_id?: string | null;
  amount_cents: number;
  amount_subtotal_cents?: number | null;
  amount_tax_cents?: number | null;
  amount_fee_cents?: number | null;
  currency: string;
  status: PaymentStatus;
  raw_event_id: string | null;
  refunded_amount_cents?: number;
  checkout_expires_at?: string | null;
  superseded_at?: string | null;
  tax_calculation_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentWebhookProcessingStatus =
  | "received"
  | "processed"
  | "ignored"
  | "failed";

export type PaymentWebhookEvent = {
  id: string;
  provider: PaymentProviderName;
  event_id: string;
  event_type: string;
  tenant_id: string | null;
  order_id: string | null;
  payment_record_id: string | null;
  processing_status: PaymentWebhookProcessingStatus;
  error_message: string | null;
  received_at: string;
  processed_at: string | null;
};

export type GuestOrderSummary = GuestOrder & {
  items: OrderLineItem[];
  payment?: PaymentRecord | null;
};

export type CheckoutPaymentResult = {
  mode: "payment";
  orderId: string;
  paymentStatus: PaymentStatus;
  totals: OrderTotals;
  checkoutUrl: string;
};

export type DeliveryRequestResult = {
  mode: "delivery_request";
  orderId: string;
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
  message: string;
  totals: OrderTotals;
};

export type CheckoutSessionResult =
  | CheckoutPaymentResult
  | DeliveryRequestResult;

export type OrderTotals = {
  subtotalCents: number;
  taxCents: number;
  feeCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  currency: string;
  taxCalculationId?: string | null;
};

export type HostedCheckoutResult = {
  provider: PaymentProviderName;
  checkoutId: string;
  providerOrderId: string | null;
  paymentId: string | null;
  checkoutUrl: string;
  totals: OrderTotals;
};

export type HostedPaymentEvent = {
  provider: PaymentProviderName;
  eventId: string;
  eventType: string;
  providerOrderId: string | null;
  checkoutId: string | null;
  paymentId: string | null;
  refundId: string | null;
  amountCents: number | null;
  subtotalCents: number | null;
  taxCents: number | null;
  feeCents: number | null;
  deliveryFeeCents: number | null;
  refundedAmountCents: number | null;
  currency: string | null;
  status: PaymentStatus;
};

export type OrderStatusHistory = {
  id: string;
  tenant_id: string;
  order_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  customer_visible: boolean;
  created_by: string | null;
  created_at: string;
};
