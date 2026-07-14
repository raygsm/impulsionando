import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { FictionalBrand } from "@/data/fictional-brands/types";

const BrandCtx = createContext<FictionalBrand | null>(null);

export function useBrand(): FictionalBrand {
  const b = useContext(BrandCtx);
  if (!b) throw new Error("useBrand fora de BrandThemeProvider");
  return b;
}

export function BrandThemeProvider({ brand, children }: { brand: FictionalBrand; children: ReactNode }) {
  const styleVars = useMemo(
    () =>
      ({
        "--bp-primary": brand.palette.primary,
        "--bp-primary-fg": brand.palette.primaryFg,
        "--bp-accent": brand.palette.accent,
        "--bp-surface": brand.palette.surface,
        "--bp-ink": brand.palette.ink,
        "--bp-muted": brand.palette.muted,
        "--bp-hero": brand.palette.heroGradient,
        "--bp-font-heading": brand.typography.heading,
        "--bp-font-body": brand.typography.body,
      }) as React.CSSProperties,
    [brand],
  );

  return (
    <BrandCtx.Provider value={brand}>
      <div
        style={styleVars}
        className="min-h-dvh"
        // Cores e fonte da marca aplicadas via CSS vars
      >
        <div
          style={{
            background: brand.palette.surface,
            color: brand.palette.ink,
            fontFamily: brand.typography.body,
          }}
          className="min-h-dvh"
        >
          {children}
        </div>
      </div>
    </BrandCtx.Provider>
  );
}
