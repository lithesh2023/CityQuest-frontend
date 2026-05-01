import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_PREFIXES = ["/home", "/journey", "/map", "/community", "/profile", "/admin"];

function adminEmails() {
  const fromEnv = process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";
  const emails = fromEnv
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (emails.length) return emails;
  return ["test@cityquest.app"];
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me",
  });

  const accessToken = (token as unknown as { accessToken?: string | null }).accessToken ?? null;
  if (!token || !accessToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const role = String((token as unknown as { role?: string }).role ?? "");
    const email = String(token.email ?? "").toLowerCase();
    const isAdmin = role === "admin" || (!!email && adminEmails().includes(email));
    if (!isAdmin) {
      return new NextResponse("Unauthorized", {
        status: 403,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Include both the exact path and nested paths. Some Next.js versions do not
    // match `/foo` when only `/foo/:path*` is listed.
    "/home",
    "/home/:path*",
    "/journey",
    "/journey/:path*",
    "/map",
    "/map/:path*",
    "/community",
    "/community/:path*",
    "/profile",
    "/profile/:path*",
    "/admin",
    "/admin/:path*",
  ],
};

