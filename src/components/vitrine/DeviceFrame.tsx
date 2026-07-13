/**
 * DeviceFrame — envolve o preview do template em uma largura fixa
 * (Desktop 1280 / Tablet 834 / Mobile 390) para demonstrar a
 * responsividade sem trocar de rota.
 */
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Viewport = "desktop" | "tablet" | "mobile";

const WIDTHS: Record<Viewport, string> = {
  desktop: "w-full",
  tablet: "w-[834px] max-w-full",
  mobile: "w-[390px] max-w-full",
};

export function DeviceFrame({ children }: { children: ReactNode }) {
  const [vp, setVp] = useState<Viewport>("desktop");
  return (
    <div className="min-h-dvh bg-muted/30">
      <div className="sticky top-0 z-50 flex justify-center border-b border-border bg-background/90 backdrop-blur px-3 py-2">
        <div
          role="tablist"
          aria-label="Alternar viewport de preview"
          className="inline-flex rounded-full border border-border bg-card p-1 text-xs shadow-sm"
        >
          {[
            { id: "desktop" as const, label: "Desktop", Icon: Monitor },
            { id: "tablet" as const, label: "Tablet", Icon: Tablet },
            { id: "mobile" as const, label: "Mobile", Icon: Smartphone },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={vp === id}
              onClick={() => setVp(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 transition",
                vp === id
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-center py-6 px-3">
        <div
          className={cn(
            "overflow-hidden rounded-2xl border border-border bg-background shadow-2xl transition-[width] duration-300",
            WIDTHS[vp],
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
