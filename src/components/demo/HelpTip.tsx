import type { ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Biblioteca curta de explicações de conceitos-chave da plataforma.
 * Use <HelpTip k="crm" /> ou <HelpTip>texto custom</HelpTip>.
 *
 * Requer que um <TooltipProvider /> envolva a árvore (já presente em layouts demo).
 */
const LIBRARY: Record<string, ReactNode> = {
  crm: "Organiza leads, clientes, histórico, funis, tarefas e follow-ups para evitar perda de oportunidades.",
  "baixa-automatica":
    "Confirma automaticamente uma agenda, reserva, pedido ou ingresso quando o pagamento é aprovado.",
  "split-automatico":
    "Divide valores entre produtor, afiliado, coprodutor, gerente e plataforma conforme regras configuradas.",
  parametrizacao:
    "Permite ativar ou desativar recursos sem customização complexa, adaptando o sistema à operação de cada cliente.",
  "first-touch":
    "Registra a primeira origem conhecida do lead, ajudando a entender qual canal iniciou a jornada.",
  "last-touch":
    "Registra a última origem antes da conversão, ajudando a medir a campanha que fechou o resultado.",
  permissoes:
    "Define exatamente o que cada usuário pode ver, criar, editar, excluir ou aprovar.",
  trial:
    "Contratação inicial do sistema com cartão de crédito, permitindo cancelamento e reembolso automático até 7 dias após o pagamento.",
  "reembolso-auto":
    "Quando o cancelamento ocorre dentro do prazo de 7 dias, o gateway é acionado automaticamente para devolver o valor ao cartão.",
  coproducer:
    "Sócio do produto que recebe parte da receita conforme percentual ou valor fixo configurado.",
  "gerente-afiliados":
    "Profissional que coordena uma rede de afiliados e recebe override sobre as vendas do time.",
  bump:
    "Oferta adicional exibida no momento da compra principal, normalmente com 1 clique para adicionar.",
  upsell:
    "Oferta complementar exibida após a compra principal, com novo pagamento, para aumentar o ticket médio.",
  "tooltip-demo":
    "Os tooltips explicativos aparecem em toda a área administrativa demo. Passe o mouse (ou toque, no mobile) para ler.",
};

interface HelpTipProps {
  k?: keyof typeof LIBRARY | string;
  children?: ReactNode;
  className?: string;
}

export function HelpTip({ k, children, className }: HelpTipProps) {
  const content = children ?? (k && LIBRARY[k]) ?? "Mais informações em breve.";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Ajuda"
          className={
            "inline-flex items-center justify-center w-4 h-4 text-muted-foreground hover:text-foreground transition-colors align-middle " +
            (className ?? "")
          }
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
