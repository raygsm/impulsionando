import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { WmpShell } from "@/components/wmp/WmpShell";

type Search = { id?: string };

export const Route = createFileRoute("/wmp/obrigado/$tipo")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  head: () => ({ meta: [{ title: "Recebemos seu pedido — WMP" }] }),
  component: WmpObrigado,
});

function WmpObrigado() {
  const { tipo } = Route.useParams();
  const { id } = Route.useSearch();
  const isBriefing = tipo === "orcamento";

  return (
    <WmpShell>
      <section className="wmp-stage-bg">
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <CheckCircle2 className="size-16 mx-auto mb-6" style={{ color: "var(--wmp-gold)" }} />
          <h1 className="wmp-display text-3xl md:text-5xl mb-4">
            {isBriefing ? "Briefing recebido!" : "Cadastro enviado!"}
          </h1>
          <p className="opacity-80 text-lg mb-2">
            {isBriefing
              ? "Nossa equipe vai analisar seu briefing e entrar em contato em até 24 horas com uma proposta detalhada."
              : "Recebemos seu portfólio. Avaliamos cada parceiro com calma — retorno em até 5 dias úteis."}
          </p>
          {id && <p className="text-xs opacity-50 mb-8">Protocolo: <code>{id.slice(0, 8)}</code></p>}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Link to="/wmp" className="wmp-cta wmp-cta-outline">Voltar ao início</Link>
            {isBriefing && (
              <Link to="/wmp/parceiro" className="wmp-cta">
                Conhecer rede de parceiros <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </section>
    </WmpShell>
  );
}
