import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, SkipForward, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { AgendaLog } from "@/lib/agendaLogs";
import { toast } from "sonner";

type Etapa = { titulo: string; texto: string; aba?: string };

const ETAPAS: Etapa[] = [
  { titulo: "1. Cadastrar profissional", aba: "profs", texto: "Comece cadastrando quem realiza o atendimento: médico, profissional, professor, advogado, DJ, recepcionista ou responsável." },
  { titulo: "2. Cadastrar serviço", aba: "servs", texto: "Defina o que será agendado: consulta, retorno, aula, reunião, procedimento, reserva ou atendimento." },
  { titulo: "3. Definir disponibilidade", aba: "recursos", texto: "Configure dias, horários, unidade, sala e intervalos para evitar conflitos." },
  { titulo: "4. Cadastrar cliente/paciente", aba: "recursos", texto: "Cadastre a pessoa que será atendida e centralize histórico, WhatsApp, e-mail e próximas ações." },
  { titulo: "5. Criar agendamento", aba: "agendar", texto: "Monte um agendamento completo com profissional, serviço, data, hora, sala, valor e regras de confirmação." },
  { titulo: "6. Simular pagamento", aba: "fluxos", texto: "Quando a regra exigir pagamento, o sistema pode gerar cobrança demo e confirmar o horário após PAGO — DEMO." },
  { titulo: "7. Gerar QR Code demo", aba: "fluxos", texto: "O QR Code simula uma cobrança ou confirmação sem validade real." },
  { titulo: "8. Confirmar PAGO — DEMO", aba: "fluxos", texto: "Após o pagamento fictício, a agenda é confirmada automaticamente." },
  { titulo: "9. Enviar confirmação", aba: "comunicacao", texto: "Teste aviso por WhatsApp e e-mail para cliente, profissional e gestão." },
  { titulo: "10. Arrastar/reagendar horário", aba: "grade", texto: "No desktop, arraste o compromisso. No mobile, use o botão Reagendar." },
  { titulo: "11. Confirmar alteração", aba: "grade", texto: "Toda mudança importante exige confirmação antes de salvar." },
  { titulo: "12. Enviar aviso de reagendamento", aba: "comunicacao", texto: "O sistema avisa automaticamente todos os envolvidos." },
  { titulo: "13. Cancelar horário", aba: "fluxos", texto: "Teste cancelamento com motivo, liberação de horário e comunicação." },
  { titulo: "14. Acionar fila de espera", aba: "fluxos", texto: "Quando um horário é liberado, clientes compatíveis podem ser avisados automaticamente." },
  { titulo: "15. Criar encaixe", aba: "fluxos", texto: "Usuários autorizados podem criar encaixes controlados, sempre com motivo e log." },
  { titulo: "16. Marcar no-show", aba: "grade", texto: "Registre ausência, atualize histórico e dispare recuperação, se configurado." },
  { titulo: "17. Enviar pesquisa pós-atendimento", aba: "fluxos", texto: "Após atendimento concluído, envie pesquisa e alimente indicadores." },
  { titulo: "18. Ver dashboard atualizado", aba: "dashboard", texto: "Acompanhe como cada ação atualiza os indicadores da agenda." },
];

export function AgendaJornadaGuiada({
  open, onOpenChange, onGoTab, onContratar, onOutrosModulos,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onGoTab: (aba: string) => void;
  onContratar: () => void;
  onOutrosModulos: () => void;
}) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(0); setDone(false);
      AgendaLog.jornadaIniciada();
    }
  }, [open]);

  if (!open) return null;
  const total = ETAPAS.length;
  const etapa = ETAPAS[step];

  function continuar() {
    AgendaLog.jornadaEtapa(step + 1, "concluido");
    if (etapa.aba) onGoTab(etapa.aba);
    if (step < total - 1) {
      setStep(step + 1);
      toast.success(`Etapa ${step + 1} concluída.`);
    } else {
      setDone(true);
      AgendaLog.jornadaConcluida();
    }
  }

  function pular() {
    AgendaLog.jornadaEtapa(step + 1, "cancelado");
    if (step < total - 1) setStep(step + 1);
    else { setDone(true); AgendaLog.jornadaConcluida(); }
  }

  function voltar() {
    if (step > 0) setStep(step - 1);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {done ? "Jornada guiada concluída" : `Jornada guiada da Agenda — ${step + 1}/${total}`}
          </DialogTitle>
          <DialogDescription>DEMONSTRAÇÃO — VERSÃO TESTE — nenhum dado real é afetado.</DialogDescription>
        </DialogHeader>

        {!done ? (
          <div className="space-y-3">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-primary transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} />
            </div>
            <div className="space-y-1">
              <div className="font-medium">{etapa.titulo}</div>
              <p className="text-sm text-muted-foreground">{etapa.texto}</p>
            </div>
            {etapa.aba && (
              <Badge variant="outline" className="text-[10px]">Aba sugerida: {etapa.aba}</Badge>
            )}
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Você testou os principais recursos da Agenda Online em ambiente demonstrativo.</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 pt-2">
              <Button className="bg-gradient-primary" onClick={() => { AgendaLog.ctaClicado("contratar_agenda"); onContratar(); }}>
                Contratar Agenda real
              </Button>
              <Button variant="outline" onClick={() => { AgendaLog.ctaClicado("adicionar_orcamento"); window.location.href = "/contato?assunto=orcamento-agenda"; }}>
                Adicionar Agenda ao orçamento
              </Button>
              <Button variant="outline" onClick={() => { AgendaLog.ctaClicado("outros_modulos"); onOutrosModulos(); }}>
                Testar outros módulos
              </Button>
              <Button variant="outline" onClick={() => { AgendaLog.ctaClicado("falar_consultor"); window.location.href = "/contato?assunto=agenda"; }}>
                Falar com consultor
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          {!done ? (
            <>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" disabled={step === 0} onClick={voltar}>
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Voltar
                </Button>
                <Button variant="outline" size="sm" onClick={pular}>
                  <SkipForward className="w-3.5 h-3.5 mr-1" /> Pular etapa
                </Button>
              </div>
              <Button className="bg-gradient-primary" size="sm" onClick={continuar}>
                {step === total - 1 ? "Concluir" : "Continuar"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
