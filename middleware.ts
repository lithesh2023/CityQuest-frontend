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

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const email = String(token.email ?? "").toLowerCase();
    if (!email || !adminEmails().includes(email)) {
      const url = req.nextUrl.clone();
      url.pathname = "/home";
      url.searchParams.set("error", "not_admin");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/journey/:path*",
    "/map/:path*",
    "/community/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};

