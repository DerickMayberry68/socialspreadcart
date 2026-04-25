"use client";

import { PageContentForm, FieldEditor, type EditableValue } from "./page-content-form";
import type { MarketingPageContentByKey } from "@/lib/types/site-content";

const labelClass = "text-xs uppercase tracking-[0.13em] text-ink/45 mb-4 px-1";
const fieldsetClass = "grid gap-4 rounded-[22px] border border-sage/10 bg-[#fcf8f1] p-4";

export function ShellContentForm({
  initial,
}: {
  initial: MarketingPageContentByKey["shell"];
}) {
  return (
    <PageContentForm
      pageKey="shell"
      title="Shared site shell"
      description="These fields appear on every public marketing page."
      initial={initial}
    >
      {({ form, update, addItem, removeItem }) => {
        const value = form as Record<string, EditableValue>;

        // Helper to render a field easily
        const Field = ({ name }: { name: keyof MarketingPageContentByKey["shell"] }) => (
          <FieldEditor
            name={name}
            value={value[name]}
            path={[name]}
            pageKey="shell"
            onChange={update}
            onAddItem={addItem}
            onRemoveItem={removeItem}
          />
        );

        return (
          <div className="grid gap-6">
            <fieldset className={fieldsetClass}>
              <legend className={labelClass}>Header Settings</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field name="header_top_left" />
                <Field name="header_top_right" />
              </div>
            </fieldset>

            <fieldset className={fieldsetClass}>
              <legend className={labelClass}>Navigation Menu</legend>
              <Field name="navigation" />
            </fieldset>

            <fieldset className={fieldsetClass}>
              <legend className={labelClass}>Booking Call-to-Action</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field name="booking_cta_label" />
                <Field name="booking_cta_target" />
              </div>
            </fieldset>

            <fieldset className={fieldsetClass}>
              <legend className={labelClass}>Footer Section</legend>
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field name="footer_cta_eyebrow" />
                  <Field name="footer_cta_title" />
                </div>
                <Field name="footer_description" />
              </div>
            </fieldset>

            <fieldset className={fieldsetClass}>
              <legend className={labelClass}>Contact Details</legend>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field name="location" />
                <Field name="phone" />
                <Field name="email" />
              </div>
            </fieldset>

            <fieldset className={fieldsetClass}>
              <legend className={labelClass}>Social Media</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field name="instagram_label" />
                <Field name="instagram_url" />
              </div>
            </fieldset>
          </div>
        );
      }}
    </PageContentForm>
  );
}
