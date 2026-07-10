import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Sparkles, Users } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import { MAROCAS_BRAND, MAROCAS_IMAGENS } from "@/components/marocas/marocasContent";

const CANONICAL = "/marocas/sobre";

export const Route = createFileRoute("/marocas/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre a Marocas — gestão de locação por temporada" },
      { name: "description", content: "Quem somos, o que fazemos e por que anfitriões escolhem a Marocas para operar seus imóveis de temporada." },
      { property: "og:title", content: "Sobre a Marocas" },
      { property: "og:description", content: "Operação premium para imóveis de temporada. Fundada em 2018, homologada por dezenas de proprietários da Zona Sul." },
      { property: "og:url", content: CANONICAL },
      { property: "og:image", content: MAROCAS_IMAGENS.operacao },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: SobrePage,
});

function SobrePage() {
  return (
    <MarocasShell breadcrumbs={[{ label: "Marocas", to: "/marocas" }, { label: "Sobre" }]}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={MAROCAS_IMAGENS.operacao} alt="Equipe Marocas em operação" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 to-slate-900/40" />
        </div>
        <div className="container mx-auto px-4 md:px-6 py-24 text-white max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Nossa história</p>
          <h1 className="text-4xl md:text-6xl font-bold mt-3 leading-tight">
            Nascemos para tirar o peso da operação dos ombros do proprietário.
          </h1>
          <p className="mt-4 text-lg text-white/85">
            {MAROCAS_BRAND.promessa}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <img src={MAROCAS_IMAGENS.limpeza} alt="Equipe de limpeza Marocas" className="rounded-3xl shadow-xl w-full aspect-[4/5] object-cover" />
        <div>
          <h2 className="text-3xl md:text-4xl font-bold">Operação com padrão auditado.</h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            A Marocas foi criada em {MAROCAS_BRAND.fundacao} para atender proprietários de imóveis de temporada que queriam
            profissionalizar a operação sem depender de coordenar prestadores todos os dias. Hoje operamos dezenas de imóveis
            na Zona Sul do Rio, com checklist fotográfico obrigatório em toda limpeza e vistoria.
          </p>
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {[
              { icon: <ShieldCheck className="h-5 w-5" />, t: "Padrão auditado", d: "Toda limpeza e vistoria com foto e checklist." },
              { icon: <Users className="h-5 w-5" />, t: "Prestadores homologados", d: "Rede treinada e substituível sem esforço." },
              { icon: <Sparkles className="h-5 w-5" />, t: "Cérebro IA por imóvel", d: "Responde ao hóspede 24h com regras da casa." },
              { icon: <ShieldCheck className="h-5 w-5" />, t: "Transparência total", d: "Custos e serviços visíveis no painel." },
            ].map((v) => (
              <div key={v.t} className="rounded-2xl border p-4 bg-card">
                <div className="text-primary">{v.icon}</div>
                <div className="font-semibold mt-2">{v.t}</div>
                <div className="text-sm text-muted-foreground mt-1">{v.d}</div>
              </div>
            ))}
          </div>
          <Link
            to="/marocas/cadastrar-imovel"
            className="inline-flex items-center gap-2 mt-8 rounded-full bg-primary text-primary-foreground px-6 py-3 font-semibold hover:opacity-90 transition"
          >
            Cadastrar meu imóvel <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </MarocasShell>
  );
}
