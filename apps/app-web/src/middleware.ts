import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { DEV_PASS_COOKIE, isDevAuthEnabled } from "@/lib/auth/dev-auth";

const PUBLIC_PREFIXES = ["/auth", "/api/dev", "/favicon.ico"];

function isPublic(pathname: string): boolean {
  if (pathname.startsWith("/_next") || pathname.startsWith("/public") || pathname.startsWith("/brand")) {
    return true;
  }
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function hasDevPass(req: NextRequest): boolean {
  return isDevAuthEnabled() && req.cookies.get(DEV_PASS_COOKIE)?.value === "1";
}

function hasSessionCookie(req: NextRequest): boolean {
  return req.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.value.length > 0);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  if (!hasDevPass(req) && !hasSessionCookie(req)) {
    const login = req.nextUrl.clone();
    login.pathname = "/auth/v1/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
