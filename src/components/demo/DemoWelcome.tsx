import { useEffect, useState, type ComponentType } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  LogIn,
  ShieldCheck,
  Settings2,
  Workflow,
  Plug,
  Database,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

interface WelcomeProps {
  storageKey: string;
  trackLabel: string;
  intro: string;
  loginEmail: string;
  loginPassword: string;
  accessNote: string;
  highlights: { icon: ComponentType<{ className?: string }>; title: string; text: string }[];
  flows: string[];
  integrations: string[];
}

/**
 * Versão compacta + recolhível do guia de boas-vindas da demonstração.
 * Estado padrão: recolhido (banner pequeno), não empurra o conteúdo principal para baixo.
 */
export function DemoWelcome(props: WelcomeProps) {
  const openKey = `${props.storageKey}.welcome.open.v1`;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(openKey) === "1");
    } catch {
      /* ignore */
    }
  }, [openKey]);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(openKey, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <Card className="mb-4 overflow-hidden border-primary/20 shadow-sm">
      {/* Banner compacto sempre visível */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-md bg-gradient-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight truncate">
              Ambiente de demonstração — {props.trackLabel}
            </div>
            <div className="text-xs text-muted-foreground leading-tight truncate">
              Teste os principais recursos da plataforma com dados fictícios e seguros.
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-primary font-medium shrink-0">
          {open ? "Ocultar detalhes" : "Ver detalhes da demonstração"}
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {/* Conteúdo expandido (acordeão) */}
      {open && (
        <div className="p-5 space-y-5 border-t bg-card">
          <p className="text-sm text-muted-foreground leading-relaxed">{props.intro}</p>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <LogIn className="w-3.5 h-3.5" /> Como é o acesso real
              </div>
              <div className="mt-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Login</span>
                  <code className="text-xs bg-background border px-1.5 py-0.5 rounded">{props.loginEmail}</code>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-muted-foreground">Senha</span>
                  <code className="text-xs bg-background border px-1.5 py-0.5 rounded">{props.loginPassword}</code>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">{props.accessNote}</p>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5" /> Segurança & permissões
              </div>
              <ul className="mt-2 text-xs space-y-1.5">
                <li>• Perfis com permissões granulares por módulo</li>
                <li>• Sessão isolada por empresa (multi-tenant)</li>
                <li>• Auditoria de criação, edição e remoção</li>
                <li>• LGPD: consentimento e direito ao esquecimento</li>
              </ul>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Settings2 className="w-3.5 h-3.5" /> Configurações inclusas
              </div>
              <ul className="mt-2 text-xs space-y-1.5">
                <li>• Cadastros padronizados (sem texto livre)</li>
                <li>• Tabelas, listas suspensas e máscaras já prontas</li>
                <li>• Dashboards e KPIs ligados a dados reais</li>
                <li>• Notificações in-app por categoria</li>
              </ul>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {props.highlights.map((h) => {
              const Icon = h.icon;
              return (
                <div key={h.title} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="w-4 h-4 text-primary" /> {h.title}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{h.text}</p>
                </div>
              );
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Workflow className="w-4 h-4 text-primary" /> Fluxos ativos nesta demonstração
              </div>
              <ul className="mt-2 text-xs space-y-1.5">
                {props.flows.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Plug className="w-4 h-4 text-primary" /> Integrações & conexões
              </div>
              <ul className="mt-2 text-xs space-y-1.5">
                {props.integrations.map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap pt-2 border-t text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Database className="w-3 h-3" /> Dados salvos só no seu navegador
            </span>
            <span className="inline-flex items-center gap-1">
              <Smartphone className="w-3 h-3" /> Responsivo: teste em mobile
            </span>
            <Badge variant="outline" className="text-[10px]">
              <Sparkles className="w-3 h-3 mr-1" /> Reset disponível no menu lateral
            </Badge>
            <Button size="sm" variant="ghost" className="ml-auto h-7 text-xs" onClick={toggle}>
              Recolher
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
