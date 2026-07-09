import { createFileRoute, Link } from "@tanstack/react-router";
import { useId, useState } from "react";
import { CheckCircle2, Building2, Users, TrendingUp, ShieldCheck } from "lucide-react";
import { buildGarridoBreadcrumbJsonLd, GarridoBreadcrumbs } from "@/components/garrido/Breadcrumbs";

const CANONICAL = "https://impulsionando.com.br/garrido/anunciar";

export const Route = createFileRoute("/garrido/anunciar")({
  head: () => ({
    meta: [
      { title: "Anuncie seu imóvel — Imobiliária Garrido" },
      { name: "description", content: "Anuncie seu imóvel com a Garrido: divulgação premium, curadoria de leads qualificados, contratos digitais e corretor dedicado." },
      { property: "og:title", content: "Anuncie seu imóvel com a Imobiliária Garrido" },
      { property: "og:description", content: "Divulgação premium, curadoria de leads e corretor dedicado." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify(buildGarridoBreadcrumbJsonLd([
        { label: "Início", to: "/garrido" },
        { label: "Anunciar imóvel" },
      ])),
    }],
  }),
  component: AnunciarPage,
});

function AnunciarPage() {
  const [sent, setSent] = useState(false);
  return (
    <>
      <GarridoBreadcrumbs items={[{ label: "Início", to: "/garrido" }, { label: "Anunciar imóvel" }]} />

      <section className="bg-[color:var(--garrido-ink)] text-white py-14">
        <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-[color:var(--garrido-gold)] font-bold">Proprietários</div>
            <h1 className="font-serif text-3xl md:text-5xl font-bold mt-2">Anuncie seu imóvel com a Garrido</h1>
            <p className="mt-4 text-white/85 leading-relaxed">
              Divulgação premium, curadoria de leads qualificados, contratos digitais, corretor dedicado
              e transparência total. Vendemos e alugamos com apoio de todo o ecossistema Impulsionando.
            </p>
            <ul className="mt-5 space-y-2">
              {["Anúncio profissional (fotos, textos, tour)", "Publicação nos principais portais", "Corretor dedicado com CRECI ativo", "Contratos digitais e documentação assistida"].map((v) => (
                <li key={v} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-[color:var(--garrido-gold)] mt-0.5" aria-hidden /> <span className="text-sm">{v}</span></li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-white text-[color:var(--garrido-ink)] p-6 md:p-8 shadow-2xl">
            {sent ? (
              <SuccessMessage />
            ) : (
              <FormAnunciar onSuccess={() => setSent(true)} />
            )}
          </div>
        </div>
      </section>

      <section className="py-14 bg-[color:var(--garrido-cream)]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-center text-[color:var(--garrido-ink)]">Por que anunciar com a Garrido?</h2>
          <div className="mt-8 grid md:grid-cols-4 gap-4">
            {[
              { icon: TrendingUp, t: "Curadoria de mercado", d: "Sugerimos faixa de preço realista com base em ACM." },
              { icon: Users,      t: "Leads qualificados", d: "Matching automático de perfis do CRM do ecossistema." },
              { icon: Building2,  t: "Divulgação profissional", d: "Fotos, textos e vídeo produzidos pela nossa equipe." },
              { icon: ShieldCheck,t: "Documentação segura", d: "Curadoria de contratos, certidões e assinatura digital." },
            ].map((k) => (
              <div key={k.t} className="rounded-xl bg-white p-5 border border-black/5 text-center">
                <k.icon className="h-8 w-8 text-[color:var(--garrido-gold)] mx-auto mb-2" aria-hidden />
                <div className="font-bold text-[color:var(--garrido-ink)]">{k.t}</div>
                <p className="text-xs text-slate-500 mt-1">{k.d}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/garrido/avaliar" className="rounded-lg px-6 py-3 bg-[color:var(--garrido-ink)] text-white font-bold hover:brightness-125 transition inline-flex items-center min-h-11">
              Quero avaliar meu imóvel antes
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}


function SuccessMessage() {
  return (
    <div className="text-center py-8">
      <div className="h-16 w-16 rounded-full bg-emerald-100 grid place-items-center mx-auto">
        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
      </div>
      <h3 className="font-serif text-xl font-bold mt-4">Cadastro recebido!</h3>
      <p className="text-sm text-slate-500 mt-2">
        Um corretor Garrido entrará em contato em até 1 dia útil para agendar a visita técnica.
      </p>
    </div>
  );
}

function FormAnunciar({ onSuccess }: { onSuccess: () => void }) {
  const nomeId = useId();
  const telId = useId();
  const emailId = useId();
  const tipoId = useId();
  const finalidadeId = useId();
  const enderecoId = useId();
  const detalhesId = useId();
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSuccess(); }}
      className="space-y-3"
      aria-label="Anunciar imóvel"
    >
      <div>
        <label htmlFor={nomeId} className="text-xs font-semibold block mb-1">Nome</label>
        <input id={nomeId} required className="input" placeholder="Seu nome completo" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={telId} className="text-xs font-semibold block mb-1">WhatsApp</label>
          <input id={telId} required className="input" placeholder="(21) 99999-9999" />
        </div>
        <div>
          <label htmlFor={emailId} className="text-xs font-semibold block mb-1">E-mail</label>
          <input id={emailId} required type="email" className="input" placeholder="seu@email.com" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={tipoId} className="text-xs font-semibold block mb-1">Tipo do imóvel</label>
          <select id={tipoId} className="input">
            <option>Apartamento</option><option>Casa</option><option>Cobertura</option>
            <option>Comercial</option><option>Rural</option><option>Terreno</option>
          </select>
        </div>
        <div>
          <label htmlFor={finalidadeId} className="text-xs font-semibold block mb-1">Finalidade</label>
          <select id={finalidadeId} className="input">
            <option>Venda</option><option>Aluguel</option><option>Temporada</option><option>Ambos</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor={enderecoId} className="text-xs font-semibold block mb-1">Endereço aproximado</label>
        <input id={enderecoId} className="input" placeholder="Bairro e cidade" />
      </div>
      <div>
        <label htmlFor={detalhesId} className="text-xs font-semibold block mb-1">Detalhes (opcional)</label>
        <textarea id={detalhesId} rows={3} className="input" placeholder="Nº de quartos, área, preço pretendido..." />
      </div>
      <button type="submit" className="w-full rounded-lg bg-[color:var(--garrido-ink)] text-white font-bold py-2.5 hover:brightness-125">
        Quero anunciar meu imóvel
      </button>
      <p className="text-[10px] text-slate-500 leading-snug">
        Enviando você concorda em receber contato da equipe Garrido via WhatsApp, e-mail ou telefone.
      </p>
      <style>{`.input{width:100%;border:1px solid rgba(0,0,0,.12);border-radius:8px;padding:.55rem .7rem;font-size:.875rem;background:#fff;}`}</style>
    </form>
  );
}
