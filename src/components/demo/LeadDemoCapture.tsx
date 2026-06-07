/**
 * LeadDemoCapture — Gate reutilizável para demonstrações de módulo.
 *
 * Antes de liberar a demo completa, captura nome + WhatsApp (obrigatórios)
 * e e-mail / empresa / segmento (opcionais). Persiste localmente para não
 * pedir novamente e faz melhor-esforço de gravar em `marketing_leads`
 * (source = 'demo') — política pública já permite insert anon.
 *
 * Toda tela exibe a chancela "DEMONSTRAÇÃO — VERSÃO TESTE".
 */
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type LeadDemoInfo = {
  name: string;
  whatsapp: string;
  email?: string;
  company?: string;
  niche?: string;
  moduleSlug: string;
  moduleName: string;
  capturedAt: string;
};

type Props = {
  moduleSlug: string;
  moduleName: string;
  /** Texto curto exibido no topo do diálogo. */
  description?: string;
  /** Acionado quando o lead conclui o cadastro (ou já estava cadastrado). */
  onCaptured?: (lead: LeadDemoInfo) => void;
};

const STORAGE_PREFIX = "imp.demo.lead.";

function storageKey(slug: string) {
  return `${STORAGE_PREFIX}${slug}`;
}

export function getCapturedLead(slug: string): LeadDemoInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(slug));
    return raw ? (JSON.parse(raw) as LeadDemoInfo) : null;
  } catch {
    return null;
  }
}

export function hasCapturedLead(slug: string): boolean {
  return !!getCapturedLead(slug);
}

export function clearCapturedLead(slug: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(slug));
  } catch {
    /* ignore */
  }
}

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo.").max(120),
  whatsapp: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D+/g, ""))
    .refine((v) => v.length >= 10 && v.length <= 13, {
      message: "Informe um WhatsApp válido com DDD. Exemplo: 21999999999.",
    }),
  email: z.string().trim().email("E-mail inválido.").max(200).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  niche: z.string().trim().max(80).optional().or(z.literal("")),
});

export function LeadDemoCapture({ moduleSlug, moduleName, description, onCaptured }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [niche, setNiche] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const existing = getCapturedLead(moduleSlug);
    if (existing) {
      onCaptured?.(existing);
      setOpen(false);
    } else {
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const parsed = schema.safeParse({ name, whatsapp, email, company, niche });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Dados inválidos.");
      return;
    }
    setSubmitting(true);
    const clean = parsed.data;
    const info: LeadDemoInfo = {
      name: clean.name,
      whatsapp: clean.whatsapp,
      email: clean.email || undefined,
      company: clean.company || undefined,
      niche: clean.niche || undefined,
      moduleSlug,
      moduleName,
      capturedAt: new Date().toISOString(),
    };

    // Persistência local (sempre).
    try {
      localStorage.setItem(storageKey(moduleSlug), JSON.stringify(info));
      const listKey = "imp.demo.leads.list.v1";
      const all = JSON.parse(localStorage.getItem(listKey) ?? "[]");
      all.unshift(info);
      localStorage.setItem(listKey, JSON.stringify(all.slice(0, 200)));
    } catch {
      /* ignore */
    }

    // Melhor-esforço: salvar em marketing_leads (source='demo'). RLS já permite anon.
    try {
      const utm = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const pageUrl = typeof window !== "undefined" ? window.location.href : null;
      await supabase.from("marketing_leads").insert({
        source: "demo",
        name: info.name,
        email: info.email ?? null,
        phone: info.whatsapp,
        company: info.company ?? null,
        message: `DEMO — ${moduleName}`,
        answers: {
          module_slug: moduleSlug,
          module_name: moduleName,
          niche: info.niche ?? null,
          environment: "DEMONSTRAÇÃO",
          status_demo: "Lead DEMO",
          etapa: "Demonstração iniciada",
        },
        recommended_modules: [moduleSlug],
        status: "new",
        utm_source: utm?.get("utm_source") ?? null,
        utm_medium: utm?.get("utm_medium") ?? null,
        utm_campaign: utm?.get("utm_campaign") ?? null,
        page_url: pageUrl,
      });
    } catch {
      /* segue só com localStorage */
    }

    toast.success("Demonstração liberada. Vamos personalizar seu teste.");
    onCaptured?.(info);
    setSubmitting(false);
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        // Não permite fechar antes da captura.
        if (!v && !getCapturedLead(moduleSlug)) {
          toast.message("Informe nome e WhatsApp para liberar a demonstração.");
          return;
        }
        setOpen(v);
      }}
    >
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px]">DEMONSTRAÇÃO — VERSÃO TESTE</Badge>
            <Badge variant="secondary" className="text-[10px]">{moduleName}</Badge>
          </div>
          <DialogTitle className="flex items-center gap-2 pt-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Liberar demonstração
          </DialogTitle>
          <DialogDescription>
            {description ??
              `Antes de liberar sua demonstração de ${moduleName}, informe seu nome e WhatsApp. Assim conseguimos personalizar seu teste e, se fizer sentido, ajudar depois na configuração real.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div>
            <Label className="text-xs">Nome completo *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" maxLength={120} autoFocus required />
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> WhatsApp com DDD *
            </Label>
            <Input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="21999999999"
              inputMode="tel"
              maxLength={20}
              required
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Use DDD. Ex.: 21999999999. Pode digitar com ou sem máscara.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">E-mail</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="opcional" maxLength={200} type="email" />
            </div>
            <div>
              <Label className="text-xs">Empresa</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="opcional" maxLength={120} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Segmento / nicho</Label>
            <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="ex.: clínica, estética, advocacia…" maxLength={80} />
          </div>

          <p className="text-[11px] text-muted-foreground">
            Nenhuma cobrança é realizada na demonstração. Seus dados são usados apenas para personalizar o teste.
          </p>

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Liberando…" : "Liberar demonstração"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
