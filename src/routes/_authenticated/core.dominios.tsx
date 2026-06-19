import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { checkCoreHealthAccess } from "@/lib/core-rbac.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check, Globe, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/core/dominios")({
  head: () => ({ meta: [{ title: "Domínios dos Tenants" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const r = await checkCoreHealthAccess();
    if (!r.allowed) throw redirect({ to: "/core" as any });
    return { coreAccess: r.level };
  },
  component: DominiosPage,
});

const LOVABLE_IP = "185.158.133.1";
const LOVABLE_HOST = "impulsionando.lovable.app";

type DnsAnswer = { name: string; type: number; data: string };

async function resolveDns(host: string, type: "A" | "CNAME"): Promise<DnsAnswer[]> {
  try {
    const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`, {
      headers: { accept: "application/dns-json" },
    });
    const j = await r.json();
    return (j.Answer ?? []) as DnsAnswer[];
  } catch {
    return [];
  }
}

function CopyBtn({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setDone(true);
        toast.success("Copiado");
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

function DnsCheck({ host, expected }: { host: string; expected: string }) {
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["dns", host],
    queryFn: async () => {
      const [a, c] = await Promise.all([resolveDns(host, "A"), resolveDns(host, "CNAME")]);
      return { a, c };
    },
    staleTime: 60_000,
  });
  const records = [...(data?.a ?? []), ...(data?.c ?? [])].map((r) => r.data.replace(/\.$/, ""));
  const matches = records.some((r) => r === expected || r === `${expected}.` || r.endsWith(LOVABLE_HOST));
  const status = !data ? "checando" : records.length === 0 ? "sem registro" : matches ? "ok" : "incorreto";
  const color =
    status === "ok" ? "bg-emerald-600" : status === "checando" ? "bg-zinc-400" : status === "sem registro" ? "bg-amber-500" : "bg-rose-600";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-muted-foreground">
        {status === "ok" ? "DNS propagado" : status === "sem registro" ? "DNS ausente" : status === "incorreto" ? `aponta para ${records[0]}` : "verificando…"}
      </span>
      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => refetch()} disabled={isFetching}>
        <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}

function DominiosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["core-dominios"],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("id, name, subdomain, domain, environment, is_active")
        .eq("is_active", true)
        .eq("is_master", false)
        .neq("environment", "demo")
        .order("name");
      return data ?? [];
    },
  });

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Carregando tenants…</div>;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <header>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          Domínios dos Tenants
        </h1>
        <p className="text-sm text-muted-foreground">
          Registros DNS por tenant + checagem de propagação em tempo real (Cloudflare DNS-over-HTTPS).
        </p>
      </header>

      <Card className="p-4 bg-muted/30">
        <div className="text-sm font-medium mb-2">Registros padrão Lovable</div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <div className="text-muted-foreground">Sem proxy (A record)</div>
            <code className="block bg-background p-2 rounded">A → {LOVABLE_IP}</code>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Com Cloudflare proxy (CNAME)</div>
            <code className="block bg-background p-2 rounded">CNAME → {LOVABLE_HOST}</code>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {(data ?? []).map((t) => {
          const hosts: { label: string; host: string; expected: string }[] = [];
          if (t.domain) hosts.push({ label: "Domínio customizado", host: t.domain, expected: LOVABLE_IP });
          if (t.subdomain) hosts.push({ label: "Subdomínio impulsionando", host: `${t.subdomain}.impulsionando.com.br`, expected: LOVABLE_IP });
          if (hosts.length === 0) hosts.push({ label: "Sem domínio configurado", host: "", expected: "" });
          return (
            <Card key={t.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.name}</div>
                  <Badge variant="outline" className="text-xs">{t.environment}</Badge>
                </div>
              </div>
              {hosts.map((h) =>
                h.host ? (
                  <div key={h.host} className="border-t pt-3 space-y-2">
                    <div className="text-xs text-muted-foreground">{h.label}</div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded flex-1">{h.host}</code>
                      <CopyBtn value={h.host} />
                    </div>
                    <DnsCheck host={h.host} expected={h.expected} />
                  </div>
                ) : (
                  <div key="empty" className="text-xs text-amber-600 border-t pt-3">
                    Configure `subdomain` ou `domain` em /core/cliente/{t.id}
                  </div>
                ),
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
