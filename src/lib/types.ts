import type { EventType, ServiceOption } from "@/types/booking";

export type MenuItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  size: string;
  dietary: string[];
  occasion: string[];
  lead_time: string;
  image_url: string;
  featured: boolean;
  is_active: boolean;
  order_url?: string | null;
};

export type EventItem = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image_url: string;
  join_url?: string | null;
};

export type QuoteRequest = {
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  eventType: EventType;
  guests: string;
  services: ServiceOption[];
  message: string;
};

export type Testimonial = {
  id: string;
  name: string;
  occasion: string;
  quote: string;
};

export type GalleryItem = {
  id: string;
  title: string;
  eyebrow: string;
  image_url: string;
  alt_text?: string;
  display_order?: number;
};

export type TenantRole = "owner" | "admin" | "staff";

export type TenantInvitationStatus =
  | "pending"
  | "accepted"
  | "expired"
  | "revoked";

export type TenantInvitation = {
  id: string;
  tenant_id: string;
  email: string;
  role: TenantRole;
  token: string;
  invited_by: string;
  status: TenantInvitationStatus;
  expires_at: string;
  created_at: string;
  accepted_at?: string | null;
};

export type TenantMembership = {
  tenant_id: string;
  user_id: string;
  role: TenantRole;
  created_at: string;
  tenant?: {
    id: string;
    slug: string;
    name: string;
    status: "active" | "suspended" | "archived";
    created_at: string;
    updated_at: string;
  } | null;
  profile?: Pick<Profile, "id" | "full_name" | "email"> | null;
};

// ── CRM ──────────────────────────────────────────────────────

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "staff";
  created_at: string;
  updated_at: string;
};

export type ContactStatus = "new" | "contacted" | "booked" | "closed";
export type ContactSource = "quote" | "contact_form";

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  source: ContactSource;
  status: ContactStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type InteractionType =
  | "quote_submitted"
  | "note"
  | "follow_up"
  | "status_change"
  | "contact_form";

export type Interaction = {
  id: string;
  contact_id: string;
  type: InteractionType;
  body?: string | null;
  created_by?: string | null;
  created_at: string;
  profile?: Pick<Profile, "id" | "full_name"> | null;
};

export type QuoteStatus = "new" | "in_progress" | "booked" | "closed" | "lost";

export type Quote = {
  id: string;
  contact_id?: string | null;
  name: string;
  email: string;
  phone: string;
  event_date: string;
  event_type: string;
  guests: string;
  services: string[];
  message: string;
  status: QuoteStatus;
  created_at: string;
  updated_at: string;
};
