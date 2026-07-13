/**
 * /meu-projeto — Onda 4
 * Área do cliente autenticado com status dos briefings enviados
 * (pós-checkout: site institucional e futuros produtos).
 */
import { createFileRoute, ErrorComponent, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyBriefings } from "@/lib/my-briefings.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, FileText, Loader2, PlayCircle, PlusCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/meu-projeto")({
  component: MyProjectPage,
  errorComponent: ErrorComponent,
  notFoundComponent: () => <div className="p-8">Não encontrado</div>,
});

type Briefing = {
  id: string;
  company_name: string | null;
  source: string | null;
  status: string | null;
  niche: string | null;
  goals: string | null;
  created_at: string;
  updated_at: string | null;
  reviewed_at: string | null;
};

const SOURCE_LABEL: Record<string, string> = {
  "site-institucional": "Site Institucional",
};

const STEPS = [
  { key: "received", label: "Briefing recebido", icon: FileText },
  { key: "in_progress", label: "Em produção", icon: PlayCircle },
  { key: "review", label: "Revisão com você", icon: Clock },
  { key: "delivered", label: "Entregue", icon: CheckCircle2 },
];

function stepIndex(status: string | null | undefined) {
  switch ((status ?? "").toLowerCase()) {
    case "delivered":
    case "done":
      return 3;
    case "review":
    case "in_review":
      return 2;
    case "in_progress":
    case "producing":
      return 1;
    default:
      return 0;
  }
}

function MyProjectPage() {
  const fn = useServerFn(getMyBriefings);
  const q = useQuery({ queryKey: ["my-briefings"], queryFn: () => fn() });

  if (q.isLoading) {
    return (
      <div className="container mx-auto p-8 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando seus projetos…
      </div>
    );
  }

  const briefings = (q.data?.briefings ?? []) as Briefing[];

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Meu projeto</h1>
          <p className="text-muted-foreground">
            Acompanhe aqui o andamento de tudo que você contratou com a Impulsionando.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/quero-comecar">
            <PlusCircle className="h-4 w-4 mr-2" /> Novo projeto
          </Link>
        </Button>
      </header>

      {briefings.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum briefing encontrado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ainda não recebemos um briefing associado ao seu e-mail. Se você acabou
              de fechar um plano, preencha o briefing para começarmos a produção.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/briefing/site-institucional">Preencher briefing do site</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/quero-comecar">Falar com o time</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        briefings.map((b) => {
          const idx = stepIndex(b.status);
          const productLabel = SOURCE_LABEL[b.source ?? ""] ?? b.source ?? "Projeto";
          return (
            <Card key={b.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">{productLabel}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {b.company_name ?? "—"} · enviado em{" "}
                    {new Date(b.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Badge variant={idx === 3 ? "default" : "secondary"}>
                  {STEPS[idx].label}
                </Badge>
              </CardHeader>
              <CardContent>
                <ol className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {STEPS.map((s, i) => {
                    const Icon = s.icon;
                    const active = i <= idx;
                    return (
                      <li
                        key={s.key}
                        className={`rounded-md border p-3 text-center text-xs ${
                          active
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 mx-auto mb-1 ${
                            active ? "text-primary" : ""
                          }`}
                        />
                        {s.label}
                      </li>
                    );
                  })}
                </ol>
                {b.goals && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    <strong className="text-foreground">Objetivo:</strong> {b.goals}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
