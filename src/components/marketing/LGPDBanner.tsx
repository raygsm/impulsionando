import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Cookie, X, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CONSENT_STORAGE_KEY as STORAGE_KEY, emitConsentChanged } from "@/lib/consent";


interface ConsentChoice {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  acceptedAt: string;
  version: string;
}

export function LGPDBanner() {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  async function save(choice: Omit<ConsentChoice, "essential" | "acceptedAt" | "version">) {
    const full: ConsentChoice = {
      essential: true,
      analytics: choice.analytics,
      marketing: choice.marketing,
      acceptedAt: new Date().toISOString(),
      version: "1.0",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
    emitConsentChanged(full);
    setOpen(false);


    // Se logado, persiste no banco
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
      const rows = [
        { user_id: user.id, consent_type: "cookies_essential", accepted: true, accepted_at: full.acceptedAt, user_agent: ua, terms_version: full.version },
        { user_id: user.id, consent_type: "cookies_analytics", accepted: full.analytics, accepted_at: full.analytics ? full.acceptedAt : null, revoked_at: full.analytics ? null : new Date().toISOString(), user_agent: ua, terms_version: full.version },
        { user_id: user.id, consent_type: "cookies_marketing", accepted: full.marketing, accepted_at: full.marketing ? full.acceptedAt : null, revoked_at: full.marketing ? null : new Date().toISOString(), user_agent: ua, terms_version: full.version },
      ];
      await supabase.from("lgpd_consents").insert(rows);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-content-center shrink-0">
              <Cookie className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-sm">Sua privacidade importa</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Usamos cookies essenciais para o funcionamento do site. Com seu consentimento, também
                    utilizamos cookies de análise para melhorar a experiência e de marketing para personalizar
                    conteúdo. Você pode ajustar a qualquer momento.{" "}
                    <Link to="/privacidade" className="text-primary hover:underline">
                      Política de Privacidade
                    </Link>
                  </p>
                </div>
                <button
                  onClick={() => save({ analytics: false, marketing: false })}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  aria-label="Recusar todos"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {details && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <ConsentRow
                    title="Essenciais"
                    desc="Necessários para login, segurança e funcionamento básico. Sempre ativos."
                    checked={true}
                    disabled
                  />
                  <ConsentRow
                    title="Análise"
                    desc="Métricas anônimas de uso para melhorar a plataforma."
                    checked={analytics}
                    onChange={setAnalytics}
                  />
                  <ConsentRow
                    title="Marketing"
                    desc="Personalização de ofertas e comunicação direcionada."
                    checked={marketing}
                    onChange={setMarketing}
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <Button
                  size="sm"
                  className="bg-gradient-primary shadow-elegant"
                  onClick={() => save({ analytics: true, marketing: true })}
                >
                  <Shield className="w-3.5 h-3.5 mr-1.5" /> Aceitar todos
                </Button>
                {details ? (
                  <Button size="sm" variant="outline" onClick={() => save({ analytics, marketing })}>
                    Salvar escolhas
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setDetails(true)}>
                    Personalizar
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => save({ analytics: false, marketing: false })}>
                  Apenas essenciais
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsentRow({
  title, desc, checked, onChange, disabled,
}: { title: string; desc: string; checked: boolean; onChange?: (b: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
