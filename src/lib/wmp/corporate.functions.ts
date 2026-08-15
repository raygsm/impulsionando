import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { dispatchN8nByEvent } from "@/lib/n8n-dispatch-by-event.server";
import { assertBrazilLocation } from "@/lib/core/locations.server";

const db: any = supabaseAdmin;
const WMP_COMPANY_ID = "ff2a9570-1168-4f9c-a852-1e042d9f32ed";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value: unknown, max = 500) => typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;

type DateItem = {
  event_date: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
};

async function getWmpTenantId() {
  const { data, error } = await db.from("communication_tenants").select("id").eq("slug", "wmp").eq("active", true).single();
  if (error || !data?.id) throw new Error(error?.message ?? "Tenant WMP não encontrado.");
  return data.id as string;
}

export const submitWmpCorporateDemand = createServerFn({ method: "POST" })
  .inputValidator((raw: any) => {
    const contactName = clean(raw?.contact_name, 120);
    const email = clean(raw?.email, 200)?.toLowerCase();
    const phone = clean(raw?.phone, 40);
    const company = clean(raw?.company, 180);
    const demandType = clean(raw?.demand_type, 40) ?? "hotelaria";
    const venueName = clean(raw?.venue_name, 180);
    const cep = (clean(raw?.cep, 12) ?? "").replace(/\D/g, "");
    const address = clean(raw?.address, 240);
    const neighborhood = clean(raw?.neighborhood, 120);
    const city = clean(raw?.city, 120);
    const state = (clean(raw?.state, 2) ?? "").toUpperCase();
    const ibge = clean(raw?.municipio_ibge, 12);
    const audienceProfile = clean(raw?.audience_profile, 300);
    const musicalProfile = clean(raw?.musical_profile, 500);
    const notes = clean(raw?.notes, 1800);
    const datesRaw = Array.isArray(raw?.dates) ? raw.dates : [];

    if (!contactName || !email || !phone || !company || !venueName) throw new Error("Preencha contato, empresa e local/unidade.");
    if (!EMAIL_RE.test(email)) throw new Error("E-mail inválido.");
    if (cep.length !== 8 || !city || !state || !/^\d{7}$/.test(ibge ?? "")) throw new Error("Informe um CEP brasileiro válido para consolidar município e UF.");
    if (!['hotelaria', 'corporativo'].includes(demandType)) throw new Error("Tipo de demanda inválido.");
    if (datesRaw.length < 1 || datesRaw.length > 100) throw new Error("Informe entre 1 e 100 datas por solicitação.");

    const dates: DateItem[] = datesRaw.map((item: any, index: number) => {
      const eventDate = clean(item?.event_date, 10);
      const startTime = clean(item?.start_time, 8);
      const endTime = clean(item?.end_time, 8);
      const itemNotes = clean(item?.notes, 500);
      if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) throw new Error(`Data ${index + 1} inválida.`);
      if (eventDate < new Date().toISOString().slice(0, 10)) throw new Error(`A data ${index + 1} está no passado.`);
      return { event_date: eventDate, start_time: startTime, end_time: endTime, notes: itemNotes };
    });

    const uniqueDates = new Set(dates.map((item) => `${item.event_date}|${item.start_time ?? ""}|${item.end_time ?? ""}`));
    if (uniqueDates.size !== dates.length) throw new Error("Existem datas/horários duplicados na solicitação.");

    return {
      contact_name: contactName,
      email,
      phone,
      company,
      demand_type: demandType,
      venue_name: venueName,
      cep,
      address,
      neighborhood,
      city,
      state,
      municipio_ibge: ibge!,
      audience_profile: audienceProfile,
      musical_profile: musicalProfile,
      notes,
      dates,
      user_agent: clean(raw?.user_agent, 300),
      utm: raw?.utm && typeof raw.utm === "object" ? raw.utm : null,
    };
  })
  .handler(async ({ data }) => {
    await assertBrazilLocation({ cep: data.cep, uf: data.state, cidade: data.city, ibge: data.municipio_ibge });
    const tenantId = await getWmpTenantId();
    const now = new Date().toISOString();

    const { data: briefing, error: briefingError } = await db.from("wmp_briefings").insert({
      tenant_id: tenantId,
      status: "NEW",
      contratante_nome: data.contact_name,
      contratante_email: data.email,
      contratante_telefone: data.phone,
      contratante_empresa: data.company,
      evento_tipo: data.demand_type,
      evento_data: data.dates[0]?.event_date ?? null,
      evento_horario_inicio: data.dates[0]?.start_time ?? null,
      evento_horario_fim: data.dates[0]?.end_time ?? null,
      evento_perfil_publico: data.audience_profile ?? null,
      evento_cep: data.cep,
      evento_bairro: data.neighborhood ?? null,
      evento_endereco: data.address ?? null,
      evento_cidade: data.city,
      evento_estado: data.state,
      evento_municipio_ibge: data.municipio_ibge,
      ambiente: { corporate_recurring: true, venue_name: data.venue_name },
      medidas: {},
      acustica: { musical_profile: data.musical_profile ?? null },
      pre_diagnostico: { status: "pending_corporate_scope", dates_count: data.dates.length },
      internal_notes: data.notes ?? null,
      utm: data.utm,
      origem: "site_wmp_b2b",
      user_agent: data.user_agent ?? null,
      consent_at: now,
    }).select("id,created_at").single();
    if (briefingError || !briefing?.id) throw new Error(briefingError?.message ?? "Não foi possível registrar a demanda corporativa.");

    const rows = data.dates.map((item) => ({
      tenant_id: tenantId,
      briefing_id: briefing.id,
      event_date: item.event_date,
      start_time: item.start_time ?? null,
      end_time: item.end_time ?? null,
      venue_name: data.venue_name,
      venue_cep: data.cep,
      venue_address: data.address ?? null,
      venue_bairro: data.neighborhood ?? null,
      venue_city: data.city,
      venue_state: data.state,
      venue_municipio_ibge: data.municipio_ibge,
      status: "REQUESTED",
      notes: item.notes ?? null,
    }));

    const { error: datesError } = await db.from("wmp_briefing_dates").insert(rows);
    if (datesError) {
      await db.from("wmp_briefings").delete().eq("id", briefing.id);
      throw new Error(`Não foi possível registrar a agenda solicitada: ${datesError.message}`);
    }

    const automation = await dispatchN8nByEvent("wmp.lead.received", {
      lead_type: "corporate_multi_date",
      briefing_id: briefing.id,
      company: data.company,
      venue_name: data.venue_name,
      dates_count: data.dates.length,
      email: data.email,
      phone: data.phone,
    }, WMP_COMPANY_ID, "wmp");

    return { id: briefing.id, created_at: briefing.created_at, dates_count: data.dates.length, automation };
  });
