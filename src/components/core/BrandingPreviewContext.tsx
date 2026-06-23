import { createContext, useContext, useState, type ReactNode } from "react";
import type { WcagParams } from "@/lib/brand-kit-utils";

interface Ctx {
  wcag: WcagParams;
  setWcag: (p: WcagParams) => void;
}

const BrandingPreviewContext = createContext<Ctx | null>(null);

export function BrandingPreviewProvider({ children }: { children: ReactNode }) {
  const [wcag, setWcag] = useState<WcagParams>({
    sampleText: "Texto de exemplo",
    fontSize: 16,
    bold: false,
  });
  return (
    <BrandingPreviewContext.Provider value={{ wcag, setWcag }}>{children}</BrandingPreviewContext.Provider>
  );
}

export function useBrandingPreview(): Ctx {
  const c = useContext(BrandingPreviewContext);
  if (!c) {
    // Fallback silencioso pra componentes usados fora do provider.
    return {
      wcag: { sampleText: "Texto de exemplo", fontSize: 16, bold: false },
      setWcag: () => {},
    };
  }
  return c;
}
