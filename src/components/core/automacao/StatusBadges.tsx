import { Badge } from "@/components/ui/badge";
import type { Status, Modo, Canal } from "@/data/automacao-catalog";
import { CANAL_LABEL } from "@/data/automacao-catalog";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<Status, string> = {
  rascunho: "bg-muted text-foreground/70",
  pronto: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  ativo: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  pausado: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  erro: "bg-red-500/15 text-red-700 dark:text-red-300",
  aguardando_credencial: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
};

export function FlowStatusBadge({ status }: { status: Status }) {
  return <Badge variant="outline" className={cn("border-transparent", STATUS_STYLE[status])}>{status.replace("_", " ")}</Badge>;
}

export function ModoBadge({ modo }: { modo: Modo }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", modo === "demo" ? "bg-slate-500/15 text-slate-700 dark:text-slate-300" : "bg-primary/15 text-primary")}>
      {modo === "demo" ? "modo demo" : "modo produção"}
    </Badge>
  );
}

export function ChannelChip({ canal }: { canal: Canal }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      {CANAL_LABEL[canal]}
    </span>
  );
}
