import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Wand2 } from "lucide-react";
import { WmpShell } from "@/components/wmp/WmpShell";
import { submitWmpBriefing } from "@/lib/wmp.functions";
import { diagnoseAcoustics, type WmpAcousticDiagnosis } from "@/lib/wmp/acoustic-rules";

export const Route = createFileRoute("/wmp/orcamento")({
  head: () => ({
    meta: [
      { title: "Orçamento em 60 segundos — WMP" },
      { name: "description", content: "Formulário inteligente com pré-diagnóstico acústico instantâneo. Receba a estrutura ideal para seu evento." },
    ],
  }),
  component: WmpOrcamento,
});

type FormState = {
  contratante_nome: string;
  contratante_email: string;
  contratante_telefone: string;
  contratante_empresa: string;
  evento_tipo: string;
  evento_data: string;
  evento_horario_inicio: string;
  evento_horario_fim: string;
  evento_publico_estimado: string;
  evento_cidade: string;
  evento_estado: string;
  evento_endereco: string;
  ambiente_tipo: "fechado" | "aberto" | "semi_aberto";
  ambiente_piso: "carpete" | "madeira" | "ceramica" | "concreto";
  ambiente_paredes: "drywall" | "alvenaria" | "vidro" | "espelho" | "tecido";
  ambiente_altura: string;
  medidas_largura: string;
  medidas_comprimento: string;
  acustica_estilo: "dj_eletronico" | "banda_rock" | "voz_palestra" | "musica_ambiente" | "show_grande_porte";
};

const INIT: FormState = {
  contratante_nome: "", contratante_email: "", contratante_telefone: "", contratante_empresa: "",
  evento_tipo: "casamento", evento_data: "", evento_horario_inicio: "", evento_horario_fim: "",
  evento_publico_estimado: "", evento_cidade: "", evento_estado: "", evento_endereco: "",
  ambiente_tipo: "fechado", ambiente_piso: "ceramica", ambiente_paredes: "alvenaria",
  ambiente_altura: "", medidas_largura: "", medidas_comprimento: "",
  acustica_estilo: "musica_ambiente",
};

const STEPS = ["Contato", "Evento", "Ambiente", "Estilo", "Revisão"] as const;

function WmpOrcamento() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INIT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [livePreview, setLivePreview] = useState<WmpAcousticDiagnosis | null>(null);

  function update<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function refreshPreview(next = form) {
    const preview = diagnoseAcoustics({
      ambiente: {
        tipo: next.ambiente_tipo,
        material_piso: next.ambiente_piso,
        material_paredes: next.ambiente_paredes,
        teto_altura_m: Number(next.ambiente_altura) || undefined,
      },
      medidas: {
        largura_m: Number(next.medidas_largura) || undefined,
        comprimento_m: Number(next.medidas_comprimento) || undefined,
      },
      evento: {
        publico_estimado: Number(next.evento_publico_estimado) || undefined,
        horario_fim: next.evento_horario_fim,
        tipo: next.evento_tipo,
      },
      acustica: { estilo: next.acustica_estilo },
    });
    setLivePreview(preview);
  }

  function canAdvance(): boolean {
    if (step === 0) {
      return form.contratante_nome.trim().length > 1
        && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contratante_email)
        && form.contratante_telefone.trim().length >= 8;
    }
    if (step === 1) return !!form.evento_tipo && !!form.evento_data;
    return true;
  }

  function next() {
    if (!canAdvance()) {
      setError("Preencha os campos obrigatórios antes de avançar.");
      return;
    }
    setError(null);
    if (step === 2 || step === 3) refreshPreview();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function handleSubmit() {
    setSubmitting(true); setError(null);
    try {
      const res = await submitWmpBriefing({
        data: {
          contratante_nome: form.contratante_nome,
          contratante_email: form.contratante_email,
          contratante_telefone: form.contratante_telefone,
          contratante_empresa: form.contratante_empresa,
          evento_tipo: form.evento_tipo,
          evento_data: form.evento_data || undefined,
          evento_horario_inicio: form.evento_horario_inicio || undefined,
          evento_horario_fim: form.evento_horario_fim || undefined,
          evento_publico_estimado: Number(form.evento_publico_estimado) || null,
          evento_cidade: form.evento_cidade,
          evento_estado: form.evento_estado,
          evento_endereco: form.evento_endereco,
          ambiente: {
            tipo: form.ambiente_tipo,
            material_piso: form.ambiente_piso,
            material_paredes: form.ambiente_paredes,
            teto_altura_m: Number(form.ambiente_altura) || undefined,
          },
          medidas: {
            largura_m: Number(form.medidas_largura) || undefined,
            comprimento_m: Number(form.medidas_comprimento) || undefined,
          },
          acustica: { estilo: form.acustica_estilo },
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          origem: "site_wmp",
        },
      });
      navigate({ to: "/wmp/obrigado/$tipo", params: { tipo: "orcamento" }, search: { id: res.id } });
    } catch (e: any) {
      setError(e?.message ?? "Falha ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <WmpShell breadcrumbs={[{ label: "Orçamento" }]}>
      <section className="wmp-stage-bg">
        <div className="mx-auto max-w-3xl px-6 pt-14 pb-10 text-center">
          <span className="wmp-chip mb-4"><Wand2 className="size-3" /> Briefing inteligente</span>
          <h1 className="wmp-display text-3xl md:text-5xl mb-3">Seu orçamento em 60 segundos</h1>
          <p className="opacity-80">
            Quanto mais detalhes, mais preciso é o pré-diagnóstico acústico — sem precisar
            esperar visita técnica.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24 -mt-6">
        <Stepper step={step} />

        <div className="wmp-surface p-6 md:p-10 mt-6">
          {step === 0 && (
            <Grid>
              <Field label="Nome completo *"><input value={form.contratante_nome} onChange={(e) => update("contratante_nome", e.target.value)} /></Field>
              <Field label="E-mail *"><input type="email" value={form.contratante_email} onChange={(e) => update("contratante_email", e.target.value)} /></Field>
              <Field label="WhatsApp *"><input value={form.contratante_telefone} onChange={(e) => update("contratante_telefone", e.target.value)} placeholder="(21) 99999-0000" /></Field>
              <Field label="Empresa (opcional)"><input value={form.contratante_empresa} onChange={(e) => update("contratante_empresa", e.target.value)} /></Field>
            </Grid>
          )}
          {step === 1 && (
            <Grid>
              <Field label="Tipo de evento *">
                <select value={form.evento_tipo} onChange={(e) => update("evento_tipo", e.target.value)}>
                  <option value="casamento">Casamento</option>
                  <option value="aniversario">Aniversário</option>
                  <option value="corporativo">Corporativo</option>
                  <option value="show">Show / Festival</option>
                  <option value="formatura">Formatura</option>
                  <option value="palestra">Palestra / Convenção</option>
                  <option value="outro">Outro</option>
                </select>
              </Field>
              <Field label="Data *"><input type="date" value={form.evento_data} onChange={(e) => update("evento_data", e.target.value)} /></Field>
              <Field label="Horário de início"><input type="time" value={form.evento_horario_inicio} onChange={(e) => update("evento_horario_inicio", e.target.value)} /></Field>
              <Field label="Horário de término"><input type="time" value={form.evento_horario_fim} onChange={(e) => update("evento_horario_fim", e.target.value)} /></Field>
              <Field label="Público estimado"><input type="number" min={0} value={form.evento_publico_estimado} onChange={(e) => update("evento_publico_estimado", e.target.value)} /></Field>
              <Field label="Cidade"><input value={form.evento_cidade} onChange={(e) => update("evento_cidade", e.target.value)} /></Field>
              <Field label="UF"><input maxLength={2} value={form.evento_estado} onChange={(e) => update("evento_estado", e.target.value.toUpperCase())} /></Field>
              <Field label="Endereço do local" full><input value={form.evento_endereco} onChange={(e) => update("evento_endereco", e.target.value)} /></Field>
            </Grid>
          )}
          {step === 2 && (
            <Grid>
              <Field label="Tipo de ambiente">
                <select value={form.ambiente_tipo} onChange={(e) => update("ambiente_tipo", e.target.value as any)}>
                  <option value="fechado">Fechado</option>
                  <option value="semi_aberto">Semi-aberto</option>
                  <option value="aberto">Aberto</option>
                </select>
              </Field>
              <Field label="Altura do teto (m)"><input type="number" step="0.1" value={form.ambiente_altura} onChange={(e) => update("ambiente_altura", e.target.value)} /></Field>
              <Field label="Largura (m)"><input type="number" step="0.1" value={form.medidas_largura} onChange={(e) => update("medidas_largura", e.target.value)} /></Field>
              <Field label="Comprimento (m)"><input type="number" step="0.1" value={form.medidas_comprimento} onChange={(e) => update("medidas_comprimento", e.target.value)} /></Field>
              <Field label="Material do piso">
                <select value={form.ambiente_piso} onChange={(e) => update("ambiente_piso", e.target.value as any)}>
                  <option value="carpete">Carpete</option>
                  <option value="madeira">Madeira</option>
                  <option value="ceramica">Cerâmica</option>
                  <option value="concreto">Concreto</option>
                </select>
              </Field>
              <Field label="Material das paredes">
                <select value={form.ambiente_paredes} onChange={(e) => update("ambiente_paredes", e.target.value as any)}>
                  <option value="alvenaria">Alvenaria</option>
                  <option value="drywall">Drywall</option>
                  <option value="vidro">Vidro</option>
                  <option value="espelho">Espelhado</option>
                  <option value="tecido">Tecido / acústico</option>
                </select>
              </Field>
            </Grid>
          )}
          {step === 3 && (
            <Grid>
              <Field label="Estilo musical / uso predominante" full>
                <select value={form.acustica_estilo} onChange={(e) => update("acustica_estilo", e.target.value as any)}>
                  <option value="musica_ambiente">Música ambiente</option>
                  <option value="voz_palestra">Voz / palestra</option>
                  <option value="dj_eletronico">DJ / eletrônico</option>
                  <option value="banda_rock">Banda / rock</option>
                  <option value="show_grande_porte">Show de grande porte</option>
                </select>
              </Field>
              <button type="button" onClick={() => refreshPreview()} className="wmp-cta wmp-cta-outline mt-2 md:col-span-2 self-start">
                <Sparkles className="size-4" /> Pré-visualizar diagnóstico
              </button>
              {livePreview && <DiagnosisCard d={livePreview} />}
            </Grid>
          )}
          {step === 4 && (
            <div className="space-y-4 text-sm">
              <h3 className="wmp-display text-2xl">Revisão final</h3>
              <p className="opacity-80">Confirme os dados abaixo. Você receberá uma cópia por e-mail.</p>
              <ReviewBlock title="Contato" rows={[
                ["Nome", form.contratante_nome], ["E-mail", form.contratante_email],
                ["WhatsApp", form.contratante_telefone], ["Empresa", form.contratante_empresa || "—"],
              ]} />
              <ReviewBlock title="Evento" rows={[
                ["Tipo", form.evento_tipo], ["Data", form.evento_data || "—"],
                ["Horário", `${form.evento_horario_inicio || "—"} → ${form.evento_horario_fim || "—"}`],
                ["Público", form.evento_publico_estimado || "—"],
                ["Local", [form.evento_endereco, form.evento_cidade, form.evento_estado].filter(Boolean).join(" · ") || "—"],
              ]} />
              <ReviewBlock title="Ambiente" rows={[
                ["Tipo", form.ambiente_tipo], ["Altura", form.ambiente_altura ? `${form.ambiente_altura}m` : "—"],
                ["Dimensões", form.medidas_largura && form.medidas_comprimento ? `${form.medidas_largura}m × ${form.medidas_comprimento}m` : "—"],
                ["Piso", form.ambiente_piso], ["Paredes", form.ambiente_paredes],
                ["Estilo", form.acustica_estilo],
              ]} />
              {livePreview && <DiagnosisCard d={livePreview} />}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: "color-mix(in oklab, red 20%, transparent)", color: "white" }}>
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mt-8">
            <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
              className="wmp-cta wmp-cta-outline disabled:opacity-40">
              <ArrowLeft className="size-4" /> Voltar
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} className="wmp-cta">
                Avançar <ArrowRight className="size-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={submitting} className="wmp-cta">
                {submitting ? <><Loader2 className="size-4 animate-spin" /> Enviando…</> : <><Check className="size-4" /> Enviar briefing</>}
              </button>
            )}
          </div>
        </div>
      </section>
    </WmpShell>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center justify-between gap-2 text-xs">
      {STEPS.map((label, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={label} className="flex-1 flex items-center gap-2">
            <span
              className="size-7 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{
                background: done || current ? "var(--gradient-wmp-cta)" : "var(--wmp-surface-2)",
                color: done || current ? "var(--wmp-bg)" : "var(--wmp-muted)",
              }}>
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={current ? "font-semibold" : "opacity-60"}>{label}</span>
            {i < STEPS.length - 1 && <span className="flex-1 h-px" style={{ background: "var(--wmp-border)" }} />}
          </li>
        );
      })}
    </ol>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid md:grid-cols-2 gap-4">{children}</div>;
}
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block space-y-1.5 ${full ? "md:col-span-2" : ""}`}>
      <span className="block">{label}</span>
      {children}
    </label>
  );
}
function ReviewBlock({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="wmp-surface p-4">
      <div className="text-xs uppercase tracking-wider mb-2 opacity-60">{title}</div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="opacity-60">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
function DiagnosisCard({ d }: { d: WmpAcousticDiagnosis }) {
  return (
    <div className="md:col-span-2 wmp-surface p-5 border-2" style={{ borderColor: "var(--wmp-gold)" }}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="wmp-display text-xl flex items-center gap-2">
          <Sparkles className="size-4" style={{ color: "var(--wmp-gold)" }} />
          Pré-diagnóstico
        </h4>
        <span className="wmp-chip">Confiança: {d.confianca}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Metric label="PA recomendado" v={`${d.potencia_recomendada_w.toLocaleString("pt-BR")} W`} />
        <Metric label="Subwoofer" v={`${d.subwoofer_recomendado_w.toLocaleString("pt-BR")} W`} />
        <Metric label="Microfones" v={String(d.microfones_qtd)} />
        <Metric label="Monitores" v={String(d.monitores_qtd)} />
        <Metric label="PAR LED" v={String(d.iluminacao_par_qtd)} />
        <Metric label="Moving heads" v={String(d.iluminacao_movingheads_qtd)} />
        <Metric label="Área" v={`${d.area_m2} m²`} />
        <Metric label="RT60" v={d.reverberacao_estimada_s ? `${d.reverberacao_estimada_s}s` : "—"} />
      </div>
      <div className="mt-3 text-sm">
        <span className="wmp-chip" style={{ background: "color-mix(in oklab, var(--wmp-violet) 25%, transparent)", color: "var(--wmp-fg)", borderColor: "var(--wmp-violet)" }}>
          Pacote sugerido: {d.pacote_sugerido}
        </span>
      </div>
      {d.alertas.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {d.alertas.map((a) => <li key={a}>⚠ {a}</li>)}
        </ul>
      )}
      {d.recomendacoes.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm opacity-80">
          {d.recomendacoes.map((r) => <li key={r}>• {r}</li>)}
        </ul>
      )}
    </div>
  );
}
function Metric({ label, v }: { label: string; v: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider opacity-60">{label}</div>
      <div className="wmp-display text-lg">{v}</div>
    </div>
  );
}
