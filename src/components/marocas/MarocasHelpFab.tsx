// Maroquito — FAB único da Marocas.
// Une ajuda + assistente IA em um só balão (unificação solicitada).
// WhatsApp aparece apenas como SAC/suporte pós-venda.
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  MessageCircle,
  HelpCircle,
  Home,
  Wrench,
  X,
} from "lucide-react";
import { marocasWhatsAppUrl } from "./marocasContent";

interface HelpOption {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  external?: boolean;
}

const options: HelpOption[] = [
  {
    icon: <Home className="h-4 w-4" />,
    label: "Cadastrar meu imóvel",
    description: "Diagnóstico gratuito para anfitriões",
    href: "/marocas/cadastrar-imovel",
  },
  {
    icon: <Wrench className="h-4 w-4" />,
    label: "Solicitar manutenção",
    description: "Hóspede aciona um prestador homologado",
    href: "/marocas/hospedes",
  },
  {
    icon: <HelpCircle className="h-4 w-4" />,
    label: "Dúvidas frequentes",
    description: "Anfitrião, hóspede e prestador",
    href: "/marocas/faq",
  },
  {
    icon: <MessageCircle className="h-4 w-4" />,
    label: "WhatsApp de suporte",
    description: "Somente SAC — 08h às 20h",
    href: marocasWhatsAppUrl("Olá Maroquito, preciso de suporte."),
    external: true,
  },
];

/** FAB unificado: “Maroquito” — ajuda + assistente IA em um só balão. */
export function MaroquitoFab() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="mb-3 w-80 max-w-[calc(100vw-3rem)] rounded-2xl bg-card border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-br from-primary/10 to-transparent">
            <div className="flex items-center gap-2">
              <span className="grid place-items-center h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-sm">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <div className="font-semibold">Oi, sou o Maroquito</div>
                <div className="text-xs text-muted-foreground">Assistente da Marocas · ajuda + IA</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-muted rounded"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="divide-y">
            {options.map((opt) => {
              const content = (
                <div className="flex items-start gap-3 p-3 hover:bg-muted/50 transition">
                  <div className="mt-0.5 rounded-md p-2 bg-primary/10 text-primary">{opt.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.description}</div>
                  </div>
                </div>
              );
              return (
                <li key={opt.label}>
                  {opt.external ? (
                    <a href={opt.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
                      {content}
                    </a>
                  ) : (
                    <Link to={opt.href} onClick={() => setOpen(false)}>
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="p-3 text-[11px] text-muted-foreground bg-muted/30 border-t">
            O Maroquito responde 24h por texto e escala para atendente humano em horário comercial.
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3 font-semibold shadow-xl hover:shadow-2xl transition"
        aria-expanded={open}
        aria-label="Falar com Maroquito"
      >
        <Sparkles className="h-5 w-5" />
        Maroquito
      </button>
    </div>
  );
}

// Compatibilidade com imports antigos (nenhum ativo hoje, mas seguro).
export const MarocasHelpFab = MaroquitoFab;
