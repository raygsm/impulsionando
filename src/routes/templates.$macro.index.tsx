/**
 * /templates/$macro — Preview do template padrão do macro-nicho +
 * lista de subniches disponíveis.
 */
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getVitrineTemplate, VITRINE_TEMPLATES } from "@/data/vitrine-templates";
import { VitrineTemplateView } from "@/components/vitrine/VitrineTemplateView";
import { DeviceFrame } from "@/components/vitrine/DeviceFrame";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/templates/$macro/")({
  head: ({ params }) => {
    const t = getVitrineTemplate(params.macro);
    if (!t) return { meta: [{ title: "Template não encontrado — Impulsionando" }, { name: "robots", content: "noindex" }] };
    const url = `https://impulsionando.com.br/templates/${t.macro}`;
    return {
      meta: [
        { title: `${t.templateName} — Vitrine Impulsionando` },
        { name: "description", content: t.hero.subtitle },
        { property: "og:title", content: `${t.templateName} — Vitrine Impulsionando` },
        { property: "og:description", content: t.hero.subtitle },
        { property: "og:image", content: t.hero.image },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: t.hero.image },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  loader: ({ params }) => {
    const t = getVitrineTemplate(params.macro);
    if (!t) throw notFound();
    return { macro: t.macro };
  },
  component: VitrineMacroPage,
  notFoundComponent: () => (
    <div className="min-h-dvh grid place-items-center p-8 text-center">
      <div>
        <h1 className="text-2xl font-bold">Template não encontrado</h1>
        <p className="mt-2 text-muted-foreground">Escolha um macro-nicho na vitrine.</p>
        <Button asChild className="mt-4"><Link to="/templates">Voltar à vitrine</Link></Button>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="min-h-dvh grid place-items-center p-8 text-center">
      <div>
        <p className="text-destructive">Erro: {String(error)}</p>
        <Button onClick={reset} className="mt-4">Tentar novamente</Button>
      </div>
    </div>
  ),
});

function VitrineMacroPage() {
  const { macro } = Route.useLoaderData();
  const t = VITRINE_TEMPLATES.find((x) => x.macro === macro)!;
  return (
    <>
      <DeviceFrame>
        <VitrineTemplateView t={t} />
      </DeviceFrame>
      {t.subniches && t.subniches.length > 0 && (
        <section className="bg-background border-t border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
            <div className="mb-8">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Variações por subnicho</div>
              <h2 className="mt-1 font-serif text-3xl font-bold tracking-tight">
                Outros templates dentro de {t.label}
              </h2>
              <p className="mt-2 text-muted-foreground max-w-2xl">
                Cada subnicho tem sua própria variação de imagens, paleta e conteúdo.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {t.subniches.map((s) => (
                <Link
                  key={s.slug}
                  to="/templates/$macro/$sub"
                  params={{ macro: t.macro, sub: s.slug }}
                  className="group overflow-hidden rounded-xl border border-border bg-card hover:shadow-lg hover:border-primary/40 transition"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={s.heroImage ?? t.hero.image}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.label}</div>
                    <h3 className="mt-1 font-semibold">{s.templateName}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.tagline}</p>
                    <div
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold"
                      style={{ color: s.accent ?? t.palette.accent }}
                    >
                      Ver variação <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
