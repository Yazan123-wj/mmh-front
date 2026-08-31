"use client";

import { ClicksLogo } from "@/components/admin/clicks-logo";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="clicks-shell flex min-h-screen items-center justify-center p-6">
      <form
        className="w-full max-w-[400px] rounded-xl border border-[#E7EAF1] bg-white p-8 shadow-[0_8px_30px_rgba(11,21,56,0.06)]"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError("");
          const data = new FormData(event.currentTarget);
          const result = await signIn("credentials", {
            email: String(data.get("email") ?? ""),
            password: String(data.get("password") ?? ""),
            redirect: false,
          });
          setPending(false);
          if (!result?.ok) {
            setError("Invalid email or password.");
            return;
          }
          router.push(params.get("from") || "/admin");
          router.refresh();
        }}
      >
        <ClicksLogo variant="light" />
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#616674]">MMH Commerce</p>
        <h1 className="mt-1 text-xl font-semibold">Admin sign in</h1>
        <label className="mt-6 block text-sm font-medium">
          Email
          <input name="email" type="email" required autoComplete="username" className="mt-1.5 h-10 w-full rounded-lg border border-[#E7EAF1] px-3 text-sm" />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <span className="relative mt-1.5 block">
            <input
              name="password"
              type={passwordVisible ? "text" : "password"}
              required
              autoComplete="current-password"
              className="h-10 w-full rounded-lg border border-[#E7EAF1] px-3 pe-16 text-sm"
            />
            <button type="button" className="absolute end-2 top-1/2 -translate-y-1/2 text-xs text-[#0040FD]" onClick={() => setPasswordVisible((value) => !value)}>
              {passwordVisible ? "Hide" : "Show"}
            </button>
          </span>
        </label>
        {error ? <p className="mt-3 text-sm text-[#DC2626]">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-6 h-10 w-full rounded-lg bg-[#0040FD] text-sm font-semibold text-white hover:bg-[#004DFF] disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
