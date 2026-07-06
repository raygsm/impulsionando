import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLearnings } from "@/lib/impulsionito-ic/store";
import type { LearningKind, LearningStatus } from "@/lib/impulsionito-ic/types";
import { Check, X, ArrowRight } from "lucide-react";

const KIND_LABEL: Record<LearningKind, string> = {
  duvida_recorrente: "Dúvida recorrente",
  objecao: "Objeção",
  elogio: "Elogio",
  pedido_funcionalidade: "Pedido de funcionalidade",
  reclamacao: "Reclamação",
  sugestao: "Sugestão",
};

const STATUS_LABEL: Record<LearningStatus, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  convertido: "Convertido",
};

export function LearningsReview() {
  const { items, update } = useLearnings();
  const [filter, setFilter] = useState<LearningStatus | "todos">("pendente");
  const [kind, setKind] = useState<LearningKind | "todos">("todos");

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (filter === "todos" || i.status === filter) && (kind === "todos" || i.kind === kind),
      ),
    [items, filter, kind],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <div className="text-xs uppercase text-muted-foreground mb-1">Status</div>
          <Select value={filter} onValueChange={(v) => setFilter(v as LearningStatus | "todos")}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="aprovado">Aprovados</SelectItem>
              <SelectItem value="rejeitado">Rejeitados</SelectItem>
              <SelectItem value="convertido">Convertidos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <div className="text-xs uppercase text-muted-foreground mb-1">Tipo</div>
          <Select value={kind} onValueChange={(v) => setKind(v as LearningKind | "todos")}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {Object.entries(KIND_LABEL).map(([k, l]) => (
                <SelectItem key={k} value={k}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground max-w-md ml-auto">
          Aprendizados <b>nunca</b> entram automaticamente no Prompt Mestre. Precisam
          ser aprovados aqui.
        </p>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">Nada por aqui.</CardContent></Card>
        ) : (
          filtered.map((l) => (
            <Card key={l.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-base">{l.summary}</CardTitle>
                    <div className="mt-1 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                      <Badge variant="outline">{KIND_LABEL[l.kind]}</Badge>
                      <Badge
                        variant={
                          l.status === "pendente"
                            ? "secondary"
                            : l.status === "aprovado"
                              ? "default"
                              : l.status === "convertido"
                                ? "default"
                                : "outline"
                        }
                      >
                        {STATUS_LABEL[l.status]}
                      </Badge>
                      <span>· frequência {l.frequency}x</span>
                      <span>· {new Date(l.detectedAt).toLocaleString("pt-BR")}</span>
                      {l.origin.tenant ? <span>· tenant {l.origin.tenant}</span> : null}
                      {l.origin.page ? <span>· {l.origin.page}</span> : null}
                      {l.origin.userProfile ? <span>· {l.origin.userProfile}</span> : null}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Transcrição</div>
                  <p className="text-muted-foreground">{l.transcript}</p>
                </div>
                {l.suggestedAnswer ? (
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Sugestão de resposta</div>
                    <p>{l.suggestedAnswer}</p>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" onClick={() => update(l.id, { status: "aprovado" })}>
                    <Check className="h-4 w-4 mr-1" /> Aprovar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => update(l.id, { status: "rejeitado" })}>
                    <X className="h-4 w-4 mr-1" /> Rejeitar
                  </Button>
                  <ConvertMenu
                    onConvert={(section) =>
                      update(l.id, {
                        status: "convertido",
                        convertedInto: { section, itemId: `${section}-conv-${l.id}` },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function ConvertMenu({
  onConvert,
}: {
  onConvert: (section: "faq" | "scripts-comerciais" | "scripts-suporte" | "base-conhecimento") => void;
}) {
  const opts: { key: "faq" | "scripts-comerciais" | "scripts-suporte" | "base-conhecimento"; label: string }[] = [
    { key: "faq", label: "FAQ" },
    { key: "scripts-comerciais", label: "Script Comercial" },
    { key: "scripts-suporte", label: "Script de Suporte" },
    { key: "base-conhecimento", label: "Conhecimento Permanente" },
  ];
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <ArrowRight className="h-3 w-3" /> Converter em:
      </span>
      {opts.map((o) => (
        <Button key={o.key} size="sm" variant="outline" onClick={() => onConvert(o.key)}>
          {o.label}
        </Button>
      ))}
    </div>
  );
}
