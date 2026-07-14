import { useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Download } from "lucide-react";
import { loadDemoSiteDrafts, type DemoGeneratedSiteDraft } from "@/lib/demo-site-draft";

export const Route = createFileRoute("/demo/rascunho/$id")({
  head: () => ({
    meta: [
      { title: "Rascunho do site — Impulsionando" },
      { name: "description", content: "Preview do rascunho de site gerado a partir da demo Impulsionando." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DraftPreviewPage,
});

function DraftPreviewPage() {
  const { id } = useParams({ from: "/demo/rascunho/$id" });
  const [draft, setDraft] = useState<DemoGeneratedSiteDraft | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const found = loadDemoSiteDrafts().find((d) => d.id === id) ?? null;
    setDraft(found);
    setLoaded(true);
  }, [id]);

  if (!loaded) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando rascunho...</div>;
  }

  if (!draft) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold">Rascunho não encontrado</h1>
        <p className="text-sm text-muted-foreground">
          Os rascunhos ficam salvos no seu navegador. Gere um novo pela vitrine de templates.
        </p>
        <Button asChild>
          <Link to="/demo/templates">Ir para a vitrine</Link>
        </Button>
      </div>
    );
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${draft!.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/demo/templates" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Vitrine
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" /> Rascunho gerado
            </Badge>
            <Button size="sm" variant="outline" onClick={downloadJson}>
              <Download className="mr-2 h-4 w-4" /> Exportar JSON
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-background">
        {draft.hero.image && (
          <div
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: `url(${draft.hero.image})`, backgroundSize: "cover", backgroundPosition: "center" }}
            aria-hidden
          />
        )}
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-24">
          <Badge className="mb-4">Plano recomendado: {draft.qualification.planLabel}</Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{draft.hero.title}</h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">{draft.hero.subtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg">{draft.hero.cta}</Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/demo/templates">Ver outros templates</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-6 sm:grid-cols-2">
          {draft.sections.map((section) => (
            <article key={section.title} className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
              <ul className="mt-4 space-y-2">
                {section.bullets.map((b) => (
                  <li key={b} className="flex gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Contato do lead</p>
            <p className="mt-1 font-medium">{draft.contactName}</p>
            <p className="text-sm text-muted-foreground">{draft.contact.email}</p>
            <p className="text-sm text-muted-foreground">{draft.contact.phone}</p>
            {draft.contact.city && <p className="text-sm text-muted-foreground">{draft.contact.city}</p>}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Qualificação</p>
            <p className="mt-1 text-sm">Time: {draft.qualification.teamSize || "—"}</p>
            <p className="text-sm">Receita: {draft.qualification.monthlyRevenue || "—"}</p>
            <p className="text-sm">Objetivo: {draft.qualification.goal}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">SEO sugerido</p>
            <p className="mt-1 text-sm font-medium">{draft.seo.title}</p>
            <p className="text-sm text-muted-foreground">{draft.seo.description}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
