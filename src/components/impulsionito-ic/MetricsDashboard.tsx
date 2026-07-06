import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useHistory, useLearnings, usePromptVersions } from "@/lib/impulsionito-ic/store";
import { MessageCircle, CheckCircle2, Clock, UserRound, BookOpen, HelpCircle, Sparkles, Tag } from "lucide-react";

function Kpi({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 text-primary p-2">{icon}</div>
          <div className="min-w-0">
            <div className="text-xs uppercase text-muted-foreground">{label}</div>
            <div className="text-2xl font-semibold">{value}</div>
            {hint ? <div className="text-xs text-muted-foreground truncate">{hint}</div> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricsDashboard() {
  const { items: history } = useHistory();
  const { items: learnings } = useLearnings();
  const { items: versions } = usePromptVersions();

  const answered = history.length;
  const resolved = history.filter((h) => h.resolved).length;
  const escalations = history.filter((h) => h.escalated).length;
  const avgLatency =
    history.length > 0
      ? Math.round(history.reduce((s, h) => s + h.latencyMs, 0) / history.length)
      : 0;
  const rate = answered > 0 ? Math.round((resolved / answered) * 100) : 0;
  const pendingLearnings = learnings.filter((l) => l.status === "pendente").length;
  const activeVersion = versions.find((v) => v.activated);

  const topKnowledge = useMemo(() => {
    const map = new Map<string, number>();
    history.forEach((h) => h.knowledgeUsed.forEach((k) => map.set(k, (map.get(k) ?? 0) + 1)));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [history]);

  const unanswered = useMemo(
    () => history.filter((h) => !h.resolved).slice(0, 5),
    [history],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={<MessageCircle className="h-5 w-5" />} label="Perguntas respondidas" value={String(answered)} />
        <Kpi icon={<CheckCircle2 className="h-5 w-5" />} label="Taxa de resolução" value={`${rate}%`} />
        <Kpi icon={<Clock className="h-5 w-5" />} label="Tempo médio" value={`${avgLatency} ms`} />
        <Kpi icon={<UserRound className="h-5 w-5" />} label="Escalonamentos humanos" value={String(escalations)} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={<Sparkles className="h-5 w-5" />} label="Novos aprendizados" value={String(pendingLearnings)} hint="aguardando aprovação" />
        <Kpi icon={<HelpCircle className="h-5 w-5" />} label="Perguntas sem resposta" value={String(unanswered.length)} />
        <Kpi
          icon={<Tag className="h-5 w-5" />}
          label="Versão ativa do Prompt"
          value={activeVersion ? `v${activeVersion.version}` : "—"}
          hint={activeVersion?.note}
        />
        <Kpi
          icon={<BookOpen className="h-5 w-5" />}
          label="Conhecimento mais usado"
          value={topKnowledge[0]?.[0] ?? "—"}
          hint={topKnowledge[0] ? `${topKnowledge[0][1]} usos` : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Conhecimentos mais utilizados</CardTitle></CardHeader>
          <CardContent>
            {topKnowledge.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem uso registrado ainda.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {topKnowledge.map(([name, count]) => (
                  <li key={name} className="flex items-center justify-between">
                    <span className="truncate">{name}</span>
                    <Badge variant="secondary">{count}x</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Perguntas sem resposta</CardTitle></CardHeader>
          <CardContent>
            {unanswered.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma pergunta em aberto.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {unanswered.map((h) => (
                  <li key={h.id} className="rounded-md border p-2">
                    <div className="text-xs text-muted-foreground">
                      {new Date(h.when).toLocaleString("pt-BR")} · {h.tenant} · {h.page}
                    </div>
                    <div className="mt-1">{h.question}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
