import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search, MapPin, KeyRound, Sparkles, Building2, TreePine, Crown, Home as HomeIcon,
  ShieldCheck, Clock, Star, ArrowRight, Bath, BedDouble, Car, Ruler,
} from "lucide-react";
import { IMOVEIS, formatBRL, type Imovel } from "@/data/garrido-imoveis";

export const Route = createFileRoute("/garrido/")({
  head: () => ({
    meta: [
      { title: "Imobiliária Garrido — Encontre seu imóvel no Rio de Janeiro" },
      { name: "description", content: "Compra, venda, locação e temporada no Rio. Apartamentos, casas, coberturas, imóveis comerciais e rurais com curadoria e atendimento humano da Imobiliária Garrido." },
      { property: "og:title", content: "Imobiliária Garrido — Referência imobiliária no Rio de Janeiro" },
      { property: "og:description", content: "Milhares de imóveis para comprar, alugar ou temporada com curadoria Garrido." },
      { property: "og:type", content: "website" },
    ],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        name: "Imobiliária Garrido",
        areaServed: ["Rio de Janeiro", "Petrópolis", "Maricá"],
        priceRange: "$$-$$$$",
      }),
    }],
  }),
  component: GarridoHome,
});

function GarridoHome() {
  const destaques = IMOVEIS.filter((i) => i.tags.includes("alto-padrao") || i.tags.includes("vista-mar")).slice(0, 6);
  const oportunidades = IMOVEIS.filter((i) => i.tags.includes("oportunidade") || i.tags.includes("lancamento")).slice(0, 3);

  return (
    <>
      <HeroBusca />
      <TrustStrip />
      <Pilares />
      <SecaoImoveis titulo="Destaques Garrido" subtitulo="Curadoria da semana" imoveis={destaques} />
      <Segmentos />
      <SecaoImoveis titulo="Oportunidades e lançamentos" subtitulo="Boas ofertas selecionadas pela equipe" imoveis={oportunidades} />
      <BairrosGrid />
      <Depoimentos />
      <EcossistemaBlock />
      <CTAFinal />
    </>
  );
}

/* ================================ HERO ================================ */

const FINALIDADES = [
  { key: "venda",     label: "Comprar" },
  { key: "aluguel",   label: "Alugar" },
  { key: "temporada", label: "Temporada" },
  { key: "lancamento", label: "Lançamentos" },
] as const;

function HeroBusca() {
  const [finalidade, setFinalidade] = useState<typeof FINALIDADES[number]["key"]>("venda");
  const [q, setQ] = useState("");

  return (
    <section className="relative overflow-hidden bg-[color:var(--garrido-ink)] text-white">
      <div
        aria-hidden
        className="absolute inset-0 opacity-40 bg-cover bg-center"
        style={{ backgroundImage: "url(https://images.unsplash.com/photo-1519999482648-25049ddd37b1?auto=format&fit=crop&w=1920&q=80)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--garrido-ink)]/80 via-[color:var(--garrido-ink)]/60 to-[color:var(--garrido-ink)]" aria-hidden />
      <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold text-[color:var(--garrido-gold)] uppercase tracking-wider">
            <Crown className="h-3.5 w-3.5" /> Curadoria imobiliária no Rio de Janeiro
          </span>
          <h1 className="font-serif text-4xl md:text-6xl font-bold mt-4 leading-tight">
            O imóvel certo para <span className="text-[color:var(--garrido-gold)]">morar, investir</span> ou passar temporada.
          </h1>
          <p className="mt-4 text-lg text-white/85 max-w-2xl">
            Curadoria de apartamentos, casas, coberturas, imóveis comerciais e rurais no Rio de Janeiro e Região Serrana.
            Atendimento humano, corretor dedicado e documentação transparente.
          </p>
        </div>

        {/* Busca */}
        <div className="mt-8 bg-white text-[color:var(--garrido-ink)] rounded-2xl shadow-2xl p-2 max-w-4xl">
          <div className="flex flex-wrap gap-1 px-2 pt-2" role="tablist" aria-label="Finalidade da busca">
            {FINALIDADES.map((f) => (
              <button
                key={f.key}
                role="tab"
                aria-selected={finalidade === f.key}
                onClick={() => setFinalidade(f.key)}
                className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition ${
                  finalidade === f.key
                    ? "bg-[color:var(--garrido-cream)] text-[color:var(--garrido-ink)]"
                    : "text-slate-500 hover:text-[color:var(--garrido-ink)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <form
            className="bg-[color:var(--garrido-cream)] rounded-xl p-3 md:p-4 flex flex-col md:flex-row gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const params = new URLSearchParams();
              if (finalidade) params.set("finalidade", finalidade);
              if (q.trim()) params.set("q", q.trim());
              window.location.href = `/garrido/buscar?${params.toString()}`;
            }}
          >
            <label className="flex-1 flex items-center gap-2 bg-white rounded-lg px-3 py-2.5 border border-black/10 focus-within:ring-2 focus-within:ring-[color:var(--garrido-gold)]/50">
              <Search className="h-4 w-4 text-slate-500" aria-hidden />
              <span className="sr-only">Buscar por bairro, cidade, CEP ou código</span>
              <input
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400"
                placeholder="Bairro, cidade, CEP ou código do imóvel"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
            <button
              type="submit"
              className="rounded-lg px-6 py-2.5 bg-[color:var(--garrido-ink)] text-white font-bold text-sm hover:brightness-125 transition inline-flex items-center justify-center gap-2"
            >
              <Search className="h-4 w-4" /> Buscar imóveis
            </button>
          </form>
          <div className="px-3 pb-3 pt-2 flex flex-wrap gap-2 text-xs text-slate-500">
            <span>Buscas rápidas:</span>
            {["Leblon", "Ipanema", "Barra da Tijuca", "Botafogo", "Recreio", "Itaipava"].map((b) => (
              <a
                key={b}
                href={`/garrido/buscar?q=${encodeURIComponent(b)}`}
                className="rounded-full border border-black/10 px-2.5 py-0.5 hover:bg-white"
              >{b}</a>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/garrido/avaliar" className="rounded-lg px-5 py-3 bg-[color:var(--garrido-gold)] text-[color:var(--garrido-ink)] font-bold hover:brightness-110 transition">
            Avaliar meu imóvel grátis
          </Link>
          <Link to="/garrido/anunciar" className="rounded-lg px-5 py-3 border border-white/40 text-white font-semibold hover:bg-white/10 transition">
            Quero anunciar
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================ TRUST STRIP ============================ */

function TrustStrip() {
  const items = [
    { icon: ShieldCheck, title: "CRECI ativo", desc: "Operação regulamentada com corretor responsável." },
    { icon: Clock,       title: "Atendimento humano", desc: "Corretor dedicado em todas as etapas." },
    { icon: Star,        title: "Curadoria de portfólio", desc: "Só publicamos imóveis com documentação verificada." },
    { icon: Crown,       title: "Alto padrão e investimento", desc: "Portfólio dedicado para investidor e HNW." },
  ];
  return (
    <section className="bg-white border-b border-black/5">
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((it) => (
          <div key={it.title} className="flex gap-3 items-start">
            <it.icon className="h-6 w-6 text-[color:var(--garrido-gold)] shrink-0" aria-hidden />
            <div>
              <div className="font-semibold text-sm text-[color:var(--garrido-ink)]">{it.title}</div>
              <p className="text-xs text-slate-500">{it.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================== PILARES ============================== */

const PILARES = [
  { icon: KeyRound,   titulo: "Comprar",      desc: "Apartamentos, casas e coberturas para morar ou investir.", to: "/garrido/buscar" },
  { icon: HomeIcon,   titulo: "Alugar",       desc: "Locação residencial com contrato garantido.",              to: "/garrido/buscar" },
  { icon: Sparkles,   titulo: "Temporada",    desc: "Estadias curtas prontas para receber.",                     to: "/garrido/buscar" },
  { icon: Building2,  titulo: "Lançamentos",  desc: "Empreendimentos novos com condição de tabela.",             to: "/garrido/buscar" },
  { icon: Crown,      titulo: "Alto padrão",  desc: "Portfólio exclusivo para clientes exigentes.",              to: "/garrido/buscar" },
  { icon: Building2,  titulo: "Comercial",    desc: "Salas, lojas e prédios para seu negócio.",                  to: "/garrido/buscar" },
  { icon: TreePine,   titulo: "Rural",        desc: "Sítios, chácaras e fazendas na região.",                    to: "/garrido/buscar" },
  { icon: MapPin,     titulo: "Administração", desc: "Gestão completa de aluguel para proprietários.",           to: "/garrido/contato" },
];

function Pilares() {
  return (
    <section className="py-16 bg-[color:var(--garrido-cream)]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--garrido-gold)] font-bold">O que fazemos</div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold mt-2">Toda a jornada imobiliária em um só lugar</h2>
          <p className="text-slate-600 mt-3">Da primeira visita à escritura registrada — passando por locação, temporada, avaliação e administração.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PILARES.map((p) => (
            <Link
              key={p.titulo}
              to={p.to}
              className="group bg-white rounded-xl p-5 border border-black/5 hover:border-[color:var(--garrido-gold)] hover:shadow-lg transition"
            >
              <p.icon className="h-8 w-8 text-[color:var(--garrido-gold)] mb-3" aria-hidden />
              <div className="font-semibold text-[color:var(--garrido-ink)]">{p.titulo}</div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--garrido-ink)] group-hover:translate-x-1 transition">
                Ver imóveis <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================== SEÇÃO DE IMÓVEIS ======================== */

function ImovelCard({ i }: { i: Imovel }) {
  const preco =
    i.finalidade.includes("venda") && i.precoVenda
      ? { label: "Venda", value: formatBRL(i.precoVenda) }
      : i.finalidade.includes("aluguel") && i.precoAluguel
      ? { label: "Aluguel/mês", value: formatBRL(i.precoAluguel) }
      : i.finalidade.includes("temporada") && i.precoTemporada
      ? { label: "Diária", value: formatBRL(i.precoTemporada) }
      : { label: "Consulta", value: "Sob consulta" };
  return (
    <Link
      to="/garrido/imovel/$slug"
      params={{ slug: i.slug }}
      className="group bg-white rounded-xl overflow-hidden border border-black/5 hover:shadow-xl hover:-translate-y-0.5 transition"
    >
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <img
          src={i.fotos[0]}
          alt={i.titulo}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        {i.tags[0] && (
          <span className="absolute top-3 left-3 rounded-full bg-[color:var(--garrido-ink)] text-white text-[10px] uppercase tracking-wider px-2 py-1 font-bold">
            {i.tags[0].replace("-", " ")}
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> {i.bairro} · {i.cidade}/{i.uf}</div>
        <div className="font-semibold text-[color:var(--garrido-ink)] mt-1 line-clamp-2">{i.titulo}</div>
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
          {i.quartos > 0 && <span className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {i.quartos}Q</span>}
          {i.banheiros > 0 && <span className="inline-flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {i.banheiros}</span>}
          {i.vagas > 0 && <span className="inline-flex items-center gap-1"><Car className="h-3.5 w-3.5" /> {i.vagas}</span>}
          <span className="inline-flex items-center gap-1"><Ruler className="h-3.5 w-3.5" /> {i.areaUtil}m²</span>
        </div>
        <div className="mt-3 border-t pt-3 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">{preco.label}</div>
            <div className="font-bold text-[color:var(--garrido-ink)]">{preco.value}</div>
          </div>
          <span className="text-xs font-semibold text-[color:var(--garrido-gold)] group-hover:translate-x-1 transition inline-flex items-center gap-1">
            Ver <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function SecaoImoveis({ titulo, subtitulo, imoveis }: { titulo: string; subtitulo: string; imoveis: Imovel[] }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--garrido-gold)] font-bold">{subtitulo}</div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mt-1 text-[color:var(--garrido-ink)]">{titulo}</h2>
          </div>
          <Link to="/garrido/buscar" className="text-sm font-semibold text-[color:var(--garrido-ink)] hover:underline inline-flex items-center gap-1">
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {imoveis.map((i) => <ImovelCard key={i.slug} i={i} />)}
        </div>
      </div>
    </section>
  );
}

/* ============================ SEGMENTOS ============================== */

function Segmentos() {
  const segs = [
    { titulo: "Alto padrão", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80", link: "/garrido/buscar" },
    { titulo: "Praia e vista mar", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80", link: "/garrido/buscar" },
    { titulo: "Comercial",  img: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80", link: "/garrido/buscar" },
    { titulo: "Rural e serra", img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80", link: "/garrido/buscar" },
  ];
  return (
    <section className="py-16 bg-[color:var(--garrido-cream)]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--garrido-gold)] font-bold">Explore por segmento</div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold mt-2">Cada perfil, o imóvel certo</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {segs.map((s) => (
            <Link key={s.titulo} to={s.link} className="group relative overflow-hidden rounded-xl aspect-[4/5]">
              <img src={s.img} alt={s.titulo} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--garrido-ink)] via-[color:var(--garrido-ink)]/30 to-transparent" aria-hidden />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="font-serif text-xl font-bold">{s.titulo}</div>
                <div className="text-xs text-white/80 mt-1 inline-flex items-center gap-1">Explorar <ArrowRight className="h-3 w-3" /></div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================= BAIRROS =============================== */

function BairrosGrid() {
  const bairros = ["Leblon", "Ipanema", "Botafogo", "Flamengo", "Copacabana", "Barra da Tijuca", "Recreio", "Tijuca", "Centro", "Itaipava", "Maricá"];
  return (
    <section className="py-14 bg-white">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--garrido-gold)] font-bold">Busque por bairro</div>
        <h2 className="font-serif text-3xl font-bold mt-2 text-[color:var(--garrido-ink)]">Onde você quer morar?</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {bairros.map((b) => (
            <a
              key={b}
              href={`/garrido/buscar?q=${encodeURIComponent(b)}`}
              className="rounded-full border border-black/10 px-4 py-1.5 text-sm font-medium hover:border-[color:var(--garrido-gold)] hover:text-[color:var(--garrido-ink)] transition"
            >{b}</a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================ DEPOIMENTOS ============================ */
/* Bloco institucional. Depoimentos reais serão publicados quando o módulo
   de avaliações do Core estiver ativo (RLS + moderação). Nenhum depoimento
   é inventado aqui para respeitar a regra de compliance do ecossistema.  */

function Depoimentos() {
  return (
    <section className="py-16 bg-[color:var(--garrido-ink)] text-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--garrido-gold)] font-bold">
          Prova social verificada
        </div>
        <h2 className="font-serif text-3xl md:text-4xl font-bold mt-2">
          Depoimentos com identificação e consentimento
        </h2>
        <p className="mt-4 text-white/80 max-w-2xl mx-auto leading-relaxed">
          A Garrido publica apenas depoimentos verificados e com consentimento explícito
          do cliente. Estamos consolidando as autorizações no módulo de avaliações do Core
          Impulsionando — em breve esta área traz nome, foto opcional, tipo de negócio,
          bairro e link para o processo real.
        </p>
        <div className="mt-6">
          <Link
            to="/garrido/contato"
            className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--garrido-gold)] text-[color:var(--garrido-ink)] font-bold px-5 py-2.5 hover:brightness-110 transition min-h-11"
          >
            Fui cliente e quero autorizar meu depoimento
          </Link>
        </div>
      </div>
    </section>
  );
}

/* =========================== ECOSSISTEMA ============================= */

function EcossistemaBlock() {
  const items = [
    "CRM imobiliário e follow-up automático",
    "Agenda de visitas integrada ao WhatsApp",
    "Área do Cliente, Corretor e Proprietário",
    "Impulsionito IA: recomenda imóveis por perfil",
    "Automações N8N (leads, contratos, avaliações)",
    "Clube Impulsionando: benefícios em toda a rede",
  ];
  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 rounded-2xl bg-gradient-to-br from-[color:var(--garrido-ink)] to-[#242b3e] p-8 md:p-12 text-white">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--garrido-gold)] font-bold">Ecossistema Impulsionando</div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mt-2">Tecnologia por trás da Garrido</h2>
            <p className="text-white/80 mt-3 leading-relaxed">
              A Garrido opera dentro do Ecossistema Impulsionando: CRM, agenda, WhatsApp,
              automações, área do cliente e o agente de IA Impulsionito trabalhando juntos
              para acelerar sua compra, venda ou locação.
            </p>
            <Link to="/garrido/contato" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[color:var(--garrido-gold)] text-[color:var(--garrido-ink)] font-bold px-5 py-2.5 hover:brightness-110 transition">
              Fale com um corretor <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[color:var(--garrido-gold)] shrink-0" aria-hidden />
                <span className="text-white/90">{it}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ============================== CTA FINAL ============================ */

function CTAFinal() {
  return (
    <section className="py-16 bg-[color:var(--garrido-cream)]">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-[color:var(--garrido-ink)]">
          Pronto para dar o próximo passo?
        </h2>
        <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
          Escolha o melhor caminho: buscar um imóvel, avaliar o seu ou falar com nosso time.
          O WhatsApp fica reservado para suporte e pós-venda.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/garrido/buscar" className="rounded-lg px-6 py-3 bg-[color:var(--garrido-ink)] text-white font-bold hover:brightness-125 transition min-h-11 inline-flex items-center">
            Buscar imóveis
          </Link>
          <Link to="/garrido/avaliar" className="rounded-lg px-6 py-3 bg-[color:var(--garrido-gold)] text-[color:var(--garrido-ink)] font-bold hover:brightness-110 transition min-h-11 inline-flex items-center">
            Avaliar meu imóvel
          </Link>
          <Link to="/garrido/contato" className="rounded-lg px-6 py-3 border border-[color:var(--garrido-ink)]/20 font-semibold text-[color:var(--garrido-ink)] hover:bg-white transition min-h-11 inline-flex items-center">
            Falar com o time
          </Link>
        </div>
      </div>
    </section>
  );
}
