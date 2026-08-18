import { Sparkles, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getModule } from "@/data/moduleCatalog";

interface QuoteSidebarProps { selectedSlugs: string[]; onRemove?: (slug: string) => void; compact?: boolean; }
export function QuoteSidebar({ selectedSlugs, onRemove, compact }: QuoteSidebarProps) {
  return <Card className={compact ? "p-4" : "p-5 sticky top-24"}>
    <div className="flex items-center justify-between mb-3"><h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Sua proposta</h3><span className="text-xs text-muted-foreground">{selectedSlugs.length} {selectedSlugs.length === 1 ? "módulo" : "módulos"}</span></div>
    {selectedSlugs.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">Selecione módulos certificados para definir o plano aplicável.</p> : <>
      <ul className="space-y-2 mb-4 max-h-64 overflow-auto">{selectedSlugs.map((slug) => { const mod = getModule(slug); return <li key={slug} className="flex items-center justify-between text-sm gap-2"><span className="truncate flex-1">{mod?.name ?? slug}</span>{onRemove && <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => onRemove(slug)} aria-label={`Remover ${mod?.name ?? slug}`}><Trash2 className="h-3.5 w-3.5" /></Button>}</li>; })}</ul>
      <div className="border-t border-border pt-3 text-xs text-muted-foreground"><p>O valor é definido pelo plano oficial correspondente à quantidade de módulos certificados. Não há preço avulso fictício por módulo.</p></div>
    </>}
  </Card>;
}
