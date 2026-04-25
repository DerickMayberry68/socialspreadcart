import { createClient } from "@supabase/supabase-js";

/** Shown when admin storage uploads run without a service-role client. */
export const SUPABASE_SERVICE_ROLE_MISSING_MESSAGE =
  "Image uploads need SUPABASE_SERVICE_ROLE_KEY in your environment (e.g. .env.local). Copy the service_role secret from Supabase → Project Settings → API, then restart the dev server.";

export function getSupabaseServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey);
}
