import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Wand2 } from "lucide-react";
import { WmpShell } from "@/components/wmp/WmpShell";
import { submitWmpBriefing } from "@/lib/wmp.functions";
import { diagnoseAcoustics, type WmpAcousticDiagnosis } from "@/lib/wmp/acoustic-rules";
import { WMP_AUDIENCE_RANGES, WMP_FLOOR_MATERIALS, WMP_WALL_MATERIALS, WMP_UFS, WMP_BASE_MICROPHONES } from "@/lib/wmp/briefing-options";
import { lookupCEP } from "@/lib/validators";

type Municipality = { ibge: string; nome: string; uf: string };
type FormState = {
  contratante_nome: string; contratante_email: string; contratante_telefone: string; contratante_empresa: string;
  evento_tipo: string; evento_data: string; evento_horario_inicio: string; evento_horario_fim: string;
  evento_publico_faixa: string; evento_cep: string; evento_bairro: string; evento_cidade: string; evento_estado: string; evento_municipio_ibge: string; evento_endereco: string;
  ambiente_tipo: "fechado" | "aberto" | "semi_aberto"; ambiente_piso: string; ambiente_paredes: string;
  ambiente_altura: string; medidas_largura: string; medidas_comprimento: string;
  acustica_estilo: "dj_eletronico" | "banda_rock" | "voz_palestra" | "musica_ambiente" | "show_grande_porte";
  microfones_adicionais: string;
};

const INIT: FormState = {
  contratante_nome: "", contratante_email: "", contratante_telefone: "", contratante_empresa: "",
  evento_tipo: "casamento", evento_data: "", evento_horario_inicio: "", evento_horario_fim: "",
  evento_publico_faixa: "", evento_cep: "", evento_bairro: "", evento_cidade: "", evento_estado: "", evento_municipio_ibge: "", evento_endereco: "",
  ambiente_tipo: "fechado", ambiente_piso: "ceramica", ambiente_paredes: "alvenaria", ambiente_altura: "", medidas_largura: "", medidas_comprimento: "",
  acustica_estilo: "musica_ambiente", microfones_adicionais: "0",
};

const STEPS = ["Contato", "Evento", "Ambiente", "Uso", "Revisão"] as const;

export function WmpOrcamentoForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INIT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [cities, setCities] = useState<Municipality[]>([]);
  const [livePreview, setLivePreview] = useState<WmpAcousticDiagnosis | null>(null);

  const audience = useMemo(() => WMP_AUDIENCE_RANGES.find((r) => r.value === form.evento_publico_faixa), [form.evento_publico_faixa]);
  const audienceTechnical = audience?.technicalValue;
  const baseMics = WMP_BASE_MICROPHONES[form.acustica_estilo] ?? 0;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) { setForm((f) => ({ ...f, [key]: value })); }

  useEffect(() => {
    if (!form.evento_estado) { setCities([]); return; }
    let active = true;
    setCitiesLoading(true);
    fetch(`/api/public/municipios/${form.evento_estado}`, { headers: { accept: "application/json" } })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("Falha ao carregar municípios")))
      .then((payload: { municipalities?: Municipality[] }) => { if (active) setCities(payload.municipalities ?? []); })
      .catch(() => { if (active) setCities(form.evento_cidade && form.evento_municipio_ibge ? [{ nome: form.evento_cidade, ibge: form.evento_municipio_ibge, uf: form.evento_estado }] : []); })
      .finally(() => { if (active) setCitiesLoading(false); });
    return () => { active = false; };
  }, [form.evento_estado, form.evento_cidade, form.evento_municipio_ibge]);

  async function lookupCep(raw: string) {
    const cep = raw.replace(/\D/g, "").slice(0, 8);
    update("evento_cep", cep);
    if (cep.length !== 8) return;
    setCepLoading(true); setError(null);
    try {
      const data = await lookupCEP(cep);
      if (!data) throw new Error("CEP não encontrado.");
      setForm((f) => ({
        ...f,
        evento_cep: cep,
        evento_endereco: data.logradouro ?? "",
        evento_bairro: data.bairro ?? "",
        evento_estado: data.uf ?? "",
        evento_cidade: data.cidade ?? "",
        evento_municipio_ibge: data.ibge ?? "",
      }));
    } catch (e: any) { setError(e?.message ?? "Não foi possível consultar o CEP."); }
    finally { setCepLoading(false); }
  }

  function refreshPreview(next = form) {
    setLivePreview(diagnoseAcoustics({
      ambiente: { tipo: next.ambiente_tipo, material_piso: next.ambiente_piso, material_paredes: next.ambiente_paredes, teto_altura_m: Number(next.ambiente_altura) || undefined },
      medidas: { largura_m: Number(next.medidas_largura) || undefined, comprimento_m: Number(next.medidas_comprimento) || undefined },
      evento: { publico_estimado: WMP_AUDIENCE_RANGES.find((r) => r.value === next.evento_publico_faixa)?.technicalValue, horario_fim: next.evento_horario_fim, tipo: next.evento_tipo },
      acustica: { estilo: next.acustica_estilo, microfones_adicionais: Number(next.microfones_adicionais) || 0 },
    }));
  }

  function canAdvance() {
    if (step === 0) return form.contratante_nome.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contratante_email) && form.contratante_telefone.trim().length >= 8;
    if (step === 1) return !!form.evento_tipo && !!form.evento_data && !!form.evento_publico_faixa && form.evento_cep.replace(/\D/g, "").length === 8 && !!form.evento_estado && !!form.evento_cidade && !!form.evento_municipio_ibge;
    return true;
  }

  function next() {
    if (!canAdvance()) { setError("Preencha os campos obrigatórios antes de avançar."); return; }
    setError(null); if (step === 2 || step === 3) refreshPreview(); setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function handleSubmit() {
    setSubmitting(true); setError(null);
    try {
      const res = await submitWmpBriefing({ data: {
        contratante_nome: form.contratante_nome, contratante_email: form.contratante_email, contratante_telefone: form.contratante_telefone, contratante_empresa: form.contratante_empresa,
        evento_tipo: form.evento_tipo, evento_data: form.evento_data || undefined, evento_horario_inicio: form.evento_horario_inicio || undefined, evento_horario_fim: form.evento_horario_fim || undefined,
        evento_publico_estimado: audienceTechnical ?? null, evento_perfil_publico: audience?.label,
        evento_cep: form.evento_cep, evento_bairro: form.evento_bairro, evento_cidade: form.evento_cidade, evento_estado: form.evento_estado, evento_municipio_ibge: form.evento_municipio_ibge, evento_endereco: form.evento_endereco,
        ambiente: { tipo: form.ambiente_tipo, material_piso: form.ambiente_piso, material_paredes: form.ambiente_paredes, teto_altura_m: Number(form.ambiente_altura) || undefined },
        medidas: { largura_m: Number(form.medidas_largura) || undefined, comprimento_m: Number(form.medidas_comprimento) || undefined },
        acustica: { estilo: form.acustica_estilo, microfones_adicionais: Number(form.microfones_adicionais) || 0 },
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined, origem: "site_wmp",
      }});
      navigate({ to: "/wmp/obrigado/$tipo", params: { tipo: "orcamento" }, search: { id: res.id } });
    } catch (e: any) { setError(e?.message ?? "Falha ao enviar. Tente novamente."); }
    finally { setSubmitting(false); }
  }

  return <WmpShell breadcrumbs={[{ label: "Orçamento" }]}>
    <section className="wmp-stage-bg"><div className="mx-auto max-w-3xl px-5 pt-10 pb-10 text-center"><span className="wmp-chip mb-4"><Wand2 className="size-3"/> Briefing inteligente</span><h1 className="wmp-display text-3xl md:text-5xl mb-3">Seu evento, dimensionado com inteligência</h1><p className="opacity-80">Informe o ambiente e o uso. A WMP monta um pré-diagnóstico técnico e transforma adicionais em itens rastreáveis da proposta.</p></div></section>
    <section className="mx-auto max-w-3xl px-4 md:px-6 pb-24 -mt-6"><Stepper step={step}/><div className="wmp-surface p-5 md:p-10 mt-6">
      {step === 0 && <Grid><Field label="Nome completo *"><input value={form.contratante_nome} onChange={(e)=>update("contratante_nome",e.target.value)}/></Field><Field label="E-mail *"><input type="email" value={form.contratante_email} onChange={(e)=>update("contratante_email",e.target.value)}/></Field><Field label="WhatsApp *"><input value={form.contratante_telefone} onChange={(e)=>update("contratante_telefone",e.target.value)} placeholder="(21) 99999-0000"/></Field><Field label="Empresa (opcional)"><input value={form.contratante_empresa} onChange={(e)=>update("contratante_empresa",e.target.value)}/></Field></Grid>}
      {step === 1 && <Grid>
        <Field label="Tipo de evento *"><select value={form.evento_tipo} onChange={(e)=>update("evento_tipo",e.target.value)}><option value="casamento">Casamento</option><option value="aniversario">Aniversário</option><option value="corporativo">Corporativo</option><option value="show">Show / Festival</option><option value="formatura">Formatura</option><option value="palestra">Palestra / Convenção</option><option value="karaoke">Karaokê</option><option value="outro">Outro</option></select></Field>
        <Field label="Data *"><input type="date" value={form.evento_data} onChange={(e)=>update("evento_data",e.target.value)}/></Field>
        <Field label="Horário de início"><input type="time" value={form.evento_horario_inicio} onChange={(e)=>update("evento_horario_inicio",e.target.value)}/></Field><Field label="Horário de término"><input type="time" value={form.evento_horario_fim} onChange={(e)=>update("evento_horario_fim",e.target.value)}/></Field>
        <Field label="Público estimado *"><select value={form.evento_publico_faixa} onChange={(e)=>update("evento_publico_faixa",e.target.value)}><option value="">Selecione</option>{WMP_AUDIENCE_RANGES.map((r)=><option key={r.value} value={r.value}>{r.label}</option>)}</select></Field>
        <Field label="CEP *"><div className="relative"><input inputMode="numeric" value={form.evento_cep} onChange={(e)=>lookupCep(e.target.value)} placeholder="00000000"/>{cepLoading && <Loader2 className="absolute right-3 top-3 size-4 animate-spin"/>}</div><small className="opacity-60">Digite o CEP primeiro. Município e UF são preenchidos e consolidados automaticamente.</small></Field>
        <Field label="Endereço"><input value={form.evento_endereco} onChange={(e)=>update("evento_endereco",e.target.value)} placeholder="Preenchido pelo CEP; complemente somente quando necessário"/></Field>
        <Field label="Bairro"><input value={form.evento_bairro} onChange={(e)=>update("evento_bairro",e.target.value)} readOnly={!!form.evento_bairro} placeholder="Preenchido pelo CEP quando disponível"/></Field>
        <Field label="Estado *"><select value={form.evento_estado} onChange={(e)=>{update("evento_estado",e.target.value);update("evento_cidade","");update("evento_municipio_ibge","");}}><option value="">Selecione</option>{WMP_UFS.map(([uf,nome])=><option key={uf} value={uf}>{uf} — {nome}</option>)}</select></Field>
        <Field label="Cidade *"><select value={form.evento_municipio_ibge} disabled={!form.evento_estado || citiesLoading} onChange={(e)=>{const chosen=cities.find((city)=>city.ibge===e.target.value);update("evento_municipio_ibge",e.target.value);update("evento_cidade",chosen?.nome??"");}}><option value="">{citiesLoading?"Carregando...":"Selecione"}</option>{form.evento_municipio_ibge && !cities.some((city)=>city.ibge===form.evento_municipio_ibge) && <option value={form.evento_municipio_ibge}>{form.evento_cidade}</option>}{cities.map((city)=><option key={city.ibge} value={city.ibge}>{city.nome}</option>)}</select></Field>
      </Grid>}
      {step === 2 && <Grid><Field label="Tipo de ambiente"><select value={form.ambiente_tipo} onChange={(e)=>update("ambiente_tipo",e.target.value as FormState["ambiente_tipo"])}><option value="fechado">Fechado</option><option value="semi_aberto">Semi-aberto</option><option value="aberto">Aberto</option></select></Field><Field label="Altura do teto (m)"><input type="number" step="0.1" value={form.ambiente_altura} onChange={(e)=>update("ambiente_altura",e.target.value)}/></Field><Field label="Largura (m)"><input type="number" step="0.1" value={form.medidas_largura} onChange={(e)=>update("medidas_largura",e.target.value)}/></Field><Field label="Comprimento (m)"><input type="number" step="0.1" value={form.medidas_comprimento} onChange={(e)=>update("medidas_comprimento",e.target.value)}/></Field><Field label="Material do piso"><select value={form.ambiente_piso} onChange={(e)=>update("ambiente_piso",e.target.value)}>{WMP_FLOOR_MATERIALS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field><Field label="Material das paredes"><select value={form.ambiente_paredes} onChange={(e)=>update("ambiente_paredes",e.target.value)}>{WMP_WALL_MATERIALS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field></Grid>}
      {step === 3 && <Grid><Field label="Uso predominante" full><select value={form.acustica_estilo} onChange={(e)=>update("acustica_estilo",e.target.value as FormState["acustica_estilo"])}><option value="musica_ambiente">Música ambiente</option><option value="voz_palestra">Voz / palestra / cerimônia</option><option value="dj_eletronico">DJ / eletrônico</option><option value="banda_rock">Banda / show</option><option value="show_grande_porte">Show de grande porte</option></select></Field><Field label={`Microfones adicionais (base do setup: ${baseMics})`} full><select value={form.microfones_adicionais} onChange={(e)=>update("microfones_adicionais",e.target.value)}>{Array.from({length:11},(_,i)=><option key={i} value={String(i)}>{i===0?"Nenhum adicional":`+${i} microfone${i>1?"s":""}`}</option>)}</select><small className="opacity-60">Cada adicional será precificado conforme o valor do equipamento definido pela gestão WMP.</small></Field><button type="button" onClick={()=>refreshPreview()} className="wmp-cta wmp-cta-outline mt-2 md:col-span-2 self-start"><Sparkles className="size-4"/> Pré-visualizar diagnóstico</button>{livePreview&&<DiagnosisCard d={livePreview}/>}</Grid>}
      {step === 4 && <div className="space-y-4 text-sm"><h3 className="wmp-display text-2xl">Revisão final</h3><ReviewBlock title="Contato" rows={[["Nome",form.contratante_nome],["E-mail",form.contratante_email],["WhatsApp",form.contratante_telefone],["Empresa",form.contratante_empresa||"—"]]}/><ReviewBlock title="Evento" rows={[["Tipo",form.evento_tipo],["Data",form.evento_data||"—"],["Público",audience?.label||"—"],["CEP",form.evento_cep||"—"],["Local",[form.evento_endereco,form.evento_bairro,form.evento_cidade,form.evento_estado].filter(Boolean).join(" · ")||"—"]]}/><ReviewBlock title="Estrutura" rows={[["Uso",form.acustica_estilo],["Microfones base",String(baseMics)],["Microfones adicionais",form.microfones_adicionais],["Piso",form.ambiente_piso],["Paredes",form.ambiente_paredes]]}/>{livePreview&&<DiagnosisCard d={livePreview}/>}</div>}
      {error&&<div className="mt-4 p-3 rounded-lg text-sm" style={{background:"color-mix(in oklab, red 20%, transparent)",color:"white"}}>{error}</div>}
      <div className="flex items-center justify-between mt-8 gap-3"><button type="button" onClick={()=>setStep((s)=>Math.max(0,s-1))} disabled={step===0} className="wmp-cta wmp-cta-outline disabled:opacity-40"><ArrowLeft className="size-4"/> Voltar</button>{step<STEPS.length-1?<button type="button" onClick={next} className="wmp-cta">Avançar <ArrowRight className="size-4"/></button>:<button type="button" onClick={handleSubmit} disabled={submitting} className="wmp-cta">{submitting?<><Loader2 className="size-4 animate-spin"/> Enviando…</>:<><Check className="size-4"/> Enviar briefing</>}</button>}</div>
    </div></section>
  </WmpShell>;
}

function Stepper({step}:{step:number}){return <ol className="flex items-center justify-between gap-1 text-[10px] md:text-xs">{STEPS.map((label,i)=><li key={label} className="flex-1 flex items-center gap-1 md:gap-2"><span className="size-7 rounded-full flex items-center justify-center font-semibold" style={{background:i<=step?"var(--gradient-wmp-cta)":"var(--wmp-surface-2)",color:i<=step?"var(--wmp-bg)":"var(--wmp-muted)"}}>{i<step?<Check className="size-3.5"/>:i+1}</span><span className={i===step?"font-semibold hidden sm:inline":"opacity-60 hidden sm:inline"}>{label}</span>{i<STEPS.length-1&&<span className="flex-1 h-px" style={{background:"var(--wmp-border)"}}/>}</li>)}</ol>}
function Grid({children}:{children:React.ReactNode}){return <div className="grid md:grid-cols-2 gap-4">{children}</div>}
function Field({label,children,full}:{label:string;children:React.ReactNode;full?:boolean}){return <label className={`block space-y-1.5 ${full?"md:col-span-2":""}`}><span className="block">{label}</span>{children}</label>}
function ReviewBlock({title,rows}:{title:string;rows:[string,string][]}){return <div className="wmp-surface p-4"><div className="text-xs uppercase tracking-wider mb-2 opacity-60">{title}</div><dl className="grid grid-cols-2 gap-x-4 gap-y-1">{rows.map(([k,v])=><div key={k} className="contents"><dt className="opacity-60">{k}</dt><dd>{v}</dd></div>)}</dl></div>}
function DiagnosisCard({d}:{d:WmpAcousticDiagnosis}){return <div className="md:col-span-2 wmp-surface p-5 border-2" style={{borderColor:"var(--wmp-gold)"}}><div className="flex items-center justify-between mb-3"><h4 className="wmp-display text-xl flex items-center gap-2"><Sparkles className="size-4"/>Pré-diagnóstico</h4><span className="wmp-chip">Confiança: {d.confianca}</span></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm"><Metric label="PA recomendado" v={`${d.potencia_recomendada_w.toLocaleString("pt-BR")} W`}/><Metric label="Subwoofer" v={`${d.subwoofer_recomendado_w.toLocaleString("pt-BR")} W`}/><Metric label="Microfones" v={String(d.microfones_qtd)}/><Metric label="Monitores" v={String(d.monitores_qtd)}/><Metric label="PAR LED" v={String(d.iluminacao_par_qtd)}/><Metric label="Moving heads" v={String(d.iluminacao_movingheads_qtd)}/><Metric label="Área" v={`${d.area_m2} m²`}/><Metric label="RT60" v={d.reverberacao_estimada_s?`${d.reverberacao_estimada_s}s`:"—"}/></div><div className="mt-3"><span className="wmp-chip">Setup sugerido: {d.pacote_sugerido}</span></div>{d.alertas.length>0&&<ul className="mt-3 space-y-1 text-sm">{d.alertas.map((a)=><li key={a}>⚠ {a}</li>)}</ul>}{d.recomendacoes.length>0&&<ul className="mt-2 space-y-1 text-sm opacity-80">{d.recomendacoes.map((r)=><li key={r}>• {r}</li>)}</ul>}</div>}
function Metric({label,v}:{label:string;v:string}){return <div><div className="text-[11px] uppercase tracking-wider opacity-60">{label}</div><div className="wmp-display text-lg">{v}</div></div>}
