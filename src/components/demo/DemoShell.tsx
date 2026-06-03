import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HelpCircle, RotateCcw, LogOut, Info } from "lucide-react";
import { toast } from "sonner";
import logoAsset from "@/assets/logo-impulsionando.png.asset.json";

export interface DemoNavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group?: string;
  help?: string;
}

interface DemoShellProps {
  trackLabel: string;
  trackTagline: string;
  storageKey: string;
  nav: DemoNavItem[];
  activePath: string;
  children: ReactNode;
}

export function DemoShell({ trackLabel, trackTagline, storageKey, nav, activePath, children }: DemoShellProps) {
  const [, setTick] = useState(0);
  useEffect(() => { setTick((t) => t + 1); }, []);

  function resetData() {
    if (!confirm("Zerar todos os dados desta demonstração? Esta ação é instantânea e apaga apenas os dados de teste do seu navegador.")) return;
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(storageKey))
        .forEach((k) => localStorage.removeItem(k));
      toast.success("Dados da demonstração zerados.");
      setTimeout(() => window.location.reload(), 600);
    } catch {
      toast.error("Não foi possível zerar os dados.");
    }
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Banner de demonstração */}
        <div className="bg-gradient-primary text-primary-foreground text-xs">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5" />
              <span className="font-medium">Ambiente de Demonstração — {trackLabel}.</span>
              <span className="opacity-90 hidden sm:inline">{trackTagline}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="secondary" className="h-7">
                <Link to="/demo">Trocar trilha</Link>
              </Button>
              <Button asChild size="sm" variant="secondary" className="h-7">
                <Link to="/">
                  <LogOut className="w-3 h-3 mr-1" /> Sair do DEMO
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
            <div className="h-16 px-5 flex items-center gap-2 border-b border-sidebar-border">
              <img src={logoAsset.url} alt="Impulsionando" className="h-8 w-auto" />
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight">Impulsionando</div>
                <div className="text-[10px] uppercase text-sidebar-foreground/60 tracking-wider">DEMO</div>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {(() => {
                let lastGroup: string | undefined;
                const rendered: ReactNode[] = [];
                nav.forEach((it) => {
                  if (it.group !== lastGroup) {
                    lastGroup = it.group;
                    if (it.group) {
                      rendered.push(
                        <div key={`g-${it.group}`} className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/40">
                          {it.group}
                        </div>
                      );
                    }
                  }
                  const Icon = it.icon;
                  const active = activePath === it.to;
                  rendered.push(
                    <div key={it.to} className="flex items-center gap-1">
                      <Link
                        to={it.to}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors flex-1",
                          active
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-elegant"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{it.label}</span>
                      </Link>
                      {it.help && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="p-1 text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors" aria-label="Ajuda">
                              <HelpCircle className="w-3.5 h-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">{it.help}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  );
                });
                return rendered;
              })()}
            </nav>
            <div className="p-3 border-t border-sidebar-border">
              <Button onClick={resetData} variant="outline" size="sm" className="w-full gap-2">
                <RotateCcw className="w-3.5 h-3.5" /> Zerar dados do DEMO
              </Button>
              <p className="mt-2 text-[10px] text-sidebar-foreground/50 leading-relaxed">
                Reinicia todos os cadastros desta demonstração. Não afeta o sistema real.
              </p>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0 overflow-x-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              <Alert className="mb-6 border-primary/30 bg-primary/5">
                <Info className="h-4 w-4" />
                <AlertTitle className="flex items-center gap-2">
                  Você está no DEMO {trackLabel}
                  <Badge variant="outline" className="ml-2">Sem persistência real</Badge>
                </AlertTitle>
                <AlertDescription className="text-xs">
                  Todos os campos usam listas suspensas para garantir dados padronizados. Passe o mouse nos
                  ícones <HelpCircle className="inline w-3 h-3" /> para entender cada recurso.
                </AlertDescription>
              </Alert>
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

/** Persisted demo storage helper (per track). */
export function useDemoStore<T>(key: string, initial: T): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch { return initial; }
  });
  function update(next: T) {
    setValue(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
  }
  return [value, update];
}
