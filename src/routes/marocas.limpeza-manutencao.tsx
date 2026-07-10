import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Camera, RefreshCcw, ShieldCheck } from "lucide-react";
import { MarocasShell } from "@/components/marocas/MarocasShell";
import {
  MAROCAS_IMAGENS,
  MAROCAS_FLUXOS_N8N,
} from "@/components/marocas/marocasContent";

const CANONICAL = "/marocas/limpeza-manutencao";

export const Route = createFileRoute("/marocas/limpeza-manutencao")({
  head: () => ({
    meta: [
      { title: "Limpeza e manutenção — Marocas" },
      { name: "description", content: "Como a Marocas opera limpeza, reposição e manutenção do seu imóvel de temporada: checklist fotográfico, prestadores homologados, substituição automática." },
      { property: "og:title", content: "Limpeza & manutenção Marocas" },
      { property: "og:description", content: "Padrão auditado, checklist obrigatório e rede homologada." },
      { property: "og:url", content: CANONICAL },
      { property: "og:image", content: MAROCAS_IMAGENS.limpeza },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: LimpezaManutencaoPage,
});

function LimpezaManutencaoPage() {
  return (
    <MarocasShell breadcrumbs={[{ label: "Marocas", to: "/marocas" }, { label: "Limpeza & manutenção" }]}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={MAROCAS_IMAGENS.limpeza} alt="Equipe de limpeza Marocas" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 to-slate-900/30" />
        </div>
        <div className="container mx-auto px-4 md:px-6 py-20 text-white max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Operação Marocas</p>
          <h1 className="text-4xl md:text-5xl font-bold mt-3">Padrão de hotelaria dentro de casa.</h1>
          <p className="mt-4 text-white/85 text-lg">
            Cada limpeza, reposição e manutenção com checklist fotográfico, prestadores homologados e substituição automática se necessário.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/marocas/cadastrar-imovel" className="rounded-full bg-amber-300 text-slate-900 px-6 py-3 font-semibold">
              Cadastrar meu imóvel
            </Link>
            <Link to="/marocas/prestadores" className="rounded-full border border-white/40 px-6 py-3 font-semibold hover:bg-white/10 transition">
              Sou prestador
            </Link>
          </div>
        </div>
      </section>

      {/* PILARES */}
      <section className="container mx-auto px-4 md:px-6 py-16 max-w-5xl">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: <Camera className="h-5 w-5" />, t: "Checklist fotográfico", d: "Fotos antes e depois de cada serviço. Histórico permanente por imóvel." },
            { icon: <ShieldCheck className="h-5 w-5" />, t: "Prestadores homologados", d: "Documentação, referências e avaliação prática antes de entrar na rede." },
            { icon: <RefreshCcw className="h-5 w-5" />, t: "Substituição automática", d: "Se um prestador cancela, o serviço volta à fila e outro assume." },
          ].map((p) => (
            <div key={p.t} className="rounded-2xl border bg-card p-5">
              <div className="text-primary">{p.icon}</div>
              <div className="font-semibold mt-3">{p.t}</div>
              <div className="text-sm text-muted-foreground mt-2">{p.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FLUXO DE LIMPEZA */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center">Como uma limpeza acontece</h2>
          <ol className="mt-10 space-y-6">
            {[
              { t: "Check-out do hóspede", d: "Sistema recebe evento e agenda a limpeza automaticamente." },
              { t: "Camareira homologada é acionada", d: "Recebe convite pela plataforma. Se recusar, outro prestador assume em minutos." },
              { t: "Execução com checklist", d: "Foto do imóvel na chegada, limpeza padronizada, troca de enxoval, reposição." },
              { t: "Foto final e ordem de serviço", d: "Registro fotográfico e assinatura digital. Proprietário vê tudo no painel." },
              { t: "Imóvel liberado para próximo hóspede", d: "Agenda atualiza automaticamente." },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-4">
                <div className="grid place-items-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
                  {i + 1}
                </div>
                <div>
                  <div className="font-semibold">{s.t}</div>
                  <div className="text-sm text-muted-foreground mt-1">{s.d}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* MANUTENÇÃO */}
      <section className="container mx-auto px-4 md:px-6 py-16 max-w-5xl">
        <h2 className="text-2xl md:text-3xl font-bold">Manutenção sem enrolação</h2>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Hóspede aciona pelo Maroquito, painel abre ordem de serviço, prestador é notificado, você acompanha em tempo real. Se prestador cancela, sistema busca substituto automaticamente e registra o motivo.
        </p>

        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          {[
            "Ordem de serviço com foto do problema",
            "Prestador homologado por especialidade",
            "Prazo estimado comunicado ao hóspede",
            "Aprovação de orçamento acima do teto",
            "Histórico completo por imóvel",
            "Fechamento com foto final",
          ].map((l) => (
            <div key={l} className="flex gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" /> {l}
            </div>
          ))}
        </div>
      </section>

      {/* AUTOMAÇÕES */}
      <section className="bg-[oklch(0.15_0.02_240)] text-white py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">Automações N8N (Full)</p>
          <h2 className="text-2xl md:text-3xl font-bold mt-2">Cada evento dispara a comunicação certa</h2>
          <p className="mt-3 text-white/75">
            Fluxos preparados no core Impulsionando. Ativação real depende de credenciais WhatsApp Business, e-mail transacional e configuração no Codex.
          </p>

          <div className="mt-8 grid md:grid-cols-2 gap-3">
            {MAROCAS_FLUXOS_N8N.map((f) => (
              <div key={f.evento} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="font-mono text-xs text-amber-300">{f.evento}</div>
                <div className="font-semibold mt-1 text-sm">{f.descricao}</div>
                <div className="text-xs text-white/60 mt-1">Canal: {f.canal}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold">Quer essa operação no seu imóvel?</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/marocas/cadastrar-imovel" className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-semibold">
            Solicitar diagnóstico <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/marocas/planos" className="rounded-full border px-6 py-3 font-semibold">
            Ver planos
          </Link>
        </div>
      </section>
    </MarocasShell>
  );
}
