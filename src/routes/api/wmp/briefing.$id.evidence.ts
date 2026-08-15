import { createHash, randomUUID } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { analyzeWmpBriefingImage } from "@/lib/wmp/evidence-analysis.server";

const BUCKET = "wmp-briefing-evidence";
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function hashToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function safeOriginalName(name: string) {
  return name.replace(/[\u0000-\u001f\u007f]/g, "").replace(/[<>:"/\\|?*]/g, "_").slice(0, 160) || "arquivo";
}

export const Route = createFileRoute("/api/wmp/briefing/$id/evidence")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const briefingId = String(params.id ?? "").trim();
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(briefingId)) {
          return json({ ok: false, error: "invalid_briefing" }, 400);
        }

        const token = request.headers.get("x-wmp-upload-token")?.trim() ?? "";
        if (token.length < 32 || token.length > 200) return json({ ok: false, error: "invalid_upload_grant" }, 401);

        const contentLength = Number(request.headers.get("content-length") ?? "0");
        if (Number.isFinite(contentLength) && contentLength > MAX_FILE_BYTES + 1024 * 1024) {
          return json({ ok: false, error: "file_too_large" }, 413);
        }

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return json({ ok: false, error: "invalid_multipart" }, 400);
        }

        const value = form.get("file");
        if (!(value instanceof File)) return json({ ok: false, error: "file_required" }, 400);
        if (value.size <= 0 || value.size > MAX_FILE_BYTES) return json({ ok: false, error: "file_too_large" }, 413);

        const extension = ALLOWED[value.type];
        if (!extension) return json({ ok: false, error: "unsupported_file_type" }, 415);

        const { data: grantRows, error: grantError } = await supabaseAdmin.rpc("wmp_consume_briefing_upload_grant", {
          p_briefing_id: briefingId,
          p_token_hash: hashToken(token),
        });
        if (grantError) return json({ ok: false, error: "upload_grant_failed" }, 500);
        const grant = Array.isArray(grantRows) ? grantRows[0] : null;
        if (!grant?.token_id || !grant?.slot) return json({ ok: false, error: "upload_grant_expired_or_exhausted" }, 410);

        const storagePath = `${briefingId}/${String(grant.slot).padStart(2, "0")}-${randomUUID()}.${extension}`;
        const bytes = new Uint8Array(await value.arrayBuffer());
        const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(storagePath, bytes, {
          contentType: value.type,
          cacheControl: "3600",
          upsert: false,
        });
        if (uploadError) return json({ ok: false, error: "storage_upload_failed" }, 502);

        const isImage = value.type.startsWith("image/");
        const evidence = {
          storage_bucket: BUCKET,
          storage_path: storagePath,
          original_name: safeOriginalName(value.name),
          mime_type: value.type,
          size_bytes: value.size,
          category: isImage ? "image" : value.type.startsWith("video/") ? "video" : "document",
          uploaded_at: new Date().toISOString(),
          analysis_status: isImage ? "pending" : "not_applicable",
        };

        const { error: appendError } = await supabaseAdmin.rpc("wmp_append_briefing_evidence", {
          p_briefing_id: briefingId,
          p_evidence: evidence,
        });
        if (appendError) {
          await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
          return json({ ok: false, error: "evidence_link_failed" }, 500);
        }

        let analysis = null;
        let analysisStatus: "not_applicable" | "completed" | "pending" = isImage ? "pending" : "not_applicable";
        if (isImage) {
          try {
            analysis = await analyzeWmpBriefingImage({ briefingId, storagePath, mimeType: value.type });
            analysisStatus = analysis ? "completed" : "pending";
          } catch {
            // O arquivo permanece privado e vinculado ao briefing. A análise pode ser reprocessada depois.
            analysisStatus = "pending";
          }
        }

        return json({
          ok: true,
          evidence: { ...evidence, storage_bucket: undefined, analysis_status: analysisStatus },
          analysis,
        });
      },
    },
  },
});
