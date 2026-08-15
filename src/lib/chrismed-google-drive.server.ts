import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CHRISMED_COMPANY_ID = "642096b5-a9ff-4521-a82a-c004f6d2e2d2";
const CHRISMED_BASE_URL = process.env.CHRISMED_BASE_URL || "https://chrismed.impulsionando.com.br";
const GOOGLE_DRIVE_CALLBACK_URL = `${CHRISMED_BASE_URL}/api/chrismed/google-drive/callback`;
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const MASTER_ADMIN_EMAIL = "raygs@hotmail.com";
const CHRISMED_DRIVE_ACCOUNT = "chrissalencar@gmail.com";

type OAuthState = { companyId: string; userId: string; exp: number; nonce: string };

function requiredEnv(name: "GOOGLE_DRIVE_CLIENT_ID" | "GOOGLE_DRIVE_CLIENT_SECRET") {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing_${name.toLowerCase()}`);
  return value;
}

function b64url(value: string | Buffer) { return Buffer.from(value).toString("base64url"); }
function sign(payloadB64: string) {
  return createHmac("sha256", requiredEnv("GOOGLE_DRIVE_CLIENT_SECRET")).update(payloadB64).digest("base64url");
}

function createState(userId: string) {
  const payload: OAuthState = { companyId: CHRISMED_COMPANY_ID, userId, exp: Date.now() + 10 * 60 * 1000, nonce: randomBytes(16).toString("hex") };
  const encoded = b64url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

function verifyState(state: string): OAuthState {
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) throw new Error("invalid_oauth_state");
  const expected = sign(encoded);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) throw new Error("invalid_oauth_state");
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as OAuthState;
  if (payload.companyId !== CHRISMED_COMPANY_ID || !payload.userId || payload.exp < Date.now()) throw new Error("expired_or_invalid_oauth_state");
  return payload;
}

export async function authenticateChrismedDriveAdmin(request: Request) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!bearer) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(bearer);
  const user = error ? null : data.user;
  if (!user) return null;
  if (user.email?.toLowerCase() === MASTER_ADMIN_EMAIL) return user;
  const { data: roles } = await (supabaseAdmin as any).from("user_roles").select("role").eq("user_id", user.id).eq("company_id", CHRISMED_COMPANY_ID);
  const allowed = (roles ?? []).some((row: { role?: string }) => ["admin", "gestor"].includes(String(row.role)));
  return allowed ? user : null;
}

export function buildGoogleDriveAuthorizationUrl(userId: string) {
  const params = new URLSearchParams({
    client_id: requiredEnv("GOOGLE_DRIVE_CLIENT_ID"),
    redirect_uri: GOOGLE_DRIVE_CALLBACK_URL,
    response_type: "code",
    scope: GOOGLE_DRIVE_SCOPE,
    access_type: "offline",
    prompt: "consent select_account",
    include_granted_scopes: "true",
    login_hint: CHRISMED_DRIVE_ACCOUNT,
    state: createState(userId),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function revokeGoogleToken(token: string) {
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" } });
  } catch {
    // Revogação é best-effort; a conexão nunca é persistida quando a conta está errada.
  }
}

export async function completeGoogleDriveOAuth(input: { code: string; state: string }) {
  const state = verifyState(input.state);
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code: input.code, client_id: requiredEnv("GOOGLE_DRIVE_CLIENT_ID"), client_secret: requiredEnv("GOOGLE_DRIVE_CLIENT_SECRET"), redirect_uri: GOOGLE_DRIVE_CALLBACK_URL, grant_type: "authorization_code" }),
  });
  const tokenJson = (await tokenResponse.json().catch(() => ({}))) as { access_token?: string; refresh_token?: string; scope?: string; error?: string; error_description?: string };
  if (!tokenResponse.ok || !tokenJson.access_token) throw new Error(tokenJson.error_description || tokenJson.error || "google_token_exchange_failed");
  if (!tokenJson.refresh_token) throw new Error("google_refresh_token_missing");

  const aboutResponse = await fetch("https://www.googleapis.com/drive/v3/about?fields=user(emailAddress,displayName)", { headers: { authorization: `Bearer ${tokenJson.access_token}` } });
  const aboutJson = (await aboutResponse.json().catch(() => ({}))) as { user?: { emailAddress?: string; displayName?: string } };
  const accountEmail = aboutJson.user?.emailAddress?.trim().toLowerCase();
  if (!aboutResponse.ok || !accountEmail) throw new Error("google_drive_account_identity_failed");
  if (accountEmail !== CHRISMED_DRIVE_ACCOUNT) {
    await revokeGoogleToken(tokenJson.refresh_token);
    throw new Error("wrong_google_drive_account");
  }

  const { data: connectionId, error } = await (supabaseAdmin as any).rpc("client_drive_store_google_refresh_token", {
    p_company_id: CHRISMED_COMPANY_ID,
    p_account_email: accountEmail,
    p_refresh_token: tokenJson.refresh_token,
    p_scopes: (tokenJson.scope || GOOGLE_DRIVE_SCOPE).split(/\s+/).filter(Boolean),
    p_root_folder_id: null,
  });
  if (error) throw error;

  return { connectionId: String(connectionId), accountEmail, displayName: aboutJson.user?.displayName ?? null, initiatedBy: state.userId };
}

export const CHRISMED_GOOGLE_DRIVE_CALLBACK_URL = GOOGLE_DRIVE_CALLBACK_URL;
export const CHRISMED_GOOGLE_DRIVE_ACCOUNT = CHRISMED_DRIVE_ACCOUNT;
