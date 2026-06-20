import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LifeBuoy, MessageCircle, Wrench, Phone, MapPin, Sparkles, X } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/5521999999999?text=Ol%C3%A1%20Marocas%2C%20preciso%20de%20ajuda";

interface HelpOption {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  external?: boolean;
  variant?: "default" | "danger";
}

const options: HelpOption[] = [
  {
    icon: <MessageCircle className="h-4 w-4" />,
    label: "WhatsApp Marocas",
    description: "Resposta rápida em horário comercial",
    href: WHATSAPP_URL,
    external: true,
  },
  {
    icon: <LifeBuoy className="h-4 w-4" />,
    label: "Central de suporte",
    description: "Abrir chamado e acompanhar status",
    href: "/marocas/assistente?topico=suporte",
  },
  {
    icon: <Phone className="h-4 w-4" />,
    label: "Emergência 24h",
    description: "Vazamento, segurança, sem energia",
    href: "/marocas/assistente?topico=emergencia",
    variant: "danger",
  },
  {
    icon: <Wrench className="h-4 w-4" />,
    label: "Manutenção",
    description: "Solicitar reparo ou preventiva",
    href: "/marocas/assistente?topico=manutencao",
  },
  {
    icon: <MapPin className="h-4 w-4" />,
    label: "Recomendações locais",
    description: "Praias, restaurantes, transporte",
    href: "/marocas#aproveite-o-rio",
  },
  {
    icon: <Sparkles className="h-4 w-4" />,
    label: "Assistente Marocas",
    description: "Respostas guiadas 24h",
    href: "/marocas/assistente",
  },
];

export function MarocasHelpFab() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 w-80 max-w-[calc(100vw-3rem)] rounded-2xl bg-card border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between p-4 border-b bg-muted/40">
            <div>
              <div className="font-semibold">Precisa de ajuda?</div>
              <div className="text-xs text-muted-foreground">Equipe Marocas disponível agora</div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-muted rounded" aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="divide-y">
            {options.map((opt) => {
              const content = (
                <div className="flex items-start gap-3 p-3 hover:bg-muted/50 transition">
                  <div className={`mt-0.5 rounded-md p-2 ${opt.variant === "danger" ? "bg-red-100 text-red-700" : "bg-primary/10 text-primary"}`}>
                    {opt.icon}
                  </div>
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
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3 font-semibold shadow-xl hover:shadow-2xl transition"
        aria-expanded={open}
        aria-label="Precisa de ajuda?"
      >
        <LifeBuoy className="h-5 w-5" />
        Precisa de ajuda?
      </button>
    </div>
  );
}
