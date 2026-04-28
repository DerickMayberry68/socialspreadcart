"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") ?? "/admin";
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Authentication is not configured.");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/auth/post-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnUrl }),
    });
    const payload = (await response.json()) as {
      ok: boolean;
      redirectTo?: string;
      message?: string;
    };

    if (!response.ok || !payload.ok || !payload.redirectTo) {
      setError(payload.message ?? "We couldn't resolve your tenant membership.");
      setLoading(false);
      return;
    }

    router.push(payload.redirectTo);
    router.refresh();
  };

  return (
    <div className="rounded-[28px] border border-sage/15 bg-white px-8 py-10 shadow-soft">
      <h1 className="font-heading text-3xl text-sage">Admin Sign In</h1>
      <p className="mt-1 text-sm text-ink/55">
        The Social Spread Cart · Staff Portal
      </p>

      {error && (
        <div className="mt-5 rounded-[16px] bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-xs uppercase tracking-[0.15em] text-ink/60"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[14px] border border-sage/20 bg-cream px-4 py-2.5 text-sm text-ink outline-none focus:border-sage focus:ring-1 focus:ring-sage"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-xs uppercase tracking-[0.15em] text-ink/60"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-[14px] border border-sage/20 bg-cream px-4 py-2.5 text-sm text-ink outline-none focus:border-sage focus:ring-1 focus:ring-sage"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-full bg-sage px-6 py-3 text-sm font-medium uppercase tracking-[0.18em] text-cream shadow-frame transition hover:bg-sage-700 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-8 w-32 overflow-hidden rounded-full border border-sage/10 bg-white p-2 shadow-soft">
          <Image
            src="/icon.png"
            alt="The Social Spread Cart"
            width={128}
            height={128}
            priority
            className="h-full w-full rounded-full object-cover"
          />
        </div>

        <React.Suspense fallback={null}>
          <LoginForm />
        </React.Suspense>

        <p className="mt-6 text-center text-xs uppercase tracking-[0.15em] text-ink/35">
          © {new Date().getFullYear()} The Social Spread Cart
        </p>
      </div>
    </div>
  );
}
