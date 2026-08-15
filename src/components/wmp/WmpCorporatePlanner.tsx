import { useState } from "react";
import { CalendarPlus2, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { submitWmpCorporateDemand } from "@/lib/wmp/corporate.functions";
import { lookupCEP } from "@/lib/validators";

type DateRow = { event_date: string; start_time: string; end_time: string; notes: string };
const newDateRow = (): DateRow => ({ event_date: "", start_time: "", end_time: "", notes: "" });

export function WmpCorporatePlanner() {
  const [form, setForm] = useState({
    contact_name: "", email: "", phone: "", company: "", demand_type: "hotelaria",
    venue_name: "", cep: "", address: "", neighborhood: "", city: "", state: "", municipio_ibge: "",
    audience_profile: "", musical_profile: "", notes: "",
  });
  const [dates, setDates] = useState<DateRow[]>([newDateRow()]);
  const [cepLoading, setCepLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; dates: number } | null>(null);

  function update(key: keyof typeof form, value: string) { setForm((current) => ({ ...current, [key]: value })); }
  function updateDate(index: number, key: keyof DateRow, value: string) {
    setDates((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  }

  async function handleCep(raw: string) {
    const cep = raw.replace(/\D/g, "").slice(0, 8);
    update("cep", cep);
    if (cep.length !== 8) return;
    setCepLoading(true); setError(null);
    try {
      const data = await lookupCEP(cep);
      if (!data) throw new Error("CEP não encontrado.");
      setForm((current) => ({
        ...current,
        cep,
        address: data.logradouro ?? "",
        neighborhood: data.bairro ?? "",
        city: data.cidade ?? "",
        state: data.uf ?? "",
        municipio_ibge: data.ibge ?? "",
      }));
    } catch (cause: any) {
      setError(cause?.message ?? "Não foi possível consultar o CEP.");
    } finally { setCepLoading(false); }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const result = await submitWmpCorporateDemand({ data: {
        ...form,
        dates,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      }});
      setSuccess({ id: result.id, dates: result.dates_count });
    } catch (cause: any) {
      setError(cause?.message ?? "Não foi possível registrar a agenda corporativa.");
    } finally { setSubmitting(false); }
  }

  if (success) {
    return (
      <div className="wmp-surface p-8 text-center md:p-10">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full" style={{ background: "var(--gradient-wmp-cta)", color: "var(--wmp-bg)" }}><Check className="size-6" /></div>
        <h3 className="wmp-display mt-4 text-2xl">Agenda recebida pela WMP</h3>
        <p className="mx-auto mt-3 max-w-2xl opacity-75">Registramos {success.dates} data(s) em uma única demanda corporativa. O Milito e a equipe WMP podem seguir com curadoria, disponibilidade e proposta sem você repetir o cadastro.</p>
        <div className="mt-4 text-xs opacity-55">Referência: {success.id}</div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="wmp-surface p-6 md:p-8">
      <div className="mb-6">
        <span className="wmp-chip"><CalendarPlus2 className="size-3" /> Agenda corporativa</span>
        <h3 className="wmp-display mt-3 text-2xl md:text-3xl">Informe uma ou várias datas</h3>
        <p className="mt-2 text-sm opacity-70">Ideal para hotéis, redes, restaurantes, empresas e operações recorrentes. Uma solicitação pode conter até 100 datas.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Seu nome *"><input value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} required /></Field>
        <Field label="Empresa / hotel *"><input value={form.company} onChange={(e) => update("company", e.target.value)} required /></Field>
        <Field label="E-mail *"><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required /></Field>
        <Field label="WhatsApp *"><input value={form.phone} onChange={(e) => update("phone", e.target.value)} required /></Field>
        <Field label="Tipo de operação"><select value={form.demand_type} onChange={(e) => update("demand_type", e.target.value)}><option value="hotelaria">Hotelaria / entretenimento recorrente</option><option value="corporativo">Empresa / eventos corporativos</option></select></Field>
        <Field label="Local / unidade *"><input value={form.venue_name} onChange={(e) => update("venue_name", e.target.value)} placeholder="Ex.: Hotel — Unidade Copacabana" required /></Field>
        <Field label="CEP do local *"><div className="relative"><input inputMode="numeric" value={form.cep} onChange={(e) => void handleCep(e.target.value)} required />{cepLoading ? <Loader2 className="absolute right-3 top-3 size-4 animate-spin" /> : null}</div></Field>
        <Field label="Endereço"><input value={form.address} onChange={(e) => update("address", e.target.value)} /></Field>
        <Field label="Bairro"><input value={form.neighborhood} readOnly /></Field>
        <Field label="Cidade / UF"><input value={[form.city, form.state].filter(Boolean).join(" / ")} readOnly /></Field>
        <Field label="Perfil de público"><input value={form.audience_profile} onChange={(e) => update("audience_profile", e.target.value)} placeholder="Executivos, hóspedes, turistas, convidados..." /></Field>
        <Field label="Perfil musical desejado"><input value={form.musical_profile} onChange={(e) => update("musical_profile", e.target.value)} placeholder="Open format, lounge, flashback, eletrônico..." /></Field>
      </div>

      <div className="mt-8 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h4 className="wmp-display text-xl">Datas solicitadas</h4><p className="text-xs opacity-60">Cada data fica rastreável separadamente no operacional WMP.</p></div>
          <button type="button" className="wmp-cta wmp-cta-outline" disabled={dates.length >= 100} onClick={() => setDates((current) => [...current, newDateRow()])}><Plus className="size-4" /> Adicionar data</button>
        </div>
        {dates.map((row, index) => (
          <div key={index} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1.1fr_.8fr_.8fr_1.5fr_auto]" style={{ borderColor: "var(--wmp-border)" }}>
            <Field label={`Data ${index + 1} *`}><input type="date" value={row.event_date} onChange={(e) => updateDate(index, "event_date", e.target.value)} required /></Field>
            <Field label="Início"><input type="time" value={row.start_time} onChange={(e) => updateDate(index, "start_time", e.target.value)} /></Field>
            <Field label="Fim"><input type="time" value={row.end_time} onChange={(e) => updateDate(index, "end_time", e.target.value)} /></Field>
            <Field label="Observação"><input value={row.notes} onChange={(e) => updateDate(index, "notes", e.target.value)} placeholder="Ex.: rooftop, jantar, convenção" /></Field>
            <button type="button" aria-label={`Remover data ${index + 1}`} disabled={dates.length === 1} className="self-end rounded-lg p-3 disabled:opacity-30" onClick={() => setDates((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" /></button>
          </div>
        ))}
      </div>

      <Field label="Observações gerais"><textarea rows={4} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Frequência desejada, particularidades da unidade, estrutura já disponível, dress code, restrições..." /></Field>
      {error ? <div className="mt-4 rounded-lg p-3 text-sm" style={{ background: "color-mix(in oklab, red 20%, transparent)" }}>{error}</div> : null}
      <button type="submit" disabled={submitting || cepLoading} className="wmp-cta mt-6">{submitting ? <><Loader2 className="size-4 animate-spin" /> Registrando agenda…</> : <><CalendarPlus2 className="size-4" /> Enviar agenda para a WMP</>}</button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-sm">{label}</span>{children}</label>;
}
