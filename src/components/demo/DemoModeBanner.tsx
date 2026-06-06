import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";
import { DemoModuleSwitcher } from "@/components/demo/DemoModuleSwitcher";
import type { DemoModuleKey } from "@/lib/demoModules";

const DISMISS_KEY = "demo-mode-banner-dismissed";

/**
 * Faixa discreta exibida no topo das páginas /demo/*.
 * Reforça que se trata de ambiente fictício e oferece um atalho ao checklist.
 * Pode ser dispensada (persistido em localStorage).
 */
export function DemoModeBanner({ current }: { current?: DemoModuleKey } = {}) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHidden(window.localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (hidden) {
    return (
      <div className="border-b bg-card text-xs">
        <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-end">
          <DemoModuleSwitcher current={current} size="sm" variant="outline" className="h-7" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-primary text-primary-foreground text-xs sm:text-sm">
      <div className="mx-auto max-w-6xl px-4 py-2 flex items-center gap-3">
        <Sparkles className="w-4 h-4 shrink-0" />
        <span className="flex-1">
          <strong>Modo Demonstração</strong> — dados fictícios, sem impacto em dados reais.{" "}
          <Link to="/demo/checklist" className="underline underline-offset-2 hover:no-underline">
            Ver checklist
          </Link>
          .
        </span>
        <DemoModuleSwitcher current={current} size="sm" variant="secondary" className="h-7" />
        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem(DISMISS_KEY, "1");
            setHidden(true);
          }}
          aria-label="Dispensar aviso"
          className="opacity-80 hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
