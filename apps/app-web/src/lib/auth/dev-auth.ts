/** Local-only dashboard entry. Never active in production. */
export const DEV_PASS_COOKIE = "sb-dev-pass";

export function isDevAuthEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.APP_WEB_DEV_AUTH === "0") return false;
  return true;
}
