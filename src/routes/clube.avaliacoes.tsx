import { createFileRoute } from "@tanstack/react-router";
import { Star, MessageSquare, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeader } from "@/components/impulsionando";
import { CLUBE_AVALIACOES } from "@/data/clube-mocks";

export const Route = createFileRoute("/clube/avaliacoes")({
  head: () => ({
    meta: [
      { title: "Avaliações — Clube Impulsionando" },
      { name: "description", content: "Suas avaliações e comentários sobre empresas do Ecossistema Impulsionando." },
      { property: "og:title", content: "Avaliações — Clube Impulsionando" },
      { property: "og:url", content: "https://impulsionando.com.br/clube/avaliacoes" },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/clube/avaliacoes" }],
  }),
  component: ClubeAvaliacoes,
});

function Stars({ n }: { n: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= n ? "text-primary fill-primary" : "opacity-30"}`} />
      ))}
    </div>
  );
}

function ClubeAvaliacoes() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <SectionHeader
        eyebrow="Avaliações"
        title="Suas avaliações contam"
        description="Compartilhe experiências, notas, comentários e fotos. Ajuda o Ecossistema a melhorar e outros consumidores a escolher."
        align="left"
      />

      {/* Composer */}
      <form className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5 mt-6 space-y-3" onSubmit={(e) => e.preventDefault()}>
        <label className="block">
          <span className="text-sm mb-1 block opacity-80">Empresa</span>
          <select className="w-full rounded-md border border-border bg-background p-2 text-sm">
            <option>Selecione...</option>
            <option>CHRISMED</option>
            <option>Colors Saúde</option>
            <option>Food Service</option>
            <option>Garrido</option>
            <option>WMP</option>
            <option>Marocas</option>
            <option>RIOMED</option>
          </select>
        </label>
        <div>
          <span className="text-sm mb-1 block opacity-80">Sua nota</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} type="button" className="p-1" aria-label={`${i} estrela${i > 1 ? "s" : ""}`}>
                <Star className="w-6 h-6 text-primary" />
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="text-sm mb-1 block opacity-80">Comentário</span>
          <Textarea placeholder="Conte como foi sua experiência..." rows={3} />
        </label>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1"><ImageIcon className="w-4 h-4" /> Adicionar fotos</Button>
          <Button type="submit" size="sm" className="gap-1"><MessageSquare className="w-4 h-4" /> Publicar</Button>
        </div>
      </form>

      {/* Lista */}
      <h2 className="font-serif text-2xl mt-10 mb-4">Suas avaliações recentes</h2>
      <ul className="space-y-3">
        {CLUBE_AVALIACOES.map((a) => (
          <li key={a.id} className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">{a.empresa}</div>
              <div className="text-xs opacity-60">{a.data}</div>
            </div>
            <Stars n={a.nota} />
            <p className="text-sm opacity-80 mt-2">{a.comentario}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
