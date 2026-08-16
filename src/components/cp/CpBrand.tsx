import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function CpMark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)} aria-label="CP — Chat Privado">
      <div className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-[18px] border border-slate-300/15 bg-slate-950 text-white shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(148,163,184,0.24),transparent_42%)]" />
        <span className="relative text-lg font-black tracking-[-0.08em]">CP</span>
        <ShieldCheck className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white p-0.5 text-slate-950" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-sm font-black tracking-[0.18em] text-slate-950 dark:text-white">CP</div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Chat Privado</div>
        </div>
      )}
    </div>
  );
}

export const CP_TAGLINE = "A segurança das suas conversas começa aqui — e termina com você.";
export const CP_SIGNATURE = "O que é dito no CP fica entre quem foi convidado para estar ali.";
