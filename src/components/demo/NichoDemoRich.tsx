import { Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/marketing/PublicHeader";
import { PublicFooter } from "@/components/marketing/PublicFooter";
import { DemoModeBanner } from "@/components/demo/DemoModeBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight } from "lucide-react";
import { useDemoTracker } from "@/hooks/useDemoTracker";
import type { RichNicheConfig, RichTab } from "@/lib/demoNichoExtras";

export function NichoDemoRich({ config }: { config: RichNicheConfig }) {
  const { track } = useDemoTracker(config.niche);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <DemoModeBanner />

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-8">
          <Badge className="bg-gradient-primary mb-3">{config.heroEyebrow}</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{config.heroTitle}</h1>
          <p className="mt-3 text-muted-foreground max-w-3xl">{config.heroSubtitle}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {config.kpis.map((k) => (
            <Card key={k.label} className="p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</div>
              <div className="mt-1 text-2xl font-bold">{k.value}</div>
              {k.sub && <div className="text-xs text-muted-foreground mt-0.5">{k.sub}</div>}
            </Card>
          ))}
        </div>

        <Tabs
          defaultValue={config.tabs[0]?.id}
          className="w-full"
          onValueChange={(v) => track("nav", `tab.${v}`, 2)}
        >
          <TabsList className="flex flex-wrap h-auto justify-start gap-1">
            {config.tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>
            ))}
          </TabsList>

          {config.tabs.map((t) => (
            <TabsContent key={t.id} value={t.id} className="mt-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">{t.headline}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
              </div>
              <TabBody tab={t} />
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button
            asChild
            className="bg-gradient-primary shadow-elegant"
            onClick={() => track("cta", "primary", 5)}
          >
            <Link to={config.ctaPrimary.to as "/orcamento"}>
              {config.ctaPrimary.label} <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline" onClick={() => track("cta", "secondary", 3)}>
            <Link to={config.ctaSecondary.to as "/contato"}>{config.ctaSecondary.label}</Link>
          </Button>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function TabBody({ tab }: { tab: RichTab }) {
  if (tab.kind === "table" && tab.columns && tab.rows) {
    return (
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>{tab.columns.map((c) => <TableHead key={c}>{c}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {tab.rows.map((r, i) => (
              <TableRow key={i}>
                {r.map((cell, j) => (
                  <TableCell key={j} className={j === 0 ? "font-medium" : "text-sm text-muted-foreground"}>
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  }
  if (tab.kind === "cards" && tab.cards) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tab.cards.map((c) => (
          <Card key={c.title} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold">{c.title}</div>
                {c.meta && <div className="text-xs text-muted-foreground mt-0.5">{c.meta}</div>}
              </div>
              {c.tag && <Badge variant="outline" className="shrink-0">{c.tag}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-2">{c.body}</p>
          </Card>
        ))}
      </div>
    );
  }
  if (tab.kind === "timeline" && tab.steps) {
    return (
      <div className="space-y-3">
        {tab.steps.map((s, i) => (
          <Card key={i} className="p-4 flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="font-semibold">{s.title}</div>
                {s.meta && <span className="text-xs text-muted-foreground">{s.meta}</span>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{s.body}</p>
            </div>
          </Card>
        ))}
      </div>
    );
  }
  if (tab.kind === "metrics" && tab.metrics) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tab.metrics.map((m) => (
          <Card key={m.label} className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{m.label}</div>
            <div className="mt-2 text-2xl font-bold">{m.value}</div>
            {m.sub && <div className="text-xs text-muted-foreground mt-1">{m.sub}</div>}
          </Card>
        ))}
      </div>
    );
  }
  return null;
}
