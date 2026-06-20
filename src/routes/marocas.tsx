import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, ShieldCheck, Sparkles, BarChart3, Banknote, Wrench, Camera, Wifi, Waves, UtensilsCrossed, ShoppingBag, Bus, Mountain, Pill, LifeBuoy, Check } from "lucide-react";

export const Route = createFileRoute("/marocas")({
  head: () => ({
    meta: [
      { title: "Marocas — Gestão profissional de aluguel por temporada" },
      { name: "description", content: "Operação completa do seu apartamento de temporada: limpeza, enxoval, manutenção, repasse PIX e portal do proprietário. Integrado ao ecossistema Impulsionando." },
      { property: "og:title", content: "Marocas — Gestão profissional de aluguel por temporada" },
      { property: "og:description", content: "Operação 360º: limpeza, enxoval, manutenção, financeiro e portal transparente para o proprietário." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarocasLanding,
});

function MarocasLanding() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Building2 className="h-6 w-6 text-primary" />
            Marocas
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a href="#aproveite-o-rio" className="hover:underline">Aproveite o Rio</a>
            <a href="#como-funciona" className="hover:underline">Como funciona</a>
            <a href="#operacao" className="hover:underline">Operação</a>
            <a href="#planos" className="hover:underline">Planos</a>
            <a href="#proprietario" className="hover:underline">Proprietário</a>
            <Link to="/contato" className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 font-medium">Quero gerir meu apto</Link>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Aluguel por temporada · turnkey</p>
          <h1 className="text-4xl md:text-5xl font-bold mt-2 leading-tight">
            Seu apartamento sempre pronto. Seu repasse sempre no PIX.
          </h1>
          <p className="text-lg text-muted-foreground mt-4">
            A Marocas opera limpeza, reposição, enxoval, lavanderia, manutenção e cobrança do seu imóvel de temporada — com transparência total no portal do proprietário e integração nativa ao CORE Impulsionando.
          </p>
          <div className="flex gap-3 mt-6">
            <Link to="/contato" className="rounded-md bg-primary text-primary-foreground px-5 py-3 font-semibold">Cadastrar meu apartamento</Link>
            <a href="#como-funciona" className="rounded-md border px-5 py-3 font-semibold">Como funciona</a>
          </div>
          <div className="flex items-center gap-4 mt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Transparência total</span>
            <span className="flex items-center gap-1"><Banknote className="h-4 w-4" /> Repasse PIX mensal</span>
            <span className="flex items-center gap-1"><Camera className="h-4 w-4" /> Vistoria fotográfica</span>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-xl border">
          <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200" alt="Loft Copacabana 811" className="w-full h-full object-cover" />
        </div>
      </section>

      <section id="como-funciona" className="bg-muted/30 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center">Como funciona</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {[
              { t: "1. Cadastre o imóvel", d: "Fotos, diária, características e PIX do proprietário. Em até 48h o apartamento está no ar." },
              { t: "2. Marocas opera", d: "Limpeza, enxoval, lavanderia, manutenção, cobrança e relacionamento com o hóspede — tudo coordenado." },
              { t: "3. Você acompanha e recebe", d: "Portal do proprietário com diário operacional, fotos, ocupação e repasse PIX automático no início do mês." },
            ].map((s) => (
              <div key={s.t} className="rounded-xl bg-card p-6 border">
                <h3 className="font-semibold text-lg">{s.t}</h3>
                <p className="text-muted-foreground mt-2 text-sm">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="operacao" className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center">Operação 360º</h2>
        <div className="grid md:grid-cols-4 gap-4 mt-10">
          {[
            { i: <Sparkles className="h-5 w-5" />, t: "Limpeza & enxoval", d: "Checklist por estadia, fotos antes/depois, reposição automática." },
            { i: <Wrench className="h-5 w-5" />, t: "Manutenção", d: "Marketplace de prestadores com cotações comparadas e aprovação do proprietário." },
            { i: <Banknote className="h-5 w-5" />, t: "Financeiro & PIX", d: "Cobrança do hóspede, extrato mensal e repasse PIX rastreável." },
            { i: <BarChart3 className="h-5 w-5" />, t: "Dashboard", d: "Ocupação, receita, despesas e prazo médio de manutenção." },
          ].map((b) => (
            <div key={b.t} className="rounded-xl border p-5">
              <div className="text-primary">{b.i}</div>
              <h3 className="font-semibold mt-2">{b.t}</h3>
              <p className="text-sm text-muted-foreground mt-1">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="proprietario" className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold">Para o proprietário</h2>
            <ul className="mt-6 space-y-3 text-base">
              <li className="flex gap-2"><ShieldCheck className="h-5 w-5 mt-0.5" /> Histórico completo de cada estadia, com fotos e checklist.</li>
              <li className="flex gap-2"><Banknote className="h-5 w-5 mt-0.5" /> Extrato mensal com receita, taxa Marocas, despesas e repasse PIX.</li>
              <li className="flex gap-2"><Wifi className="h-5 w-5 mt-0.5" /> Acesso ao portal e ao diário operacional do seu apartamento.</li>
              <li className="flex gap-2"><Camera className="h-5 w-5 mt-0.5" /> Vistoria fotográfica entre check-outs e check-ins.</li>
            </ul>
            <Link to="/contato" className="inline-block mt-8 rounded-md bg-background text-foreground px-6 py-3 font-semibold">
              Quero cadastrar meu apartamento
            </Link>
          </div>
          <div className="rounded-2xl bg-primary-foreground/10 p-6 border border-primary-foreground/20">
            <p className="text-xs uppercase tracking-wider opacity-80">Vitrine</p>
            <h3 className="text-2xl font-bold mt-1">Loft Copacabana 811</h3>
            <p className="opacity-90 text-sm mt-2">
              42m² · 1 quarto · até 2 hóspedes · vista mar · Wi-Fi 600MB.
              Diária a partir de R$ 480. Ocupação atual: 87%.
            </p>
            <p className="opacity-70 text-xs mt-4">Operado pela Marocas desde 2024.</p>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Marocas é uma operação integrada ao{" "}
        <Link to="/" className="underline">CORE Impulsionando</Link>.
      </footer>
    </main>
  );
}
