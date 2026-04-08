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
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  eventType: string;
  guests: string;
  services: string[];
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
};

