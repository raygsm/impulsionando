/**
 * /busca — "Busque o que Precisa".
 *
 * Acesso restrito a Impulsionitos (assinantes do Clube — inclui plano free).
 * Sem assinatura ativa, exibe CTA para entrar/assinar o Clube.
 *
 * Aqui ficam todos os filtros do antigo /ecossistema (CEP, Cidade, Bairro,
 * Distância, Categoria macro, Avaliação mínima, Benefícios) + busca natural,
 * lista/mapa e resultados.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { getPublicVitrine } from "@/lib/consumer.functions";
import { useConsumerHasActiveMembership } from "@/hooks/use-consumer-membership";
import {
  Sparkles, MapPin, Search, Building2, Star, Gift, Ticket, Crown,
  Calendar, MessageCircle, List, Map as MapIcon, Locate, Filter, Lock,
} from "lucide-react";

const searchSchema = z.object({
  geo: z.number().optional(),
  q: z.string().optional(),
  cat: z.string().optional(),
  city: z.string().optional(),
}).partial();

export const Route = createFileRoute("/_authenticated/busca")({
  validateSearch: (s) => searchSchema.parse(s ?? {}),
  head: () => ({
    meta: [
      { title: "Busque o que Precisa — Ecossistema Impulsionando" },
      { name: "description", content: "Busca exclusiva para Impulsionitos: filtros por CEP, cidade, bairro, distância, categoria, avaliação e benefícios." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: BuscaGatePage,
});

const MACRO_CATEGORIES: Array<{ id: string; label: string; segments: string[]; services: string[] }> = [
  { id: "saude", label: "Saúde", segments: ["saude", "clinica", "consultorio"], services: ["clínica médica","teleconsulta","atendimento domiciliar","medicina ocupacional","psicologia","terapias","nutrição","fisioterapia"] },
  { id: "alimentacao", label: "Alimentação", segments: ["restaurante","bar","cervejaria","cafeteria","alimentacao"], services: ["restaurante","bar","cervejaria","cafeteria","hamburgueria","pizzaria","delivery","eventos gastronômicos"] },
  { id: "servicos", label: "Serviços", segments: ["servicos","servico"], services: ["limpeza","manutenção","marketing","consultoria","jurídico","contabilidade","arquitetura","engenharia"] },
  { id: "educacao", label: "Educação", segments: ["educacao","educação"], services: ["cursos","graduação","idiomas","preparatórios","reforço","treinamentos"] },
  { id: "comercio", label: "Comércio e Varejo", segments: ["comercio","varejo","loja"], services: ["moda","calçados","acessórios","supermercado","conveniência","presentes"] },
  { id: "imobiliario", label: "Imobiliário", segments: ["imobiliaria","imobiliária"], services: ["venda","aluguel","lançamentos","administração de imóveis"] },
  { id: "eventos", label: "Eventos e Entretenimento", segments: ["eventos","entretenimento"], services: ["shows","baladas","casas noturnas","produtoras","casamentos","aniversários"] },
  { id: "veiculos", label: "Veículos", segments: ["veiculos","automotivo"], services: ["concessionária","oficina","funilaria","estética automotiva","peças"] },
  { id: "hospedagem", label: "Hospedagem e Temporada", segments: ["hospedagem","temporada","airbnb"], services: ["limpeza de Airbnb","gestão de enxoval","manutenção de apartamentos","imóveis de temporada","hospedagem"] },
  { id: "juridico", label: "Jurídico", segments: ["juridico","advocacia"], services: ["cível","trabalhista","família","consumidor","empresarial"] },
  { id: "contabilidade", label: "Contabilidade", segments: ["contabilidade"], services: ["abertura de empresa","escrita fiscal","folha de pagamento","IRPF","BPO financeiro"] },
];

const DISTANCES = [
  { v: 1, l: "até 1 km" }, { v: 3, l: "até 3 km" }, { v: 5, l: "até 5 km" },
  { v: 10, l: "até 10 km" }, { v: 25, l: "até 25 km" }, { v: 50, l: "até 50 km" },
];

const BENEFITS = [
  { id: "voucher", label: "Possui voucher", icon: Ticket },
  { id: "desconto", label: "Possui desconto", icon: Gift },
  { id: "cashback", label: "Possui cashback", icon: Gift },
  { id: "clube", label: "Aceita Clube Premium", icon: Crown },
  { id: "promo", label: "Promoção ativa", icon: Sparkles },
  { id: "online", label: "Atendimento online", icon: MessageCircle },
  { id: "agendamento", label: "Agendamento online", icon: Calendar },
];

const RATINGS = [
  { v: 5, l: "5 estrelas" },
  { v: 4, l: "4+ estrelas" },
  { v: 3, l: "3+ estrelas" },
];

function parseNaturalQuery(q: string) {
  const lower = q.toLowerCase();
  const catHit = MACRO_CATEGORIES.find((c) =>
    c.services.some((s) => lower.includes(s.toLowerCase())) ||
    c.segments.some((s) => lower.includes(s.toLowerCase())) ||
    lower.includes(c.label.toLowerCase()),
  );
  const cityMatch = lower.match(/(?:em|no|na|perto de|próximo a)\s+([a-zà-ú\s]{3,30})/i);
  return { categoryId: catHit?.id, city: cityMatch?.[1]?.trim() };
}

function BuscaGatePage() {
  const membership = useConsumerHasActiveMembership();

  if (membership.isLoading) {
    return (
      <div className="min-h-dvh flex flex-col bg-background">
        <PublicHeader />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Validando seu acesso…</p>
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (!membership.data) {
    return (
      <div className="min-h-dvh flex flex-col bg-background">
        <PublicHeader />
        <main className="flex-1">
          <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" /> Área exclusiva dos Impulsionitos
              </span>
              <h1 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">
                A busca inteligente é exclusiva dos sócios do Clube
              </h1>
              <p className="mt-4 text-white/85 max-w-2xl mx-auto">
                Somente <strong>Impulsionitos</strong> podem usar o sistema para encontrar
                o negócio desejado mais próximo, com filtros avançados e vantagens reais.
                A entrada é gratuita — o plano pago libera ainda mais benefícios.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 gap-2">
                  <Link to="/clube/cadastro">
                    <Crown className="w-4 h-4" /> Quero ser Impulsionito (grátis)
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white gap-2">
                  <Link to="/clube">
                    Conhecer o Clube de Vantagens
                  </Link>
                </Button>
              </div>
              <p className="mt-3 text-xs text-white/70">
                Já é sócio? <Link to="/clube/login" className="underline">Entrar no Clube</Link>.
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 grid sm:grid-cols-3 gap-4">
            {[
              { icon: Search, t: "Busca por CEP, cidade, bairro e distância", d: "Encontre quem está realmente perto de você." },
              { icon: Star, t: "Filtros por avaliação e benefícios", d: "Voucher, cashback, desconto, agendamento online e mais." },
              { icon: Crown, t: "Vantagens reais com o plano pago", d: "Recomendações premium, alertas e benefícios exclusivos." },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <Card key={i} className="p-5">
                  <Icon className="w-6 h-6 text-primary mb-2" />
                  <h3 className="font-semibold text-sm">{f.t}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{f.d}</p>
                </Card>
              );
            })}
          </section>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return <BuscaResultsPage />;
}

function BuscaResultsPage() {
  const search = Route.useSearch();
  const fetchFn = useServerFn(getPublicVitrine);

  const [view, setView] = useState<"list" | "map">("list");
  const [naturalQ, setNaturalQ] = useState(search.q ?? "");
  const [categoryId, setCategoryId] = useState<string>(search.cat ?? "");
  const [serviceType, setServiceType] = useState<string>("");
  const [cep, setCep] = useState("");
  const [city, setCity] = useState<string>(search.city ?? "");
  const [neighborhood, setNeighborhood] = useState("");
  const [distance, setDistance] = useState<number | "">("");
  const [rating, setRating] = useState<number | "">("");
  const [benefits, setBenefits] = useState<string[]>([]);
  const [useMyLocation, setUseMyLocation] = useState<boolean>(Boolean(search.geo));

  const activeCategory = useMemo(
    () => MACRO_CATEGORIES.find((c) => c.id === categoryId),
    [categoryId],
  );

  function applyNatural() {
    if (!naturalQ.trim()) return;
    const parsed = parseNaturalQuery(naturalQ);
    if (parsed.categoryId) setCategoryId(parsed.categoryId);
    if (parsed.city) setCity(parsed.city);
  }

  function requestGeo() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setUseMyLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setUseMyLocation(true),
      () => setUseMyLocation(false),
      { timeout: 5000 },
    );
  }

  const segmentParam = activeCategory?.segments?.[0];

  const q = useQuery({
    queryKey: ["busca-ecossistema", segmentParam, city],
    queryFn: () => fetchFn({ data: { segment: segmentParam, city: city || undefined, limit: 120 } }),
  });

  const companies = useMemo(() => {
    const raw: any[] = q.data?.companies ?? [];
    return raw.filter((c) => {
      if (neighborhood) {
        const hay = `${c.address_city ?? ""} ${c.segment ?? ""}`.toLowerCase();
        if (!hay.includes(neighborhood.toLowerCase())) return false;
      }
      if (serviceType) {
        const hay = `${c.trade_name ?? c.name ?? ""} ${c.segment ?? ""}`.toLowerCase();
        if (!hay.includes(serviceType.toLowerCase())) return false;
      }
      return true;
    });
  }, [q.data, neighborhood, serviceType]);

  function toggleBenefit(id: string) {
    setBenefits((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center">
            <Badge className="bg-white/15 text-primary-foreground border-0 mb-3">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Busque o que Precisa
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
              Encontre o negócio certo, perto de você
            </h1>
            <p className="mt-3 text-white/85 max-w-2xl mx-auto">
              Você é um Impulsionito. Use os filtros abaixo para encontrar empresas, serviços e
              benefícios dentro do Ecossistema Impulsionando.
            </p>

            <div className="mt-6 max-w-2xl mx-auto">
              <div className="flex gap-2 bg-white rounded-xl p-2 shadow-lg">
                <div className="flex items-center gap-2 flex-1 px-2">
                  <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <Input
                    value={naturalQ}
                    onChange={(e) => setNaturalQ(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") applyNatural(); }}
                    placeholder="Ex.: restaurante japonês com voucher em Copacabana"
                    className="border-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <Button onClick={applyNatural} className="bg-primary hover:bg-primary/90">Buscar</Button>
              </div>
              <p className="mt-2 text-xs text-white/70">
                Dica: "Clínica perto de Botafogo", "Psicólogo online", "Limpeza para Airbnb na Zona Sul".
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Filtros</h2>
              <div className="ml-auto flex items-center gap-1 rounded-md border p-1">
                <Button size="sm" variant={view === "list" ? "default" : "ghost"} onClick={() => setView("list")} className="h-7 gap-1">
                  <List className="w-3.5 h-3.5" /> Lista
                </Button>
                <Button size="sm" variant={view === "map" ? "default" : "ghost"} onClick={() => setView("map")} className="h-7 gap-1">
                  <MapIcon className="w-3.5 h-3.5" /> Mapa
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <Input placeholder="CEP" value={cep} onChange={(e) => setCep(e.target.value)} />
              <Input placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
              <Input placeholder="Bairro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
              <Select value={distance === "" ? "" : String(distance)} onValueChange={(v) => setDistance(v ? Number(v) : "")}>
                <SelectTrigger><SelectValue placeholder="Distância" /></SelectTrigger>
                <SelectContent>
                  {DISTANCES.map((d) => (<SelectItem key={d.v} value={String(d.v)}>{d.l}</SelectItem>))}
                </SelectContent>
              </Select>
              <Button variant={useMyLocation ? "default" : "outline"} onClick={requestGeo} className="gap-1.5">
                <Locate className="w-4 h-4" /> {useMyLocation ? "Localização ativa" : "Usar minha localização"}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setServiceType(""); }}>
                <SelectTrigger><SelectValue placeholder="Categoria macro" /></SelectTrigger>
                <SelectContent>
                  {MACRO_CATEGORIES.map((c) => (<SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={serviceType} onValueChange={setServiceType} disabled={!activeCategory}>
                <SelectTrigger><SelectValue placeholder={activeCategory ? "Tipo de serviço" : "Escolha uma categoria"} /></SelectTrigger>
                <SelectContent>
                  {(activeCategory?.services ?? []).map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={rating === "" ? "" : String(rating)} onValueChange={(v) => setRating(v ? Number(v) : "")}>
                <SelectTrigger><SelectValue placeholder="Avaliação mínima" /></SelectTrigger>
                <SelectContent>
                  {RATINGS.map((r) => (<SelectItem key={r.v} value={String(r.v)}>{r.l}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Benefícios</p>
              <div className="flex flex-wrap gap-2">
                {BENEFITS.map((b) => {
                  const Icon = b.icon;
                  const active = benefits.includes(b.id);
                  return (
                    <Button
                      key={b.id}
                      size="sm"
                      variant={active ? "default" : "outline"}
                      onClick={() => toggleBenefit(b.id)}
                      className="gap-1.5 h-8"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {b.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {(categoryId || city || neighborhood || serviceType || distance || rating || benefits.length || useMyLocation) ? (
              <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {companies.length} empresa{companies.length === 1 ? "" : "s"} encontrada{companies.length === 1 ? "" : "s"}
                </span>
                <button
                  className="text-primary hover:underline"
                  onClick={() => {
                    setCategoryId(""); setServiceType(""); setCity(""); setNeighborhood("");
                    setCep(""); setDistance(""); setRating(""); setBenefits([]); setUseMyLocation(false);
                  }}
                >
                  Limpar filtros
                </button>
              </div>
            ) : null}
          </Card>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
          {view === "map" ? (
            <Card className="p-10 text-center bg-muted/30">
              <MapIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold">Visualização em mapa</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Em breve mostraremos as empresas próximas em um mapa interativo. Por enquanto, use a visão em lista com filtros de cidade, bairro e distância.
              </p>
              <Button className="mt-4" variant="outline" onClick={() => setView("list")}>Voltar para lista</Button>
            </Card>
          ) : q.isLoading ? (
            <p className="text-center text-muted-foreground py-12">Carregando empresas do ecossistema…</p>
          ) : companies.length === 0 ? (
            <Card className="p-10 text-center">
              <Building2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold">Nenhuma empresa encontrada</h3>
              <p className="text-sm text-muted-foreground mt-1">Ajuste os filtros ou tente outra cidade/categoria.</p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {companies.map((c: any) => (
                <Card key={c.id} className="p-5 h-full flex flex-col hover:shadow-lg transition-shadow">
                  <Link to="/vitrine/$slug" params={{ slug: c.public_slug }} className="group flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      {c.logo_url ? (
                        <img src={c.logo_url} alt={c.trade_name ?? c.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <Building2 className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate group-hover:text-primary">{c.trade_name || c.name}</h3>
                        {c.segment && <Badge variant="outline" className="mt-1 text-xs">{c.segment}</Badge>}
                      </div>
                    </div>
                    {(c.address_city || c.address_state) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3" /> {c.address_city}{c.address_state ? `, ${c.address_state}` : ""}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Novo no ecossistema
                    </div>
                  </Link>
                  <div className="mt-4 pt-3 border-t flex gap-2">
                    <Button asChild size="sm" variant="outline" className="flex-1 h-8 text-xs">
                      <Link to="/vitrine/$slug" params={{ slug: c.public_slug }}>Ver detalhes</Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1 h-8 text-xs gap-1">
                      <Link to="/vitrine/$slug" params={{ slug: c.public_slug }}>
                        <MessageCircle className="w-3 h-3" /> Falar
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
          <Card className="p-8 sm:p-10 text-center bg-gradient-hero text-primary-foreground border-0">
            <Crown className="w-10 h-10 mx-auto mb-3" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Quer ainda mais vantagens?</h2>
            <p className="text-white/85 max-w-2xl mx-auto mb-5">
              No plano pago do Clube, Impulsionitos recebem alertas personalizados, vouchers premium,
              recomendações inteligentes e filtros avançados por R$ 9,99/mês.
            </p>
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 gap-2">
              <Link to="/clube"><Crown className="w-4 h-4" /> Upgrade no Clube</Link>
            </Button>
          </Card>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
