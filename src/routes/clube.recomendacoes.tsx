import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, ArrowRight, MessageSquare, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeader } from "@/components/impulsionando";
import { TENANT_MODELS, getTenantModel } from "@/data/tenant-registry";
import { IMPULSIONITO_EXEMPLOS } from "@/data/clube-mocks";

export const Route = createFileRoute("/clube/recomendacoes")({
  head: () => ({
    meta: [
      { title: "Impulsionito — Clube Impulsionando" },
      { name: "description", content: "Interface de recomendação inteligente do Ecossistema Impulsionando. Diga o que precisa e receba o tenant certo." },
      { property: "og:title", content: "Impulsionito — Clube Impulsionando" },
      { property: "og:url", content: "https://impulsionando.com.br/clube/recomendacoes" },
    ],
    links: [{ rel: "canonical", href: "https://impulsionando.com.br/clube/recomendacoes" }],
  }),
  component: ClubeRecomendacoes,
});

/**
 * Interface pronta para o Impulsionito. Sem IA neste momento:
 * usa mapeamento determinístico dos exemplos oficiais para provar
 * o fluxo. Quando o backend estiver ligado, apenas o `resolve()`
 * será substituído por uma chamada de server function.
 */
function resolve(intent: string): { tenantSlug: string; motivo: string } | null {
  const norm = intent.toLowerCase();
  const found = IMPULSIONITO_EXEMPLOS.find((e) => norm.includes(e.intent.toLowerCase().replace(".", "").slice(0, 8)));
  if (found) return { tenantSlug: found.tenantSlug, motivo: found.motivo };
  return null;
}

function ClubeRecomendacoes() {
  const [intent, setIntent] = useState("");
  const [result, setResult] = useState<{ tenantSlug: string; motivo: string } | null>(null);

  const submit = (text: string) => {
    setIntent(text);
    setResult(resolve(text));
  };

  const tenant = result ? getTenantModel(result.tenantSlug) : null;

  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <SectionHeader
        eyebrow="Impulsionito"
        title="Diga o que você quer, receba o caminho certo"
        description="Interface oficial da IA do Ecossistema Impulsionando. Consumo direto de TENANT_MODELS para recomendar o tenant certo por dimensão semântica."
        align="left"
      />

      <div className="mt-6 rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5 md:p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(intent);
          }}
          className="space-y-3"
        >
          <label className="block">
            <span className="text-sm mb-1 block opacity-80 inline-flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-primary" /> O que você está buscando?
            </span>
            <Textarea
              placeholder="Ex.: Quero emagrecer. / Preciso de hospedagem em Búzios."
              rows={3}
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
            />
          </label>
          <div className="flex items-center gap-2">
            <Button type="submit" className="gap-1">
              <MessageSquare className="w-4 h-4" /> Perguntar ao Impulsionito
            </Button>
            <span className="text-xs opacity-60 inline-flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Prévia sem IA — mapeamento determinístico de exemplos oficiais.
            </span>
          </div>
        </form>

        {/* Chips de exemplo */}
        <div className="flex flex-wrap gap-2 mt-4">
          {IMPULSIONITO_EXEMPLOS.map((e) => (
            <button
              key={e.intent}
              type="button"
              onClick={() => submit(e.intent)}
              className="text-xs rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 px-3 py-1"
            >
              {e.intent}
            </button>
          ))}
        </div>
      </div>

      {/* Resultado */}
      {result && tenant && (
        <div className="mt-6 rounded-xl border-2 border-primary/40 bg-primary/5 p-5 md:p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-primary">Recomendação do Impulsionito</div>
          <h2 className="font-serif text-2xl mt-2">{tenant.name}</h2>
          <div className="text-xs opacity-70 mt-1">{tenant.segmentLabel}</div>
          <p className="text-sm opacity-90 mt-3 leading-relaxed">{result.motivo}</p>
          <p className="text-sm opacity-80 mt-1 italic">{tenant.tagline}</p>
          <div className="mt-4">
            <Button asChild className="gap-1">
              <Link to={tenant.route}>
                Ir para {tenant.name} <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {result === null && intent.trim().length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-muted/30 p-5 text-sm opacity-80">
          Ainda não temos um tenant mapeado para essa intenção nesta prévia. Quando o Impulsionito for ativado com IA, todo o catálogo semântico do Ecossistema será considerado.
        </div>
      )}

      {/* Lista bruta dos tenants para contexto */}
      <div className="mt-10">
        <h3 className="font-serif text-lg mb-3">Todos os tenants disponíveis para recomendação</h3>
        <ul className="grid md:grid-cols-2 gap-2 text-sm">
          {TENANT_MODELS.map((t) => (
            <li key={t.slug} className="rounded-lg border border-border p-3">
              <div className="font-medium">{t.name}</div>
              <div className="text-xs opacity-70">{t.segmentLabel} · {t.impulsionitoDimensoes.join(", ")}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
