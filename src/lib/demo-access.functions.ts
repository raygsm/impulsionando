/**
 * Captura de leads para áreas de demonstração (/demo/*).
 * Antes de liberar o acesso, exigimos nome completo + WhatsApp + e-mail.
 * Após cadastro:
 *   - Insere lead em demo_leads
 *   - Enfileira 3 e-mails no message_outbox (boas-vindas / pesquisa / convite de plano)
 * Endpoints públicos (sem auth) — validação rigorosa via Zod.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PHONE_REGEX = /^\+?\s*(?:55\s*)?\(?\d{2}\)?\s*9?\s*\d{4}-?\s*\d{4}$/;

const RegisterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo")
    .max(120, "Nome muito longo")
    .refine((v) => v.split(/\s+/).length >= 2, "Informe seu nome completo (nome e sobrenome)"),
  phone: z
    .string()
    .trim()
    .min(10, "WhatsApp inválido")
    .max(20, "WhatsApp inválido")
    .regex(PHONE_REGEX, "WhatsApp inválido (use DDD + número)"),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(180),
  sourcePath: z.string().trim().min(1).max(200),
  niche: z.string().trim().max(80).optional().nullable(),
});

function digitsOnly(s: string) {
  return s.replace(/\D+/g, "");
}

const WELCOME_BODY = (name: string, sourcePath: string) =>
  `Olá ${name.split(" ")[0]},

Seja muito bem-vindo(a) à Impulsionando! 🎉

Você acaba de liberar o acesso a uma das nossas áreas de demonstração (${sourcePath}). Explore livremente — tudo o que você vê reflete como os módulos funcionam em uma operação real.

Algumas dicas para aproveitar melhor:
• Clique nos cartões e botões — quase tudo é interativo
• Olhe os indicadores e relatórios — eles mostram o que você teria no dia a dia
• Volte quando quiser, o acesso fica liberado por 30 dias no mesmo navegador

Se ficar com qualquer dúvida, é só responder este e-mail.

Vamos juntos impulsionar o seu negócio. 🚀

Equipe Impulsionando`;

const SURVEY_BODY = (name: string, surveyUrl: string) =>
  `Olá ${name.split(" ")[0]},

Esperamos que sua experiência na demonstração da Impulsionando tenha sido produtiva!

Sua opinião é fundamental para evoluirmos. Você teria 2 minutinhos para nos contar o que podemos melhorar?

👉 Responder pesquisa: ${surveyUrl}

É um campo livre — escreva como preferir. Toda observação ajuda muito.

Obrigado!
Equipe Impulsionando`;

const INVITE_BODY = (name: string, plansUrl: string) =>
  `Olá ${name.split(" ")[0]},

Já conhece nossos planos? Eles foram desenhados para crescer com você:

• Essencial — ½ salário mínimo/mês — comece pelo módulo que mais dói
• Ideal (Integrado) — 1 salário mínimo/mês — módulos integrados com automação
• Full (Avançado) — 2 salários mínimos/mês — operação multiunidade + IA avançada

👉 Ver planos e contratar: ${plansUrl}

Quer ajuda para escolher? Responda este e-mail com seu cenário (quantidade de unidades, time, principais dores) e indicamos o melhor caminho.

Equipe Impulsionando`;

export const registerDemoAccess = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => RegisterSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const phoneDigits = digitsOnly(data.phone);
    const baseUrl =
      process.env.PUBLIC_SITE_URL ||
      process.env.VITE_PUBLIC_SITE_URL ||
      "https://www.impulsionando.com.br";

    // 1) Insere lead (ou reaproveita pelo e-mail recente)
    const { data: existing } = await supabaseAdmin
      .from("demo_leads")
      .select("id")
      .eq("email", data.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let leadId = existing?.id as string | undefined;

    if (!leadId) {
      const { data: inserted, error: insErr } = await supabaseAdmin
        .from("demo_leads")
        .insert({
          name: data.name,
          phone: phoneDigits,
          email: data.email,
          niche: data.niche ?? null,
          origin: `Demo Gate · ${data.sourcePath}`,
          tags: ["demo_gate", data.sourcePath],
          status: "novo",
        })
        .select("id")
        .single();
      if (insErr) throw new Error(insErr.message);
      leadId = inserted.id as string;
    }

    // 2) Enfileira 3 e-mails no outbox (welcome agora, survey +24h, invite +72h)
    const now = Date.now();
    const surveyUrl = `${baseUrl}/pesquisa?lead=${leadId}`;
    const plansUrl = `${baseUrl}/planos?utm_source=demo&utm_medium=email&utm_campaign=demo_invite&lead=${leadId}`;

    const messages = [
      {
        event_code: "demo_access_welcome",
        subject: "Bem-vindo(a) à Impulsionando — seu acesso à demonstração",
        body: WELCOME_BODY(data.name, data.sourcePath),
        scheduled_at: new Date(now).toISOString(),
      },
      {
        event_code: "demo_access_survey",
        subject: "Pode nos contar o que achou? (2 minutos)",
        body: SURVEY_BODY(data.name, surveyUrl),
        scheduled_at: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        event_code: "demo_access_plan_invite",
        subject: "Pronto(a) para impulsionar? Conheça nossos planos",
        body: INVITE_BODY(data.name, plansUrl),
        scheduled_at: new Date(now + 72 * 60 * 60 * 1000).toISOString(),
      },
    ];

    await supabaseAdmin.from("message_outbox").insert(
      messages.map((m) => ({
        channel: "email" as const,
        event_code: m.event_code,
        subject: m.subject,
        body: m.body,
        recipient_email: data.email,
        recipient_name: data.name,
        recipient_phone: phoneDigits,
        scheduled_at: m.scheduled_at,
        reference_type: "demo_lead",
        reference_id: leadId,
        status: "queued" as const,
        payload: { sourcePath: data.sourcePath, niche: data.niche ?? null },
      })),
    );

    return { ok: true, leadId };
  });

const SurveySchema = z.object({
  leadId: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(3).max(120),
  email: z.string().trim().toLowerCase().email().max(180),
  message: z.string().trim().min(5, "Conte um pouco mais").max(2000),
  planInterest: z.string().trim().max(60).optional().nullable(),
  sourcePath: z.string().trim().max(200).optional().nullable(),
});

export const submitDemoSurvey = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SurveySchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("demo_survey_responses").insert({
      lead_id: data.leadId ?? null,
      name: data.name,
      email: data.email,
      message: data.message,
      plan_interest: data.planInterest ?? null,
      source_path: data.sourcePath ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
