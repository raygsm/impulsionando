import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ModuleCard } from "@/components/orcamento/ModuleCard";
import { CATALOG_MODULES, getModule } from "@/data/moduleCatalog";
import { getCommercialAvailability } from "@/lib/commercial.functions";
import { createQuote, updateQuote, acceptQuote, requestPayment } from "@/lib/quote.functions";

export const Route = createFileRoute("/orcamento")({
  head: () => ({
    meta: [
      { title: "Solicite sua proposta — Impulsionando Tecnologia" },
      { name: "description", content: "Escolha módulos certificados e receba uma proposta baseada nos planos oficiais da Impulsionando Tecnologia." },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/orcamento" }],
  }),
  component: OrcamentoPage,
});

type QuoteState = {
  quoteId: string | null;
  publicToken: string | null;
  quoteNumber: string | null;
  planCode: string | null;
  planName: string | null;
  recurringCents: number;
  setupCents: number;
};

const emptyQuote: QuoteState = { quoteId: null, publicToken: null, quoteNumber: null, planCode: null, planName: null, recurringCents: 0, setupCents: 0 };
const brl = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

function OrcamentoPage() {
  const availabilityFn = useServerFn(getCommercialAvailability);
  const createFn = useServerFn(createQuote);
  const updateFn = useServerFn(updateQuote);
  const acceptFn = useServerFn(acceptQuote);
  const requestFn = useServerFn(requestPayment);
  const { data: availability, isLoading } = useQuery({ queryKey: ["quote-commercial-availability"], queryFn: () => availabilityFn(), staleTime: 60_000 });

  const [step, setStep] = useState(1);
  const [lead, setLead] = useState({ name: "", whatsapp: "", email: "", companyName: "", companyTaxId: "", category: "", segment: "" });
  const [selected, setSelected] = useState<string[]>([]);
  const [quote, setQuote] = useState<QuoteState>(emptyQuote);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  const availableSet = useMemo(() => new Set(availability?.availableModuleSlugs ?? []), [availability]);
  const availableCatalog = useMemo(() => CATALOG_MODULES.filter((m) => availableSet.has(m.motherSlug)), [availableSet]);

  async function ensureQuote() {
    setLoading(true);
    try {
      if (!quote.quoteId || !quote.publicToken) {
        const result = await createFn({ data: { lead: { name: lead.name, whatsapp: lead.whatsapp, email: lead.email || undefined }, company: { companyName: lead.companyName || undefined, companyTaxId: lead.companyTaxId || undefined }, category: lead.category || undefined, segment: lead.segment || undefined, modules: selected, tracking: { origin: "/orcamento" } } });
        const next = { quoteId: result.id, publicToken: result.publicToken, quoteNumber: result.quoteNumber, planCode: result.planCode ?? null, planName: result.planName ?? null, recurringCents: result.recurringCents ?? 0, setupCents: result.setupCents ?? 0 };
        setQuote(next);
        return next;
      }
      const result = await updateFn({ data: { id: quote.quoteId, publicToken: quote.publicToken, modules: selected, company: { companyName: lead.companyName || undefined, companyTaxId: lead.companyTaxId || undefined }, category: lead.category || undefined, segment: lead.segment || undefined } });
      const next = { ...quote, planCode: result.planCode ?? quote.planCode, planName: result.planName ?? quote.planName, recurringCents: result.recurringCents ?? quote.recurringCents, setupCents: result.setupCents ?? quote.setupCents };
      setQuote(next);
      return next;
    } finally { setLoading(false); }
  }

  async function goToPlan() {
    if (!lead.name.trim() || lead.whatsapp.replace(/\D/g, "").length < 10) return toast.error("Informe nome e WhatsApp válidos.");
    if (!selected.length) return toast.error("Selecione ao menos um módulo certificado.");
    try { await ensureQuote(); setStep(4); } catch (e) { toast.error((e as Error).message); }
  }

  async function finalize() {
    if (!quote.quoteId || !quote.publicToken) return;
    if (!accepted) return toast.error("Confirme o aceite das condições da proposta.");
    setLoading(true);
    try {
      await acceptFn({ data: { id: quote.quoteId, publicToken: quote.publicToken, userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined, terms: { terms: true, modules: true, deadlines: true, integrations: true, refund: true } } });
      await requestFn({ data: { id: quote.quoteId, publicToken: quote.publicToken } });
      setFinished(true);
    } catch (e) { toast.error((e as Error).message); } finally { setLoading(false); }
  }

  return <div className="min-h-screen flex flex-col bg-background">
    <PublicHeader />
    <main className="flex-1"><div className="container max-w-6xl mx-auto px-4 py-10">
      <div className="text-center mb-8"><Badge variant="secondary" className="mb-3"><Sparkles className="h-3 w-3 mr-1" />Proposta conectada ao Core</Badge><h1 className="text-3xl md:text-4xl font-bold">Monte sua proposta</h1><p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Você escolhe os módulos certificados. O Core define automaticamente o plano oficial aplicável. Não existe preço fictício por módulo nem checkout direto nesta jornada.</p></div>

      {finished ? <Card className="p-8 text-center max-w-2xl mx-auto"><CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4"/><h2 className="text-2xl font-bold">Proposta registrada</h2><p className="text-muted-foreground mt-2">Número: <strong>{quote.quoteNumber}</strong>. A próxima etapa é o contato comercial para formalização e pagamento conforme a proposta aprovada.</p><p className="text-sm text-muted-foreground mt-4">Nenhuma cobrança foi criada automaticamente.</p></Card> : <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <Card className="p-6">
          {step === 1 && <div className="space-y-5"><div><h2 className="text-2xl font-bold">1. Identificação</h2><p className="text-sm text-muted-foreground">Dados mínimos para gerar e rastrear sua proposta.</p></div><div className="grid md:grid-cols-2 gap-4"><Field label="Nome *" value={lead.name} onChange={(v)=>setLead({...lead,name:v})}/><Field label="WhatsApp *" value={lead.whatsapp} onChange={(v)=>setLead({...lead,whatsapp:v})}/><Field label="E-mail" value={lead.email} onChange={(v)=>setLead({...lead,email:v})}/><Field label="Empresa" value={lead.companyName} onChange={(v)=>setLead({...lead,companyName:v})}/></div><Button onClick={()=>setStep(2)}>Continuar</Button></div>}
          {step === 2 && <div className="space-y-5"><div><h2 className="text-2xl font-bold">2. Segmento</h2><p className="text-sm text-muted-foreground">Ajuda a equipe e o Impulsionito a contextualizar a proposta e os módulos.</p></div><div className="grid md:grid-cols-2 gap-4"><Field label="Categoria" value={lead.category} onChange={(v)=>setLead({...lead,category:v})} placeholder="Ex.: Saúde, Eventos, Varejo"/><Field label="Segmento" value={lead.segment} onChange={(v)=>setLead({...lead,segment:v})} placeholder="Ex.: Clínica médica, Restaurante"/><Field label="CNPJ" value={lead.companyTaxId} onChange={(v)=>setLead({...lead,companyTaxId:v})}/></div><div className="flex gap-2"><Button variant="outline" onClick={()=>setStep(1)}>Voltar</Button><Button onClick={()=>setStep(3)}>Escolher módulos</Button></div></div>}
          {step === 3 && <div className="space-y-5"><div><h2 className="text-2xl font-bold">3. Módulos certificados</h2><p className="text-sm text-muted-foreground">Só aparecem módulos liberados pelo Core para contratação. Recursos em homologação permanecem fora da proposta.</p></div>{isLoading ? <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Carregando catálogo...</div> : <div className="grid md:grid-cols-2 gap-3">{availableCatalog.map((m)=><ModuleCard key={m.slug} module={m} selected={selected.includes(m.slug)} onToggle={()=>setSelected(selected.includes(m.slug)?selected.filter((s)=>s!==m.slug):[...selected,m.slug])}/>)}</div>}<div className="flex gap-2"><Button variant="outline" onClick={()=>setStep(2)}>Voltar</Button><Button onClick={goToPlan} disabled={loading || !selected.length}>{loading&&<Loader2 className="h-4 w-4 mr-1 animate-spin"/>Calcular plano oficial</Button></div></div>}
          {step === 4 && <div className="space-y-5"><div><h2 className="text-2xl font-bold">4. Plano oficial</h2><p className="text-sm text-muted-foreground">Preço e implantação vêm diretamente de <code>billing_plans</code>.</p></div><Card className="p-5 bg-primary/5 border-primary/20"><div className="text-sm text-muted-foreground">Plano recomendado</div><div className="text-2xl font-bold mt-1">{quote.planName ?? quote.planCode}</div><div className="grid sm:grid-cols-2 gap-3 mt-4"><Metric label="Mensalidade" value={brl(quote.recurringCents)}/><Metric label="Implantação" value={brl(quote.setupCents)}/></div><div className="mt-4 text-sm text-muted-foreground space-y-1"><p>• Contratação mínima: 90 dias.</p><p>• Vencimento contratual: dia 5.</p><p>• O pagamento é formalizado após aprovação comercial.</p><p>• Checkout direto está desativado nesta jornada.</p></div></Card><div className="flex gap-2"><Button variant="outline" onClick={()=>setStep(3)}>Alterar módulos</Button><Button onClick={()=>setStep(5)}>Revisar proposta</Button></div></div>}
          {step === 5 && <div className="space-y-5"><div><h2 className="text-2xl font-bold">5. Revisão e aceite</h2><p className="text-sm text-muted-foreground">Confira o escopo antes de enviar a solicitação comercial.</p></div><ul className="space-y-2">{selected.map((slug)=><li key={slug} className="border rounded-md p-3"><strong>{getModule(slug)?.name ?? slug}</strong><div className="text-xs text-muted-foreground">Incluído conforme o plano {quote.planName}.</div></li>)}</ul><Card className="p-4"><div className="flex items-start gap-3"><Checkbox checked={accepted} onCheckedChange={(v)=>setAccepted(v===true)}/><div className="text-sm"><strong>Li e concordo com a proposta.</strong><p className="text-muted-foreground mt-1">Reconheço o plano, módulos, implantação, prazo mínimo de 90 dias, vencimento dia 5, dependências de integração e que o pagamento será tratado após a aprovação comercial.</p></div></div></Card><div className="flex gap-2"><Button variant="outline" onClick={()=>setStep(4)}>Voltar</Button><Button onClick={finalize} disabled={!accepted||loading}>{loading&&<Loader2 className="h-4 w-4 mr-1 animate-spin"/>Enviar proposta</Button></div></div>}
        </Card>

        <aside><Card className="p-5 sticky top-24"><div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-primary"/>Resumo</div><div className="mt-4 text-sm"><div className="text-muted-foreground">Módulos</div><div className="text-xl font-bold">{selected.length}</div></div>{quote.planName&&<div className="mt-4"><div className="text-xs text-muted-foreground">Plano</div><div className="font-semibold">{quote.planName}</div><div className="text-lg font-bold mt-1">{brl(quote.recurringCents)}/mês</div><div className="text-xs text-muted-foreground">Implantação: {brl(quote.setupCents)}</div></div>}<div className="mt-5 pt-4 border-t text-xs text-muted-foreground">Fonte: Core Impulsionando. Disponibilidade e preços não são calculados localmente.</div></Card></aside>
      </div>}
    </div></main>
    <PublicFooter />
  </div>;
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v:string)=>void; placeholder?: string }) { return <div><Label>{label}</Label><Input value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} className="mt-1"/></div>; }
function Metric({ label, value }: { label:string; value:string }) { return <div className="rounded-md bg-background border p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="font-bold text-lg">{value}</div></div>; }
