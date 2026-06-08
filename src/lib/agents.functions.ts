import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const WEBHOOK_URL = "https://impulsionando.app.n8n.cloud/webhook-test/comite-agentes";

export const runCommittee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { demandId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { demandId } = data;

    const { data: demand, error: dErr } = await supabase
      .from("agent_demands")
      .select("*")
      .eq("id", demandId)
      .single();
    if (dErr || !demand) throw new Error("Demanda não encontrada");

    // status -> em_analise
    await supabase.from("agent_demands").update({ status: "em_analise" }).eq("id", demandId);

    const payload = {
      demanda_id: demand.id,
      cliente_id: demand.cliente,
      projeto_id: demand.projeto,
      tipo_entrega: demand.tipo_entrega,
      agentes: demand.agentes_selecionados ?? [],
      usuario_solicitante: userId,
      titulo: demand.title,
      objetivo: demand.objetivo,
      contexto: demand.contexto,
    };

    await supabase.from("agent_logs").insert({
      demand_id: demandId,
      event: "webhook.sent",
      details: { url: WEBHOOK_URL, payload },
      user_id: userId,
    });

    let responseJson: unknown = null;
    let responseText = "";
    let httpStatus = 0;
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      httpStatus = res.status;
      responseText = await res.text();
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = { raw: responseText };
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${responseText.slice(0, 300)}`);

      const ok =
        responseJson &&
        typeof responseJson === "object" &&
        (responseJson as Record<string, unknown>).status === "ok";

      await supabase.from("agent_outputs").insert({
        demand_id: demandId,
        agent_id: "n8n-comite",
        output_type: "webhook_response",
        content: responseJson as Record<string, unknown>,
        is_final: !!ok,
      });

      await supabase.from("agent_demands").update({
        status: ok ? "concluida" : "em_analise",
      }).eq("id", demandId);

      await supabase.from("agent_logs").insert({
        demand_id: demandId,
        event: ok ? "webhook.ok" : "webhook.received",
        details: { httpStatus, response: responseJson },
        user_id: userId,
      });

      return { ok: true, httpStatus, response: responseJson, finalStatus: ok ? "concluida" : "em_analise" };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await supabase.from("agent_demands").update({ status: "erro" }).eq("id", demandId);
      await supabase.from("agent_logs").insert({
        demand_id: demandId,
        event: "webhook.error",
        details: { httpStatus, message, response: responseText },
        user_id: userId,
      });
      return { ok: false, httpStatus, error: message, finalStatus: "erro" as const };
    }
  });
