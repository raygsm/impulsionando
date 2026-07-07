#!/usr/bin/env node
/**
 * Gerador de workflows N8N do Ecossistema Impulsionando.
 * Roda offline (sem tocar N8N real). Produz JSONs importáveis em
 * docs/n8n/workflows/** e payloads de exemplo em docs/n8n/payloads/**.
 *
 * Todos os workflows nascem em modo:demo com nodes de canal disabled.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = "docs/n8n";
const WF_DIR = join(ROOT, "workflows");
const PL_DIR = join(ROOT, "payloads");

/** @typedef {{id:number,slug:string,regua:string,folder:string,gatilho:string,canais:string[],planoMin:string,nichos?:string[]}} WF */

/** @type {WF[]} */
const CATALOG = [
  // Captação
  { id: 1, slug: "lead-captado", regua: "captacao", folder: "captacao", gatilho: "form/lp → lead", canais: ["email","impulsionito"], planoMin: "free" },
  { id: 2, slug: "lead-qualificado", regua: "captacao", folder: "captacao", gatilho: "score ≥ threshold", canais: ["whatsapp","email"], planoMin: "essencial" },
  { id: 3, slug: "lead-sem-resposta", regua: "captacao", folder: "captacao", gatilho: "48h sem interação", canais: ["whatsapp","email"], planoMin: "essencial" },
  { id: 4, slug: "lead-quente", regua: "captacao", folder: "captacao", gatilho: "intent alto", canais: ["whatsapp","internal"], planoMin: "pro" },
  { id: 5, slug: "lead-vitrine", regua: "captacao", folder: "captacao", gatilho: "clique/contato vitrine", canais: ["email","impulsionito"], planoMin: "free" },
  { id: 6, slug: "lead-whatsapp", regua: "captacao", folder: "captacao", gatilho: "msg WhatsApp", canais: ["whatsapp"], planoMin: "essencial" },
  { id: 7, slug: "lead-quiz", regua: "captacao", folder: "captacao", gatilho: "quiz concluído", canais: ["email","impulsionito"], planoMin: "free" },
  { id: 8, slug: "lead-redes-sociais", regua: "captacao", folder: "captacao", gatilho: "Meta/Insta/TikTok Ads", canais: ["whatsapp","email"], planoMin: "pro" },
  // Conversão
  { id: 9,  slug: "cadastro-iniciado",      regua: "conversao", folder: "conversao", gatilho: "signup.start",             canais: ["email"],                       planoMin: "free" },
  { id: 10, slug: "cadastro-abandonado",    regua: "conversao", folder: "conversao", gatilho: "30min sem completar",       canais: ["email","whatsapp"],            planoMin: "essencial" },
  { id: 11, slug: "cadastro-concluido",     regua: "conversao", folder: "conversao", gatilho: "user.created",              canais: ["email","impulsionito"],        planoMin: "free" },
  { id: 12, slug: "checkout-iniciado",      regua: "conversao", folder: "conversao", gatilho: "checkout.started",          canais: ["email"],                       planoMin: "essencial" },
  { id: 13, slug: "pix-gerado",             regua: "conversao", folder: "conversao", gatilho: "invoice.pix_created",       canais: ["whatsapp","email"],            planoMin: "essencial" },
  { id: 14, slug: "pix-expirado",           regua: "conversao", folder: "conversao", gatilho: "invoice.pix_expired",       canais: ["whatsapp","email"],            planoMin: "essencial" },
  { id: 15, slug: "cartao-recusado",        regua: "conversao", folder: "conversao", gatilho: "payment.card_declined",     canais: ["email","whatsapp"],            planoMin: "essencial" },
  { id: 16, slug: "pagamento-aprovado",     regua: "conversao", folder: "conversao", gatilho: "payment.approved",          canais: ["email","whatsapp","impulsionito"], planoMin: "essencial" },
  { id: 17, slug: "boleto-emitido",         regua: "conversao", folder: "conversao", gatilho: "invoice.boleto_created",    canais: ["email"],                       planoMin: "essencial" },
  { id: 18, slug: "boleto-pago",            regua: "conversao", folder: "conversao", gatilho: "invoice.boleto_paid",       canais: ["email","whatsapp"],            planoMin: "essencial" },
  { id: 19, slug: "trial-premium-iniciado", regua: "conversao", folder: "conversao", gatilho: "subscription.trial_started",canais: ["email","impulsionito"],        planoMin: "free" },
  // Relacionamento
  { id: 20, slug: "boas-vindas",            regua: "relacionamento", folder: "relacionamento", gatilho: "account.activated",   canais: ["email","impulsionito"], planoMin: "free" },
  { id: 21, slug: "onboarding-d0",          regua: "relacionamento", folder: "relacionamento", gatilho: "+0d",                 canais: ["impulsionito","email"], planoMin: "free" },
  { id: 22, slug: "onboarding-d1",          regua: "relacionamento", folder: "relacionamento", gatilho: "+1d",                 canais: ["email","whatsapp"],     planoMin: "free" },
  { id: 23, slug: "onboarding-d3",          regua: "relacionamento", folder: "relacionamento", gatilho: "+3d",                 canais: ["email"],                planoMin: "free" },
  { id: 24, slug: "onboarding-d7",          regua: "relacionamento", folder: "relacionamento", gatilho: "+7d",                 canais: ["email"],                planoMin: "free" },
  { id: 25, slug: "modulo-nao-configurado", regua: "relacionamento", folder: "relacionamento", gatilho: "48h sem config",      canais: ["impulsionito","email"], planoMin: "essencial" },
  { id: 26, slug: "cliente-sem-uso",        regua: "relacionamento", folder: "relacionamento", gatilho: "14d sem login",       canais: ["email","whatsapp"],     planoMin: "essencial" },
  { id: 27, slug: "cliente-engajado",       regua: "relacionamento", folder: "relacionamento", gatilho: "uso alto",             canais: ["email","impulsionito"], planoMin: "pro" },
  { id: 28, slug: "sugestao-recurso",       regua: "relacionamento", folder: "relacionamento", gatilho: "heurística IA",        canais: ["impulsionito"],         planoMin: "pro" },
  { id: 29, slug: "tutorial-automatico",    regua: "relacionamento", folder: "relacionamento", gatilho: "primeira vez",         canais: ["impulsionito"],         planoMin: "free" },
  { id: 30, slug: "impulsionito-proativo",  regua: "relacionamento", folder: "relacionamento", gatilho: "padrão detectado",     canais: ["impulsionito"],         planoMin: "pro" },
  // Retenção
  { id: 31, slug: "trial-d15",              regua: "retencao", folder: "retencao", gatilho: "+15d trial",         canais: ["email","impulsionito"], planoMin: "free" },
  { id: 32, slug: "trial-d25",              regua: "retencao", folder: "retencao", gatilho: "+25d trial",         canais: ["email","whatsapp"],     planoMin: "free" },
  { id: 33, slug: "trial-d29",              regua: "retencao", folder: "retencao", gatilho: "+29d trial",         canais: ["whatsapp","email"],     planoMin: "free" },
  { id: 34, slug: "trial-expirado",         regua: "retencao", folder: "retencao", gatilho: "trial.ended",        canais: ["email","impulsionito"], planoMin: "free" },
  { id: 35, slug: "renovacao-proxima",      regua: "retencao", folder: "retencao", gatilho: "7d antes venc.",     canais: ["email","whatsapp"],     planoMin: "essencial" },
  { id: 36, slug: "cancelamento-solicitado",regua: "retencao", folder: "retencao", gatilho: "cancel.requested",   canais: ["internal","email"],     planoMin: "essencial" },
  { id: 37, slug: "cancelamento-confirmado",regua: "retencao", folder: "retencao", gatilho: "cancel.confirmed",   canais: ["email","internal"],     planoMin: "essencial" },
  { id: 38, slug: "reativacao",             regua: "retencao", folder: "retencao", gatilho: "ex-cliente volta",   canais: ["email","whatsapp"],     planoMin: "essencial" },
  { id: 39, slug: "upsell-oportunidade",    regua: "retencao", folder: "retencao", gatilho: "heurística uso",     canais: ["impulsionito","email"], planoMin: "pro" },
  { id: 40, slug: "downgrade-preventivo",   regua: "retencao", folder: "retencao", gatilho: "baixo uso + venc.",  canais: ["impulsionito","email"], planoMin: "pro" },
  // Financeiro
  { id: 41, slug: "pagamento-confirmado",   regua: "financeiro", folder: "financeiro", gatilho: "payment.confirmed",  canais: ["email","whatsapp"], planoMin: "essencial" },
  { id: 42, slug: "pagamento-recusado",     regua: "financeiro", folder: "financeiro", gatilho: "payment.failed",     canais: ["email","whatsapp"], planoMin: "essencial" },
  { id: 43, slug: "inadimplencia",          regua: "financeiro", folder: "financeiro", gatilho: "+3d atraso",          canais: ["whatsapp","email"], planoMin: "essencial" },
  { id: 44, slug: "suspensao-automatica",   regua: "financeiro", folder: "financeiro", gatilho: "+15d inadimplência",  canais: ["email","internal"], planoMin: "essencial" },
  { id: 45, slug: "reativacao-pos-pagamento",regua: "financeiro", folder: "financeiro", gatilho: "payment após suspensão", canais: ["email","impulsionito"], planoMin: "essencial" },
  { id: 46, slug: "repasse-pendente",       regua: "financeiro", folder: "financeiro", gatilho: "payout.pending",     canais: ["internal","email"], planoMin: "wl" },
  { id: 47, slug: "repasse-realizado",      regua: "financeiro", folder: "financeiro", gatilho: "payout.completed",   canais: ["email"],            planoMin: "wl" },
  { id: 48, slug: "nota-fiscal-pendente",   regua: "financeiro", folder: "financeiro", gatilho: "invoice.nf_pending", canais: ["internal","email"], planoMin: "pro" },
  { id: 49, slug: "nota-fiscal-emitida",    regua: "financeiro", folder: "financeiro", gatilho: "invoice.nf_issued",  canais: ["email"],            planoMin: "pro" },
  { id: 50, slug: "tenant-emitir-nf-cliente-final", regua: "financeiro", folder: "financeiro", gatilho: "pedido pago pelo consumidor", canais: ["internal","email"], planoMin: "pro" },
  // Suporte
  { id: 51, slug: "chamado-aberto",         regua: "suporte", folder: "suporte", gatilho: "ticket.created",   canais: ["email","internal"], planoMin: "free" },
  { id: 52, slug: "sla-vencendo",           regua: "suporte", folder: "suporte", gatilho: "30min do SLA",     canais: ["internal"],         planoMin: "essencial" },
  { id: 53, slug: "sla-vencido",            regua: "suporte", folder: "suporte", gatilho: "SLA passou",       canais: ["internal","email"], planoMin: "essencial" },
  { id: 54, slug: "chamado-resolvido",      regua: "suporte", folder: "suporte", gatilho: "ticket.resolved",  canais: ["email"],            planoMin: "free" },
  { id: 55, slug: "avaliacao-negativa",     regua: "suporte", folder: "suporte", gatilho: "csat ≤ 2",         canais: ["internal","email"], planoMin: "essencial" },
  { id: 56, slug: "escalonamento-humano",   regua: "suporte", folder: "suporte", gatilho: "flag manual/IA",   canais: ["internal"],         planoMin: "free" },
  // Vitrine & Clube
  { id: 57, slug: "vitrine-publicado",      regua: "vitrine", folder: "vitrine", gatilho: "tenant.vitrine_enabled",  canais: ["email","internal"],      planoMin: "essencial" },
  { id: 58, slug: "vitrine-removido",       regua: "vitrine", folder: "vitrine", gatilho: "tenant.vitrine_disabled", canais: ["internal"],              planoMin: "essencial" },
  { id: 59, slug: "clube-favorito-novo",    regua: "vitrine", folder: "vitrine", gatilho: "consumer favorited",       canais: ["impulsionito","email"],  planoMin: "free" },
  { id: 60, slug: "clube-voucher-usado",    regua: "vitrine", folder: "vitrine", gatilho: "voucher.redeemed",         canais: ["email","whatsapp"],      planoMin: "free" },
  { id: 61, slug: "vitrine-avaliacao",      regua: "vitrine", folder: "vitrine", gatilho: "review.created",           canais: ["email"],                 planoMin: "essencial" },
  { id: 62, slug: "clube-empresa-proxima",  regua: "vitrine", folder: "vitrine", gatilho: "geo match por CEP",        canais: ["impulsionito","email"],  planoMin: "free" },
  { id: 63, slug: "clube-recomendacao",     regua: "vitrine", folder: "vitrine", gatilho: "recomendação histórico",   canais: ["impulsionito","email"],  planoMin: "free" },
];

/** Variações por nicho (subset representativo) */
const NICHOS = [
  { niche: "clinica",  slug: "consulta-confirmada",   gatilho: "appointment.confirmed",   canais: ["whatsapp","email"] },
  { niche: "clinica",  slug: "no-show",               gatilho: "appointment.no_show",     canais: ["whatsapp","internal"] },
  { niche: "clinica",  slug: "retorno",               gatilho: "appointment.followup_due",canais: ["whatsapp","email"] },
  { niche: "clinica",  slug: "teleconsulta",          gatilho: "appointment.tele_scheduled", canais: ["whatsapp","email"] },
  { niche: "bar",      slug: "pedido-recebido",       gatilho: "order.received",          canais: ["whatsapp"] },
  { niche: "bar",      slug: "pedido-saiu-entrega",   gatilho: "order.out_for_delivery",  canais: ["whatsapp"] },
  { niche: "bar",      slug: "pedido-delivery",       gatilho: "order.delivered",         canais: ["whatsapp"] },
  { niche: "bar",      slug: "avaliacao-pos-consumo", gatilho: "order.completed +2h",     canais: ["whatsapp","email"] },
  { niche: "bar",      slug: "cupom-retorno",         gatilho: "7d após consumo",         canais: ["whatsapp"] },
  { niche: "imob",     slug: "lead-imovel",           gatilho: "lead.property_interest",  canais: ["whatsapp","email"] },
  { niche: "imob",     slug: "visita-agendada",       gatilho: "visit.scheduled",         canais: ["whatsapp","email"] },
  { niche: "imob",     slug: "visita-confirmada",     gatilho: "visit.confirmed",         canais: ["whatsapp"] },
  { niche: "imob",     slug: "proposta-sem-resposta", gatilho: "proposal.no_response 48h",canais: ["whatsapp","email"] },
  { niche: "eventos",  slug: "ingresso-vendido",      gatilho: "ticket.purchased",        canais: ["email","whatsapp"] },
  { niche: "eventos",  slug: "lembrete-antes",        gatilho: "24h antes",               canais: ["whatsapp","email"] },
  { niche: "eventos",  slug: "checkin",               gatilho: "attendee.checked_in",     canais: ["internal"] },
  { niche: "eventos",  slug: "pos-evento",            gatilho: "event.ended +2h",         canais: ["email","whatsapp"] },
  { niche: "wl",       slug: "novo-cliente",          gatilho: "partner.tenant_created",  canais: ["email","internal"] },
  { niche: "wl",       slug: "tenant-suspenso",       gatilho: "tenant.suspended",        canais: ["internal","email"] },
  { niche: "wl",       slug: "tenant-convertido",     gatilho: "tenant.converted_paid",   canais: ["email","internal"] },
  { niche: "clube",    slug: "boas-vindas",           gatilho: "consumer.created",        canais: ["email","impulsionito"] },
  { niche: "clube",    slug: "voucher-disponivel",    gatilho: "voucher.available",       canais: ["email","impulsionito"] },
  { niche: "clube",    slug: "beneficio-expirando",   gatilho: "benefit.expires_in 3d",   canais: ["email","impulsionito"] },
];

let X = 240, Y = 300;
const step = 200;

function makeChannelNode(channel, id, x) {
  const map = {
    whatsapp: {
      name: "WhatsApp (Z-API) [demo:disabled]",
      url: "={{$env.ZAPI_BASE}}/instances/{{$env.ZAPI_INSTANCE}}/token/{{$env.ZAPI_TOKEN}}/send-text",
    },
    email: {
      name: "E-mail (Resend) [demo:disabled]",
      url: "https://api.resend.com/emails",
    },
    impulsionito: {
      name: "Impulsionito (in-app) [demo:disabled]",
      url: "={{$env.IMPULSIONANDO_API_BASE}}/api/public/impulsionito/notify",
    },
    internal: {
      name: "Notificação interna [demo:disabled]",
      url: "={{$env.IMPULSIONANDO_API_BASE}}/api/public/hooks/notify-staff",
    },
  };
  const cfg = map[channel] ?? map.internal;
  return {
    id,
    name: cfg.name,
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4,
    position: [x, Y + 120],
    disabled: true,
    parameters: {
      method: "POST",
      url: cfg.url,
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: "Content-Type", value: "application/json" },
      ]},
      jsonBody: "={{ JSON.stringify({ tenant: $json.tenant, entity: $json.entity, template_id: $json.channels?." + channel + "?.template_id, payload: $json.context }) }}",
      options: { timeout: 15000 },
    },
  };
}

function makeWorkflow(wf, prefix = "") {
  const wfSlug = prefix ? `${prefix}-${wf.slug}` : wf.slug;
  const nodes = [];
  const connections = {};

  // 1. Webhook
  const webhook = {
    id: "webhook",
    name: `Webhook · ${wfSlug}`,
    type: "n8n-nodes-base.webhook",
    typeVersion: 2,
    position: [X, Y],
    parameters: {
      httpMethod: "POST",
      path: `impulsionando/{{tenant_slug}}/${wfSlug}`,
      responseMode: "responseNode",
      options: {},
    },
  };
  nodes.push(webhook);

  // 2. Mode Gate
  const gate = {
    id: "mode-gate",
    name: "Mode Gate (demo vs producao)",
    type: "n8n-nodes-base.if",
    typeVersion: 2,
    position: [X + step, Y],
    parameters: {
      conditions: {
        options: { caseSensitive: true, typeValidation: "loose" },
        conditions: [{
          id: "mode",
          leftValue: "={{$json.body.mode}}",
          rightValue: "producao",
          operator: { type: "string", operation: "equals" },
        }],
        combinator: "and",
      },
    },
  };
  nodes.push(gate);
  connections[webhook.name] = { main: [[{ node: gate.name, type: "main", index: 0 }]] };

  // 3. Simulate (demo branch)
  const simulate = {
    id: "simulate",
    name: "Simulate (demo)",
    type: "n8n-nodes-base.set",
    typeVersion: 3,
    position: [X + 2 * step, Y - 120],
    parameters: {
      assignments: { assignments: [
        { id: "status", name: "status", value: "skipped", type: "string" },
        { id: "note",   name: "note",   value: `demo: no real dispatch for ${wfSlug}`, type: "string" },
      ]},
      options: {},
    },
  };
  nodes.push(simulate);

  // 4. Validate (producao branch)
  const validate = {
    id: "validate",
    name: "Validate tenant/canal/template",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [X + 2 * step, Y + 120],
    parameters: {
      language: "javaScript",
      jsCode: [
        "const b = $json.body || $json;",
        "const errors = [];",
        "if (!b?.tenant?.id) errors.push('tenant.id ausente');",
        "if (!b?.consent?.lgpd_ok) errors.push('consent.lgpd_ok=false');",
        `const canais = ${JSON.stringify(wf.canais)};`,
        "for (const c of canais) {",
        "  if (c === 'internal' || c === 'impulsionito') continue;",
        "  if (!b?.channels?.[c]?.enabled) errors.push(`canal ${c} desabilitado`);",
        "  if (!b?.channels?.[c]?.template_id) errors.push(`template ${c} ausente`);",
        "}",
        "return [{ json: { ...b, _validation: { ok: errors.length === 0, errors } } }];",
      ].join("\n"),
    },
  };
  nodes.push(validate);
  connections[gate.name] = { main: [
    [{ node: validate.name, type: "main", index: 0 }],   // true → producao
    [{ node: simulate.name, type: "main", index: 0 }],   // false → demo
  ]};

  // 5. Channel nodes (paralelos, disabled por default)
  const channelNodes = wf.canais.map((c, i) => makeChannelNode(c, `channel-${c}`, X + 3 * step + i * 40));
  channelNodes.forEach(n => nodes.push(n));
  connections[validate.name] = { main: [ channelNodes.map(n => ({ node: n.name, type: "main", index: 0 })) ] };

  // 6. Log (HMAC hook)
  const log = {
    id: "log",
    name: "Log → /api/public/hooks/n8n-log",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4,
    position: [X + 5 * step, Y],
    parameters: {
      method: "POST",
      url: "={{$env.IMPULSIONANDO_API_BASE}}/api/public/hooks/n8n-log",
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: "x-impulsionando-signature", value: "={{$crypto.createHmac('sha256', $env.IMPULSIONANDO_WEBHOOK_SECRET).update(JSON.stringify($json)).digest('hex')}}" },
        { name: "Content-Type", value: "application/json" },
      ]},
      jsonBody: `={{ JSON.stringify({ workflow_name: '${wfSlug}', workflow_version: '1.0.0', regua: '${wf.regua}', event_name: '${wf.gatilho}', step: 'complete', status: ($json._validation?.ok === false ? 'failed' : ($json.status || 'ok')), tenant_id: $json.tenant?.id, entity_type: $json.entity?.type, entity_id: $json.entity?.id, payload: $json, idempotency_key: '${wfSlug}:' + ($json.tenant?.slug || 'demo') + ':' + ($json.entity?.id || $now) }) }}`,
      options: { timeout: 15000 },
    },
  };
  nodes.push(log);
  channelNodes.forEach(n => {
    connections[n.name] = { main: [[{ node: log.name, type: "main", index: 0 }]] };
  });
  connections[simulate.name] = { main: [[{ node: log.name, type: "main", index: 0 }]] };

  // 7. Fallback humano (branch de erro)
  const fallback = {
    id: "fallback",
    name: "Fallback humano",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4,
    position: [X + 5 * step, Y + 240],
    disabled: true,
    parameters: {
      method: "POST",
      url: "={{$env.IMPULSIONANDO_API_BASE}}/api/public/hooks/notify-staff",
      sendHeaders: true,
      headerParameters: { parameters: [
        { name: "Content-Type", value: "application/json" },
      ]},
      jsonBody: `={{ JSON.stringify({ workflow: '${wfSlug}', tenant: $json.tenant, error: $json.error || 'unknown', regua: '${wf.regua}' }) }}`,
      options: { timeout: 15000 },
    },
  };
  nodes.push(fallback);

  // 8. Respond
  const respond = {
    id: "respond",
    name: "Respond 200",
    type: "n8n-nodes-base.respondToWebhook",
    typeVersion: 1,
    position: [X + 6 * step, Y],
    parameters: {
      respondWith: "json",
      responseBody: `={{ JSON.stringify({ ok: true, workflow: '${wfSlug}', mode: $json.body?.mode || $json.mode || 'demo' }) }}`,
    },
  };
  nodes.push(respond);
  connections[log.name] = { main: [[{ node: respond.name, type: "main", index: 0 }]] };

  return {
    name: `Impulsionando · ${wf.regua} · ${wfSlug}`,
    meta: {
      generated_by: "docs/n8n/generate-workflows.mjs",
      workflow_id: wf.id ?? null,
      regua: wf.regua,
      slug: wfSlug,
      plano_min: wf.planoMin ?? "free",
      canais: wf.canais,
      gatilho: wf.gatilho,
      status: "rascunho",
      mode_default: "demo",
    },
    nodes,
    connections,
    active: false,
    settings: { executionOrder: "v1" },
    tags: [{ name: "impulsionando" }, { name: wf.regua }, prefix ? { name: `nicho:${prefix}` } : { name: "core" }],
  };
}

function makePayload(wf, prefix = "") {
  const slug = prefix ? `${prefix}-${wf.slug}` : wf.slug;
  return {
    mode: "demo",
    workflow: { slug, version: "1.0.0", regua: wf.regua },
    tenant: { id: null, slug: prefix ? `demo-${prefix}` : "demo", plan: wf.planoMin ?? "free", niche: prefix || "multi" },
    actor: { user_id: null, email: "fulano@example.com", phone: "+5521999990000", name: "Fulano da Silva" },
    entity: { type: "demo", id: "demo-0001" },
    channels: {
      whatsapp:     { enabled: false, template_id: null },
      email:        { enabled: false, template_id: null },
      impulsionito: { enabled: true },
    },
    consent: { lgpd_ok: true, opt_in_channels: ["email"] },
    context: { note: `payload de exemplo para ${slug} — apenas demo` },
  };
}

function write(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(obj, null, 2) + "\n");
}

// Shared: fallback humano e plano gate como referência
write(join(WF_DIR, "_shared", "fallback-humano.json"), {
  name: "Impulsionando · _shared · fallback-humano",
  meta: { description: "Sub-workflow reutilizável. Notifica staff quando um workflow falha após retries.", status: "rascunho" },
  nodes: [
    { id: "start", name: "Start", type: "n8n-nodes-base.executeWorkflowTrigger", typeVersion: 1, position: [240, 300], parameters: {} },
    { id: "notify", name: "Notify staff [disabled]", type: "n8n-nodes-base.httpRequest", typeVersion: 4, position: [440, 300], disabled: true,
      parameters: { method: "POST", url: "={{$env.IMPULSIONANDO_API_BASE}}/api/public/hooks/notify-staff",
        sendHeaders: true, headerParameters: { parameters: [{ name: "Content-Type", value: "application/json" }] },
        jsonBody: "={{ JSON.stringify($json) }}", options: { timeout: 15000 } } },
  ],
  connections: { Start: { main: [[{ node: "Notify staff [disabled]", type: "main", index: 0 }]] } },
  active: false, settings: { executionOrder: "v1" }, tags: [{ name: "impulsionando" }, { name: "_shared" }],
});

write(join(WF_DIR, "_shared", "plano-gate.json"), {
  name: "Impulsionando · _shared · plano-gate",
  meta: { description: "Sub-workflow reutilizável. Valida plano do tenant vs matriz-planos.md antes de disparo.", status: "rascunho" },
  nodes: [
    { id: "start", name: "Start", type: "n8n-nodes-base.executeWorkflowTrigger", typeVersion: 1, position: [240, 300], parameters: {} },
    { id: "check", name: "Check plan", type: "n8n-nodes-base.code", typeVersion: 2, position: [440, 300],
      parameters: { language: "javaScript", jsCode: "const order={free:0,essencial:1,pro:2,premium:3,wl:4};const p=(($json.tenant?.plan)||'free').toLowerCase();const min=(($json.workflow?.plano_min)||'free').toLowerCase();const ok=(order[p]??0)>=(order[min]??0);return[{ json:{ ...$json, _plan:{ok,current:p,min}} }];" } },
  ],
  connections: { Start: { main: [[{ node: "Check plan", type: "main", index: 0 }]] } },
  active: false, settings: { executionOrder: "v1" }, tags: [{ name: "impulsionando" }, { name: "_shared" }],
});

// Core workflows
for (const wf of CATALOG) {
  write(join(WF_DIR, wf.folder, `${String(wf.id).padStart(2, "0")}-${wf.slug}.json`), makeWorkflow(wf));
  write(join(PL_DIR, `${wf.slug}.json`), makePayload(wf));
}

// Nicho variants
for (const nv of NICHOS) {
  const wf = { id: 900, slug: nv.slug, regua: "nicho", folder: `nichos/${nv.niche}`, gatilho: nv.gatilho, canais: nv.canais, planoMin: "essencial" };
  write(join(WF_DIR, wf.folder, `${nv.slug}.json`), makeWorkflow(wf, nv.niche));
  write(join(PL_DIR, `${nv.niche}-${nv.slug}.json`), makePayload(wf, nv.niche));
}

console.log(`Gerados ${CATALOG.length} workflows core + ${NICHOS.length} variações de nicho + 2 sub-workflows compartilhados.`);
