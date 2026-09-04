"use client";

import type { ReactNode } from "react";
import type { ModuleLifecycleState } from "@impulsionando/contracts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

const COPY: Record<ModuleLifecycleState | "LOADING" | "ERROR" | "FORBIDDEN" | "EMPTY" | "UNKNOWN_DATA", { title: string; body: string }> =
  {
    LOADING: { title: "Carregando", body: "Buscando dados no API." },
    EMPTY: { title: "Nada por aqui", body: "Não há itens para mostrar." },
    ERROR: { title: "Falha ao carregar", body: "O API não respondeu. Tente de novo." },
    FORBIDDEN: { title: "Sem permissão", body: "O servidor recusou este recurso. A UI não autoriza acesso." },
    CONFIGURING: { title: "Em configuração", body: "O módulo está contratado mas ainda não está pronto." },
    DEGRADED: { title: "Degradado", body: "O módulo está instável. Dados podem estar incompletos." },
    UNKNOWN_DATA: { title: "UNKNOWN", body: "Este indicador não tem fonte no API. Não é zero." },
    NOT_ENTITLED: { title: "Não contratado", body: "Este módulo não faz parte do plano atual." },
    READY: { title: "Pronto", body: "Aguardando ativação." },
    ACTIVE: { title: "Ativo", body: "" },
    SUSPENDED: { title: "Suspenso", body: "Acesso bloqueado pela política de cobrança." },
    DISABLED: { title: "Desligado", body: "Módulo desabilitado por flag." },
  };

export function ModuleStateView({
  state,
  title,
  children,
  className,
  dataAvailability,
}: {
  state: ModuleLifecycleState | "LOADING" | "ERROR" | "FORBIDDEN" | "EMPTY";
  title: string;
  children?: ReactNode;
  className?: string;
  dataAvailability?: "LIVE" | "UNKNOWN" | "UNAVAILABLE";
}) {
  if (state === "LOADING") {
    return (
      <Card className={className} data-state="loading">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (state === "ACTIVE" && dataAvailability === "UNKNOWN") {
    const copy = COPY.UNKNOWN_DATA;
    return (
      <Alert className={className} data-state="unknown-data">
        <AlertTitle>
          {title} — {copy.title}
        </AlertTitle>
        <AlertDescription>{copy.body}</AlertDescription>
      </Alert>
    );
  }

  if (state === "ACTIVE" && (dataAvailability === "LIVE" || !dataAvailability)) {
    return (
      <Card className={cn(className)} data-state="active">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    );
  }

  if (state === "EMPTY") {
    return (
      <Empty className={className} data-state="empty">
        <EmptyHeader>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{COPY.EMPTY.body}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const key = state === "ERROR" || state === "FORBIDDEN" ? state : state;
  const copy = COPY[key];
  return (
    <Alert className={className} variant={state === "ERROR" || state === "FORBIDDEN" ? "destructive" : "default"} data-state={String(state).toLowerCase()}>
      <AlertTitle>
        {title} — {copy.title}
      </AlertTitle>
      <AlertDescription>{copy.body}</AlertDescription>
    </Alert>
  );
}
