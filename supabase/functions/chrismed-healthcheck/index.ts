// Edge function: diagnóstico de saúde da integração CHRISMED.
// Verifica: credencial MP, public key, webhook URL e chave PIX (via probe).
// GET ?company_id=...
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

type Check = { id: string; label: string; status: "ok" | "warn" | "error"; detail: string; action?: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const url = new URL(req.url);
  const companyId = url.searchParams.get("company_id");
  if (!companyId) {
    return new Response(JSON.stringify({ error: "company_id obrigatório" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }

  const checks: Check[] = [];

  // 1. Empresa
  const { data: company } = await sb.from("companies").select("id,name,active").eq("id", companyId).maybeSingle();
  checks.push({
    id: "company",
    label: "Empresa cadastrada",
    status: company ? "ok" : "error",
    detail: company ? `${company.name} (${company.active ? "ativa" : "inativa"})` : "Empresa não encontrada",
  });

  // 2. Credencial MP
  const { data: cred } = await sb
    .from("mpago_credentials")
    .select("public_key,access_token_secret_name,webhook_secret_name,environment")
    .eq("company_id", companyId)
    .maybeSingle();
  checks.push({
    id: "credential",
    label: "Credencial Mercado Pago",
    status: cred ? "ok" : "error",
    detail: cred ? `Ambiente: ${cred.environment} · Secret: ${cred.access_token_secret_name}` : "Credencial ausente",
  });

  // 3. Public Key
  const pkOk = cred?.public_key && !cred.public_key.includes("PENDENTE");
  checks.push({
    id: "public_key",
    label: "Public Key configurada",
    status: pkOk ? "ok" : "warn",
    detail: pkOk ? cred!.public_key : "Placeholder — checkout de cartão indisponível",
    action: pkOk ? undefined : "Informar Public Key (TEST-... ou APP_USR-...) ao admin Lovable",
  });

  // 4. Acesso ao token + probe da chave PIX
  const accessToken = cred ? Deno.env.get(cred.access_token_secret_name) : null;
  if (!accessToken) {
    checks.push({
      id: "token",
      label: "Token de acesso",
      status: "error",
      detail: `Secret ${cred?.access_token_secret_name ?? "?"} não encontrado no ambiente`,
    });
  } else {
    // Probe: tenta criar pagamento PIX inválido propositalmente para inspecionar erro
    const probe = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        transaction_amount: 0.01,
        description: "Healthcheck CHRISMED",
        payment_method_id: "pix",
        payer: { email: "healthcheck@impulsionando.com.br", first_name: "Health", last_name: "Check" },
      }),
    });
    const data = await probe.json().catch(() => ({}));

    if (probe.ok) {
      checks.push({ id: "token", label: "Token de acesso", status: "ok", detail: "Autenticado no MP" });
      checks.push({
        id: "pix_key",
        label: "Chave PIX da conta vendedora",
        status: "ok",
        detail: `Pagamento de teste criado (id ${data.id}) — chave PIX ativa`,
      });
    } else {
      const code = data?.cause?.[0]?.code;
      const msg = data?.message ?? "erro desconhecido";
      checks.push({ id: "token", label: "Token de acesso", status: "ok", detail: "Autenticado no MP" });
      if (code === 13253 || /key enabled for QR/i.test(msg)) {
        checks.push({
          id: "pix_key",
          label: "Chave PIX da conta vendedora",
          status: "error",
          detail: "Conta MP do CHRISMED sem chave PIX cadastrada (cód. 13253)",
          action: "No painel MP do CHRISMED → Seu perfil → Suas chaves Pix → cadastrar CNPJ ou chave aleatória",
        });
      } else {
        checks.push({
          id: "pix_key",
          label: "Chave PIX da conta vendedora",
          status: "warn",
          detail: `MP devolveu ${probe.status}: ${msg}`,
        });
      }
    }
  }

  // 5. Webhook URL esperada
  const webhookUrl = `https://fpywvlhsfdtztkbncmdt.supabase.co/functions/v1/mpago-webhook?company_id=${companyId}`;
  const { data: lastWh } = await sb
    .from("mpago_webhook_events")
    .select("created_at,event_type")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  checks.push({
    id: "webhook",
    label: "Webhook registrado",
    status: lastWh ? "ok" : "warn",
    detail: lastWh
      ? `Último evento: ${lastWh.event_type} em ${new Date(lastWh.created_at).toLocaleString("pt-BR")}`
      : "Nenhum evento recebido ainda",
    action: lastWh ? undefined : `Cadastrar no MP: ${webhookUrl}`,
  });

  // 6. Ofertas ativas
  const { count: offerings } = await sb
    .from("chrismed_service_offerings")
    .select("id", { count: "exact", head: true })
    .eq("active", true);
  checks.push({
    id: "offerings",
    label: "Ofertas ativas",
    status: (offerings ?? 0) > 0 ? "ok" : "warn",
    detail: `${offerings ?? 0} serviço(s) ativos`,
  });

  // 7. Templates de comunicação
  const { count: templates } = await sb
    .from("message_templates")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("is_active", true);
  checks.push({
    id: "templates",
    label: "Templates de mensagem",
    status: (templates ?? 0) > 0 ? "ok" : "warn",
    detail: `${templates ?? 0} template(s) ativos`,
  });

  const summary = {
    ok: checks.filter((c) => c.status === "ok").length,
    warn: checks.filter((c) => c.status === "warn").length,
    error: checks.filter((c) => c.status === "error").length,
  };

  return new Response(JSON.stringify({ company_id: companyId, webhook_url: webhookUrl, summary, checks }, null, 2), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
