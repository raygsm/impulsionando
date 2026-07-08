import { createFileRoute } from "@tanstack/react-router";
import { Wallet, TrendingUp, Clock, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/impulsionando";
import {
  CLUBE_CASHBACK_SALDO,
  CLUBE_CASHBACK_PENDENTE,
  CLUBE_CASHBACK_HISTORICO,
} from "@/data/clube-mocks";

export const Route = createFileRoute("/clube/cashback")({
  head: () => ({
    meta: [
      { title: "Cashback — Clube Impulsionando" },
      { name: "description", content: "Saldo, histórico, próximos créditos e regras de cashback do Clube Impulsionando." },
      { property: "og:title", content: "Cashback — Clube Impulsionando" },
      { property: "og:url", content: "https://impulsionando.com.br/clube/cashback" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/clube/cashback" }],
  }),
  component: ClubeCashback,
});

function ClubeCashback() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <SectionHeader
        eyebrow="Cashback"
        title="Seu dinheiro de volta, sempre visível"
        description="Créditos são gerados por compras elegíveis nos tenants do Ecossistema e podem ser utilizados no checkout parceiro."
        align="left"
      />

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
          <div className="text-xs uppercase tracking-[0.2em] text-primary flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Saldo disponível
          </div>
          <div className="font-serif text-4xl mt-2">R$ {CLUBE_CASHBACK_SALDO.toFixed(2).replace(".", ",")}</div>
          <div className="text-xs opacity-70 mt-1">Utilizável no checkout dos parceiros.</div>
        </Card>
        <Card className="p-6">
          <div className="text-xs uppercase tracking-[0.2em] opacity-70 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Pendente
          </div>
          <div className="font-serif text-4xl mt-2">R$ {CLUBE_CASHBACK_PENDENTE.toFixed(2).replace(".", ",")}</div>
          <div className="text-xs opacity-70 mt-1">Libera após 7 dias sem estorno.</div>
        </Card>
        <Card className="p-6">
          <div className="text-xs uppercase tracking-[0.2em] opacity-70 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Total acumulado (12m)
          </div>
          <div className="font-serif text-4xl mt-2">R$ 812,30</div>
          <div className="text-xs opacity-70 mt-1">Nos últimos 12 meses.</div>
        </Card>
      </div>

      <div className="mt-10">
        <h2 className="font-serif text-2xl mb-4">Histórico</h2>
        <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
          {CLUBE_CASHBACK_HISTORICO.map((e) => {
            const positivo = e.valor >= 0;
            return (
              <div key={e.id} className="flex items-center gap-3 p-4">
                <div className={`w-9 h-9 rounded-full inline-flex items-center justify-center ${positivo ? "bg-primary/10 text-primary" : "bg-muted"}`}>
                  {positivo ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{e.descricao}</div>
                  <div className="text-xs opacity-60">{e.data} · {e.status}</div>
                </div>
                <div className={`font-serif ${positivo ? "text-primary" : "opacity-70"}`}>
                  {positivo ? "+" : ""}R$ {Math.abs(e.valor).toFixed(2).replace(".", ",")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-serif text-2xl mb-4">Regras</h2>
        <ul className="space-y-2 text-sm opacity-90 list-disc pl-5">
          <li>Cashback é creditado após 7 dias corridos da compra sem estorno.</li>
          <li>Cada tenant define o percentual próprio; média do Ecossistema é 3% a 8%.</li>
          <li>Créditos não expiram enquanto sua conta estiver ativa.</li>
          <li>Uso limitado ao checkout parceiro; não é sacável em dinheiro.</li>
          <li>Premium multiplica o cashback padrão em categorias selecionadas.</li>
        </ul>
      </div>
    </section>
  );
}
