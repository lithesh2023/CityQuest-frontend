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

async function proxy(req: NextRequest) {
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

  const location = req.nextUrl.searchParams.get("location");
  if (!location) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "Missing location query param" } }, { status: 400 });
  }

  const target = `${base}/api/admin/journeys?location=${encodeURIComponent(location)}`;
  const init: RequestInit = {
    method: req.method,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    cache: "no-store",
  };

  if (req.method === "POST") {
    init.body = await req.text();
  }

  const upstream = await fetch(target, init);
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

export async function GET(req: NextRequest) {
  return proxy(req);
}

export async function POST(req: NextRequest) {
  return proxy(req);
}

