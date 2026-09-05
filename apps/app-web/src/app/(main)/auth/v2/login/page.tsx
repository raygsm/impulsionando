import Link from "next/link";

import { ImpulsionandoMark } from "@/components/brand/impulsionando-mark";
import { APP_CONFIG } from "@/config/app-config";

import { LoginForm } from "../../_components/login-form";
import { resolveLoginPersonalization } from "../../_components/login-personalization";
import { GoogleButton } from "../../_components/social-auth/google-button";

export default function LoginV2() {
  const brand = resolveLoginPersonalization();

  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 px-6 sm:w-[350px] sm:px-0">
        <div className="space-y-3 text-center lg:text-left">
          <div className="flex justify-center lg:hidden">
            <ImpulsionandoMark size={32} labelled />
          </div>
          <h1 className="text-balance text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
            Entrar na operação
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{brand.tagline}</p>
        </div>
        <div className="space-y-4">
          <GoogleButton
            className="h-11 w-full border border-border bg-card text-foreground hover:bg-muted"
            variant="outline"
          />
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-border after:border-t">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">ou continue com e-mail</span>
          </div>
          <LoginForm />
        </div>
      </div>

      <div className="absolute top-5 flex w-full justify-end px-6 sm:px-10">
        <p className="text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link
            prefetch={false}
            className="font-medium text-primary underline-offset-4 hover:underline"
            href="/auth/v2/register"
          >
            Criar acesso
          </Link>
        </p>
      </div>

      <div className="absolute bottom-5 flex w-full justify-between px-6 text-xs text-muted-foreground sm:px-10 sm:text-sm">
        <div>{APP_CONFIG.copyright}</div>
        <div className="font-medium tracking-tight text-foreground/80">{brand.name}</div>
      </div>
    </>
  );
}
