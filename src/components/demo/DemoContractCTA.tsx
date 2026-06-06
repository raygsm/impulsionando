/**
 * Botão CTA reutilizável que dispara o fluxo de contratação demo de um módulo.
 * Mostra estado "Ativo na demo" quando o módulo já foi contratado ficticiamente.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { DemoContractFlow } from "./DemoContractFlow";
import { useDemoContracted } from "@/lib/demoContracting";

type Props = {
  slug: string;
  moduleName: string;
  moduleDescription?: string;
  amountReference?: number;
  features?: string[];
  testRoute?: string;
  size?: "sm" | "default";
  variant?: "default" | "outline";
};

export function DemoContractCTA({
  slug, moduleName, moduleDescription, amountReference, features, testRoute,
  size = "sm", variant = "default",
}: Props) {
  const [open, setOpen] = useState(false);
  const { isContracted } = useDemoContracted();
  const active = isContracted(slug);

  if (active) {
    return (
      <Badge className="bg-primary/15 text-primary border-primary/30">
        <CheckCircle2 className="w-3 h-3 mr-1" /> PAGO — DEMO
      </Badge>
    );
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        onClick={() => setOpen(true)}
        className={variant === "default" ? "bg-gradient-primary" : ""}
      >
        <ShoppingBag className="w-4 h-4 mr-1" />
        Contratar na Demonstração
      </Button>
      <DemoContractFlow
        open={open}
        onOpenChange={setOpen}
        slug={slug}
        moduleName={moduleName}
        moduleDescription={moduleDescription}
        amountReference={amountReference ?? 0}
        features={features}
        testRoute={testRoute}
      />
    </>
  );
}
