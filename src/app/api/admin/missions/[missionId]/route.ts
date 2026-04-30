import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

function backendBaseUrl() {
  const base =
    process.env.AUTH_API_BASE_URL ??
    process.env.NEXT_PUBLIC_AUTH_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "";
  return base.replace(/\/+$/, "");
}

async function getAccessToken(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me",
  });
  const accessToken = (token as unknown as { accessToken?: string })?.accessToken;
  return accessToken ?? null;
}

async function proxy(req: NextRequest, missionId: string) {
  const base = backendBaseUrl();
  if (!base) {
    return Response.json(
      { error: { code: "CONFIG_ERROR", message: "Missing backend API base URL" } },
      { status: 500 },
    );
  }

  const accessToken = await getAccessToken(req);
  if (!accessToken) {
    return Response.json({ error: { code: "UNAUTHORIZED", message: "Missing access token" } }, { status: 401 });
  }

  const target = `${base}/api/admin/missions/${encodeURIComponent(missionId)}`;
  const init: RequestInit = {
    method: req.method,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    cache: "no-store",
  };

  if (req.method === "PATCH") {
    init.body = await req.text();
  }

  const upstream = await fetch(target, init);
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ missionId: string }> }) {
  const { missionId } = await ctx.params;
  return proxy(req, missionId);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ missionId: string }> }) {
  const { missionId } = await ctx.params;
  return proxy(req, missionId);
}

