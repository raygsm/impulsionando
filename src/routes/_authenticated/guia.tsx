import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, Bot, CheckCircle2, ChevronRight, Search, Sparkles, TestTube2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GUIDE_SECTIONS } from "@/content/impulsionito-guide/catalog";

export const Route = createFileRoute("/_authenticated/guia")({
  component: ImpulsionitoGuidePage,
  head: () => ({ meta: [
    { title: "Impulsionito Guia — Impulsionando" },
    { name: "description", content: "Manual Vivo e onboarding contextual da Impulsionando." },
  ] }),
});

function openImpulsionito() {
  if (typeof document === "undefined") return;
  const button = document.querySelector<HTMLButtonElement>('button[aria-label^="Abrir Impulsionito"]');
  if (button) button.click();
  else window.dispatchEvent(new CustomEvent("impulsionito:open", { detail: { origin: "manual-vivo" } }));
}

function ImpulsionitoGuidePage() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const sections = useMemo(() => {
    if (!normalized) return GUIDE_SECTIONS;
    return GUIDE_SECTIONS.filter((section) => [section.title, section.summary, section.why, ...section.tags, ...section.steps]
      .join(" ").toLocaleLowerCase("pt-BR").includes(normalized));
  }, [normalized]);

  return (
    <div className="container max-w-6xl py-6 md:py-8 space-y-6">
      <section className="rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-5 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge className="gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Impulsionito Guia</Badge>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Você nunca precisa aprender a Impulsionando sozinho.</h1>
            <p className="text-muted-foreground text-base md:text-lg">Entenda o recurso, veja por que ele importa, siga o passo a passo e faça um teste seguro. Quando preferir, o Impulsionito acompanha você.</p>
          </div>
          <Button size="lg" onClick={openImpulsionito} className="shrink-0">
            <Bot className="w-4 h-4 mr-2" /> Falar com o Impulsionito
          </Button>
        </div>
      </section>

      <section className="grid md:grid-cols-4 gap-3">
        {[
          ["1", "Entenda", "O que é e por que usar"],
          ["2", "Aprenda", "Passo a passo sem jargão"],
          ["3", "Teste", "Validação controlada"],
          ["4", "Faça", "Com ajuda do Impulsionito"],
        ].map(([n, title, text]) => (
          <Card key={n}>
            <CardContent className="pt-5 flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">{n}</div>
              <div><div className="font-semibold">{title}</div><div className="text-xs text-muted-foreground mt-0.5">{text}</div></div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5 text-primary" /> O que você quer aprender ou fazer?</CardTitle>
          <CardDescription>Busque pelo que deseja fazer, mesmo que não saiba o nome técnico do recurso.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ex.: conectar WhatsApp, cadastrar produto, configurar agenda, testar e-mail..." className="h-12" />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
        <Card className="lg:sticky lg:top-4">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4" /> Índice vivo</CardTitle><CardDescription>{sections.length} tópico(s) disponíveis nesta primeira versão.</CardDescription></CardHeader>
          <CardContent className="space-y-1">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="flex items-center justify-between rounded-md px-2.5 py-2 text-sm hover:bg-muted transition-colors">
                <span>{section.title}</span><ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {sections.length === 0 ? (
            <Card><CardContent className="py-10 text-center"><p className="font-medium">Não encontrei esse assunto nesta versão do Guia.</p><p className="text-sm text-muted-foreground mt-1">Pergunte ao Impulsionito usando suas próprias palavras.</p><Button className="mt-4" variant="outline" onClick={openImpulsionito}><Bot className="w-4 h-4 mr-2" /> Perguntar ao Impulsionito</Button></CardContent></Card>
          ) : sections.map((section) => (
            <Card key={section.id} id={section.id} className="scroll-mt-6">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><BookOpen className="w-5 h-5" /></div>
                  <div><CardTitle>{section.title}</CardTitle><CardDescription className="mt-1">{section.summary}</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/40 p-4"><div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-1">Por que isso importa</div><p className="text-sm">{section.why}</p></div>
                <Accordion type="single" collapsible>
                  <AccordionItem value="steps"><AccordionTrigger>Ver passo a passo</AccordionTrigger><AccordionContent><ol className="space-y-3">{section.steps.map((step, i) => <li key={step} className="flex gap-3 text-sm"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">{i + 1}</span><span className="pt-0.5">{step}</span></li>)}</ol></AccordionContent></AccordionItem>
                  {section.test ? <AccordionItem value="test"><AccordionTrigger>Como testar com segurança</AccordionTrigger><AccordionContent><div className="flex gap-3 text-sm"><TestTube2 className="w-4 h-4 mt-0.5 text-primary shrink-0" /><span>{section.test}</span></div></AccordionContent></AccordionItem> : null}
                </Accordion>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={openImpulsionito}><Bot className="w-4 h-4 mr-1.5" /> Fazer com o Impulsionito</Button>
                  <Button size="sm" variant="outline" disabled><CheckCircle2 className="w-4 h-4 mr-1.5" /> Teste guiado — próxima fase</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
