import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";

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

  function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const key = "demo:leads";
      const prev = JSON.parse(localStorage.getItem(key) ?? "[]");
      prev.push({
        templateId,
        businessLabel,
        planLabel,
        name,
        whatsapp,
        email,
        ts: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(prev));
    } catch {
      /* noop */
    }
    setSent(true);
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
            <Button type="submit" className="w-full">Quero receber a proposta</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
