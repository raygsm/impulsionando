import { useEffect, useState, type ComponentType } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Sparkles,
  LogIn,
  ShieldCheck,
  Settings2,
  Workflow,
  Plug,
  Database,
  Eye,
  Smartphone,
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

export function DemoWelcome(props: WelcomeProps) {
  const dismissKey = `${props.storageKey}.welcome.v3`;
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    try {
      setHidden(localStorage.getItem(dismissKey) === "1");
    } catch {
      setHidden(false);
    }
  }, [dismissKey]);

  if (hidden) {
    return (
      <div className="mb-6 -mt-2 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => {
            try {
              localStorage.removeItem(dismissKey);
            } catch {
              /* ignore */
            }
            setHidden(false);
          }}
        >
          <Eye className="w-3.5 h-3.5 mr-1" /> Ver guia da demonstração
        </Button>
      </div>
    );
  }

  function dismiss() {
    try {
      localStorage.setItem(dismissKey, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  }

  return (
    <Card className="mb-6 overflow-hidden border-primary/30 shadow-elegant">
      <div className="bg-gradient-primary text-primary-foreground px-5 py-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider opacity-85">
              Bem-vindo à demonstração
            </div>
            <div className="text-lg font-semibold leading-tight">
              {props.trackLabel} — tudo configurado, pronto para explorar
            </div>
          </div>
        </div>
        <button
          aria-label="Fechar guia"
          onClick={dismiss}
          className="p-1.5 rounded-md hover:bg-white/15 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        <p className="text-sm text-muted-foreground leading-relaxed">{props.intro}</p>

        {/* Acesso simulado */}
        <div className="grid md:grid-cols-3 gap-3">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <LogIn className="w-3.5 h-3.5" /> Como é o acesso real
            </div>
            <div className="mt-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Login</span>
                <code className="text-xs bg-background border px-1.5 py-0.5 rounded">
                  {props.loginEmail}
                </code>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-muted-foreground">Senha</span>
                <code className="text-xs bg-background border px-1.5 py-0.5 rounded">
                  {props.loginPassword}
                </code>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                {props.accessNote}
              </p>
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

        {/* Destaques */}
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

        {/* Fluxos e integrações */}
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

        {/* Rodapé do guia */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Database className="w-3 h-3" /> Dados salvos só no seu navegador
            </span>
            <span className="inline-flex items-center gap-1">
              <Smartphone className="w-3 h-3" /> Responsivo: teste em mobile
            </span>
            <Badge variant="outline" className="text-[10px]">
              Reset disponível no menu lateral
            </Badge>
          </div>
          <Button size="sm" variant="default" className="bg-gradient-primary" onClick={dismiss}>
            Começar a explorar
          </Button>
        </div>
      </div>
    </Card>
  );
}
