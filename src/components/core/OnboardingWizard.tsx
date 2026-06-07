import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { saveDomainRequest, saveEmailRequests, initChecklist, completeChecklistItem } from "@/lib/onboarding.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

type Mode = "subdomain" | "own" | "register";

const PREFIX_OPTIONS = ["contato", "sac", "financeiro", "comercial", "atendimento", "agenda", "rh", "diretoria"];

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

  const saveDomain = useServerFn(saveDomainRequest);
  const saveEmails = useServerFn(saveEmailRequests);
  const init = useServerFn(initChecklist);
  const complete = useServerFn(completeChecklistItem);

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
      await complete({ data: { companyId, itemKey: "onboarding_done", status: "done" } });
      await complete({ data: { companyId, itemKey: "payment_approved", status: "done" } });
    },
    onSuccess: () => {
      toast.success("Onboarding registrado!");
      qc.invalidateQueries({ queryKey: ["client-360", companyId] });
      setStep(4);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const showSubdomainConfirm = mode === "subdomain";

  return (
    <Card className="p-5 space-y-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        Passo {step} de 3
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
          <h3 className="font-semibold">Resumo</h3>
          <ul className="text-sm space-y-1">
            <li><strong>Domínio:</strong> {mode === "subdomain" ? `${domainValue}.impulsionando.com.br` : domainValue} ({mode})</li>
            {wantsEmails === "yes" && <li><strong>E-mails:</strong> {selectedPrefixes.join(", ") || "—"}</li>}
          </ul>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
            <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
              {submit.isPending ? "Salvando…" : "Confirmar onboarding"}
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="text-center py-6 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-semibold text-lg">Onboarding registrado</h3>
          <p className="text-sm text-muted-foreground">As solicitações foram salvas e o checklist foi atualizado. Nossa equipe segue com as próximas etapas.</p>
        </div>
      )}
    </Card>
  );
}
