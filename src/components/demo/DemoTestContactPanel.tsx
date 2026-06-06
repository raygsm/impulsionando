import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, MessageCircle, FlaskConical, Trash2, Send, ClipboardList, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  DEMO_SCENARIOS,
  buildBody,
  buildSubject,
  clearDemoContact,
  clearDemoLog,
  loadDemoContact,
  loadDemoLog,
  saveDemoContact,
  simulateSend,
  type DemoScenario,
  type DemoTestContact,
  type DemoTestLogEntry,
} from "@/lib/demoTesting";

/** Floating universal panel — appears once in DemoShell and covers every demo profile. */
export function DemoTestContactPanel() {
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState<DemoTestContact | null>(null);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [log, setLog] = useState<DemoTestLogEntry[]>([]);
  const [previewScenario, setPreviewScenario] = useState<DemoScenario | null>(null);
  const [previewChannel, setPreviewChannel] = useState<"email" | "whatsapp">("email");
  const [confirmSend, setConfirmSend] = useState<{ scenario: DemoScenario; channel: "email" | "whatsapp" } | null>(null);

  useEffect(() => {
    const c = loadDemoContact();
    if (c) {
      setContact(c);
      setEmail(c.demo_test_email);
      setWhatsapp(c.demo_test_whatsapp);
    }
    setLog(loadDemoLog());
  }, [open]);

  const hasEmail = useMemo(() => /\S+@\S+\.\S+/.test(email.trim()), [email]);
  const hasWhats = useMemo(() => whatsapp.replace(/\D/g, "").length >= 10, [whatsapp]);
  const ready = (contact?.demo_test_email && /\S+@\S+\.\S+/.test(contact.demo_test_email)) ||
    (contact?.demo_test_whatsapp && contact.demo_test_whatsapp.replace(/\D/g, "").length >= 10);

  function handleSave() {
    if (!hasEmail && !hasWhats) {
      toast.error("Informe pelo menos um e-mail ou WhatsApp de teste.");
      return;
    }
    const saved = saveDemoContact(email, whatsapp);
    setContact(saved);
    toast.success("Contatos de teste salvos para esta demonstração.");
  }

  function handleClear() {
    clearDemoContact();
    setContact(null);
    setEmail("");
    setWhatsapp("");
    toast.success("Contatos de teste removidos.");
  }

  function openPreview(scenario: DemoScenario, channel: "email" | "whatsapp") {
    setPreviewScenario(scenario);
    setPreviewChannel(channel);
  }

  async function doSimulate(scenario: DemoScenario, channel: "email" | "whatsapp") {
    if (!contact) {
      toast.error("Salve primeiro um e-mail ou WhatsApp de teste.");
      return;
    }
    if (channel === "email" && !contact.demo_test_email) {
      toast.error("Cadastre um e-mail de teste para simular este envio.");
      return;
    }
    if (channel === "whatsapp" && !contact.demo_test_whatsapp) {
      toast.error("Cadastre um WhatsApp de teste para simular este envio.");
      return;
    }
    const entry = await simulateSend({ scenario, contact, channel });
    setLog(loadDemoLog());
    setConfirmSend(null);
    setPreviewScenario(null);
    if (entry.status === "enviado") {
      toast.success(
        channel === "email"
          ? `E-mail de TESTE enviado para ${entry.recipient}.`
          : `WhatsApp de TESTE enviado para ${entry.recipient}.`,
      );
    } else if (entry.status === "falhou") {
      toast.error(
        `Não foi possível enviar a mensagem de TESTE. Confira o log para detalhes.`,
      );
    } else {
      toast.message(
        `Envio demonstrativo preparado para ${entry.recipient} — aguardando integração externa.`,
      );
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            size="sm"
            className="fixed bottom-6 right-6 z-40 shadow-elegant gap-2 bg-gradient-primary"
            aria-label="Abrir painel de testes da demonstração"
          >
            <FlaskConical className="w-4 h-4" />
            <span className="hidden sm:inline">Contatos de teste</span>
            {ready && (
              <Badge variant="secondary" className="ml-1 h-5">ativo</Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-primary" />
              Testes da Demonstração
            </SheetTitle>
            <SheetDescription className="text-xs">
              Informe seu próprio e-mail ou WhatsApp para visualizar como qualquer perfil fictício
              (médico, paciente, cliente, afiliado, participante, entregador, etc.) receberia
              mensagens em uma operação real. Todas as mensagens saem identificadas como{" "}
              <strong>TESTE</strong> e ficam restritas à área de demonstração.
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="contato" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="contato">Meu contato</TabsTrigger>
              <TabsTrigger value="simular">Simular</TabsTrigger>
              <TabsTrigger value="log">Log ({log.length})</TabsTrigger>
            </TabsList>

            {/* ----- Contato ----- */}
            <TabsContent value="contato" className="space-y-4 mt-4">
              <Alert>
                <AlertTitle className="text-sm">Uso restrito à demonstração</AlertTitle>
                <AlertDescription className="text-xs">
                  Estes campos são auxiliares e exclusivos para teste. Não substituem os dados dos
                  cadastros fictícios, não disparam ações reais e não são compartilhados com
                  nenhum outro ambiente. Marcação: <code>is_demo=true, is_test_contact=true,
                  source=demo, consent_context=teste_demonstracao</code>.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="demo-email" className="text-xs font-medium">
                  E-mail para receber teste
                </Label>
                <Input
                  id="demo-email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                />
                <p className="text-[11px] text-muted-foreground">
                  Use estes campos apenas para testar notificações da demonstração. As mensagens
                  enviadas serão identificadas como <strong>TESTE</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="demo-whats" className="text-xs font-medium">
                  WhatsApp para receber teste
                </Label>
                <Input
                  id="demo-whats"
                  type="tel"
                  placeholder="(11) 90000-0000"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={handleSave} className="bg-gradient-primary">Salvar</Button>
                {contact && (
                  <Button variant="outline" onClick={handleClear} className="gap-2">
                    <Trash2 className="w-3.5 h-3.5" /> Limpar
                  </Button>
                )}
              </div>

              {contact && (
                <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1">
                  <div><strong>E-mail de teste:</strong> {contact.demo_test_email || "—"}</div>
                  <div><strong>WhatsApp de teste:</strong> {contact.demo_test_whatsapp || "—"}</div>
                  <div className="text-muted-foreground">
                    Atualizado em {new Date(contact.updated_at).toLocaleString("pt-BR")}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ----- Simular ----- */}
            <TabsContent value="simular" className="space-y-3 mt-4">
              {!ready ? (
                <Alert>
                  <AlertTitle className="text-sm">Informe um contato de teste</AlertTitle>
                  <AlertDescription className="text-xs">
                    Informe um e-mail ou WhatsApp de teste na aba <strong>Meu contato</strong> para
                    visualizar como cada comunicação funcionaria na prática.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertTitle className="text-sm">Integração preparada</AlertTitle>
                  <AlertDescription className="text-xs">
                    <strong>Envio demonstrativo preparado — aguardando credenciais externas.</strong>{" "}
                    O conteúdo, destinatário, assunto e canal são montados exatamente como sairiam
                    em produção; o disparo real depende do gateway de e-mail/WhatsApp.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                {DEMO_SCENARIOS.map((s) => (
                  <div key={s.id} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">{s.label}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {s.module} · {s.profile}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {s.channels.includes("email") && (
                        <>
                          <Button size="sm" variant="outline" className="gap-1.5"
                            onClick={() => openPreview(s, "email")}>
                            <Eye className="w-3.5 h-3.5" /> Prévia e-mail
                          </Button>
                          <Button size="sm" className="gap-1.5"
                            disabled={!contact?.demo_test_email}
                            onClick={() => setConfirmSend({ scenario: s, channel: "email" })}>
                            <Mail className="w-3.5 h-3.5" /> Enviar e-mail de teste
                          </Button>
                        </>
                      )}
                      {s.channels.includes("whatsapp") && (
                        <>
                          <Button size="sm" variant="outline" className="gap-1.5"
                            onClick={() => openPreview(s, "whatsapp")}>
                            <Eye className="w-3.5 h-3.5" /> Prévia WhatsApp
                          </Button>
                          <Button size="sm" className="gap-1.5"
                            disabled={!contact?.demo_test_whatsapp}
                            onClick={() => setConfirmSend({ scenario: s, channel: "whatsapp" })}>
                            <MessageCircle className="w-3.5 h-3.5" /> Enviar WhatsApp de teste
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* ----- Log ----- */}
            <TabsContent value="log" className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5" />
                  Histórico local desta demonstração (até 100 entradas).
                </div>
                {log.length > 0 && (
                  <Button size="sm" variant="outline" className="gap-1.5"
                    onClick={() => { clearDemoLog(); setLog([]); toast.success("Log limpo."); }}>
                    <Trash2 className="w-3.5 h-3.5" /> Limpar log
                  </Button>
                )}
              </div>
              {log.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum envio demonstrativo registrado ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {log.map((e) => (
                    <div key={e.id} className="rounded-md border p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium">{e.scenario_label}</div>
                        <Badge variant="outline" className="text-[10px]">
                          {e.status === "aguardando_integracao"
                            ? "Aguardando integração externa"
                            : e.status}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground">
                        {e.module} · {e.profile} · {e.channel === "email" ? "E-mail" : "WhatsApp"} · {e.recipient}
                      </div>
                      {e.subject && <div><strong>Assunto:</strong> {e.subject}</div>}
                      <div className="whitespace-pre-wrap text-muted-foreground">{e.body}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(e.created_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Prévia */}
      <Dialog open={!!previewScenario} onOpenChange={(o) => !o && setPreviewScenario(null)}>
        <DialogContent>
          {previewScenario && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {previewChannel === "email" ? <Mail className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                  Prévia · {previewScenario.label}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Canal: <strong>{previewChannel === "email" ? "E-mail" : "WhatsApp"}</strong> ·{" "}
                  Módulo: <strong>{previewScenario.module}</strong> · Perfil:{" "}
                  <strong>{previewScenario.profile}</strong>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <div className="text-xs text-muted-foreground">
                  Destinatário:{" "}
                  <strong>
                    {previewChannel === "email"
                      ? contact?.demo_test_email || "(não informado)"
                      : contact?.demo_test_whatsapp || "(não informado)"}
                  </strong>
                </div>
                {previewChannel === "email" && (
                  <div className="rounded-md border p-2 bg-muted/30">
                    <strong>Assunto:</strong> {buildSubject(previewScenario)}
                  </div>
                )}
                <div className="rounded-md border p-3 whitespace-pre-wrap bg-card">
                  {buildBody(previewScenario)}
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setPreviewScenario(null)}>Cancelar</Button>
                <Button
                  className="gap-1.5"
                  disabled={
                    previewChannel === "email"
                      ? !contact?.demo_test_email
                      : !contact?.demo_test_whatsapp
                  }
                  onClick={() =>
                    setConfirmSend({ scenario: previewScenario, channel: previewChannel })
                  }
                >
                  <Send className="w-3.5 h-3.5" /> Simular envio
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação */}
      <Dialog open={!!confirmSend} onOpenChange={(o) => !o && setConfirmSend(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar envio de TESTE</DialogTitle>
            <DialogDescription className="text-xs">
              Você está prestes a enviar uma mensagem de <strong>TESTE</strong> para o e-mail ou
              WhatsApp informado. Nenhuma ação real será executada. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmSend(null)}>Cancelar</Button>
            <Button
              className="bg-gradient-primary gap-1.5"
              onClick={() => confirmSend && doSimulate(confirmSend.scenario, confirmSend.channel)}
            >
              <Send className="w-3.5 h-3.5" /> Sim, enviar teste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
