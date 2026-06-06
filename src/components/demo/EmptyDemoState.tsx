import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EmptyDemoStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Quando true, exibe a mensagem de "recurso preparado". */
  pending?: boolean;
}

/**
 * Estado vazio inteligente para listas em telas demo.
 * Use sempre que uma lista demo possa aparecer sem itens.
 */
export function EmptyDemoState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  pending = false,
}: EmptyDemoStateProps) {
  return (
    <Card className="p-8 text-center border-dashed">
      <Icon className="w-10 h-10 mx-auto text-muted-foreground/60 mb-3" />
      <h3 className="font-semibold text-base">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
        {description}
      </p>
      {pending && (
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-3">
          Recurso preparado — aguardando configuração final.
        </p>
      )}
      {actionLabel && onAction && !pending && (
        <Button size="sm" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}
