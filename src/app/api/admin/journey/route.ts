import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // This route used to proxy the legacy city JSON config endpoint.
  // Keep it as a compatibility shim: redirect callers to the new endpoint.
  const city = req.nextUrl.searchParams.get("city") ?? "";
  const target = city ? `/api/admin/journeys?location=${encodeURIComponent(city)}` : "/api/admin/journeys";
  return Response.redirect(new URL(target, req.nextUrl), 307);
}

export async function PUT(req: NextRequest) {
  return Response.json(
    { error: { code: "NOT_FOUND", message: "This endpoint is deprecated. Use POST /api/admin/journeys." } },
    { status: 404 },
  );
}

// NOTE:
// The old JourneyConfig JSON authoring flow is removed in the backend.
// Frontend should use /api/admin/locations and /api/admin/journeys.

