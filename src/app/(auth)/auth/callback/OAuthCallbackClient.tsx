"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OAuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = useMemo(() => searchParams.get("code") ?? "", [searchParams]);
  const from = useMemo(() => searchParams.get("from") || "/home", [searchParams]);
  const errorParam = useMemo(() => searchParams.get("error"), [searchParams]);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (errorParam) {
        setError(errorParam);
        return;
      }

      if (!code) {
        setError("Missing OAuth code.");
        return;
      }

      const redirectUri = `${window.location.origin}/auth/callback?from=${encodeURIComponent(from)}`;
      const res = await signIn("credentials", {
        oauthCode: code,
        redirectUri,
        redirect: false,
        callbackUrl: from,
      });

      if (cancelled) return;

      if (!res || res.error) {
        setError("Google sign-in failed.");
        return;
      }

      router.replace(from);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [code, errorParam, from, router]);

  return (
    <div className="min-h-[100svh] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card/80 backdrop-blur-xl shadow-glow p-6">
        <h1 className="text-lg font-semibold">Signing you in…</h1>
        <p className="mt-2 text-sm text-muted">Completing Google sign-in.</p>
        {error ? (
          <div className="mt-4 rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}

