import { createFileRoute } from "@tanstack/react-router";
import {
  decideSpecialtyRequest,
  getSpecialtyDecision,
} from "@/lib/chrismed-specialty-request.server";

function page(content: string, status = 200) {
  return new Response(
    `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>CHRISMED — Avaliar especialidade</title><body style="font-family:Arial,sans-serif;background:#eff8f8;color:#173236;padding:32px"><main style="max-width:620px;margin:auto;background:white;padding:32px;border-radius:16px;box-shadow:0 8px 30px #075c5920"><h1 style="color:#078f8b">CHRISMED</h1>${content}</main></body></html>`,
    {
      status,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    },
  );
}

export const Route = createFileRoute("/api/chrismed/specialty-decision")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token") ?? "";
        const decision = url.searchParams.get("decision") === "approve" ? "approve" : "reject";
        const item = token ? await getSpecialtyDecision(token) : null;
        if (
          !item ||
          item.status !== "pending" ||
          new Date(item.decision_token_expires_at).getTime() < Date.now()
        )
          return page("<h2>Link inválido, expirado ou já utilizado.</h2>", 410);
        const label = decision === "approve" ? "APROVAR" : "NÃO APROVAR";
        const color = decision === "approve" ? "#078f8b" : "#a33";
        return page(
          `<h2>Confirmar decisão</h2><p>Especialidade solicitada: <strong>${item.requested_name.replace(/[<>]/g, "")}</strong></p><p>Você escolheu <strong>${label}</strong>. Confirme abaixo para registrar a decisão e avisar o profissional.</p><form method="post"><input type="hidden" name="token" value="${token}"><input type="hidden" name="decision" value="${decision}"><button style="border:0;background:${color};color:white;padding:13px 20px;border-radius:7px;font-weight:bold;cursor:pointer">CONFIRMAR ${label}</button></form>`,
        );
      },
      POST: async ({ request }) => {
        const form = await request.formData();
        const token = String(form.get("token") ?? "");
        const decision = form.get("decision") === "approve" ? "approve" : "reject";
        try {
          const result = await decideSpecialtyRequest(token, decision);
          return page(
            `<h2>Decisão registrada</h2><p><strong>${result.requestedName.replace(/[<>]/g, "")}</strong> foi ${result.approved ? "aprovada e publicada no catálogo" : "não aprovada"}. O profissional já foi avisado automaticamente.</p>`,
          );
        } catch {
          return page(
            "<h2>Não foi possível registrar.</h2><p>O link pode ter expirado ou já ter sido utilizado.</p>",
            409,
          );
        }
      },
    },
  },
});
