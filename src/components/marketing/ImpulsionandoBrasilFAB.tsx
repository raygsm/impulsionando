import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { submitMarketingLead } from "@/lib/marketing-lead.functions";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const WHATSAPP_URL = "https://wa.me/5521993075000?text=" + encodeURIComponent(
  "Olá! Vim do site da Impulsionando e quero falar com a Impulsionando Brasil sobre marketing.",
);

export function MarketingLeadDialog({
  trigger,
  defaultInterest,
}: {
  trigger: React.ReactNode;
  defaultInterest?: string;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const submit = useServerFn(submitMarketingLead);

  const mut = useMutation({
    mutationFn: () =>
      submit({
        data: {
          ...form,
          interest: defaultInterest ?? "Marketing",
          page_url: typeof window !== "undefined" ? window.location.href : null,
        },
      }),
    onSuccess: () => {
      toast.success("Recebemos seu contato. Time da Impulsionando Brasil vai te chamar.");
      setOpen(false);
      setForm({ name: "", email: "", phone: "", company: "", message: "" });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao enviar"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Falar com a Impulsionando Brasil
          </DialogTitle>
          <DialogDescription>
            {defaultInterest ? `Interesse: ${defaultInterest}.` : ""} Deixe seu contato e nosso time retorna.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="ib-name">Nome</Label>
            <Input id="ib-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="ib-phone">WhatsApp</Label>
              <Input id="ib-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ib-email">Email</Label>
              <Input id="ib-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ib-company">Empresa</Label>
            <Input id="ib-company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ib-msg">Conta um pouco do que precisa</Label>
            <Textarea id="ib-msg" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={() => mut.mutate()} disabled={mut.isPending}>
              {mut.isPending ? "Enviando…" : "Enviar contato"}
            </Button>
            <Button variant="outline" asChild>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ImpulsionandoBrasilFAB() {
  if (typeof window !== "undefined") {
    const path = window.location.pathname;
    // Esconde no /auth, /healthz e dentro do app autenticado em rotas administrativas pesadas
    if (path.startsWith("/healthz") || path.startsWith("/manutencao")) return null;
  }
  return (
    <MarketingLeadDialog
      defaultInterest="Marketing geral"
      trigger={
        <button
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 shadow-lg hover:shadow-xl hover:opacity-95 transition text-sm font-medium"
          aria-label="Impulsionando Brasil"
        >
          <Sparkles className="h-4 w-4" />
          Impulsionando Brasil
        </button>
      }
    />
  );
}
