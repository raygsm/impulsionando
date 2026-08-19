import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { HelpCircle, RotateCcw, LogOut, Info, Menu } from "lucide-react";
import { toast } from "sonner";
import { LogoImpulsionando } from "@/components/brand/LogoImpulsionando";
import { DemoTestContactPanel } from "@/components/demo/DemoTestContactPanel";
import { DemoModuleSwitcher } from "@/components/demo/DemoModuleSwitcher";
import type { DemoModuleKey } from "@/lib/demoModules";

export interface DemoNavItem {
  id: string;
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
  activeId: string;
  onSelect: (id: string) => void;
  currentModule?: DemoModuleKey;
  children: ReactNode;
}

export function DemoShell({ trackLabel, trackTagline, storageKey, nav, activeId, onSelect, currentModule, children }: DemoShellProps) {
  const [, setTick] = useState(0);
  useEffect(() => setTick((t) => t + 1), []);

  function resetData() {
    if (!confirm("Zerar todos os dados desta demonstração? Esta ação apaga apenas os dados de teste deste navegador.")) return;
    try {
      Object.keys(localStorage).filter((k) => k.startsWith(storageKey)).forEach((k) => localStorage.removeItem(k));
      toast.success("Dados da demonstração zerados.");
      setTimeout(() => window.location.reload(), 400);
    } catch {
      toast.error("Não foi possível zerar os dados.");
    }
  }

  const activeItem = nav.find((n) => n.id === activeId);
  const navList = (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      {nav.map((it) => {
        const Icon = it.icon;
        const active = activeId === it.id;
        return (
          <div key={it.id}>
            {it.group ? <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/40">{it.group}</div> : null}
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => onSelect(it.id)} className={cn("flex flex-1 items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors", active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent") }>
                <Icon className="h-4 w-4 shrink-0" />
                <span>{it.label}</span>
              </button>
              {it.help ? <Tooltip><TooltipTrigger asChild><button aria-label="Ajuda" className="p-1 text-sidebar-foreground/40"><HelpCircle className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent side="right" className="max-w-xs">{it.help}</TooltipContent></Tooltip> : null}
            </div>
          </div>
        );
      })}
    </nav>
  );

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen flex flex-col bg-background">
        <div className="bg-gradient-primary text-primary-foreground text-xs">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2"><Info className="w-3.5 h-3.5" /><span className="font-medium">Ambiente de Demonstração — {trackLabel}.</span><span className="opacity-90 hidden sm:inline">{trackTagline}</span></div>
            <div className="flex items-center gap-2"><DemoModuleSwitcher current={currentModule} size="sm" variant="secondary" className="h-7" /><Button asChild size="sm" variant="secondary" className="h-7"><Link to="/demo">Trocar trilha</Link></Button><Button asChild size="sm" variant="secondary" className="h-7"><Link to="/"><LogOut className="w-3 h-3 mr-1" /> Sair do DEMO</Link></Button></div>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <aside className="hidden lg:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
            <div className="h-20 px-5 flex items-center gap-2 border-b border-sidebar-border"><LogoImpulsionando variant="dark" size="sm" /><div className="leading-tight"><div className="text-sm font-semibold">Impulsionando</div><div className="text-[10px] uppercase text-sidebar-foreground/60 tracking-wider">DEMO</div></div></div>
            {navList}
            <div className="p-3 border-t border-sidebar-border"><Button onClick={resetData} size="sm" className="w-full gap-2 bg-destructive text-destructive-foreground"><RotateCcw className="w-3.5 h-3.5" /> Zerar dados do DEMO</Button></div>
          </aside>

          <main className="flex-1 min-w-0 overflow-x-hidden">
            <div className="lg:hidden flex items-center justify-between gap-2 px-4 py-3 border-b bg-card">
              <Sheet><SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Abrir menu"><Menu className="w-5 h-5" /></Button></SheetTrigger><SheetContent side="left" className="p-0 w-72 bg-sidebar text-sidebar-foreground"><div className="h-20 px-5 flex items-center gap-2 border-b border-sidebar-border"><LogoImpulsionando variant="dark" size="sm" /><div className="text-sm font-semibold">Impulsionando DEMO</div></div>{navList}</SheetContent></Sheet>
              <div className="flex items-center gap-2 text-sm font-medium">{activeItem?.icon ? <activeItem.icon className="w-4 h-4" /> : null}{activeItem?.label}</div><div className="w-9" />
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              <Alert className="mb-6 border-primary/30 bg-primary/5"><Info className="h-4 w-4" /><AlertTitle className="flex items-center gap-2">Você está no DEMO {trackLabel} — {activeItem?.label}<Badge variant="outline" className="ml-2">Sem persistência real</Badge></AlertTitle><AlertDescription className="text-xs">Os dados de demonstração ficam apenas neste navegador e podem ser zerados a qualquer momento.</AlertDescription></Alert>
              {children}

              <div className="mt-10 rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6">
                <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-center">
                  <div><Badge className="bg-gradient-primary mb-2 text-[10px]">Catálogo vivo</Badge><h3 className="font-semibold text-lg tracking-tight">Gostou da demonstração? Veja os planos oficiais</h3><p className="text-sm text-muted-foreground mt-1 leading-relaxed">Os valores e condições são carregados da fonte comercial do Core e seguem a política vigente da Impulsionando. Não exibimos preços congelados dentro das demos.</p></div>
                  <Button asChild><Link to="/planos">Ver planos atualizados →</Link></Button>
                </div>
              </div>
            </div>
          </main>
        </div>
        <DemoTestContactPanel />
      </div>
    </TooltipProvider>
  );
}

export function useDemoStore<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : initial; } catch { return initial; }
  });
  function update(next: T | ((prev: T) => T)) {
    setValue((prev) => {
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try { localStorage.setItem(key, JSON.stringify(resolved)); } catch { /* noop */ }
      return resolved;
    });
  }
  return [value, update];
}

export function DemoSelect({ label, value, onChange, options, placeholder = "Selecione...", help }: { label: string; value: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string; help?: string }) {
  return <div className="space-y-1"><label className="text-xs font-medium flex items-center gap-1">{label}{help ? <Tooltip><TooltipTrigger asChild><button type="button"><HelpCircle className="w-3 h-3 text-muted-foreground" /></button></TooltipTrigger><TooltipContent className="max-w-xs">{help}</TooltipContent></Tooltip> : null}</label><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"><option value="">{placeholder}</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>;
}

export function StatGrid({ stats }: { stats: { label: string; value: string; help?: string; tone?: "default" | "success" | "warn" }[] }) {
  return <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">{stats.map((s) => <div key={s.label} className="rounded-lg border bg-card p-5"><div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</div><div className={cn("mt-2 text-2xl font-bold", s.tone === "success" && "text-success", s.tone === "warn" && "text-warning")}>{s.value}</div></div>)}</div>;
}

export function SectionHeader({ title, description, badge, actions }: { title: string; description?: string; badge?: ReactNode; actions?: ReactNode }) {
  return <div className="flex items-end justify-between gap-4 flex-wrap mb-4"><div><h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">{title}{badge}</h2>{description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}</div>{actions}</div>;
}
