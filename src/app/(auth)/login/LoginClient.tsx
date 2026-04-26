"use client";

import { useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Sparkles } from "lucide-react";

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const from = useMemo(() => searchParams.get("from") || "/home", [searchParams]);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "authenticated") {
    router.replace(from);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: from,
    });

    setIsSubmitting(false);

    if (!res || res.error) {
      setError('Invalid credentials. Use test@cityquest.app / CityQuest@123');
      return;
    }

    router.replace(from);
  }

  return (
    <div className="min-h-[100svh] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl border border-border bg-card/80 backdrop-blur-xl shadow-glow p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-sm text-muted">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
                  <Sparkles className="h-4 w-4 text-warning" />
                </span>
                CityQuest
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {mode === "login"
                  ? "Continue your 52-week journey."
                  : "Start exploring and earn badges."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/15 ring-1 ring-white/10 transition"
            >
              {mode === "login" ? "Sign Up" : "Log In"}
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
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
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
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
              {isSubmitting
                ? "Signing in…"
                : mode === "login"
                  ? "Log In"
                  : "Create Account"}
            </button>

            <p className="text-xs text-muted leading-relaxed">
              Session is stored in secure cookies via NextAuth, so it stays logged in
              even after closing the PWA.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

