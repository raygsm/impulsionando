import { NextResponse } from "next/server";

import { DEV_PASS_COOKIE, isDevAuthEnabled } from "@/lib/auth/dev-auth";

/** Mints a local cookie so middleware lets /dashboard through. Not a real session. */
export async function POST() {
  if (!isDevAuthEnabled()) {
    return NextResponse.json({ error: { message: "Dev auth desligado" } }, { status: 403 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DEV_PASS_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DEV_PASS_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
