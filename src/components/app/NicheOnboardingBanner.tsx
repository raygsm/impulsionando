import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { useState } from "react";

type Props = { companyId: string | null | undefined };

const DISMISS_KEY = "niche-onboarding-banner-dismissed";

export function NicheOnboardingBanner({ companyId }: Props) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  });

  const { data } = useQuery({
    queryKey: ["company-niche", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from("companies")
        .select("id, niche_id")
        .eq("id", companyId)
        .maybeSingle();
      return data;
    },
  });

  if (!companyId || dismissed) return null;
  if (data === undefined) return null; // ainda carregando
  if (data?.niche_id) return null; // já configurado

  return (
    <Card className="p-4 mb-6 border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent relative">
      <button
        type="button"
        aria-label="Dispensar"
        onClick={() => {
          window.localStorage.setItem(DISMISS_KEY, "1");
          setDismissed(true);
        }}
        className="absolute top-2 right-2 p-1 rounded hover:bg-muted text-muted-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold leading-tight">Configure seu nicho em 1 minuto</h3>
          <p className="text-sm text-muted-foreground">
            Escolha seu segmento e aplicamos automaticamente módulos, menus e relatórios certos
            para você.
          </p>
        </div>
        <Button asChild>
          <Link to="/onboarding/nicho">
            Começar <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
