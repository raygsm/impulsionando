import type { ReactNode } from "react";

import { ImpulsionandoMark } from "@/components/brand/impulsionando-mark";
import { APP_CONFIG } from "@/config/app-config";

import { resolveLoginPersonalization } from "../_components/login-personalization";

/** Auth v2 chrome — Impulsionando identity; structure kept from the preset split layout. */
export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const brand = resolveLoginPersonalization();

  return (
    <main className="font-[family-name:var(--font-source-sans)]">
      <div className="grid h-dvh justify-center bg-background p-2 lg:grid-cols-2">
        <div className="relative order-2 hidden h-full overflow-hidden rounded-3xl bg-[var(--imp-surface-sunken)] ring-1 ring-border lg:flex">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              backgroundImage: `
                radial-gradient(ellipse 70% 60% at 20% 20%, color-mix(in srgb, var(--imp-action) 14%, transparent), transparent 50%),
                repeating-linear-gradient(
                  -18deg,
                  transparent,
                  transparent 14px,
                  color-mix(in srgb, var(--imp-ink) 4%, transparent) 14px,
                  color-mix(in srgb, var(--imp-ink) 4%, transparent) 15px
                )
              `,
            }}
          />
          <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 text-foreground">
            <div className="space-y-3">
              <ImpulsionandoMark size={36} labelled />
              <h1 className="text-2xl font-bold tracking-[-0.02em]">{brand.name}</h1>
              <p className="max-w-[28ch] text-sm leading-relaxed text-muted-foreground">{brand.tagline}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Mesma operação para cada negócio — configuração, não um dashboard por empresa.
            </p>
          </div>
        </div>
        <div className="relative order-1 flex h-full bg-background">{children}</div>
      </div>
      <span className="sr-only">{APP_CONFIG.copyright}</span>
    </main>
  );
}
