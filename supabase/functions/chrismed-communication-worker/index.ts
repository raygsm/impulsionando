import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.9.16";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

type OutboxRow = { id: string; event_code: string; recipient: string; payload: Record<string, unknown>; attempts: number; from_email: string | null; reply_to_email: string | null };

const TEMPLATE_MAP: Record<string, string> = {
  appointment_created: "appointment.created",
  payment_pending: "payment.pending",
  appointment_confirmed: "appointment.confirmed",
  appointment_confirmed_management: "appointment.confirmed.management",
  appointment_rescheduled: "appointment.rescheduled",
  appointment_reminder_72h: "appointment.reminder.72h",
  appointment_reminder_24h: "appointment.reminder.24h",
  appointment_reminder_2h: "appointment.reminder.2h",
  appointment_cancelled: "appointment.cancelled",
  appointment_completed: "appointment.completed",
  appointment_no_show: "appointment.no_show",
  event_confirmed: "event.confirmed",
  event_reminder: "event.reminder",
  event_survey: "event.survey",
  "chrismed.event.invitation.created": "chrismed.event.invitation.created",
  "chrismed.event.registration.confirmed": "chrismed.event.registration.confirmed",
  "chrismed.event.registration.rejected": "chrismed.event.registration.rejected",
  professional_registration_received: "professional.registration.received",
  professional_registration_management: "professional.registration.management",
  pega_agenda_offer: "pega_agenda.opportunity",
  pega_agenda_opt_in: "pega_agenda.opt_in",
  pega_agenda_claimed: "pega_agenda.patient_reassigned",
  pega_agenda_claimed_professional: "pega_agenda.claimed",
};

const required = (name: string) => { const value = Deno.env.get(name)?.trim(); if (!value) throw new Error(`missing_secret:${name}`); return value; };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const escapeHtml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const scalar = (value: unknown): string => value == null ? "" : Array.isArray(value) ? value.map(scalar).filter(Boolean).join(", ") : typeof value === "object" ? JSON.stringify(value) : String(value);
const render = (template: string, vars: Record<string, unknown>, html = false) => template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key) => html ? escapeHtml(scalar(vars[key])) : scalar(vars[key]));
const fmtDate = (iso: unknown) => { if (!iso) return ""; const d = new Date(String(iso)); return Number.isNaN(d.getTime()) ? "" : new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" }).format(d); };
const fmtTime = (iso: unknown) => { if (!iso) return ""; const d = new Date(String(iso)); return Number.isNaN(d.getTime()) ? "" : new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hour12: false }).format(d); };
const fmtDateTime = (iso: unknown) => { const d = fmtDate(iso); const t = fmtTime(iso); return [d,t].filter(Boolean).join(" às "); };

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const supabaseUrl = required("SUPABASE_URL");
  const serviceRole = required("SUPABASE_SERVICE_ROLE_KEY");
  const smtpUser = required("CHRISMED_SMTP_USERNAME");
  const smtpPassword = required("CHRISMED_SMTP_PASSWORD");
  const db = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const transporter = nodemailer.createTransport({ host: "smtp.hostinger.com", port: 465, secure: true, auth: { user: smtpUser, pass: smtpPassword }, connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000 });

  const { data: tenant, error: tenantError } = await db.from("communication_tenants").select("id").eq("slug", "chrismed").eq("active", true).maybeSingle();
  if (tenantError || !tenant) return json({ error: "chrismed_tenant_unavailable" }, 503);
  const { data: claimed, error: claimError } = await db.rpc("chrismed_claim_communication_outbox", { p_batch_size: 25 });
  if (claimError) return json({ error: "outbox_claim_failed" }, 500);

  const rows = (claimed ?? []) as OutboxRow[];
  let sent = 0; let failed = 0;
  const failures: Array<{ id: string; code: string }> = [];

  for (const row of rows) {
    try {
      const code = row.event_code.toLowerCase();
      const templateKey = TEMPLATE_MAP[code];
      if (!templateKey) throw new Error(`template_mapping_missing:${code}`);
      const { data: template, error: templateError } = await db.from("communication_templates").select("id,current_version").eq("tenant_id", tenant.id).eq("template_key", templateKey).eq("locale", "pt-BR").eq("status", "PUBLISHED").is("deleted_at", null).maybeSingle();
      if (templateError || !template?.current_version) throw new Error(`published_template_missing:${templateKey}`);
      const { data: version, error: versionError } = await db.from("communication_template_versions").select("subject_template,html_template,text_template,required_variables,approval_status").eq("template_id", template.id).eq("version", template.current_version).eq("approval_status", "APPROVED").maybeSingle();
      if (versionError || !version) throw new Error(`approved_template_version_missing:${templateKey}`);

      const vars: Record<string, unknown> = { ...(row.payload ?? {}) };
      const base = "https://chrismed.impulsionando.com.br";
      if (vars.appointment_id) {
        const { data: appointment } = await db.from("chrismed_appointments").select("patient_name,patient_email,professional_id,starts_at,ends_at").eq("id", String(vars.appointment_id)).maybeSingle();
        if (appointment) Object.assign(vars, appointment, vars);
      }
      if (vars.professional_id) {
        const { data: professional } = await db.from("agenda_professionals").select("name,email").eq("id", String(vars.professional_id)).maybeSingle();
        if (professional?.name && !vars.professional_name) vars.professional_name = professional.name;
      }
      vars.patient_name = vars.patient_name || vars.recipient_name || vars.first_name || "cliente";
      vars.recipient_name = vars.recipient_name || vars.attendee_name || vars.professional_name || vars.invitee_name || vars.patient_name || vars.first_name || "cliente";
      vars.event_name = vars.event_name || vars.event_title || "evento CHRISMED";
      vars.appointment_date = vars.appointment_date || fmtDate(vars.starts_at);
      vars.appointment_time = vars.appointment_time || fmtTime(vars.starts_at);
      vars.event_date = vars.event_date || fmtDate(vars.starts_at);
      vars.event_time = vars.event_time || fmtTime(vars.starts_at);
      vars.event_date_time = vars.event_date_time || fmtDateTime(vars.starts_at);
      vars.event_venue = vars.event_venue || [vars.venue_name, vars.venue_address, vars.city].map(scalar).filter(Boolean).join(" · ");
      vars.expires_at_local = vars.expires_at_local || fmtDateTime(vars.expires_at);
      vars.appointment_url = vars.appointment_url || `${base}/agendar`;
      vars.booking_url = vars.booking_url || `${base}/agendar`;
      vars.confirmation_url = vars.confirmation_url || `${base}/agendar`;
      vars.payment_url = vars.payment_url || `${base}/agendar`;
      vars.event_url = vars.event_url || `${base}/eventos`;
      vars.survey_url = vars.survey_url || `${base}/eventos`;
      vars.access_url = vars.access_url || `${base}/auth`;
      vars.management_url = vars.management_url || `${base}/auth`;
      vars.agenda_url = vars.agenda_url || `${base}/agenda/profissional`;
      vars.offer_url = vars.offer_url || `${base}/agenda/profissional`;
      vars.terms_version = vars.terms_version || "pega-agenda-v1";
      vars.amount = vars.amount || vars.amount_brl || "";

      const missing = ((version.required_variables ?? []) as string[]).filter((key) => !scalar(vars[key]).trim());
      if (missing.length) throw new Error(`required_variables_missing:${missing.join(",")}`);
      const subject = render(version.subject_template, vars).replace(/[\r\n]+/g, " ").trim();
      const text = render(version.text_template, vars);
      const htmlBody = render(version.html_template, vars, true);
      const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head><body style="margin:0;background:#eef4f3;font-family:Arial,Helvetica,sans-serif;color:#173a39"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border:1px solid #d8e5e3;border-radius:18px"><tr><td style="height:7px;background:#006b68"></td></tr><tr><td style="padding:28px 32px 8px;font-size:26px;font-weight:800;color:#006b68">CHRISMED</td></tr><tr><td style="padding:16px 32px 30px;font-size:16px;line-height:1.65;color:#385654">${htmlBody}</td></tr><tr><td style="padding:20px 32px;background:#f7faf9;border-top:1px solid #e1eae9;font-size:12px;color:#627775">Precisa de ajuda? sac@chrismed.com.br<br>Mensagem transacional automática da CHRISMED.</td></tr></table></td></tr></table></body></html>`;
      await transporter.sendMail({ from: `"CHRISMED" <${smtpUser}>`, to: row.recipient, replyTo: row.reply_to_email || "sac@chrismed.com.br", subject, text, html });
      const { error: sentError } = await db.from("chrismed_communication_outbox").update({ status: "sent", sent_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() }).eq("id", row.id).eq("status", "processing");
      if (sentError) throw new Error("outbox_finalize_sent_failed");
      sent += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "delivery_failed";
      const terminal = row.attempts >= 5 || message.startsWith("template_mapping_missing") || message.startsWith("published_template_missing") || message.startsWith("approved_template_version_missing") || message.startsWith("required_variables_missing");
      const delayMinutes = Math.min(360, 5 * Math.pow(2, Math.max(0, row.attempts - 1)));
      await db.from("chrismed_communication_outbox").update({ status: terminal ? "dead_letter" : "failed", last_error: message.slice(0, 1000), available_at: new Date(Date.now() + delayMinutes * 60_000).toISOString(), updated_at: new Date().toISOString() }).eq("id", row.id).eq("status", "processing");
      failures.push({ id: row.id, code: message.split(":")[0] });
    }
  }
  return json({ ok: true, claimed: rows.length, sent, failed, failures });
});
