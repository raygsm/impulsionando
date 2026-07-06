import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useHistory, usePromptVersions } from "@/lib/impulsionito-ic/store";
import { Button } from "@/components/ui/button";

export function HistoryPanel() {
  const { items } = useHistory();
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Últimos atendimentos processados pelo Impulsionito. Fonte de aprendizados
        automáticos.
      </p>
      <div className="grid gap-2">
        {items.map((h) => (
          <Card key={h.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-sm">{h.question}</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={h.resolved ? "default" : "secondary"}>
                    {h.resolved ? "Resolvido" : "Em aberto"}
                  </Badge>
                  {h.escalated ? <Badge variant="outline">Escalado</Badge> : null}
                  <span>{new Date(h.when).toLocaleString("pt-BR")}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="text-xs text-muted-foreground">
                tenant {h.tenant} · {h.page} · perfil {h.userProfile} · {h.latencyMs}ms
              </div>
              <div>{h.answer}</div>
              <div className="text-xs text-muted-foreground">
                Conhecimento usado: {h.knowledgeUsed.join(", ")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function PromptVersionsPanel() {
  const { items, activate } = usePromptVersions();
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Toda publicação do Prompt Mestre gera uma nova versão imutável.
      </p>
      <div className="grid gap-2">
        {items.map((v) => (
          <Card key={v.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-sm">Versão v{v.version}</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {v.activated ? <Badge>Ativa</Badge> : <Badge variant="outline">Arquivada</Badge>}
                  <span>{new Date(v.createdAt).toLocaleString("pt-BR")}</span>
                  <span>por {v.createdBy}</span>
                  {!v.activated ? (
                    <Button size="sm" variant="ghost" onClick={() => activate(v.id)}>
                      Ativar
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="text-muted-foreground text-xs mb-1">Nota</div>
              <div>{v.note}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {v.composition.map((c) => (
                  <Badge key={c} variant="secondary" className="font-normal">
                    {c}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
