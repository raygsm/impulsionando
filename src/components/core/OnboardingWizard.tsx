import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { saveDomainRequest, saveEmailRequests, initChecklist, completeChecklistItem } from "@/lib/onboarding.functions";
import { upsertMonetizationModel, type CoveredEvent, type PayoutFrequency, type MonetizationModel } from "@/lib/monetization.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CheckCircle2, ArrowRight, ArrowLeft, AlertTriangle } from "lucide-react";

type Mode = "subdomain" | "own" | "register";

const PREFIX_OPTIONS = ["contato", "sac", "financeiro", "comercial", "atendimento", "agenda", "rh", "diretoria"];

const EVENT_LABELS: Record<CoveredEvent, string> = {
  sale: "Venda",
  rent: "Aluguel",
  recurring: "Recorrência",
  service: "Serviço",
  subscription: "Assinatura",
  event: "Evento",
  product: "Produto",
};

const FREQ_LABELS: Record<PayoutFrequency, string> = {
  instant: "Instantâneo",
  daily: "Diário",
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
};

export function OnboardingWizard({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<Mode>("subdomain");
  const [domainValue, setDomainValue] = useState("");
  const [alternatives, setAlternatives] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const [wantsEmails, setWantsEmails] = useState<"yes" | "no">("yes");
  const [selectedPrefixes, setSelectedPrefixes] = useState<string[]>(["contato"]);
  const [emailDomain, setEmailDomain] = useState("");

  // ===== Monetização (5 perguntas obrigatórias) =====
  const [monModel, setMonModel] = useState<MonetizationModel>("saas");
  const [monthlyFee, setMonthlyFee] = useState<string>(""); // em R$
  const [setupFee, setSetupFee] = useState<string>("");
  const [revsharePct, setRevsharePct] = useState<string>("0.50"); // %
  const [coveredEvents, setCoveredEvents] = useState<CoveredEvent[]>([]);
  const [payoutFreq, setPayoutFreq] = useState<PayoutFrequency>("instant");
  const [minPayout, setMinPayout] = useState<string>("0");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const saveDomain = useServerFn(saveDomainRequest);
  const saveEmails = useServerFn(saveEmailRequests);
  const init = useServerFn(initChecklist);
  const complete = useServerFn(completeChecklistItem);
  const saveMonetization = useServerFn(upsertMonetizationModel);

  const reaisToCents = (v: string) => Math.round((parseFloat((v || "0").replace(",", ".")) || 0) * 100);
  const pctToBps = (v: string) => Math.round((parseFloat((v || "0").replace(",", ".")) || 0) * 100);

  const monetizationValid = useMemo(() => {
    if (!acceptTerms) return false;
    if (monModel === "saas" && reaisToCents(monthlyFee) <= 0) return false;
    if ((monModel === "revshare" || monModel === "hybrid")) {
      if (pctToBps(revsharePct) <= 0) return false;
      if (coveredEvents.length === 0) return false;
    }
    return true;
  }, [acceptTerms, monModel, monthlyFee, revsharePct, coveredEvents]);

  const submit = useMutation({
    mutationFn: async () => {
      await init({ data: { companyId } });
      await saveDomain({
        data: {
          companyId,
          mode,
          requestedValue: domainValue || undefined,
          alternatives: alternatives || undefined,
          contactName: contactName || undefined,
          contactEmail: contactEmail || undefined,
          contactPhone: contactPhone || undefined,
        },
      });
      if (wantsEmails === "yes" && selectedPrefixes.length > 0) {
        await saveEmails({
          data: {
            companyId,
            prefixes: selectedPrefixes,
            domain: mode === "subdomain" ? `${domainValue}.impulsionando.com.br` : emailDomain || domainValue || undefined,
          },
        });
      }

      // Monetização — bloqueia ativação se não respondido
      const rates =
        monModel === "revshare" || monModel === "hybrid"
          ? coveredEvents.map((ev) => ({
              event_type: ev,
              percent_bps: pctToBps(revsharePct),
            }))
          : [];

      await saveMonetization({
        data: {
          company_id: companyId,
          model: monModel,
          monthly_fee_cents: monModel === "revshare" ? 0 : reaisToCents(monthlyFee),
          setup_fee_cents: reaisToCents(setupFee),
          min_payout_cents: reaisToCents(minPayout),
          payout_frequency: payoutFreq,
          covered_events: coveredEvents,
          notes: `Aceite eletrônico durante onboarding (${new Date().toISOString()})`,
          rates,
        },
      });

      await complete({ data: { companyId, itemKey: "onboarding_done", status: "done" } });
      await complete({ data: { companyId, itemKey: "payment_approved", status: "done" } });
    },
    onSuccess: () => {
      toast.success("Onboarding registrado!");
      qc.invalidateQueries({ queryKey: ["client-360", companyId] });
      setStep(5);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const showSubdomainConfirm = mode === "subdomain";

  return (
    <Card className="p-5 space-y-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        Passo {step} de 4
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Domínio</h3>
          <Label>Você já possui domínio próprio?</Label>
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as Mode)} className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="subdomain" /> Não possuo (quero usar um subdomínio Impulsionando)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="own" /> Sim, possuo domínio próprio
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="register" /> Desejo registrar um domínio novo
            </label>
          </RadioGroup>

          {mode === "subdomain" && (
            <div className="space-y-2">
              <Label>Escolha seu subdomínio</Label>
              <div className="flex items-center gap-1">
                <Input value={domainValue} onChange={(e) => setDomainValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="suaempresa" />
                <span className="text-sm text-muted-foreground">.impulsionando.com.br</span>
              </div>
              {domainValue && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm space-y-2">
                  <strong>Atenção</strong>
                  <p>Este será seu endereço principal de acesso: <code>{domainValue}.impulsionando.com.br</code></p>
                  <p>Revise cuidadosamente antes de confirmar.</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(!!v)} />
                    Confirmo que o nome está correto.
                  </label>
                </div>
              )}
            </div>
          )}

          {(mode === "own" || mode === "register") && (
            <div className="space-y-2">
              <Label>{mode === "own" ? "Domínio atual" : "Domínio desejado"}</Label>
              <Input value={domainValue} onChange={(e) => setDomainValue(e.target.value)} placeholder="suaempresa.com.br" />
              {mode === "register" && (
                <>
                  <Label>Alternativas (opcional)</Label>
                  <Input value={alternatives} onChange={(e) => setAlternatives(e.target.value)} placeholder="Opções caso a primeira não esteja disponível" />
                </>
              )}
              <Label>Contato técnico</Label>
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Nome" />
              <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="E-mail" type="email" />
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Telefone" />
              <p className="text-xs text-muted-foreground">Nossa equipe entrará em contato para auxiliar.</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={!domainValue || (showSubdomainConfirm && !confirmed)}
            >
              Próximo <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold">E-mail corporativo</h3>
          <Label>Deseja que a Impulsionando configure e-mails corporativos?</Label>
          <RadioGroup value={wantsEmails} onValueChange={(v) => setWantsEmails(v as "yes" | "no")}>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="yes" /> Sim
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value="no" /> Não
            </label>
          </RadioGroup>

          {wantsEmails === "yes" && (
            <>
              {mode === "subdomain" ? (
                <div className="text-sm text-muted-foreground">
                  Como o cliente usará um subdomínio Impulsionando, vamos coletar apenas seus 3 e-mails principais (eles serão usados como contato, financeiro e comercial).
                  <div className="mt-2 grid gap-2">
                    {["contato", "financeiro", "comercial"].map((p) => (
                      <label key={p} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedPrefixes.includes(p)}
                          onCheckedChange={(v) =>
                            setSelectedPrefixes((cur) => (v ? Array.from(new Set([...cur, p])) : cur.filter((x) => x !== p)))
                          }
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <Label>Domínio para os e-mails</Label>
                  <Input value={emailDomain} onChange={(e) => setEmailDomain(e.target.value)} placeholder={domainValue || "seudominio.com.br"} />
                  <Label>Prefixos desejados</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PREFIX_OPTIONS.map((p) => (
                      <label key={p} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={selectedPrefixes.includes(p)}
                          onCheckedChange={(v) =>
                            setSelectedPrefixes((cur) => (v ? Array.from(new Set([...cur, p])) : cur.filter((x) => x !== p)))
                          }
                        />
                        {p}@…
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">As contas não são criadas automaticamente; nossa equipe abrirá uma tarefa interna.</p>
                </>
              )}
            </>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
            <Button onClick={() => setStep(3)}>Próximo <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <h3 className="font-semibold">Modelo de monetização</h3>
          </div>
          <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Este passo é obrigatório para publicação do cliente. As respostas são versionadas e ficam registradas em contrato eletrônico.</span>
          </div>

          {/* 1) Modelo */}
          <div className="space-y-2">
            <Label>1. Qual o modelo de receita?</Label>
            <RadioGroup value={monModel} onValueChange={(v) => setMonModel(v as MonetizationModel)} className="space-y-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="saas" /> SaaS tradicional (mensalidade fixa, sem comissão)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="revshare" /> Revenue Share (sem mensalidade, % sobre venda)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="hybrid" /> Híbrido (mensalidade reduzida + % sobre venda)
              </label>
            </RadioGroup>
          </div>

          {/* 2) Valores */}
          <div className="grid sm:grid-cols-2 gap-3">
            {monModel !== "revshare" && (
              <div className="space-y-1">
                <Label>Mensalidade (R$)</Label>
                <Input inputMode="decimal" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} placeholder="0,00" />
              </div>
            )}
            <div className="space-y-1">
              <Label>Setup inicial (R$)</Label>
              <Input inputMode="decimal" value={setupFee} onChange={(e) => setSetupFee(e.target.value)} placeholder="0,00" />
            </div>
            {(monModel === "revshare" || monModel === "hybrid") && (
              <div className="space-y-1">
                <Label>2. Taxa de intermediação digital (%)</Label>
                <Input inputMode="decimal" value={revsharePct} onChange={(e) => setRevsharePct(e.target.value)} placeholder="0,50" />
              </div>
            )}
          </div>

          {/* 3) Eventos cobertos */}
          {(monModel === "revshare" || monModel === "hybrid") && (
            <div className="space-y-2">
              <Label>3. Quais eventos a taxa incide?</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(EVENT_LABELS) as CoveredEvent[]).map((ev) => (
                  <label key={ev} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={coveredEvents.includes(ev)}
                      onCheckedChange={(v) =>
                        setCoveredEvents((cur) => (v ? Array.from(new Set([...cur, ev])) : cur.filter((x) => x !== ev)))
                      }
                    />
                    {EVENT_LABELS[ev]}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 4) Periodicidade */}
          <div className="space-y-2">
            <Label>4. Periodicidade do repasse</Label>
            <RadioGroup value={payoutFreq} onValueChange={(v) => setPayoutFreq(v as PayoutFrequency)} className="grid grid-cols-2 sm:grid-cols-5 gap-1">
              {(Object.keys(FREQ_LABELS) as PayoutFrequency[]).map((f) => (
                <label key={f} className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value={f} /> {FREQ_LABELS[f]}
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* 5) Valor mínimo */}
          <div className="space-y-1">
            <Label>5. Valor mínimo para repasse (R$)</Label>
            <Input inputMode="decimal" value={minPayout} onChange={(e) => setMinPayout(e.target.value)} placeholder="0,00" />
          </div>

          <label className="flex items-start gap-2 text-sm cursor-pointer rounded-md border p-3 bg-muted/30">
            <Checkbox checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(!!v)} />
            <span>
              Aceito eletronicamente os termos do modelo de monetização acima. Esta resposta será versionada
              e armazenada como assinatura digital do contrato vigente.
            </span>
          </label>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
            <Button onClick={() => setStep(4)} disabled={!monetizationValid}>
              Próximo <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Resumo e confirmação</h3>
          <ul className="text-sm space-y-1">
            <li><strong>Domínio:</strong> {mode === "subdomain" ? `${domainValue}.impulsionando.com.br` : domainValue} ({mode})</li>
            {wantsEmails === "yes" && <li><strong>E-mails:</strong> {selectedPrefixes.join(", ") || "—"}</li>}
            <li><strong>Modelo:</strong> {monModel === "saas" ? "SaaS" : monModel === "revshare" ? "Revenue Share" : "Híbrido"}</li>
            {monModel !== "revshare" && <li><strong>Mensalidade:</strong> R$ {monthlyFee || "0,00"}</li>}
            {(monModel === "revshare" || monModel === "hybrid") && (
              <>
                <li><strong>Taxa:</strong> {revsharePct}%</li>
                <li><strong>Eventos:</strong> {coveredEvents.map((e) => EVENT_LABELS[e]).join(", ")}</li>
              </>
            )}
            <li><strong>Repasse:</strong> {FREQ_LABELS[payoutFreq]} (mín. R$ {minPayout || "0,00"})</li>
          </ul>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
            <Button onClick={() => submit.mutate()} disabled={submit.isPending || !monetizationValid}>
              {submit.isPending ? "Salvando…" : "Confirmar e publicar"}
            </Button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="text-center py-6 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-semibold text-lg">Onboarding registrado</h3>
          <p className="text-sm text-muted-foreground">Domínio, e-mails e modelo de monetização foram registrados. Cliente liberado para publicação.</p>
        </div>
      )}
    </Card>
  );
}
