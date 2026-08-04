/* eslint-disable @typescript-eslint/no-explicit-any -- tabelas novas entram nos tipos gerados após aplicar a migration */
import { createHash, randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CHRISMED_COMPANY_ID = "642096b5-a9ff-4521-a82a-c004f6d2e2d2";
const CHRISMED_BASE_URL = process.env.CHRISMED_BASE_URL || "https://chrismed.impulsionando.com.br";
const REVIEW_EMAIL = "sac@chrismed.com.br";

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char] ?? char,
  );
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function queueEmail(args: {
  to: string;
  subject: string;
  html: string;
  label: string;
  idempotencyKey: string;
}) {
  const messageId = crypto.randomUUID();
  await (supabaseAdmin as any).from("email_send_log").insert({
    message_id: messageId,
    template_name: args.label,
    recipient_email: args.to,
    status: "pending",
  });
  const { error } = await (supabaseAdmin as any).rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: args.to,
      from: "CHRISMED <noreply@www.impulsionando.com.br>",
      sender_domain: "notify.www.impulsionando.com.br",
      subject: args.subject,
      html: args.html,
      text: args.html
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
      purpose: "transactional",
      label: args.label,
      idempotency_key: args.idempotencyKey,
      queued_at: new Date().toISOString(),
    },
  });
  if (error) throw error;
}

export async function authenticateRequest(request: Request) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!bearer) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(bearer);
  return error ? null : data.user;
}

export async function createSpecialtyRequest(args: {
  userId: string;
  requestedName: string;
  details?: string | null;
}) {
  const name = args.requestedName.trim();
  if (name.length < 2 || name.length > 160) throw new Error("invalid_specialty_name");
  const { data: profile, error } = await (supabaseAdmin as any)
    .from("agenda_professionals")
    .select(
      "id,name,email,phone,council_number,council_region,primary_area,secondary_areas,profession_id,health_professions:profession_id(name,slug,council_acronym)",
    )
    .eq("company_id", CHRISMED_COMPANY_ID)
    .eq("user_id", args.userId)
    .single();
  if (error || !profile) throw new Error("professional_profile_not_found");

  const token = randomBytes(32).toString("hex");
  const { data: specialtyRequest, error: insertError } = await (supabaseAdmin as any)
    .from("health_specialty_requests")
    .insert({
      company_id: CHRISMED_COMPANY_ID,
      professional_id: profile.id,
      profession_id: profile.profession_id,
      requested_name: name,
      details: args.details?.trim() || null,
      decision_token_hash: tokenHash(token),
      decision_token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  const decisionBase = `${CHRISMED_BASE_URL}/api/chrismed/specialty-decision?token=${encodeURIComponent(token)}`;
  const profession = Array.isArray(profile.health_professions)
    ? profile.health_professions[0]
    : profile.health_professions;
  const html = `<div style="font-family:Arial,sans-serif;color:#173236;line-height:1.55;max-width:680px">
    <h1 style="color:#078f8b">Nova especialidade solicitada</h1>
    <p>Um profissional da saúde solicitou a inclusão de uma habilidade ainda não listada no catálogo CHRISMED.</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:6px;font-weight:bold">Nome completo</td><td>${escapeHtml(profile.name)}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">E-mail</td><td>${escapeHtml(profile.email)}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Telefone</td><td>${escapeHtml(profile.phone || "Não informado")}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Profissão</td><td>${escapeHtml(profession?.name)}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Conselho</td><td>${escapeHtml(`${profession?.council_acronym ?? ""} ${profile.council_number ?? ""}/${profile.council_region ?? ""}`.trim() || "Não aplicável")}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Área principal</td><td>${escapeHtml(profile.primary_area)}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Áreas secundárias</td><td>${escapeHtml((profile.secondary_areas ?? []).join(", ") || "Não informadas")}</td></tr>
      <tr><td style="padding:6px;font-weight:bold">Detalhamento</td><td>${escapeHtml(args.details || "Não informado")}</td></tr>
    </table>
    <p style="font-size:18px">Solicitação em OUTRO: <strong>${escapeHtml(name)}</strong></p>
    <p style="margin-top:24px">
      <a href="${decisionBase}&decision=approve" style="background:#078f8b;color:white;text-decoration:none;padding:12px 18px;border-radius:7px;font-weight:bold;margin-right:10px">APROVAR</a>
      <a href="${decisionBase}&decision=reject" style="background:#a33;color:white;text-decoration:none;padding:12px 18px;border-radius:7px;font-weight:bold">NÃO APROVAR</a>
    </p>
    <p style="color:#68787b;font-size:12px">Os links expiram em 7 dias e exigem confirmação antes de registrar a decisão.</p>
  </div>`;
  await queueEmail({
    to: REVIEW_EMAIL,
    subject: "Nova especialidade solicitada",
    html,
    label: "chrismed-specialty-request",
    idempotencyKey: `chrismed-specialty-request-${specialtyRequest.id}`,
  });
  return specialtyRequest.id as string;
}

export async function getSpecialtyDecision(token: string) {
  const { data } = await (supabaseAdmin as any)
    .from("health_specialty_requests")
    .select("id,requested_name,status,decision_token_expires_at")
    .eq("decision_token_hash", tokenHash(token))
    .maybeSingle();
  return data as {
    id: string;
    requested_name: string;
    status: string;
    decision_token_expires_at: string;
  } | null;
}

export async function decideSpecialtyRequest(token: string, decision: "approve" | "reject") {
  const request = await getSpecialtyDecision(token);
  if (
    !request ||
    request.status !== "pending" ||
    new Date(request.decision_token_expires_at).getTime() < Date.now()
  )
    throw new Error("invalid_or_expired_token");
  const { data: full } = await (supabaseAdmin as any)
    .from("health_specialty_requests")
    .select(
      "*,agenda_professionals:professional_id(name,email),health_professions:profession_id(name)",
    )
    .eq("id", request.id)
    .single();
  let specialtyId: string | null = null;
  if (decision === "approve") {
    const { data: specialty, error } = await (supabaseAdmin as any)
      .from("health_specialties")
      .upsert(
        {
          profession_id: full.profession_id,
          name: full.requested_name,
          is_active: true,
          sort_order: 999,
        },
        { onConflict: "profession_id,name" },
      )
      .select("id")
      .single();
    if (error) throw error;
    specialtyId = specialty.id;
    await (supabaseAdmin as any).from("health_professional_specialties").upsert({
      professional_id: full.professional_id,
      specialty_id: specialtyId,
      is_primary: false,
    });
  }
  const { data: updated, error: updateError } = await (supabaseAdmin as any)
    .from("health_specialty_requests")
    .update({
      status: decision === "approve" ? "approved" : "rejected",
      decided_at: new Date().toISOString(),
      decided_by_email: REVIEW_EMAIL,
      resulting_specialty_id: specialtyId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", full.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (updateError || !updated) throw new Error("decision_already_processed");
  const professional = Array.isArray(full.agenda_professionals)
    ? full.agenda_professionals[0]
    : full.agenda_professionals;
  const approved = decision === "approve";
  const serviceUrl = `${CHRISMED_BASE_URL}/agenda/services?specialty=${encodeURIComponent(specialtyId ?? "")}`;
  const html = `<div style="font-family:Arial,sans-serif;color:#173236;line-height:1.55;max-width:640px"><h1 style="color:#078f8b">${approved ? "Especialidade aprovada" : "Retorno sobre especialidade"}</h1><p>Olá, ${escapeHtml(professional.name)}.</p><p>Sua solicitação <strong>${escapeHtml(full.requested_name)}</strong> foi <strong>${approved ? "aprovada" : "não aprovada"}</strong> pela gestão CHRISMED.</p>${approved ? `<p>Ela já está disponível no catálogo da profissão ${escapeHtml((Array.isArray(full.health_professions) ? full.health_professions[0] : full.health_professions)?.name)} para você e para novos profissionais.</p><p><a href="${serviceUrl}" style="background:#078f8b;color:white;text-decoration:none;padding:12px 18px;border-radius:7px;font-weight:bold">INCLUIR NOVO SERVIÇO</a></p>` : "<p>Se desejar, responda ao atendimento com informações adicionais para uma nova avaliação.</p>"}</div>`;
  await queueEmail({
    to: professional.email,
    subject: approved
      ? "Especialidade aprovada pela CHRISMED"
      : "Especialidade não aprovada pela CHRISMED",
    html,
    label: "chrismed-specialty-decision",
    idempotencyKey: `chrismed-specialty-decision-${full.id}-${decision}`,
  });
  return { approved, requestedName: full.requested_name };
}
