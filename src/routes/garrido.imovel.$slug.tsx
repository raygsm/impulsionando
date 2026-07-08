import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { findImovel, relacionados, formatBRL, IMOVEIS } from "@/data/garrido-imoveis";
import { MapPin, BedDouble, Bath, Car, Ruler, Calendar, ShieldCheck, MessageCircle, Phone, ChevronLeft, ChevronRight, ArrowRight, CheckCircle2, Star } from "lucide-react";

export const Route = createFileRoute("/garrido/imovel/$slug")({
  loader: ({ params }) => {
    const imovel = findImovel(params.slug);
    if (!imovel) throw notFound();
    return { imovel };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Imóvel não encontrado — Garrido" }, { name: "robots", content: "noindex" }] };
    }
    const i = loaderData.imovel;
    const title = `${i.titulo} — Imobiliária Garrido`;
    const desc = `${i.categoria.toUpperCase()} em ${i.bairro}, ${i.cidade}/${i.uf}. ${i.quartos}Q · ${i.areaUtil}m² · ${i.precoVenda ? formatBRL(i.precoVenda) : i.precoAluguel ? `${formatBRL(i.precoAluguel)}/mês` : "consulta"}.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:image", content: i.fotos[0] },
        { property: "og:url", content: `https://garrido.impulsionando.com.br/garrido/imovel/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `https://garrido.impulsionando.com.br/garrido/imovel/${params.slug}` }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: i.titulo,
          image: i.fotos,
          description: desc,
          offers: i.precoVenda ? {
            "@type": "Offer",
            price: i.precoVenda,
            priceCurrency: "BRL",
            availability: "https://schema.org/InStock",
          } : undefined,
          brand: { "@type": "RealEstateAgent", name: "Imobiliária Garrido" },
        }),
      }],
    };
  },
  errorComponent: ({ reset }) => (
    <div className="min-h-[60vh] grid place-items-center p-8 text-center">
      <div>
        <h1 className="font-serif text-2xl font-bold">Não foi possível carregar o imóvel</h1>
        <button onClick={reset} className="mt-4 rounded-md bg-[color:var(--garrido-ink)] text-white px-4 py-2 text-sm">Tentar novamente</button>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-[60vh] grid place-items-center p-8 text-center">
      <div>
        <h1 className="font-serif text-2xl font-bold">Imóvel não encontrado</h1>
        <p className="text-slate-500 mt-2 text-sm">Pode ter sido vendido ou o link está incorreto.</p>
        <Link to="/garrido/buscar" className="mt-4 inline-block rounded-md bg-[color:var(--garrido-ink)] text-white px-4 py-2 text-sm">Ver imóveis disponíveis</Link>
      </div>
    </div>
  ),
  component: ImovelDetail,
});

function ImovelDetail() {
  const { imovel: i } = Route.useLoaderData();
  const rel = relacionados(i.slug, 3);
  const [foto, setFoto] = useState(0);

  const finalidadeLabel = i.finalidade.includes("venda") ? "Venda"
    : i.finalidade.includes("aluguel") ? "Aluguel"
    : i.finalidade.includes("temporada") ? "Temporada" : "Lançamento";

  return (
    <>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-slate-500">
        <Link to="/garrido" className="hover:underline">Início</Link>
        <span className="mx-1">›</span>
        <Link to="/garrido/buscar" className="hover:underline">Imóveis</Link>
        <span className="mx-1">›</span>
        <span className="text-[color:var(--garrido-ink)] font-semibold">{i.bairro}, {i.cidade}</span>
      </div>

      {/* Galeria */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px] md:h-[520px] rounded-xl overflow-hidden">
          <button className="col-span-4 md:col-span-3 row-span-2 relative bg-slate-100 overflow-hidden group" onClick={() => setFoto(0)} aria-label="Foto principal">
            <img src={i.fotos[foto]} alt={i.titulo} className="w-full h-full object-cover" />
            <div className="absolute bottom-3 left-3 right-3 flex gap-2 md:hidden">
              <button onClick={(e) => { e.stopPropagation(); setFoto((f) => (f - 1 + i.fotos.length) % i.fotos.length); }} className="h-9 w-9 rounded-full bg-white/90 grid place-items-center" aria-label="Foto anterior"><ChevronLeft className="h-5 w-5" /></button>
              <button onClick={(e) => { e.stopPropagation(); setFoto((f) => (f + 1) % i.fotos.length); }} className="h-9 w-9 rounded-full bg-white/90 grid place-items-center ml-auto" aria-label="Próxima foto"><ChevronRight className="h-5 w-5" /></button>
            </div>
          </button>
          {i.fotos.slice(1, 5).map((f, idx) => (
            <button key={f + idx} className="hidden md:block relative bg-slate-100 overflow-hidden" onClick={() => setFoto(idx + 1)} aria-label={`Foto ${idx + 2}`}>
              <img src={f} alt={`${i.titulo} — foto ${idx + 2}`} className="w-full h-full object-cover hover:scale-105 transition" loading="lazy" />
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_360px] gap-8">
        {/* Conteúdo principal */}
        <article className="space-y-8">
          <header>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-[color:var(--garrido-ink)] text-white text-[10px] uppercase tracking-wider px-2 py-1 font-bold">{finalidadeLabel}</span>
              {i.tags.map((t) => (
                <span key={t} className="rounded-full border border-[color:var(--garrido-gold)]/40 text-[color:var(--garrido-gold)] text-[10px] uppercase tracking-wider px-2 py-1 font-bold">
                  {t.replace("-", " ")}
                </span>
              ))}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold mt-3 text-[color:var(--garrido-ink)]">{i.titulo}</h1>
            <div className="mt-2 text-sm text-slate-600 flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {i.bairro}, {i.cidade}/{i.uf} · CEP {i.cep}
            </div>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat icon={BedDouble} label="Quartos" value={`${i.quartos}${i.suites ? ` (${i.suites} suíte${i.suites > 1 ? "s" : ""})` : ""}`} />
              <Stat icon={Bath} label="Banheiros" value={i.banheiros} />
              <Stat icon={Car} label="Vagas" value={i.vagas} />
              <Stat icon={Ruler} label="Área útil" value={`${i.areaUtil}m²`} />
            </div>
          </header>

          <Bloco titulo="Sobre este imóvel">
            <p className="text-slate-700 leading-relaxed">{i.descricao}</p>
          </Bloco>

          <Bloco titulo="Diferenciais">
            <div className="grid sm:grid-cols-2 gap-2">
              {i.destaques.map((d) => (
                <div key={d} className="flex items-start gap-2 text-sm">
                  <Star className="h-4 w-4 text-[color:var(--garrido-gold)] mt-0.5 shrink-0" aria-hidden />
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </Bloco>

          <Bloco titulo="Características">
            <div className="grid sm:grid-cols-2 gap-2">
              {i.caracteristicas.map((c) => (
                <div key={c} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" aria-hidden />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </Bloco>

          <Bloco titulo="Documentação">
            <ul className="space-y-1.5 text-sm">
              {i.documentacao.map((d) => (
                <li key={d} className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-[color:var(--garrido-ink)] mt-0.5 shrink-0" aria-hidden />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </Bloco>

          <Bloco titulo="Localização e proximidades">
            <div className="rounded-xl overflow-hidden border border-black/5 bg-slate-100 aspect-video">
              <iframe
                title={`Mapa de ${i.bairro}, ${i.cidade}`}
                loading="lazy"
                src={`https://www.google.com/maps?q=${i.mapa.lat},${i.mapa.lng}&z=15&output=embed`}
                className="w-full h-full border-0"
              />
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-2">
              {i.proximidades.map((p) => (
                <div key={p} className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" aria-hidden />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </Bloco>

          {i.video && (
            <Bloco titulo="Vídeo">
              <div className="aspect-video rounded-xl overflow-hidden bg-black">
                <iframe title="Tour em vídeo" src={i.video} className="w-full h-full border-0" allowFullScreen />
              </div>
            </Bloco>
          )}
        </article>

        {/* Sidebar CTA */}
        <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
          <div className="rounded-xl bg-white p-5 border border-black/5 shadow-lg">
            {i.precoVenda != null && <PrecoLinha label="Venda" value={formatBRL(i.precoVenda)} destaque />}
            {i.precoAluguel != null && <PrecoLinha label="Aluguel/mês" value={formatBRL(i.precoAluguel)} />}
            {i.precoTemporada != null && <PrecoLinha label="Diária temporada" value={formatBRL(i.precoTemporada)} />}
            {i.condominio ? <PrecoLinha label="Condomínio" value={formatBRL(i.condominio)} small /> : null}
            {i.iptu ? <PrecoLinha label="IPTU/mês" value={formatBRL(i.iptu)} small /> : null}

            <div className="mt-4 grid gap-2">
              <a
                href={`https://wa.me/${i.corretor.whatsapp}?text=${encodeURIComponent(`Olá! Tenho interesse no imóvel "${i.titulo}" (${i.slug}).`)}`}
                target="_blank" rel="noopener"
                className="rounded-lg bg-[#25D366] text-white font-bold py-2.5 text-center inline-flex items-center justify-center gap-2 hover:brightness-110"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp com corretor
              </a>
              <a href={`tel:+55${i.corretor.whatsapp}`} className="rounded-lg border border-[color:var(--garrido-ink)]/20 font-semibold py-2.5 text-center text-sm inline-flex items-center justify-center gap-2 hover:bg-[color:var(--garrido-cream)]">
                <Phone className="h-4 w-4" /> Ligar agora
              </a>
              <FormInteresse imovelSlug={i.slug} />
            </div>

            <div className="mt-5 pt-4 border-t text-xs">
              <div className="font-semibold text-[color:var(--garrido-ink)]">{i.corretor.nome}</div>
              <div className="text-slate-500">{i.corretor.creci}</div>
            </div>
          </div>

          <div className="rounded-xl bg-[color:var(--garrido-ink)] text-white p-5">
            <div className="text-xs uppercase tracking-widest text-[color:var(--garrido-gold)] font-bold">Financiamento</div>
            <div className="font-serif text-lg font-bold mt-1">Simule seu financiamento</div>
            <p className="text-white/70 text-sm mt-1">CEF, Itaú, Bradesco, Santander e portabilidade.</p>
            <Link to="/garrido/financiamento" className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[color:var(--garrido-gold)] text-[color:var(--garrido-ink)] font-bold px-4 py-2 text-sm hover:brightness-110">
              Simular agora <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-xl bg-white p-4 border border-black/5 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-semibold text-[color:var(--garrido-ink)] mb-1">
              <Calendar className="h-4 w-4" /> Agendar visita
            </div>
            <p>Escolha o melhor horário via WhatsApp — corretor confirma em minutos.</p>
          </div>
        </aside>
      </section>

      {/* Relacionados */}
      {rel.length > 0 && (
        <section className="bg-[color:var(--garrido-cream)] py-14">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-[color:var(--garrido-ink)]">Imóveis relacionados</h2>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rel.map((r) => (
                <Link key={r.slug} to="/garrido/imovel/$slug" params={{ slug: r.slug }} className="group bg-white rounded-xl overflow-hidden border border-black/5 hover:shadow-lg transition">
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                    <img src={r.fotos[0]} alt={r.titulo} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.bairro}</div>
                    <div className="font-semibold text-[color:var(--garrido-ink)] mt-1 line-clamp-2">{r.titulo}</div>
                    <div className="mt-2 font-bold text-[color:var(--garrido-ink)]">{formatBRL(r.precoVenda ?? r.precoAluguel ?? r.precoTemporada)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-[color:var(--garrido-cream)] p-3">
      <div className="flex items-center gap-2 text-xs text-slate-500"><Icon className="h-3.5 w-3.5" aria-hidden /> {label}</div>
      <div className="mt-1 font-semibold text-[color:var(--garrido-ink)]">{value}</div>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-5 md:p-6 border border-black/5">
      <h2 className="font-serif text-xl font-bold text-[color:var(--garrido-ink)] mb-3">{titulo}</h2>
      {children}
    </section>
  );
}

function PrecoLinha({ label, value, destaque, small }: { label: string; value: string; destaque?: boolean; small?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between ${small ? "text-xs text-slate-500" : ""} ${destaque ? "border-b pb-2 mb-2" : ""}`}>
      <span className={small ? "" : "text-xs uppercase tracking-wider text-slate-500"}>{label}</span>
      <span className={destaque ? "text-xl font-bold text-[color:var(--garrido-ink)]" : small ? "" : "font-semibold text-[color:var(--garrido-ink)]"}>{value}</span>
    </div>
  );
}

function FormInteresse({ imovelSlug }: { imovelSlug: string }) {
  const [sent, setSent] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setSent(true); }}
      className="mt-1 rounded-lg border border-black/10 p-3 space-y-2 bg-[color:var(--garrido-cream)]"
    >
      <div className="text-xs font-semibold text-[color:var(--garrido-ink)]">Tenho interesse — me chamem</div>
      {sent ? (
        <div className="text-xs text-emerald-700 bg-emerald-50 rounded p-2">
          Obrigado! Um corretor entrará em contato em breve.
        </div>
      ) : (
        <>
          <input required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" className="w-full rounded border border-black/10 px-2 py-1.5 text-sm bg-white" aria-label="Nome" />
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="w-full rounded border border-black/10 px-2 py-1.5 text-sm bg-white" aria-label="E-mail" />
          <input required value={tel} onChange={(e) => setTel(e.target.value)} placeholder="Telefone/WhatsApp" className="w-full rounded border border-black/10 px-2 py-1.5 text-sm bg-white" aria-label="Telefone" />
          <input type="hidden" name="imovel" value={imovelSlug} />
          <button type="submit" className="w-full rounded-md bg-[color:var(--garrido-ink)] text-white font-semibold text-sm py-2">
            Solicitar contato
          </button>
          <p className="text-[10px] text-slate-500 leading-snug">
            Ao enviar você concorda em receber contato via WhatsApp, e-mail ou telefone da equipe Garrido.
          </p>
        </>
      )}
    </form>
  );
}

// Suprime warning quando build percorre imports não usados
void IMOVEIS;
