import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { readJourneyConfig, writeJourneyConfig } from "@/lib/journeyConfigStore";
import type { JourneyConfig } from "@/lib/journeyConfigTypes";

function adminEmails() {
  const fromEnv = process.env.ADMIN_EMAILS ?? "";
  const emails = fromEnv
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (emails.length) return emails;
  return ["test@cityquest.app"];
}

async function requireAdmin(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me",
  });
  const email = String(token?.email ?? "").toLowerCase();
  if (!token || !email || !adminEmails().includes(email)) {
    return null;
  }
  return token;
}

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ok = await requireAdmin(req);
  if (!ok) return Response.json({ error: "unauthorized" }, { status: 401 });
  const config = await readJourneyConfig();
  return Response.json(config);
}

export async function PUT(req: NextRequest) {
  const ok = await requireAdmin(req);
  if (!ok) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body: JourneyConfig | null = null;
  try {
    body = (await req.json()) as JourneyConfig;
  } catch {
    body = null;
  }
  if (!body || body.version !== 1) {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const saved = await writeJourneyConfig(body);
  return Response.json(saved);
}

