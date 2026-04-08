import type { Metadata } from "next";

import { AdminDashboard } from "@/components/sections/admin-dashboard";
import { SectionHeading, SectionShell } from "@/components/shared/section-shell";
import { getEvents, getMenuItems } from "@/lib/data";

export const metadata: Metadata = {
  title: "Admin",
  description:
    "Protected admin area for The Social Spread Cart content management.",
};

export default async function AdminPage() {
  const [menuItems, events] = await Promise.all([getMenuItems(), getEvents()]);

  return (
    <div className="py-16">
      <SectionShell>
        <SectionHeading
          eyebrow="Admin"
          title="A simple management surface for menu items and events."
          description="For larger editing workflows, you can also manage the same data directly inside Supabase."
        />
        <div className="mt-12">
          <AdminDashboard initialMenuItems={menuItems} initialEvents={events} />
        </div>
      </SectionShell>
    </div>
  );
}

