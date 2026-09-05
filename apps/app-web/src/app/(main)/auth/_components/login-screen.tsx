import Image from "next/image";
import Link from "next/link";

import { ImpulsionandoMark } from "@/components/brand/impulsionando-mark";
import { APP_CONFIG } from "@/config/app-config";

import { LoginForm } from "./login-form";
import { type LoginPersonalization, loginActionStyle, resolveLoginPersonalization } from "./login-personalization";
import { GoogleButton } from "./social-auth/google-button";

type LoginScreenProps = {
  /** Extension point for future tenant branding — defaults to Impulsionando. */
  personalization?: LoginPersonalization;
};

/** Branded Operate login chrome. Auth submit stays in `LoginForm`. */
export function LoginScreen({ personalization }: LoginScreenProps) {
  const brand = resolveLoginPersonalization(personalization);
  const isDefaultMark = brand.logoSrc === "/brand/impulsionando/mark.svg";

  return (
    <div
      className="relative flex min-h-dvh flex-col bg-background font-[family-name:var(--font-source-sans)] text-foreground"
      style={loginActionStyle(brand.actionColor)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55] dark:opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in srgb, var(--imp-action) 12%, transparent), transparent 55%),
            repeating-linear-gradient(
              -18deg,
              transparent,
              transparent 11px,
              color-mix(in srgb, var(--imp-ink) 3.5%, transparent) 11px,
              color-mix(in srgb, var(--imp-ink) 3.5%, transparent) 12px
            )
          `,
        }}
      />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-8">
        <div className="w-full max-w-[22rem] animate-in fade-in slide-in-from-bottom-2 duration-500">
          <header className="mb-10 flex flex-col items-center text-center">
            <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-card shadow-[0_1px_2px_rgb(28_25_22_/_0.06)] ring-1 ring-border">
              {isDefaultMark ? (
                <ImpulsionandoMark size={40} labelled priority />
              ) : (
                <Image
                  src={brand.logoSrc}
                  alt={brand.name}
                  width={40}
                  height={40}
                  className="size-10 object-contain"
                  unoptimized
                />
              )}
            </div>
            <p className="mb-3 text-[1.75rem] font-bold tracking-[-0.02em] text-foreground">{brand.name}</p>
            <h1 className="text-balance text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
              Entrar na operação
            </h1>
            <p className="mt-2 max-w-[28ch] text-pretty text-sm leading-relaxed text-muted-foreground sm:max-w-none">
              {brand.tagline}
            </p>
          </header>

          <div className="space-y-4">
            <LoginForm />
            <GoogleButton
              className="h-11 w-full border border-border bg-card text-foreground hover:bg-muted"
              variant="outline"
            />
            <p className="pt-1 text-center text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link
                prefetch={false}
                href="/auth/v1/register"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Criar acesso
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-6 pb-6 text-center text-xs text-muted-foreground">
        {APP_CONFIG.copyright}
      </footer>
    </div>
  );
}
