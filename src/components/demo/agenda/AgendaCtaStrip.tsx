import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, FileText, MessageSquare, Layers } from "lucide-react";
import { AgendaLog } from "@/lib/agendaLogs";
import { toast } from "sonner";

export function AgendaCtaStrip({ lead, onOutrosModulos }: { lead?: string; onOutrosModulos?: () => void }) {
  function go(destino: string, msg: string) {
    AgendaLog.ctaClicado(destino, lead);
    toast.success(msg);
    if (typeof window !== "undefined") window.location.href = destino;
  }
  return (
    <Card className="p-4 border-primary/30 bg-primary/5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-semibold">Gostou da Agenda? Transforme esta demonstração em operação real.</div>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Organize seus horários, reduza faltas e automatize confirmações. Adicione a Agenda ao seu plano e avance para contratação.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="bg-gradient-primary" onClick={() => go("/planos?modulo=agenda", "Levando para planos com Agenda pré-selecionada…")}>
            <Sparkles className="w-4 h-4 mr-1" /> Contratar Agenda real
          </Button>
          <Button size="sm" variant="outline" onClick={() => go("/contato?assunto=orcamento-agenda", "Adicionando Agenda ao orçamento…")}>
            <FileText className="w-4 h-4 mr-1" /> Adicionar ao orçamento
          </Button>
          <Button size="sm" variant="outline" onClick={() => go("/planos", "Indo para planos…")}>
            Ver planos
          </Button>
          <Button size="sm" variant="outline" onClick={() => go("/contato?assunto=agenda", "Conectando com consultor…")}>
            <MessageSquare className="w-4 h-4 mr-1" /> Falar com consultor
          </Button>
          {onOutrosModulos && (
            <Button size="sm" variant="ghost" onClick={() => { AgendaLog.ctaClicado("outros_modulos", lead); onOutrosModulos(); }}>
              <Layers className="w-4 h-4 mr-1" /> Testar outros módulos
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
