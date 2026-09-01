import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/impulsionando";
import { getClubePublicOverview } from "@/lib/clube-public.functions";

const publicQuery = queryOptions({ queryKey:["clube-public-overview"], queryFn:()=>getClubePublicOverview(), staleTime:60_000 });

export const Route = createFileRoute("/clube/buscar")({
  loader:({context})=>context.queryClient.ensureQueryData(publicQuery),
  head:()=>({meta:[{title:"Buscar no Clube — Impulsionando"},{name:"description",content:"Busca nas empresas publicadas do Ecossistema Impulsionando."},{name:"robots",content:"noindex,follow"}],links:[{rel:"canonical",href:"https://impulsionando.com.br/clube/buscar"}]}),
  component:ClubeBuscar,
});

function ClubeBuscar(){
 const {data}=useSuspenseQuery(publicQuery);
 return <section className="mx-auto max-w-7xl px-6 py-10">
  <SectionHeader eyebrow="Busca do Clube" title="Empresas realmente publicadas" description="Os resultados abaixo vêm da vitrine pública do Core. Filtros avançados serão exibidos somente quando houver dados estruturados correspondentes." align="left"/>
  <Card className="p-5 md:p-6 mt-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><label className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60"/><Input placeholder="Empresa ou segmento" className="pl-9"/></label><label className="relative"><MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60"/><Input placeholder="Cidade" className="pl-9"/></label></div><div className="flex flex-wrap gap-2 mt-4">{data.categories.map((c:any)=><span key={c.slug} className="text-xs rounded-full border border-border px-3 py-1">{c.label} ({c.count})</span>)}</div></Card>
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">{data.companies.map((t:any)=><article key={t.id} className="rounded-xl border border-border bg-card/60 p-5"><div className="flex items-center justify-between mb-3"><div className="w-10 h-10 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center font-semibold">{String(t.trade_name||t.name||"IP").slice(0,2).toUpperCase()}</div><span className="text-[10px] uppercase tracking-wider rounded-full bg-muted px-2 py-1">{t.segment||"Parceiro"}</span></div><div className="font-serif text-base">{t.trade_name||t.name}</div><div className="text-xs opacity-70 mt-1">{[t.address_city,t.address_state].filter(Boolean).join(" / ")||"Localização não informada"}</div>{t.website&&<a href={t.website} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-xs text-primary">Conhecer empresa →</a>}</article>)}</div>
  {!data.companies.length&&<p className="text-sm opacity-70 mt-8">Nenhuma empresa publicada no momento.</p>}
 </section>;
}
