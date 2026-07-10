import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { Section, SuccessBanner } from "@/components/marocas/MarocasUI";
import { Star } from "lucide-react";

export const Route = createFileRoute("/marocas/app/hospede/avaliacao")({
  head: () => ({ meta: [{ title: "Avaliar estadia — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: AvaliacaoPage,
});

function AvaliacaoPage() {
  const [nota, setNota] = useState(0);
  const [hover, setHover] = useState(0);
  const [enviado, setEnviado] = useState(false);
  return (
    <MarocasAppShell
      title="Como foi sua estadia?"
      description="Sua avaliação nos ajuda a manter o padrão Marocas em cada imóvel."
      breadcrumbs={[{ label: "Hóspede", to: "/marocas/app/hospede" }, { label: "Avaliação" }]}
    >
      {enviado ? (
        <SuccessBanner title="Obrigado pela avaliação!" description="Compartilharemos seu retorno com o anfitrião e a equipe operacional." />
      ) : (
        <form
          className="rounded-xl border bg-card p-6 space-y-6 max-w-2xl"
          onSubmit={(e) => { e.preventDefault(); if (nota > 0) setEnviado(true); }}
        >
          <div>
            <label className="text-sm font-medium">Sua nota geral</label>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNota(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`Dar nota ${n}`}
                  className="p-1"
                >
                  <Star className={`h-8 w-8 transition ${(hover || nota) >= n ? "fill-amber-500 text-amber-500" : "text-muted-foreground/40"}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Destaque algo que te encantou</label>
            <input type="text" className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Ex.: vista, limpeza, atendimento do concierge…" />
          </div>

          <div>
            <label className="text-sm font-medium">Alguma sugestão para melhorarmos?</label>
            <textarea rows={3} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Sugestões, observações, elogios…" />
          </div>

          <button
            type="submit"
            disabled={nota === 0}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            Enviar avaliação
          </button>
          <p className="text-[11px] text-muted-foreground">Persistência real será conectada pelo Codex.</p>
        </form>
      )}
    </MarocasAppShell>
  );
}
