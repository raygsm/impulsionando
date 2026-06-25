/**
 * WMP — server functions públicas (sem auth) para captura de leads e parceiros.
 * Persistem em wmp_briefings / wmp_parceiros com supabaseAdmin (bypass de RLS para INSERT).
 */
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { diagnoseAcoustics, type WmpAcousticInput } from "@/lib/wmp/acoustic-rules";

function sanitizeStr(v: unknown, max = 500): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}
function sanitizeOpt(v: unknown, max = 500): string | undefined {
  const s = sanitizeStr(v, max);
  return s ?? undefined;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const submitWmpBriefing = createServerFn({ method: "POST" })
  .inputValidator((d: any) => {
    if (!d || typeof d !== "object") throw new Error("Payload inválido");
    const nome = sanitizeStr(d.contratante_nome, 120);
    const email = sanitizeStr(d.contratante_email, 200);
    const telefone = sanitizeStr(d.contratante_telefone, 40);
    const eventoTipo = sanitizeStr(d.evento_tipo, 80);
    if (!nome || !email || !telefone || !eventoTipo) {
      throw new Error("Campos obrigatórios: nome, e-mail, telefone e tipo de evento.");
    }
    if (!EMAIL_RE.test(email)) throw new Error("E-mail inválido.");
    return {
      contratante_nome: nome,
      contratante_email: email.toLowerCase(),
      contratante_telefone: telefone,
      contratante_empresa: sanitizeOpt(d.contratante_empresa, 160),
      evento_tipo: eventoTipo,
      evento_data: sanitizeOpt(d.evento_data, 20),
      evento_horario_inicio: sanitizeOpt(d.evento_horario_inicio, 8),
      evento_horario_fim: sanitizeOpt(d.evento_horario_fim, 8),
      evento_publico_estimado: Number.isFinite(Number(d.evento_publico_estimado)) ? Number(d.evento_publico_estimado) : null,
      evento_perfil_publico: sanitizeOpt(d.evento_perfil_publico, 200),
      evento_endereco: sanitizeOpt(d.evento_endereco, 240),
      evento_cidade: sanitizeOpt(d.evento_cidade, 80),
      evento_estado: sanitizeOpt(d.evento_estado, 4),
      ambiente: d.ambiente && typeof d.ambiente === "object" ? d.ambiente : {},
      medidas: d.medidas && typeof d.medidas === "object" ? d.medidas : {},
      acustica: d.acustica && typeof d.acustica === "object" ? d.acustica : {},
      utm: d.utm && typeof d.utm === "object" ? d.utm : null,
      user_agent: sanitizeOpt(d.user_agent, 300),
      origem: sanitizeOpt(d.origem, 40) ?? "site",
    };
  })
  .handler(async ({ data }) => {
    const acousticInput: WmpAcousticInput = {
      ambiente: data.ambiente,
      medidas: data.medidas,
      evento: {
        publico_estimado: data.evento_publico_estimado ?? undefined,
        horario_fim: data.evento_horario_fim,
        tipo: data.evento_tipo,
      },
      acustica: data.acustica,
    };
    const pre_diagnostico = diagnoseAcoustics(acousticInput);

    const { data: row, error } = await supabaseAdmin
      .from("wmp_briefings")
      .insert({ ...data, pre_diagnostico })
      .select("id, created_at")
      .single();
    if (error) throw new Error(error.message);

    return { id: row.id, created_at: row.created_at, pre_diagnostico };
  });

export const submitWmpParceiro = createServerFn({ method: "POST" })
  .inputValidator((d: any) => {
    if (!d || typeof d !== "object") throw new Error("Payload inválido");
    const nome = sanitizeStr(d.nome, 120);
    const email = sanitizeStr(d.email, 200);
    const telefone = sanitizeStr(d.telefone, 40);
    const categoria = sanitizeStr(d.categoria, 40);
    const validas = ["dj","musico","tecnico_som","tecnico_luz","tecnico_video","fornecedor","cerimonialista","outro"];
    if (!nome || !email || !telefone || !categoria) throw new Error("Campos obrigatórios faltando.");
    if (!EMAIL_RE.test(email)) throw new Error("E-mail inválido.");
    if (!validas.includes(categoria)) throw new Error("Categoria inválida.");
    const links = Array.isArray(d.portfolio_links)
      ? d.portfolio_links.map((u: unknown) => sanitizeStr(u, 300)).filter(Boolean)
      : [];
    return {
      nome,
      nome_artistico: sanitizeOpt(d.nome_artistico, 120),
      email: email.toLowerCase(),
      telefone,
      categoria,
      cidade: sanitizeOpt(d.cidade, 80),
      estado: sanitizeOpt(d.estado, 4),
      experiencia_anos: Number.isFinite(Number(d.experiencia_anos)) ? Number(d.experiencia_anos) : null,
      bio: sanitizeOpt(d.bio, 1500),
      portfolio_links: links,
      utm: d.utm && typeof d.utm === "object" ? d.utm : null,
      user_agent: sanitizeOpt(d.user_agent, 300),
      origem: sanitizeOpt(d.origem, 40) ?? "site",
    };
  })
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("wmp_parceiros")
      .insert(data)
      .select("id, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, created_at: row.created_at };
  });
