import { Link, useLocation } from "@tanstack/react-router";
import { BookOpen, Bot, ChevronRight, HelpCircle, Sparkles } from "lucide-react";
import { guideForPath } from "@/content/impulsionito-guide/catalog";
import { Button } from "@/components/ui/button";

function openImpulsionito() {
  const button = document.querySelector<HTMLButtonElement>('button[aria-label^="Abrir Impulsionito"]');
  if (button) button.click();
}

export function ImpulsionitoGuideLauncher() {
  const location = useLocation();
  const contextual = guideForPath(location.pathname).slice(0, 3);

  if (location.pathname.startsWith("/auth") || location.pathname.startsWith("/reset-password")) return null;

  return (
    <div className="fixed bottom-[76px] right-4 z-40 group hidden sm:block">
      <div className="absolute bottom-full right-0 mb-2 w-[340px] max-w-[calc(100vw-32px)] origin-bottom-right rounded-2xl border bg-background p-4 shadow-2xl opacity-0 invisible translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4" /></div>
          <div><div className="font-semibold">Impulsionito Guia</div><p className="text-xs text-muted-foreground mt-0.5">Estou aqui para explicar esta tela e guiar você passo a passo.</p></div>
        </div>
        <div className="mt-3 space-y-1">
          {contextual.map((item) => (
            <Link key={item.id} to="/guia" hash={item.id} className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm hover:bg-muted">
              <span>{item.title}</span><ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
          <Button size="sm" onClick={openImpulsionito}><Bot className="w-3.5 h-3.5 mr-1.5" /> Falar comigo</Button>
          <Button asChild size="sm" variant="outline"><Link to="/guia"><BookOpen className="w-3.5 h-3.5 mr-1.5" /> Abrir Guia</Link></Button>
        </div>
      </div>
      <Link
        to="/guia"
        aria-label="Abrir Impulsionito Guia"
        className="flex h-11 items-center gap-2 rounded-full border bg-background px-3.5 text-sm font-medium shadow-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <HelpCircle className="w-4 h-4 text-primary" /><span>Guia</span>
      </Link>
    </div>
  );
}
