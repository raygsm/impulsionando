import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { WmpShell } from "@/components/wmp/WmpShell";
import { submitWmpParceiro } from "@/lib/wmp.functions";

export const Route = createFileRoute("/wmp/parceiro/cadastro")({
  head: () => ({ meta: [{ title: "Cadastro de Parceiro — WMP" }] }),
  component: WmpParceiroCadastro,
});

type RefOption={code:string;label:string};
type Municipality={ibge:string;nome:string;uf:string};

function WmpParceiroCadastro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "", nome_artistico: "", email: "", telefone: "",
    categoria: "", cidade: "", estado: "", municipio_ibge: "", experiencia_anos: "",
    bio: "",
  });
  const [categories,setCategories]=useState<RefOption[]>([]);
  const [states,setStates]=useState<RefOption[]>([]);
  const [cities,setCities]=useState<Municipality[]>([]);
  const [listsLoading,setListsLoading]=useState(true);
  const [citiesLoading,setCitiesLoading]=useState(false);
  const [links, setLinks] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function up<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  useEffect(()=>{
    let active=true;
    Promise.all([
      fetch('/api/public/referencias/wmp_partner_categories').then(r=>r.ok?r.json():Promise.reject(new Error('Categorias indisponíveis'))),
      fetch('/api/public/referencias/br_states').then(r=>r.ok?r.json():Promise.reject(new Error('UFs indisponíveis'))),
    ]).then(([cat,uf])=>{
      if(!active)return;
      const categoryOptions=(cat.options??[]) as RefOption[];
      setCategories(categoryOptions);
      setStates((uf.options??[]) as RefOption[]);
      if(categoryOptions.length) setForm(f=>({...f,categoria:f.categoria||categoryOptions[0].code}));
    }).catch(()=>{if(active)setError('Não foi possível carregar as listas canônicas do cadastro.')})
      .finally(()=>{if(active)setListsLoading(false)});
    return()=>{active=false};
  },[]);

  useEffect(()=>{
    if(!form.estado){setCities([]);return;}
    let active=true;setCitiesLoading(true);
    fetch(`/api/public/municipios/${form.estado}`)
      .then(r=>r.ok?r.json():Promise.reject(new Error('Municípios indisponíveis')))
      .then(payload=>{if(active)setCities((payload.municipalities??[]) as Municipality[])})
      .catch(()=>{if(active){setCities([]);setError('Não foi possível carregar os municípios desta UF.')}})
      .finally(()=>{if(active)setCitiesLoading(false)});
    return()=>{active=false};
  },[form.estado]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if(!form.categoria||!form.estado||!form.cidade||!form.municipio_ibge){setError('Selecione categoria, UF e município nas listas.');return;}
    setSubmitting(true); setError(null);
    try {
      const res = await submitWmpParceiro({
        data: {
          nome:form.nome,nome_artistico:form.nome_artistico,email:form.email,telefone:form.telefone,
          categoria:form.categoria,cidade:form.cidade,estado:form.estado,municipio_ibge:form.municipio_ibge,
          experiencia_anos: Number(form.experiencia_anos) || null,
          bio:form.bio,
          portfolio_links: links.filter((l) => l.trim()),
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          origem: "site_wmp_parceiro",
        },
      });
      navigate({ to: "/wmp/obrigado/$tipo", params: { tipo: "parceiro" }, search: { id: res.id } });
    } catch (err: any) {
      setError(err?.message ?? "Falha ao enviar cadastro.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <WmpShell>
      <section className="wmp-stage-bg">
        <div className="mx-auto max-w-3xl px-6 pt-14 pb-10 text-center">
          <h1 className="wmp-display text-3xl md:text-5xl mb-3">Cadastro de Parceiro</h1>
          <p className="opacity-80">Compartilhe seu perfil. Avaliamos em até 5 dias úteis.</p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 pb-24 -mt-6">
        <form onSubmit={handleSubmit} className="wmp-surface p-6 md:p-10 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Nome completo *"><input required value={form.nome} onChange={(e) => up("nome", e.target.value)} /></Field>
            <Field label="Nome artístico"><input value={form.nome_artistico} onChange={(e) => up("nome_artistico", e.target.value)} /></Field>
            <Field label="E-mail *"><input required type="email" value={form.email} onChange={(e) => up("email", e.target.value)} /></Field>
            <Field label="WhatsApp *"><input required value={form.telefone} onChange={(e) => up("telefone", e.target.value)} /></Field>
            <Field label="Categoria *"><select required disabled={listsLoading} value={form.categoria} onChange={(e) => up("categoria", e.target.value)}><option value="">Selecione</option>{categories.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}</select></Field>
            <Field label="Anos de experiência"><input type="number" min={0} max={80} value={form.experiencia_anos} onChange={(e) => up("experiencia_anos", e.target.value)} /></Field>
            <Field label="UF *"><select required disabled={listsLoading} value={form.estado} onChange={(e)=>setForm(f=>({...f,estado:e.target.value,cidade:"",municipio_ibge:""}))}><option value="">Selecione</option>{states.map(uf=><option key={uf.code} value={uf.code}>{uf.code} — {uf.label}</option>)}</select></Field>
            <Field label="Município *"><select required disabled={!form.estado||citiesLoading} value={form.municipio_ibge} onChange={(e)=>{const city=cities.find(c=>c.ibge===e.target.value);setForm(f=>({...f,municipio_ibge:e.target.value,cidade:city?.nome??""}))}}><option value="">{citiesLoading?'Carregando...':'Selecione'}</option>{cities.map(c=><option key={c.ibge} value={c.ibge}>{c.nome}</option>)}</select></Field>
            <Field label="Sobre você (mini-bio)" full><textarea rows={4} value={form.bio} onChange={(e) => up("bio", e.target.value)} maxLength={1500} /></Field>
            <div className="md:col-span-2 space-y-2">
              <span className="block text-sm" style={{ color: "var(--wmp-muted)" }}>Portfólio (Instagram, YouTube, SoundCloud, site…)</span>
              {links.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <input type="url" value={l} onChange={(e) => setLinks((arr) => arr.map((x, j) => j === i ? e.target.value : x))} placeholder="https://…" />
                  {links.length > 1 && <button type="button" onClick={() => setLinks((arr) => arr.filter((_, j) => j !== i))} className="wmp-cta wmp-cta-outline" style={{ padding: "0.5rem" }}><Trash2 className="size-4" /></button>}
                </div>
              ))}
              <button type="button" onClick={() => setLinks((arr) => [...arr, ""])} className="wmp-cta wmp-cta-outline" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}><Plus className="size-4" /> Adicionar link</button>
            </div>
          </div>
          {error && <div className="p-3 rounded-lg text-sm" style={{ background: "color-mix(in oklab, red 20%, transparent)", color: "white" }}>{error}</div>}
          <div className="flex justify-end"><button type="submit" disabled={submitting||listsLoading} className="wmp-cta">{submitting ? <><Loader2 className="size-4 animate-spin" /> Enviando…</> : <><Check className="size-4" /> Enviar cadastro</>}</button></div>
        </form>
      </section>
    </WmpShell>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <label className={`block space-y-1.5 ${full ? "md:col-span-2" : ""}`}><span className="block text-sm" style={{ color: "var(--wmp-muted)" }}>{label}</span>{children}</label>;
}
