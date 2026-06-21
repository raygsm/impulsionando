import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  /** Slug do nicho clicado no hub. Vai para `demo_leads.niche` e para o e-mail. */
  niche: string;
  /** Rótulo do nicho (humano), usado no título do modal. */
  nicheLabel?: string;
  /** Origem para `demo_leads.origin`. Default: `hub-nicho`. */
  origin?: string;
  /** Trigger custom; se omitido renderiza um botão padrão. */
  trigger?: React.ReactNode;
  /** Classe do botão padrão. */
  className?: string;
  /** Label do botão padrão. */
  label?: string;
}

const phoneOk = (v: string) => v.replace(/\D/g, "").length >= 10;
const emailOk = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim());

export function DemoLeadDialog({
  niche,
  nicheLabel,
  origin = "hub-nicho",
  trigger,
  className,
  label = "Receber esta demo no WhatsApp",
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 3) return toast.error("Informe seu nome.");
    if (!emailOk(email)) return toast.error("E-mail inválido.");
    if (!phoneOk(phone)) return toast.error("WhatsApp inválido.");
    if (!consent) return toast.error("Confirme o aceite de contato.");

    setSubmitting(true);
    try {
      const r = await fetch("/api/public/demo/feira-lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, phone, niche, origin }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error ?? "Falha ao registrar.");
      setDone(true);
      toast.success("Tudo certo! Enviamos os próximos passos no seu WhatsApp e e-mail.");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao enviar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className={className ?? "bg-gradient-primary gap-2"}>
            <Send className="w-4 h-4" /> {label}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {done ? "Acesso liberado" : `Demo ${nicheLabel ?? niche} — receber acesso`}
          </DialogTitle>
          <DialogDescription>
            {done
              ? "Em instantes você recebe um e-mail com a demo e um contato no WhatsApp."
              : "Preencha 3 dados e libere a demo completa do nicho, sem cadastro."}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Você pode continuar navegando — o material já está a caminho.
            </p>
            <Button className="mt-4" variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3" noValidate>
            <div>
              <Label htmlFor="ld-name">Nome completo</Label>
              <Input id="ld-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="ld-email">E-mail</Label>
              <Input id="ld-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="ld-phone">WhatsApp</Label>
              <Input id="ld-phone" inputMode="tel" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
              <span>Autorizo a Impulsionando a entrar em contato sobre esta demonstração.</span>
            </label>
            <Button type="submit" disabled={submitting} className="w-full bg-gradient-primary gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Liberar demo
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
