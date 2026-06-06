import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FlaskConical,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { InfinitePayCheckoutButton } from "@/components/payments/InfinitePayCheckoutButton";
import { ModulePicker } from "@/components/marketing/ModulePicker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/planos/teste")({
  head: () => ({
    meta: [
      { title: "Plano TESTE R$1,00 — Checkout ativo | Impulsionando" },
      {
        name: "description",
        content:
          "Plano TESTE de R$1,00 com checkout ativo via InfinitePay para validar pagamentos, confirmações automáticas e ações pós-pagamento da Impulsionando.",
      },
      { property: "og:title", content: "Plano TESTE R$1,00 — Impulsionando" },
      {
        property: "og:description",
        content:
          "Checkout real de R$1,00 para validar pagamento Pix/cartão, webhook e liberação automática.",
      },
      { property: "og:url", content: "https://impulsionando.com.br/planos/teste" },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [
      { rel: "canonical", href: "https://impulsionando.com.br/planos/teste" },
    ],
  }),
  component: PlanoTestePage,
});

const TEST_PLAN = {
  id: "TESTE",
  name: "Plano TESTE",
  amountCents: 100, // R$ 1,00
  description: "Plano TESTE Impulsionando — R$1,00 (validação de checkout)",
  features: [
    "Checkout InfinitePay real (Pix e cartão)",
    "Webhook assinado liberando acesso automaticamente",
    "Validação de e-mail/WhatsApp pós-pagamento",
    "Ideal para testar confirmações e gatilhos antes de assinar um plano completo",
  ],
};

function PlanoTestePage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    email: string;
    name: string;
    phone: string;
  } | null>(null);
  const [lead, setLead] = useState({ name: "", email: "", phone: "" });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedModules, setPickedModules] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (data.user) {
        const meta = (data.user.user_metadata ?? {}) as Record<string, string>;
        const name = meta.display_name || meta.name || data.user.email?.split("@")[0] || "Cliente";
        const phone = meta.phone || meta.whatsapp || "";
        setUser({
          id: data.user.id,
          email: data.user.email ?? "",
          name,
          phone,
        });
        setLead({ name, email: data.user.email ?? "", phone });
      }
      setAuthChecked(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const phoneDigits = lead.phone.replace(/\D+/g, "");
  const canPay =
    !!user &&
    lead.name.trim().length >= 2 &&
    /.+@.+\..+/.test(lead.email) &&
    phoneDigits.length >= 10;

  function goLogin() {
    toast.info("Faça login ou crie sua conta para pagar com checkout real.");
    navigate({
      to: "/auth",
      search: { redirect: "/planos/teste" } as never,
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-accent/30 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs mb-4">
            <FlaskConical className="w-3.5 h-3.5" /> Plano de teste
            <Badge className="ml-1 bg-amber-400 text-amber-950 hover:bg-amber-400">
              R$1,00
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight max-w-3xl">
            Pague R$1,00 para validar todo o fluxo de pagamento da Impulsionando
          </h1>
          <p className="mt-4 text-lg text-white/85 max-w-2xl leading-relaxed">
            Checkout ativo de R$1,00 via InfinitePay. Testamos Pix, cartão, webhook
            assinado, confirmação automática e ações pós-pagamento — antes de
            assinar um plano completo.
          </p>
        </div>
      </section>

      {/* BADGE — escopo */}
      <div className="w-full bg-amber-100 border-y border-amber-300 text-amber-900 text-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            <strong>Cobrança real de R$1,00.</strong> A liberação automática só
            acontece quando a InfinitePay marca o pagamento como{" "}
            <code>paid</code> em <code>production</code> — nunca apenas pelo
            retorno do navegador.
          </span>
        </div>
      </div>

      {/* PLANO */}
      <section className="mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-12 grid gap-6 lg:grid-cols-[1.1fr_1fr] items-start">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">{TEST_PLAN.name}</h2>
            <Badge variant="secondary" className="ml-auto">TESTE</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Plano de validação técnica — não dá acesso a módulos de produção. Serve
            apenas para validar o fluxo completo de cobrança e confirmação.
          </p>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-bold tracking-tight">R$ 1,00</span>
            <span className="text-muted-foreground text-sm">/ cobrança única</span>
          </div>
          <ul className="space-y-2 mb-2">
            {TEST_PLAN.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <BadgeCheck className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Seus dados para a cobrança</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Esses dados vão para a InfinitePay no checkout. O pagamento de R$1,00 é
            real — você pode usar Pix para confirmação imediata.
          </p>

          {!authChecked ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : !user ? (
            <div className="space-y-3">
              <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/60 p-3 text-xs text-amber-900 dark:text-amber-200">
                Para que o pagamento confirmado libere acessos automaticamente, é
                preciso estar logado. Crie sua conta gratuita e volte para esta
                página.
              </div>
              <Button onClick={goLogin} className="w-full">
                Entrar ou criar conta para pagar R$1,00
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="t-name">Nome completo</Label>
                <Input
                  id="t-name"
                  value={lead.name}
                  onChange={(e) => setLead({ ...lead, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="t-email">E-mail</Label>
                <Input
                  id="t-email"
                  type="email"
                  value={lead.email}
                  onChange={(e) => setLead({ ...lead, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="t-phone">WhatsApp / Telefone</Label>
                <Input
                  id="t-phone"
                  value={lead.phone}
                  onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                  placeholder="(21) 99999-9999"
                />
              </div>

              {pickedModules.length > 0 && (
                <div className="rounded-md border bg-muted/30 p-3 text-xs">
                  <div className="font-medium mb-1">Módulo selecionado:</div>
                  <div className="text-muted-foreground">
                    {pickedModules.join(", ")}
                  </div>
                </div>
              )}

              {!confirmed ? (
                <Button
                  type="button"
                  className="w-full"
                  disabled={!canPay}
                  onClick={() => setPickerOpen(true)}
                >
                  Escolher módulo e continuar
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <InfinitePayCheckoutButton
                  customer={{
                    name: lead.name.trim(),
                    email: lead.email.trim(),
                    phone_number: phoneDigits,
                  }}
                  items={[
                    {
                      quantity: 1,
                      price: TEST_PLAN.amountCents,
                      description:
                        TEST_PLAN.description +
                        (pickedModules.length
                          ? ` — módulo: ${pickedModules.join(",")}`
                          : ""),
                    },
                  ]}
                  plano_id={TEST_PLAN.id}
                  label="Pagar R$1,00 com InfinitePay"
                  className="w-full"
                />
              )}
              {!canPay && (
                <p className="text-xs text-muted-foreground">
                  Preencha nome, e-mail e telefone (mín. 10 dígitos) para liberar
                  o checkout.
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Ao continuar você concorda com a cobrança de R$1,00. Esse valor
                <strong> não é reembolsado automaticamente</strong> — é um teste
                técnico do fluxo. Em caso de dúvida, fale com a Impulsionando pelo{" "}
                <Link to="/contato" className="underline">contato</Link>.
              </p>
            </div>
          )}
        </Card>
      </section>

      {/* COMO TESTAR */}
      <section className="mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 pb-12">
        <h2 className="text-xl font-semibold mb-3">O que esse plano valida</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
              1. Checkout
            </div>
            <p className="text-sm">
              Geração do link InfinitePay, captura via Pix ou cartão, redirect
              autenticado de retorno para <code>/checkout/success</code>.
            </p>
          </Card>
          <Card className="p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
              2. Confirmação
            </div>
            <p className="text-sm">
              Webhook assinado (HMAC) + dupla checagem via <code>payment_check</code>{" "}
              marcam o pedido como <code>paid</code> em produção.
            </p>
          </Card>
          <Card className="p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
              3. Ações automáticas
            </div>
            <p className="text-sm">
              Disparo de mensagens (e-mail/WhatsApp), notificação in-app e
              registro do recibo do pagamento — tudo a partir do status{" "}
              <code>paid</code>.
            </p>
          </Card>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/planos">Ver planos completos</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/teste">Conhecer a área de testes</Link>
          </Button>
        </div>
      </section>

      <PublicFooter />

      <ModulePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        quota={1}
        planName={TEST_PLAN.name}
        planSubtitle="No Plano TESTE você pode escolher 1 módulo para conhecer."
        initialSelected={pickedModules}
        confirmLabel="Confirmar e ir para o pagamento de R$1,00"
        onConfirm={(slugs) => {
          setPickedModules(slugs);
          setPickerOpen(false);
          setConfirmed(true);
          toast.success(
            slugs.length
              ? `Módulo selecionado: ${slugs.join(", ")}. Clique em Pagar R$1,00 para continuar.`
              : "Você pode pagar sem selecionar módulos. Clique em Pagar R$1,00.",
          );
        }}
      />
    </div>
  );
}
