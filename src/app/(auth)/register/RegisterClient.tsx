"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { registerWithEmailPassword } from "@/lib/api/auth";

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = useMemo(() => searchParams.get("from") || "/home", [searchParams]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGoogle() {
    setError(null);
    const base = (process.env.NEXT_PUBLIC_AUTH_API_BASE_URL ?? "").replace(/\/+$/, "");
    if (!base) {
      setError("Missing NEXT_PUBLIC_AUTH_API_BASE_URL for Google sign-in.");
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback?from=${encodeURIComponent(from)}`;
    window.location.href = `${base}/v1/auth/google/start?redirect_uri=${encodeURIComponent(redirectUri)}`;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await registerWithEmailPassword({ name: name.trim(), email: email.trim(), password });

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: from,
      });

      if (!res || res.error) {
        router.replace(`/login?from=${encodeURIComponent(from)}`);
        return;
      }

      router.replace(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100svh] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-border bg-card/80 backdrop-blur-xl shadow-glow p-6">
          <div className="inline-flex items-center gap-2 text-sm text-muted">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
              <Sparkles className="h-4 w-4 text-warning" />
            </span>
            CityQuest
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted">Sign up with Google or email.</p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={onGoogle}
              className={cx(
                "w-full rounded-2xl px-4 py-3 text-sm font-semibold transition",
                "bg-white text-black hover:bg-white/90 ring-1 ring-black/10",
                "shadow-[0_10px_30px_rgba(0,0,0,0.12)]",
              )}
            >
              <span className="relative flex items-center justify-center">
                <span className="absolute left-0 inline-flex h-6 w-6 items-center justify-center rounded-md bg-white">
                  <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
                    <path
                      fill="#FFC107"
                      d="M43.611 20.083H42V20H24v8h11.303C33.65 32.657 29.22 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                    />
                    <path
                      fill="#FF3D00"
                      d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.268 4 24 4c-7.682 0-14.354 4.327-17.694 10.691z"
                    />
                    <path
                      fill="#4CAF50"
                      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.191-5.238C29.205 35.091 26.715 36 24 36c-5.199 0-9.614-3.317-11.277-7.946l-6.52 5.025C9.505 39.556 16.227 44 24 44z"
                    />
                    <path
                      fill="#1976D2"
                      d="M43.611 20.083H42V20H24v8h11.303a11.98 11.98 0 0 1-4.087 5.571l.003-.002 6.191 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                    />
                  </svg>
                </span>
                Continue with Google
              </span>
            </button>

            <div className="relative py-2">
              <div className="h-px bg-white/10" />
              <div className="absolute inset-0 grid place-items-center">
                <span className="px-2 text-[11px] text-muted bg-card/80">or</span>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-2 space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-muted">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                autoComplete="name"
                placeholder="Your name"
                className="mt-1 w-full rounded-2xl bg-white/5 ring-1 ring-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/60"
                required
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-muted">Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@cityquest.app"
                className="mt-1 w-full rounded-2xl bg-white/5 ring-1 ring-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/60"
                required
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-muted">Password</span>
              <div className="mt-1 relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full rounded-2xl bg-white/5 ring-1 ring-white/10 pl-4 pr-12 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/60"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl p-2 text-muted hover:text-foreground hover:bg-white/5 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-muted">Confirm password</span>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                className="mt-1 w-full rounded-2xl bg-white/5 ring-1 ring-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent/60"
                required
              />
            </label>

            {error ? (
              <div className="rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className={cx(
                "w-full rounded-2xl py-3 text-sm font-semibold transition",
                "bg-gradient-to-r from-accent to-[#4f46e5] shadow-glowSoft",
                "hover:brightness-110 active:brightness-95 disabled:opacity-60",
              )}
            >
              {isSubmitting ? "Creating account…" : "Create Account"}
            </button>

            <p className="text-xs text-muted leading-relaxed">
              Already have an account?{" "}
              <Link href={`/login?from=${encodeURIComponent(from)}`} className="text-foreground underline underline-offset-4">
                Log in
              </Link>
              .
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

