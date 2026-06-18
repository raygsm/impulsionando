/**
 * DemoAccessGate
 * Bloqueia áreas /demo/* com um Dialog modal solicitando nome completo,
 * WhatsApp e e-mail antes de liberar o acesso. Persiste por 30 dias no
 * localStorage e dispara a jornada de e-mails (boas-vindas + pesquisa + planos).
 */
import { useEffect, useMemo, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { registerDemoAccess } from "@/lib/demo-access.functions";
import { Sparkles, ShieldCheck } from "lucide-react";

const STORAGE_KEY = "impulsionando:demo_access";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

type Stored = { leadId: string; name: string; email: string; phone: string; expiresAt: number };

function readStored(): Stored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed?.expiresAt || parsed.expiresAt < Date.now()) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(s: Stored) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

// Validações mínimas (client-side; servidor reaplica com Zod)
const PHONE_REGEX = /^\+?\s*(?:55\s*)?\(?\d{2}\)?\s*9?\s*\d{4}-?\s*\d{4}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(name: string, phone: string, email: string) {
  const errs: { name?: string; phone?: string; email?: string } = {};
  const n = name.trim();
  if (n.length < 3) errs.name = "Informe seu nome completo";
  else if (n.split(/\s+/).length < 2) errs.name = "Informe nome e sobrenome";
  const p = phone.trim();
  if (!PHONE_REGEX.test(p)) errs.phone = "WhatsApp inválido (DDD + número)";
  const e = email.trim();
  if (!EMAIL_REGEX.test(e)) errs.email = "E-mail inválido";
  return errs;
}

export function DemoAccessGate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDemo = pathname.startsWith("/demo/") || pathname === "/demo";
  const [stored, setStored] = useState<Stored | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStored(readStored());
    setHydrated(true);
  }, []);

  // Re-hydrata quando muda de rota (caso o usuário tenha cadastrado em outra aba)
  useEffect(() => {
    if (isDemo) setStored(readStored());
  }, [pathname, isDemo]);

  const open = hydrated && isDemo && !stored;

  if (!hydrated || !isDemo) return null;

  return (
    <GateDialog
      open={open}
      pathname={pathname}
      onSuccess={(s) => {
        writeStored(s);
        setStored(s);
      }}
    />
  );
}

function GateDialog({
  open,
  pathname,
  onSuccess,
}: {
  open: boolean;
  pathname: string;
  onSuccess: (s: Stored) => void;
}) {
  const register = useServerFn(registerDemoAccess);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const niche = useMemo(() => {
    const m = pathname.match(/^\/demo\/nicho\/([^/?#]+)/);
    return m?.[1] ?? null;
  }, [pathname]);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate(name, phone, email);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      const res = await register({
        data: { name: name.trim(), phone: phone.trim(), email: email.trim(), sourcePath: pathname, niche },
      });
      toast.success("Acesso liberado! Enviamos boas-vindas no seu e-mail.");
      onSuccess({
        leadId: res.leadId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        expiresAt: Date.now() + TTL_MS,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Não foi possível liberar o acesso. Tente novamente.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl">Acesso à área de demonstração</DialogTitle>
          <DialogDescription className="text-center">
            Para liberar o acesso, preencha rapidinho seus dados. Em seguida você pode explorar livremente — e nós te enviamos um guia rápido por e-mail.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="demo-gate-name">Nome completo</Label>
            <Input
              id="demo-gate-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Maria Silva"
              autoComplete="name"
              required
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="demo-gate-phone">WhatsApp (com DDD)</Label>
            <Input
              id="demo-gate-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(21) 99999-0000"
              inputMode="tel"
              autoComplete="tel"
              required
              aria-invalid={!!errors.phone}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="demo-gate-email">E-mail</Label>
            <Input
              id="demo-gate-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com.br"
              autoComplete="email"
              required
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Liberando..." : "Liberar acesso à demonstração"}
          </Button>

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <ShieldCheck className="h-3 w-3" />
            Seus dados ficam protegidos (LGPD). Liberação válida por 30 dias neste navegador.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default DemoAccessGate;
