import { useEffect, useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function detectPlatform(): "android" | "ios" | "desktop" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && "ontouchend" in document)) return "ios";
  if (/windows|mac|linux|cros/i.test(ua)) return "desktop";
  return "other";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

/**
 * Botão flutuante "Baixar APP" — SEMPRE visível para todos os usuários,
 * sem exceção. Única exceção lógica: quando o próprio app já está rodando
 * instalado (display-mode: standalone) — nesse caso o usuário já está dentro
 * do app e não precisa baixá-lo de novo.
 */
export function DownloadAppFab() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);
  const [platform, setPlatform] = useState<"android" | "ios" | "desktop" | "other">("other");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;

    setPlatform(detectPlatform());
    setVisible(true);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setVisible(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible) return null;

  async function handleClick() {
    if (deferred) {
      await deferred.prompt();
      const result = await deferred.userChoice.catch(() => null);
      setDeferred(null);
      if (result?.outcome === "accepted") {
        setVisible(false);
      }
      return;
    }
    if (platform === "ios") {
      setIosOpen(true);
      return;
    }
    // Sem prompt nativo e não-iOS → leva para /app com instruções completas
    window.location.href = "/app";
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[60] print:hidden">
        <Button
          onClick={handleClick}
          size="lg"
          className="gap-2 bg-gradient-primary text-primary-foreground shadow-elegant hover:brightness-110 rounded-full px-5"
          aria-label="Baixar app Impulsionando"
        >
          <Download className="w-4 h-4" aria-hidden />
          <span className="font-medium">Baixar APP</span>
        </Button>
      </div>


      <Dialog open={iosOpen} onOpenChange={setIosOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Instalar no iPhone / iPad
            </DialogTitle>
            <DialogDescription>
              O Safari instala o app Impulsionando direto na tela inicial — sem loja, sem cadastro extra.
            </DialogDescription>
          </DialogHeader>
          <ol className="text-sm space-y-3 mt-2">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center text-xs font-semibold">1</span>
              <span>Abra este site no <strong>Safari</strong> (não funciona em outros navegadores no iOS).</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center text-xs font-semibold">2</span>
              <span>Toque no botão <strong>Compartilhar</strong> (□↑) na barra inferior do Safari.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center text-xs font-semibold">3</span>
              <span>Escolha <strong>“Adicionar à Tela de Início”</strong> e confirme.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center text-xs font-semibold">4</span>
              <span>Pronto — o ícone <strong>Impulsionando</strong> aparece junto aos seus apps.</span>
            </li>
          </ol>
          <Button asChild variant="outline" className="mt-2">
            <a href="/app">Ver instruções completas</a>
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
