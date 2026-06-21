import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "imp.pwa.installDismissedAt";
const DISMISS_DAYS = 14;

/**
 * Botão "Instalar app" do Impulsionando.
 * - Aparece apenas quando o navegador dispara `beforeinstallprompt` (Chrome/Edge/Android).
 * - Some quando já instalado (display-mode: standalone) ou recém-dispensado.
 * - iOS Safari não dispara o evento; nesses casos o componente fica oculto
 *   (orientação de instalação manual fica em /app).
 */
export function InstallAppButton({
  variant = "outline",
  size = "sm",
  className,
  label = "Instalar app",
}: {
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  label?: string;
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Já instalado?
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari
      (navigator as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    // Dispensado recentemente?
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 86400_000) return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setHidden(false);
    };
    const onInstalled = () => {
      setDeferred(null);
      setHidden(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden || !deferred) return null;

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const result = await deferred.userChoice.catch(() => null);
    if (!result || result.outcome === "dismissed") {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setDeferred(null);
    setHidden(true);
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleInstall}
      className={className}
    >
      <Download className="w-4 h-4 mr-1.5" aria-hidden />
      {label}
    </Button>
  );
}
