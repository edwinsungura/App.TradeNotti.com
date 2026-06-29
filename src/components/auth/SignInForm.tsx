"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/20";

/**
 * Single-step email + password sign-in (one click) built on Clerk's useSignIn,
 * replacing Clerk's default two-step prebuilt flow. Branded to match the app.
 */
export default function SignInForm() {
  const clerk = useClerk();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await clerk.client.signIn.create({
        identifier: email.trim(),
        password,
      });
      if (res.status === "complete") {
        await clerk.setActive({ session: res.createdSessionId });
        router.push("/today");
        return;
      }
      // Anything else (e.g. 2FA) isn't expected for basic email+password.
      setError("Additional verification is required to finish signing in.");
      setLoading(false);
    } catch (err: unknown) {
      const e2 = err as { errors?: { longMessage?: string; message?: string }[] };
      setError(
        e2?.errors?.[0]?.longMessage ??
          e2?.errors?.[0]?.message ??
          "Invalid email or password.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="w-[22rem] max-w-full rounded-2xl border border-accent/10 bg-surface px-7 py-7 shadow-2xl shadow-accent/10 ring-1 ring-accent/10">
      <h1 className="text-center text-xl font-bold tracking-tight text-ink">
        Sign in to TradeNotti
      </h1>
      <p className="mb-6 mt-1 text-center text-[13px] text-muted">
        Welcome back. Enter your details to continue.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-medium text-ink-soft">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-medium text-ink-soft">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
          />
        </label>

        {error && <p className="text-[12.5px] text-loss">{error}</p>}

        {/* Clerk bot-protection mount point (Smart CAPTCHA, if enabled) */}
        <div id="clerk-captcha" />

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex items-center justify-center rounded-lg bg-gradient-to-r from-accent to-[#7b6bf9] px-4 py-2.5 text-[14px] font-semibold text-white shadow-lg shadow-accent/25 transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-center text-[13px] text-faint">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-accent">
          Sign up
        </Link>
      </p>
    </div>
  );
}
