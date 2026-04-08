import { HomePage } from "@/components/sections/home-page";
import {
  getEvents,
  getGalleryItems,
  getMenuItems,
  getTestimonials,
} from "@/lib/data";

export default async function IndexPage() {
  const [menuItems, events, testimonials, gallery] = await Promise.all([
    getMenuItems(),
    getEvents(),
    getTestimonials(),
    getGalleryItems(),
  ]);

  return (
    <HomePage
      menuItems={menuItems}
      events={events}
      testimonials={testimonials}
      gallery={gallery}
    />
  );
}

