import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, KeyRound, UserPlus, Copy, CheckCircle2, Loader2, LockKeyhole, RefreshCw, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CpMark } from "@/components/cp/CpBrand";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/cp-seguro")({
  validateSearch: (search: Record<string, unknown>) => ({
    convite: typeof search.convite === "string" ? search.convite : undefined,
  }),
  head: () => ({ meta: [{ title: "CP Seguro — Chat Privado" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CpSecureArea,
});

type AalState = { currentLevel: "aal1" | "aal2" | null; nextLevel: "aal1" | "aal2" | null };
type Invitation = {
  id: string;
  inviter_user_id: string;
  invitee_user_id: string | null;
  invited_alias_hint: string | null;
  state: string;
  expires_at: string;
  second_factor_verified_at: string | null;
  invitee_accepted_at: string | null;
  inviter_confirmed_at: string | null;
  activated_at: string | null;
  created_at: string;
};

function normalizeQr(value: string | undefined) {
  if (!value) return null;
  if (value.startsWith("data:image")) return value;
  if (value.trim().startsWith("<svg")) return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(value)}`;
  return value;
}

function CpSecureArea() {
  const { convite } = Route.useSearch();
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [aal, setAal] = useState<AalState>({ currentLevel: null, nextLevel: null });
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [alias, setAlias] = useState("");
  const [lastToken, setLastToken] = useState<string | null>(null);

  const refreshAal = async () => {
    const [{ data: userData }, { data: aalData, error: aalError }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    if (aalError) throw aalError;
    setUserId(userData.user?.id ?? null);
    setAal({
      currentLevel: (aalData?.currentLevel as AalState["currentLevel"]) ?? null,
      nextLevel: (aalData?.nextLevel as AalState["nextLevel"]) ?? null,
    });
  };

  useEffect(() => { refreshAal().catch((e) => toast.error(e?.message ?? "Não foi possível validar a segurança da sessão.")); }, []);

  const { data: invitations = [], isLoading: invitationsLoading } = useQuery({
    queryKey: ["cp-invitations", userId],
    enabled: !!userId && aal.currentLevel === "aal2",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cp_invitations")
        .select("id,inviter_user_id,invitee_user_id,invited_alias_hint,state,expires_at,second_factor_verified_at,invitee_accepted_at,inviter_confirmed_at,activated_at,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Invitation[];
    },
  });

  const enrollMfa = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "CP Chat Privado" });
      if (error) throw error;
      setFactorId(data.id);
      setQr(normalizeQr(data.totp?.qr_code));
      setSecret(data.totp?.secret ?? null);
      return data;
    },
    onError: (e: any) => toast.error(e?.message ?? "Não foi possível iniciar o segundo fator."),
  });

  const verifyMfa = useMutation({
    mutationFn: async () => {
      if (!factorId) throw new Error("Inicie o cadastro do autenticador primeiro.");
      if (!/^\d{6}$/.test(code.trim())) throw new Error("Digite o código de 6 dígitos do autenticador.");
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: code.trim() });
      if (verifyError) throw verifyError;
      await refreshAal();
    },
    onSuccess: () => { setCode(""); toast.success("Segundo fator verificado. Sessão CP protegida em AAL2."); qc.invalidateQueries({ queryKey: ["cp-invitations"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Código inválido."),
  });

  const challengeExisting = useMutation({
    mutationFn: async () => {
      const { data: factors, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const verified = factors.totp?.find((f) => f.status === "verified");
      if (!verified) throw new Error("Nenhum autenticador verificado foi encontrado.");
      setFactorId(verified.id);
      return verified.id;
    },
    onSuccess: () => toast.success("Autenticador localizado. Digite o código atual para elevar a sessão."),
    onError: (e: any) => toast.error(e?.message ?? "Não foi possível localizar seu autenticador."),
  });

  const verifyExisting = useMutation({
    mutationFn: async () => {
      if (!factorId) throw new Error("Localize seu autenticador primeiro.");
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: code.trim() });
      if (verifyError) throw verifyError;
      await refreshAal();
    },
    onSuccess: () => { setCode(""); toast.success("Sessão elevada para AAL2."); },
    onError: (e: any) => toast.error(e?.message ?? "Não foi possível confirmar o segundo fator."),
  });

  const createInvitation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("cp_create_invitation", { p_phone: phone, p_alias_hint: alias || null });
      if (error) throw error;
      return data as { invitation_id: string; invitation_token: string; expires_at: string };
    },
    onSuccess: (data) => {
      setLastToken(data.invitation_token);
      setPhone(""); setAlias("");
      qc.invalidateQueries({ queryKey: ["cp-invitations"] });
      toast.success("Convite criado. O token é exibido somente para você compartilhar com a pessoa certa.");
    },
    onError: (e: any) => toast.error(e?.message ?? "Não foi possível criar o convite."),
  });

  const acceptInvitation = useMutation({
    mutationFn: async () => {
      if (!convite) throw new Error("Convite ausente.");
      const { data, error } = await supabase.rpc("cp_accept_invitation", { p_token: convite });
      if (error) throw error;
      return data;
    },
    onSuccess: () => { toast.success("Sua identidade e 2FA foram validados. Falta apenas a confirmação final de quem convidou você."); qc.invalidateQueries({ queryKey: ["cp-invitations"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Não foi possível aceitar o convite."),
  });

  const confirmInvitation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc("cp_confirm_invitation", { p_invitation_id: id });
      if (error) throw error;
      return data;
    },
    onSuccess: () => { toast.success("Convite confirmado. A pessoa está autorizada na sua rede CP."); qc.invalidateQueries({ queryKey: ["cp-invitations"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Não foi possível confirmar o convite."),
  });

  const revokeInvitation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("cp_revoke_invitation", { p_invitation_id: id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Convite revogado."); qc.invalidateQueries({ queryKey: ["cp-invitations"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Não foi possível revogar o convite."),
  });

  const isAal2 = aal.currentLevel === "aal2";
  const hasEnrolledFactor = aal.nextLevel === "aal2";
  const outgoing = useMemo(() => invitations.filter((i) => i.inviter_user_id === userId), [invitations, userId]);
  const incoming = useMemo(() => invitations.filter((i) => i.invitee_user_id === userId), [invitations, userId]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><CpMark /><h1 className="mt-4 text-2xl font-black">Área Segura CP</h1><p className="mt-1 text-sm text-muted-foreground">Convites, identidade e autorização protegidos antes de qualquer conversa.</p></div>
        <Badge variant={isAal2 ? "default" : "outline"}>{isAal2 ? "AAL2 verificado" : "AAL2 obrigatório"}</Badge>
      </div>

      {!isAal2 && (
        <Card className="p-6">
          <div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><KeyRound className="h-5 w-5" /></div><div><h2 className="font-bold">Segundo fator obrigatório</h2><p className="mt-1 text-sm text-muted-foreground">O CP não libera convites ou rede privada com uma sessão AAL1. Configure ou confirme seu autenticador.</p></div></div>
          {!hasEnrolledFactor && !factorId && <Button className="mt-5" onClick={() => enrollMfa.mutate()} disabled={enrollMfa.isPending}>{enrollMfa.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShieldCheck className="mr-2 h-4 w-4"/>}Configurar autenticador</Button>}
          {!hasEnrolledFactor && factorId && (
            <div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr]">
              <div className="rounded-xl border bg-white p-3">{qr ? <img src={qr} alt="QR Code para configurar autenticador" className="mx-auto w-full" /> : <div className="aspect-square animate-pulse rounded bg-muted"/>}</div>
              <div className="space-y-4"><div><Label>Chave manual</Label><div className="mt-1 rounded-md border bg-muted p-2 font-mono text-xs break-all">{secret ?? "—"}</div></div><div><Label htmlFor="cp-mfa-code">Código de 6 dígitos</Label><Input id="cp-mfa-code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" /></div><Button onClick={() => verifyMfa.mutate()} disabled={verifyMfa.isPending}>{verifyMfa.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle2 className="mr-2 h-4 w-4"/>}Ativar segundo fator</Button></div>
            </div>
          )}
          {hasEnrolledFactor && (
            <div className="mt-5 max-w-md space-y-3">
              {!factorId && <Button variant="outline" onClick={() => challengeExisting.mutate()} disabled={challengeExisting.isPending}><RefreshCw className="mr-2 h-4 w-4"/>Usar meu autenticador cadastrado</Button>}
              {factorId && <><Label htmlFor="cp-existing-code">Código atual do autenticador</Label><Input id="cp-existing-code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000"/><Button onClick={() => verifyExisting.mutate()} disabled={verifyExisting.isPending}>{verifyExisting.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LockKeyhole className="mr-2 h-4 w-4"/>}Confirmar AAL2</Button></>}
            </div>
          )}
        </Card>
      )}

      {isAal2 && (
        <>
          {convite && <Card className="border-primary/30 p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-primary"/><div className="flex-1"><h2 className="font-bold">Você recebeu um convite CP</h2><p className="mt-1 text-sm text-muted-foreground">Ao aceitar, seu telefone autenticado e seu segundo fator serão validados. A ativação só acontece depois do segundo aceite do convidante.</p><Button className="mt-4" onClick={() => acceptInvitation.mutate()} disabled={acceptInvitation.isPending}>{acceptInvitation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle2 className="mr-2 h-4 w-4"/>}Validar e aceitar convite</Button></div></div></Card>}

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5"><div className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary"/><h2 className="font-bold">Convidar alguém</h2></div><p className="mt-1 text-sm text-muted-foreground">O número é usado apenas para validar a identidade no primeiro vínculo; o banco guarda somente a impressão criptográfica do telefone.</p><div className="mt-4 space-y-3"><div><Label>Celular com DDI</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+55 21 99999-9999" /></div><div><Label>Apelido sugerido (opcional)</Label><Input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Como você reconhecerá a pessoa" /></div><Button onClick={() => createInvitation.mutate()} disabled={createInvitation.isPending || phone.trim().length < 10}>{createInvitation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4"/>}Criar convite protegido</Button></div>
              {lastToken && <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"><div className="text-xs font-bold uppercase tracking-wide text-amber-700">Token único do convite</div><div className="mt-2 break-all font-mono text-xs">{lastToken}</div><Button className="mt-3" size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/cp-seguro?convite=${lastToken}`); toast.success("Link do convite copiado."); }}><Copy className="mr-2 h-3.5 w-3.5"/>Copiar link protegido</Button><p className="mt-2 text-xs text-muted-foreground">Depois de compartilhado, feche esta tela. O servidor guarda somente o hash do token.</p></div>}
            </Card>

            <Card className="p-5"><h2 className="font-bold">Sua rede de confiança</h2><p className="mt-1 text-sm text-muted-foreground">Nenhum convite vira acesso sem as duas confirmações.</p>{invitationsLoading ? <div className="mt-5 text-sm text-muted-foreground">Carregando…</div> : <div className="mt-4 space-y-3">{outgoing.length===0 && incoming.length===0 && <div className="text-sm text-muted-foreground">Nenhum vínculo CP ainda.</div>}{outgoing.map((i) => <div key={i.id} className="rounded-lg border p-3"><div className="flex items-center justify-between gap-2"><div><div className="text-sm font-semibold">{i.invited_alias_hint || "Convite enviado"}</div><div className="text-xs text-muted-foreground">{i.state}</div></div><Badge variant={i.state==="active"?"default":"outline"}>{i.state==="active"?"Ativo":"Pendente"}</Badge></div><div className="mt-3 flex gap-2">{i.state==="invitee_accepted" && <Button size="sm" onClick={() => confirmInvitation.mutate(i.id)}><CheckCircle2 className="mr-1 h-3.5 w-3.5"/>Confirmar pessoa</Button>}{!["active","expired","revoked"].includes(i.state) && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => revokeInvitation.mutate(i.id)}><XCircle className="mr-1 h-3.5 w-3.5"/>Revogar</Button>}</div></div>)}{incoming.map((i) => <div key={i.id} className="rounded-lg border p-3"><div className="flex items-center justify-between"><div><div className="text-sm font-semibold">Convite recebido</div><div className="text-xs text-muted-foreground">{i.state}</div></div><Badge variant={i.state==="active"?"default":"outline"}>{i.state==="active"?"Ativo":"Aguardando convidante"}</Badge></div></div>)}</div>}</Card>
          </div>

          <Card className="border-slate-300/20 bg-slate-950 p-5 text-white"><div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 h-5 w-5"/><div><h2 className="font-bold">Conversas ainda bloqueadas nesta etapa de homologação</h2><p className="mt-1 text-sm text-slate-300">A rede e o duplo aceite já estão implementados. O conteúdo de conversa só será liberado depois que gestão de chaves no dispositivo, E2EE auditável e exclusão sem backup recuperável passarem nos testes de segurança do CP.</p></div></div></Card>
        </>
      )}
    </div>
  );
}
