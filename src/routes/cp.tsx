import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, LockKeyhole, ShieldCheck, TimerReset, UserCheck, Server, Scale, EyeOff, ArrowRight } from "lucide-react";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { CpMark, CP_TAGLINE, CP_SIGNATURE } from "@/components/cp/CpBrand";
import { getCpCommercialCatalog } from "@/lib/cp-commercial.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/cp")({
  head: () => ({
    meta: [
      { title: "CP — Chat Privado | Impulsionando" },
      { name: "description", content: "CP — Chat Privado: comunicação por convite, privacidade configurável e arquitetura projetada para que o provedor não tenha acesso ao conteúdo das conversas." },
      { property: "og:title", content: "CP — Chat Privado" },
      { property: "og:description", content: "A segurança das suas conversas começa aqui — e termina com você." },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/cp" }],
  }),
  component: CpPage,
});

const principles = [
  { icon: LockKeyhole, title: "Conteúdo ponta a ponta", body: "Arquitetura alvo com chaves privadas mantidas nos dispositivos, nunca no servidor da Impulsionando." },
  { icon: UserCheck, title: "Só entra por convite", body: "Primeiro acesso com validação em dois fatores, aceite do convidado e confirmação final de quem convidou." },
  { icon: EyeOff, title: "Identidade discreta", body: "Na rede, cada pessoa é reconhecida por celular e apelido escolhido. Nome civil não é exibido aos demais participantes." },
  { icon: TimerReset, title: "Retenção definida por você", body: "Conversas podem seguir exclusão manual ou automática por janelas configuradas. A exclusão definitiva exige confirmação explícita." },
  { icon: Server, title: "Infraestrutura segregada", body: "O CP foi separado do Core comercial comum e exige infraestrutura dedicada antes de sua homologação plena." },
  { icon: Scale, title: "Privacidade dentro da lei", body: "Conteúdo e registros legais mínimos são tratados em camadas distintas. Hospedagem internacional não é usada para contornar obrigações legais." },
];

function money(v: number | null) {
  if (v == null) return "Sob consulta";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function CpPage() {
  const fetchCatalog = useServerFn(getCpCommercialCatalog);
  const { data } = useQuery({ queryKey: ["cp-commercial-catalog"], queryFn: () => fetchCatalog() });
  const wl = data?.whiteLabel ?? [];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(148,163,184,0.18),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.12),transparent_30%)]" />
          <div className="relative container-narrow py-20 sm:py-28">
            <CpMark className="mb-8 [&_*]:text-white" />
            <Badge className="mb-5 border-white/15 bg-white/5 text-white">Produto independente Impulsionando</Badge>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">{CP_TAGLINE}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">{CP_SIGNATURE}</p>
            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-400">
              O CP está sendo construído para pessoas e organizações que exigem discrição real: executivos, profissionais expostos, equipes sensíveis, famílias, assessorias, jurídico e operações confidenciais. O conteúdo é projetado para permanecer tecnicamente inacessível ao provedor; a homologação comercial plena depende de auditoria criptográfica e testes externos.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-slate-950 hover:bg-slate-100"><Link to="/orcamento">Quero conhecer o CP <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10"><Link to="/sobre">Conhecer a Impulsionando</Link></Button>
            </div>
          </div>
        </section>

        <section className="container-narrow py-16 sm:py-20">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {principles.map((p) => { const Icon = p.icon; return <Card key={p.title} className="border-white/10 bg-white/[0.04] p-6 text-white"><Icon className="h-6 w-6 text-slate-200"/><h2 className="mt-4 font-bold">{p.title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-400">{p.body}</p></Card>; })}
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.03]">
          <div className="container-narrow py-16 sm:py-20">
            <div className="max-w-3xl">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Arquitetura de confiança</div>
              <h2 className="mt-3 text-3xl font-black">Segurança não pode depender de promessa.</h2>
              <p className="mt-4 text-slate-300">O desenho do CP segue quatro fronteiras: conteúdo cifrado ponta a ponta; chaves privadas fora do servidor; metadados minimizados; e registros de acesso legalmente necessários separados do conteúdo. Exclusão de mensagem não será tratada como concluída apenas por um “deleted_at”: a homologação exige prova de purga/crypto-shredding e ausência de backup recuperável do payload.</p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {["Sem exportação nativa de conversas", "Convite + 2FA + duplo aceite", "Retenção manual ou automática", "Revogação de dispositivo", "Chaves por dispositivo", "Sem nome civil visível na rede", "Legal hold separado de conteúdo", "Auditoria externa antes do selo de homologado"].map((x) => <div key={x} className="flex gap-2 text-sm text-slate-300"><Check className="mt-0.5 h-4 w-4 shrink-0" />{x}</div>)}
            </div>
          </div>
        </section>

        <section className="container-narrow py-16 sm:py-20">
          <div className="max-w-3xl"><div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">CP para White Label</div><h2 className="mt-3 text-3xl font-black">Um serviço separado, com escala própria.</h2><p className="mt-3 text-slate-400">O CP não está incluído nos planos Essencial, Ideal ou Full. Para White Label, a cobrança é mensal por faixa de usuários ativos.</p></div>
          <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {wl.map((t) => <Card key={t.code} className="border-white/10 bg-white/[0.04] p-5 text-white"><div className="text-sm font-semibold">{t.name}</div><div className="mt-3 text-2xl font-black">{money(t.monthly_amount)}</div><div className="mt-1 text-xs text-slate-500">por mês</div><p className="mt-3 text-sm text-slate-400">{t.description}</p></Card>)}
          </div>
          <p className="mt-5 text-xs text-slate-500">Contratação direta PF será publicada somente com a tabela histórica já aprovada e reconciliada. Nenhum preço PF será inventado ou derivado de outro produto.</p>
        </section>

        <section className="container-narrow pb-20">
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-8 sm:p-12">
            <ShieldCheck className="h-8 w-8"/><h2 className="mt-5 text-3xl font-black">Privacidade forte e legalmente defensável.</h2>
            <p className="mt-4 max-w-3xl text-slate-300">Se uma autoridade competente requisitar dados, a Impulsionando deverá cumprir a lei na extensão dos dados que efetivamente possuir e puder fornecer. A proposta do CP é justamente reduzir essa superfície: o provedor não deve deter chaves privadas nem conteúdo legível. Isso não elimina obrigações sobre registros de acesso, dados cadastrais ou preservação válida determinada por autoridade competente.</p>
            <Button asChild size="lg" className="mt-7 bg-white text-slate-950 hover:bg-slate-100"><Link to="/orcamento">Falar sobre CP <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
