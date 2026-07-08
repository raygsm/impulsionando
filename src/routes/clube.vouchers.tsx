import { createFileRoute } from "@tanstack/react-router";
import { Ticket, Calendar, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/impulsionando";
import { CLUBE_VOUCHERS } from "@/data/clube-mocks";

export const Route = createFileRoute("/clube/vouchers")({
  head: () => ({
    meta: [
      { title: "Vouchers — Clube Impulsionando" },
      { name: "description", content: "Todos os vouchers ativos, usados e expirados do Clube Impulsionando. Categorias, validade e empresas participantes." },
      { property: "og:title", content: "Vouchers — Clube Impulsionando" },
      { property: "og:url", content: "https://impulsionando.com.br/clube/vouchers" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/clube/vouchers" }],
  }),
  component: ClubeVouchers,
});

const STATUS_STYLE: Record<string, { icon: typeof Ticket; label: string; className: string }> = {
  ativo: { icon: CheckCircle2, label: "Ativo", className: "bg-primary/10 text-primary" },
  usado: { icon: Ticket, label: "Usado", className: "bg-muted text-foreground/70" },
  expirado: { icon: X, label: "Expirado", className: "bg-destructive/10 text-destructive" },
};

function ClubeVouchers() {
  const groups = (["ativo", "usado", "expirado"] as const).map((s) => ({
    status: s,
    list: CLUBE_VOUCHERS.filter((v) => v.status === s),
  }));

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <SectionHeader
        eyebrow="Vouchers"
        title="Seus benefícios aplicáveis"
        description="Cupons dos tenants oficiais. Toque em utilizar para copiar o código no checkout parceiro."
        align="left"
      />

      {groups.map(({ status, list }) => {
        const meta = STATUS_STYLE[status];
        return (
          <div key={status} className="mt-8">
            <h2 className="flex items-center gap-2 font-serif text-xl mb-4">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${meta.className}`}>
                <meta.icon className="w-3.5 h-3.5" /> {meta.label}
              </span>
              <span className="opacity-60 text-sm">({list.length})</span>
            </h2>

            {list.length === 0 ? (
              <p className="opacity-60 text-sm">Nenhum voucher nesta categoria.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {list.map((v) => (
                  <article key={v.id} className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-serif text-2xl text-primary">{v.desconto}</span>
                      <span className="text-[10px] uppercase tracking-wider rounded-full bg-muted px-2 py-1">{v.categoria}</span>
                    </div>
                    <div className="font-medium">{v.titulo}</div>
                    <div className="text-xs opacity-70 mt-1">{v.empresa} · {v.cidade}</div>
                    <div className="flex items-center gap-1 text-xs opacity-70 mt-3 flex-1">
                      <Calendar className="w-3.5 h-3.5" /> Válido até {v.validade}
                    </div>
                    <Button size="sm" disabled={v.status !== "ativo"} className="mt-4">
                      {v.status === "ativo" ? "Utilizar" : v.status === "usado" ? "Já utilizado" : "Expirado"}
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
