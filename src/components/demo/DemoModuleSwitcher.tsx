import { Link } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { DEMO_MODULE_OPTIONS, type DemoModuleKey } from "@/lib/demoModules";
import { cn } from "@/lib/utils";

interface DemoModuleSwitcherProps {
  current?: DemoModuleKey;
  size?: "sm" | "default";
  variant?: "default" | "secondary" | "outline";
  className?: string;
}

export function DemoModuleSwitcher({
  current,
  size = "sm",
  variant = "secondary",
  className,
}: DemoModuleSwitcherProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size={size} variant={variant} className={cn("gap-2", className)}>
          <Layers className="w-4 h-4" /> OUTROS MÓDULOS
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pr-8">
          <SheetTitle>Outros módulos em DEMO</SheetTitle>
          <SheetDescription>
            A troca é imediata e abre a demonstração com textos, cards, menus, CTAs e dados fictícios próprios do módulo escolhido.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 grid gap-3">
          {DEMO_MODULE_OPTIONS.map((module) => {
            const Icon = module.icon;
            const active = current === module.key;
            return (
              <SheetClose asChild key={module.key}>
                <Link
                  to={module.route}
                  className={cn(
                    "group rounded-lg border bg-card p-4 transition-colors hover:border-primary/60 hover:bg-primary/5",
                    active && "border-primary/60 bg-primary/10",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{module.label}</span>
                        <Badge variant={active ? "default" : "outline"} className="text-[10px]">
                          {active ? "Atual" : module.badge}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {module.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </SheetClose>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
