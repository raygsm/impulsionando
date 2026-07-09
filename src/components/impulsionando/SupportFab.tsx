/**
 * SupportFab — FAB flutuante de suporte (menu com opções de ajuda).
 *
 * Onda 2.9 — Padrão compartilhado do ecossistema para SAC/pós-venda.
 *
 * REGRA DE OURO Impulsionando: WhatsApp é APENAS canal de suporte/SAC/
 * pós-venda quando existe jornada interna. Nunca é o CTA principal de
 * conversão. Este componente reforça isso, colocando WhatsApp junto de
 * opções internas (assistente, FAQ, meus pedidos, etc.) em um menu.
 *
 * Uso:
 *   <SupportFab
 *     tenantLabel="Marocas"
 *     options={[
 *       { icon: <ClipboardList />, label: "Meus pedidos", href: "/marocas/pedidos" },
 *       { icon: <MessageCircle />, label: "WhatsApp SAC", href: "https://wa.me/...", external: true },
 *     ]}
 *   />
 *
 * Nunca colocar dois FABs de suporte por página. Se o tenant precisa de
 * WhatsApp puro (raro), documentar por escrito o motivo.
 */
import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LifeBuoy, X } from "lucide-react";

export interface SupportOption {
  icon: ReactNode;
  label: string;
  description?: string;
  href: string;
  external?: boolean;
}

export interface SupportFabProps {
  /** Nome do tenant exibido no topo do painel. Ex.: "Marocas". */
  tenantLabel: string;
  options: SupportOption[];
  /** Texto do botão fechado (mobile pode esconder). */
  triggerLabel?: string;
  /** Cor do FAB. Default: var(--primary). */
  bg?: string;
  /** Cor do texto do FAB. Default: var(--primary-foreground). */
  fg?: string;
  /** Offset em px do bottom (útil quando há bottom-nav mobile). */
  offsetBottom?: number;
}

export function SupportFab({
  tenantLabel,
  options,
  triggerLabel = "Ajuda",
  bg = "var(--primary, #0f172a)",
  fg = "var(--primary-foreground, #fff)",
  offsetBottom = 24,
}: SupportFabProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="fixed right-6 z-40"
      style={{ bottom: `${offsetBottom}px` }}
    >
      {open && (
        <div className="mb-3 w-80 max-w-[calc(100vw-3rem)] rounded-2xl bg-card border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between p-4 border-b bg-muted/40">
            <div className="min-w-0">
              <div className="font-semibold truncate">Precisa de ajuda?</div>
              <div className="text-xs text-muted-foreground truncate">
                Atendimento {tenantLabel}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-muted rounded shrink-0"
              aria-label="Fechar painel de ajuda"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="divide-y">
            {options.map((opt, i) => {
              const content = (
                <div className="flex items-start gap-3 p-3 hover:bg-muted/50 transition">
                  <div className="mt-0.5 rounded-md p-2 bg-primary/10 text-primary shrink-0">
                    {opt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{opt.label}</div>
                    {opt.description && (
                      <div className="text-xs text-muted-foreground">
                        {opt.description}
                      </div>
                    )}
                  </div>
                </div>
              );
              return (
                <li key={`${opt.label}-${i}`}>
                  {opt.external ? (
                    <a
                      href={opt.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                    >
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
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar ajuda" : "Abrir ajuda e suporte"}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full px-5 py-3 shadow-2xl hover:brightness-110 transition font-semibold text-sm"
        style={{ backgroundColor: bg, color: fg }}
      >
        <LifeBuoy className="h-5 w-5" aria-hidden />
        <span className="hidden sm:inline">{triggerLabel}</span>
      </button>
    </div>
  );
}
