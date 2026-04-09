"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={logout}
      className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.15em] text-ink/55 transition hover:bg-sage/10 hover:text-sage"
    >
      <LogOut className="h-3.5 w-3.5" />
      Sign Out
    </button>
  );
}
