import { createFileRoute } from "@tanstack/react-router";
import { createHash, randomUUID } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BUCKET = "riomed-medicito-images";
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function validSession(request: Request) {
  const value = request.headers.get("x-riomed-session")?.trim() ?? "";
  return /^riomed:[A-Za-z0-9:_-]{8,200}$/.test(value) ? value : null;
}

function sessionHash(session: string) {
  return createHash("sha256").update(session).digest("hex");
}

async function tenantContext() {
  const { data, error } = await supabaseAdmin
    .from("communication_tenants")
    .select("id,company_id")
    .eq("slug", "rio-med")
    .eq("active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data?.id || !data.company_id) throw new Error("riomed_not_configured");
  return data;
}

export const Route = createFileRoute("/api/riomed/medicito/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = validSession(request);
        if (!session) return Response.json({ error: "invalid_session" }, { status: 400 });

        let form: FormData;
        try { form = await request.formData(); }
        catch { return Response.json({ error: "invalid_multipart" }, { status: 400 }); }

        const file = form.get("image");
        if (!(file instanceof File)) return Response.json({ error: "image_required" }, { status: 400 });
        if (!ALLOWED.has(file.type)) return Response.json({ error: "unsupported_image_type" }, { status: 415 });
        if (file.size <= 0 || file.size > MAX_BYTES) return Response.json({ error: "image_size_invalid", maxBytes: MAX_BYTES }, { status: 413 });

        let tenant;
        try { tenant = await tenantContext(); }
        catch (error) {
          console.error("[riomed/medicito/upload] tenant unavailable", error);
          return Response.json({ error: "runtime_unavailable" }, { status: 503 });
        }

        const hash = sessionHash(session);
        const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count, error: countError } = await supabaseAdmin
          .from("riomed_medicito_uploads")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenant.id)
          .eq("session_hash", hash)
          .gte("created_at", since);
        if (countError) return Response.json({ error: "upload_guard_unavailable" }, { status: 503 });
        if ((count ?? 0) >= 20) return Response.json({ error: "upload_rate_limited" }, { status: 429 });

        const extension = ALLOWED.get(file.type)!;
        const objectPath = `${tenant.id}/${hash.slice(0, 24)}/${randomUUID()}.${extension}`;
        const bytes = new Uint8Array(await file.arrayBuffer());
        const { error: uploadError } = await supabaseAdmin.storage
          .from(BUCKET)
          .upload(objectPath, bytes, { contentType: file.type, cacheControl: "0", upsert: false });
        if (uploadError) {
          console.error("[riomed/medicito/upload] storage failed", uploadError);
          return Response.json({ error: "image_upload_failed" }, { status: 503 });
        }

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const { data: ledger, error: ledgerError } = await supabaseAdmin
          .from("riomed_medicito_uploads")
          .insert({
            tenant_id: tenant.id,
            company_id: tenant.company_id,
            session_hash: hash,
            object_path: objectPath,
            media_type: file.type,
            size_bytes: file.size,
            status: "uploaded",
            expires_at: expiresAt,
          })
          .select("id,media_type,size_bytes,expires_at")
          .single();

        if (ledgerError || !ledger) {
          await supabaseAdmin.storage.from(BUCKET).remove([objectPath]);
          console.error("[riomed/medicito/upload] ledger failed", ledgerError);
          return Response.json({ error: "upload_ledger_failed" }, { status: 503 });
        }

        return Response.json({
          ok: true,
          uploadId: ledger.id,
          mediaType: ledger.media_type,
          sizeBytes: ledger.size_bytes,
          expiresAt: ledger.expires_at,
        }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
