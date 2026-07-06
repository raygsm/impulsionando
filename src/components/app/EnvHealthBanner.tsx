import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, X } from "lucide-react";

const DISMISS_KEY = "impulsionando.env-banner.dismissed-at";
const DISMISS_TTL_MS = 30 * 60_000; // 30 min

/**
 * Banner global: avisa quando SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY
 * (ou os pares VITE_*) não chegaram ao build do domínio atual.
 * Detecção 100% client-side via import.meta.env — sem chamada de rede.
 */
export function EnvHealthBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(DISMISS_KEY);
    const dismissedAt = raw ? Number(raw) : 0;
    if (Date.now() - dismissedAt < DISMISS_TTL_MS) return;
    setDismissed(false);
  }, []);

  const missing: string[] = [];
  if (!import.meta.env.VITE_SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
  if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) missing.push("VITE_SUPABASE_PUBLISHABLE_KEY");

  if (dismissed || missing.length === 0) return null;

  return (
    <div
      role="alert"
      className="sticky top-0 z-[60] w-full border-b border-destructive/40 bg-destructive/10 backdrop-blur supports-[backdrop-filter]:bg-destructive/10"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-2.5 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-destructive">Ambiente sem credenciais do backend.</span>{" "}
          <span className="text-foreground/90">
            Faltando no build deste domínio: {missing.map((m) => (
              <code key={m} className="mx-0.5 rounded bg-background/70 px-1 py-0.5 text-xs">{m}</code>
            ))}. Login e dados podem falhar.
          </span>{" "}
          <Link
            to={"/admin/env-diagnostics" as never}
            className="font-medium underline underline-offset-2 hover:text-destructive"
          >
            Ver diagnóstico
          </Link>
        </div>
        <button
          type="button"
          aria-label="Ocultar aviso"
          onClick={() => {
            window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
            setDismissed(true);
          }}
          className="rounded p-1 text-muted-foreground hover:bg-background/60 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
