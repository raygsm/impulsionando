import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { Section, SuccessBanner } from "@/components/marocas/MarocasUI";
import { MOCK_HOSPEDE_RESERVA } from "@/components/marocas/marocasMockData";
import { Eye, EyeOff, KeyRound, Wifi, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/marocas/app/hospede/acesso")({
  head: () => ({ meta: [{ title: "Acesso & senha — Marocas" }, { name: "robots", content: "noindex" }] }),
  component: AcessoPage,
});

function AcessoPage() {
  const r = MOCK_HOSPEDE_RESERVA;
  const [showPorta, setShowPorta] = useState(false);
  const [showWifi, setShowWifi] = useState(false);
  return (
    <MarocasAppShell
      title="Acesso ao imóvel"
      description="Dados sensíveis liberados a partir de 24h antes do seu check-in. Nunca compartilhe com terceiros."
      breadcrumbs={[{ label: "Hóspede", to: "/marocas/app/hospede" }, { label: "Acesso" }]}
    >
      <div className="mb-4">
        <SuccessBanner
          title="Dados prontos para uso"
          description="Salve estas informações no seu celular. Em caso de problema no acesso, acione o suporte 24h."
        />
      </div>

      <Section title="Senha da porta" description="Fechadura eletrônica única para sua estadia. Reset automático após o check-out.">
        <div className="rounded-xl border bg-card p-5 flex flex-wrap items-center gap-4">
          <KeyRound className="h-8 w-8 text-primary shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Código de 4 dígitos</p>
            <p className="text-3xl font-mono tabular-nums mt-1 tracking-[0.35em]" aria-live="polite">
              {showPorta ? "4 8 2 6" : "• • • •"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Válida por toda a estadia · revogada no check-out</p>
          </div>
          <button
            onClick={() => setShowPorta((v) => !v)}
            aria-pressed={showPorta}
            className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {showPorta ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPorta ? "Ocultar" : "Revelar"}
          </button>
        </div>
      </Section>

      <Section title="Wi-Fi" description="Rede exclusiva do apartamento. Se cair, o roteiro fica no armário da cozinha.">
        <div className="rounded-xl border bg-card p-5 flex flex-wrap items-center gap-4">
          <Wifi className="h-8 w-8 text-primary shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Rede</p>
            <p className="text-lg font-mono truncate">{r.wifiSsid}</p>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2">Senha</p>
            <p className="text-lg font-mono tracking-widest" aria-live="polite">
              {showWifi ? "praia@2026" : "••••••••••"}
            </p>
          </div>
          <button
            onClick={() => setShowWifi((v) => !v)}
            aria-pressed={showWifi}
            className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {showWifi ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showWifi ? "Ocultar" : "Revelar"}
          </button>
        </div>
      </Section>

      <div className="mt-6 rounded-xl border border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20 p-4 flex gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-semibold text-sm">Segurança primeiro</p>
          <p className="text-xs text-muted-foreground mt-1">
            No ambiente real, cada senha é gerada por reserva, revogada no check-out e nunca fica exposta em logs.
            A integração com fechaduras inteligentes é operada pela equipe técnica.
          </p>
        </div>
      </div>
    </MarocasAppShell>
  );
}
