import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitMarketingLead } from "@/lib/marketing-lead.functions";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  businessLabel: string;
  planLabel: string;
  ctaLabel: string;
};

export function SmartLeadCapture({ open, onOpenChange, templateId, businessLabel, planLabel, ctaLabel }: Props) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitLead = useServerFn(submitMarketingLead);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const key = "demo:leads";
      const prev = JSON.parse(localStorage.getItem(key) ?? "[]");
      prev.push({ templateId, businessLabel, planLabel, name, whatsapp, email, ts: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(prev));
    } catch { /* noop */ }
    try {
      await submitLead({
        data: {
          name,
          email,
          phone: whatsapp,
          interest: `${businessLabel} · Plano ${planLabel}`,
          message: `Lead capturado na demo ${templateId}`,
          page_url: typeof window !== "undefined" ? window.location.href : null,
        },
      });
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSent(false); }}>
      <DialogContent className="sm:max-w-md">
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <DialogTitle>Recebemos seu interesse!</DialogTitle>
            <DialogDescription>
              Um consultor Impulsionando vai falar com você em breve com a proposta do plano {planLabel}.
            </DialogDescription>
            <Button className="mt-2" onClick={() => onOpenChange(false)}>Continuar explorando a demo</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{ctaLabel}</DialogTitle>
              <DialogDescription>
                Deixe seu contato para receber a proposta personalizada de {businessLabel} no plano {planLabel}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="lead-name">Seu nome</Label>
                <Input id="lead-name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lead-wa">WhatsApp</Label>
                <Input id="lead-wa" required inputMode="tel" placeholder="(21) 99999-9999" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lead-email">E-mail</Label>
                <Input id="lead-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Ao enviar, você concorda em receber contato comercial da Impulsionando. Sem spam.
            </p>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>) : "Quero receber a proposta"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
