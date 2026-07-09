import { createFileRoute, Link } from "@tanstack/react-router";
import { Handshake, Headphones, Lightbulb, Music2, Mic2, CheckCircle2, ArrowRight } from "lucide-react";
import { WmpShell } from "@/components/wmp/WmpShell";

export const Route = createFileRoute("/wmp/parceiro")({
  head: () => ({
    meta: [{ title: "Seja Parceiro WMP — DJs, músicos, técnicos e fornecedores" }],
  }),
  component: WmpParceiroLanding,
});

function WmpParceiroLanding() {
  return (
    <WmpShell breadcrumbs={[{ label: "Seja Parceiro" }]}>
      <section className="wmp-stage-bg">
        <div className="mx-auto max-w-5xl px-6 pt-16 pb-20 text-center">
          <span className="wmp-chip mb-4"><Handshake className="size-3" /> Rede de parceiros WMP</span>
          <h1 className="wmp-display text-4xl md:text-6xl leading-[1.05] mb-5">
            Mais palco. Mais cachê.<br />Mais previsibilidade.
          </h1>
          <p className="opacity-80 text-lg max-w-2xl mx-auto mb-8">
            Cadastre-se na rede WMP e seja chamado em eventos compatíveis com seu perfil,
            cidade e disponibilidade. Curadoria séria, pagamentos pontuais, contrato claro.
          </p>
          <Link to="/wmp/parceiro/cadastro" className="wmp-cta">
            Quero me cadastrar agora <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="wmp-display text-3xl text-center mb-10">Quem buscamos</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { i: Music2, t: "DJs" },
            { i: Mic2, t: "Músicos / bandas" },
            { i: Headphones, t: "Técnicos de som" },
            { i: Lightbulb, t: "Técnicos de luz" },
          ].map(({ i: Icon, t }) => (
            <div key={t} className="wmp-surface p-5 text-center">
              <Icon className="size-7 mx-auto mb-3" style={{ color: "var(--wmp-gold)" }} />
              <div className="wmp-display text-lg">{t}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="wmp-surface p-8">
          <h2 className="wmp-display text-2xl mb-5">O que oferecemos</h2>
          <ul className="space-y-3">
            {[
              "Eventos recorrentes ao longo do ano, com agenda planejada.",
              "Contrato e cachê combinados antes do evento — sem surpresas.",
              "Pagamento em até 7 dias após o evento.",
              "Estrutura WMP (PA, palco, iluminação) — você foca no que sabe fazer.",
              "Avaliação contínua: mantemos uma rede curada e ativa.",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2">
                <CheckCircle2 className="size-5 mt-0.5 shrink-0" style={{ color: "var(--wmp-gold)" }} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 text-center">
            <Link to="/wmp/parceiro/cadastro" className="wmp-cta">
              Cadastrar meu portfólio <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </WmpShell>
  );
}
