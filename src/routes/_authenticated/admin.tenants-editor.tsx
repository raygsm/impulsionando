/**
 * /admin/tenants-editor — Editor de tenants (companies) para preencher os
 * dados que alimentam a vitrine e o roteamento por subdomínio.
 *
 * Campos editáveis: public_slug, nome, segmento, cidade/UF, WhatsApp,
 * telefone, e-mail, website, logo, tagline, domain, vitrine_enabled.
 * Inclui checklist de diagnóstico de subdomínio (DNS + roteamento).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { listTenants, updateTenant, probeSubdomain, type TenantRow } from "@/lib/tenant-editor.functions";
import { getTenantSubdomain } from "@/lib/subdomain";
import {
  Search, Save, Loader2, ExternalLink, ShieldCheck, AlertTriangle, CheckCircle2, XCircle,
  Building2, BookOpen, Info,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/tenants-editor")({
  component: TenantsEditorPage,
});

function TenantsEditorPage() {
  const fetchList = useServerFn(listTenants);
  const q = useQuery({
    queryKey: ["admin", "tenants-editor", "list"],
    queryFn: () => fetchList({ data: undefined }),
  });

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const tenants = q.data?.tenants ?? [];
  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return tenants;
    return tenants.filter((c) =>
      [c.name, c.trade_name, c.public_slug, c.subdomain, c.segment, c.address_city]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t)),
    );
  }, [tenants, search]);

  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <ShieldCheck className="h-4 w-4 text-primary" /> Admin · Tenants
          </div>
          <h1 className="text-3xl font-bold">Editor de tenants da Vitrine</h1>
          <p className="text-muted-foreground mt-1.5">
            Preencha slug, contatos, endereço, logo e website. Alimenta a vitrine e o
            roteamento por subdomínio <code className="text-xs">&lt;slug&gt;.impulsionando.com.br</code>.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/vitrine">Vitrine (governança)</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Lista */}
        <Card className="p-3 h-fit lg:sticky lg:top-4">
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar tenant…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="max-h-[70vh] overflow-y-auto -mx-1 px-1">
            {q.isLoading && <p className="text-sm text-muted-foreground p-4">Carregando…</p>}
            {!q.isLoading && filtered.length === 0 && (
              <p className="text-sm text-muted-foreground p-4">Nenhum tenant.</p>
            )}
            <ul className="space-y-1">
              {filtered.map((t) => {
                const isSel = selected?.id === t.id;
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => setSelectedId(t.id)}
                      className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                        isSel ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{t.trade_name || t.name}</span>
                        {t.vitrine_enabled && (
                          <span className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {t.public_slug ?? "sem slug"} · {t.segment ?? "sem segmento"}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>

        {/* Editor */}
        <div>
          {selected ? (
            <TenantEditor key={selected.id} tenant={selected} />
          ) : (
            <Card className="p-12 text-center text-muted-foreground">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-50" />
              Selecione um tenant à esquerda.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function TenantEditor({ tenant }: { tenant: TenantRow }) {
  const qc = useQueryClient();
  const doUpdate = useServerFn(updateTenant);

  const [form, setForm] = useState({
    public_slug: tenant.public_slug ?? "",
    name: tenant.name,
    trade_name: tenant.trade_name ?? "",
    segment: tenant.segment ?? "",
    address_city: tenant.address_city ?? "",
    address_state: tenant.address_state ?? "",
    whatsapp: tenant.whatsapp ?? "",
    phone: tenant.phone ?? "",
    email: tenant.email ?? "",
    website: tenant.website ?? "",
    logo_url: tenant.logo_url ?? "",
    tagline: tenant.tagline ?? "",
    domain: tenant.domain ?? "",
    vitrine_enabled: tenant.vitrine_enabled,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async () =>
      doUpdate({
        data: {
          id: tenant.id,
          public_slug: form.public_slug || null,
          name: form.name,
          trade_name: form.trade_name || null,
          segment: form.segment || null,
          address_city: form.address_city || null,
          address_state: form.address_state ? form.address_state.toUpperCase() : null,
          whatsapp: form.whatsapp || null,
          phone: form.phone || null,
          email: form.email || null,
          website: form.website || null,
          logo_url: form.logo_url || null,
          tagline: form.tagline || null,
          domain: form.domain || null,
          vitrine_enabled: form.vitrine_enabled,
        },
      }),
    onSuccess: () => {
      toast.success("Tenant atualizado");
      qc.invalidateQueries({ queryKey: ["admin", "tenants-editor", "list"] });
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao salvar"),
  });

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted grid place-items-center">
            {form.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.logo_url} alt="logo" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <span className="text-lg font-bold text-muted-foreground">
                {(form.trade_name || form.name).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{form.trade_name || form.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{tenant.environment}</Badge>
              <Badge variant={tenant.status === "active" ? "default" : "secondary"}>{tenant.status}</Badge>
              {form.public_slug && (
                <Link
                  to="/vitrine/$slug"
                  params={{ slug: form.public_slug }}
                  target="_blank"
                  className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                >
                  /vitrine/{form.public_slug} <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Slug público" hint="a-z 0-9 e hífen. Ex.: chrismed">
          <Input value={form.public_slug} onChange={(e) => set("public_slug", e.target.value.toLowerCase())} placeholder="chrismed" />
        </Field>
        <Field label="Domínio/subdomínio" hint="Ex.: chrismed.impulsionando.com.br">
          <Input value={form.domain} onChange={(e) => set("domain", e.target.value)} placeholder="slug.impulsionando.com.br" />
        </Field>

        <Field label="Nome legal">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Nome fantasia">
          <Input value={form.trade_name} onChange={(e) => set("trade_name", e.target.value)} />
        </Field>

        <Field label="Segmento" hint="Ex.: saude, imobiliaria, eventos, hospedagem">
          <Input value={form.segment} onChange={(e) => set("segment", e.target.value)} />
        </Field>
        <div className="grid grid-cols-[1fr_100px] gap-3">
          <Field label="Cidade"><Input value={form.address_city} onChange={(e) => set("address_city", e.target.value)} /></Field>
          <Field label="UF"><Input maxLength={2} value={form.address_state} onChange={(e) => set("address_state", e.target.value.toUpperCase())} /></Field>
        </div>

        <Field label="WhatsApp" hint="Com DDI+DDD. Ex.: 5521999999999">
          <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="5521999999999" />
        </Field>
        <Field label="Telefone fixo">
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>

        <Field label="E-mail">
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="contato@empresa.com.br" />
        </Field>
        <Field label="Website" hint="https://…">
          <Input type="url" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://empresa.com.br" />
        </Field>

        <Field label="Logo (URL)" className="md:col-span-2" hint="URL absoluta https://… A vitrine mostra a inicial se ficar vazia.">
          <Input type="url" value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://…/logo.png" />
        </Field>

        <Field label="Tagline" className="md:col-span-2" hint="Uma linha curta que aparece no card.">
          <Textarea value={form.tagline} onChange={(e) => set("tagline", e.target.value)} rows={2} maxLength={240} />
        </Field>

        <div className="md:col-span-2 flex items-center justify-between rounded-lg border p-3">
          <div>
            <div className="font-medium">Publicado na vitrine</div>
            <div className="text-xs text-muted-foreground">Quando ligado e com slug preenchido, aparece em /vitrine.</div>
          </div>
          <Switch checked={form.vitrine_enabled} onCheckedChange={(v) => set("vitrine_enabled", v)} />
        </div>
      </div>

      <div className="mt-8">
        <SubdomainChecklist tenant={tenant} formDomain={form.domain} formSlug={form.public_slug} />
      </div>
    </Card>
  );
}

function Field({
  label, hint, className, children,
}: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function SubdomainChecklist({
  tenant, formDomain, formSlug,
}: { tenant: TenantRow; formDomain: string; formSlug: string }) {
  const expected = formSlug ? `${formSlug}.impulsionando.com.br` : null;
  const domainMatches = !!expected && formDomain.trim().toLowerCase() === expected;
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<{ ok: boolean; status: number | null; note: string } | null>(null);

  const parsed = expected ? getTenantSubdomain(expected) : null;

  async function probe() {
    if (!expected) return;
    setProbing(true);
    setProbeResult(null);
    try {
      const res = await fetch(`https://${expected}/vitrine/${formSlug}`, { method: "HEAD", mode: "no-cors" });
      // no-cors: type=opaque, status=0 → só sabemos se resolveu DNS+TLS
      setProbeResult({
        ok: true,
        status: res.status || null,
        note: "DNS resolvido e conexão TLS estabelecida. (Resposta opaca por CORS; use DevTools/Network para status real.)",
      });
    } catch (e) {
      setProbeResult({
        ok: false,
        status: null,
        note: `Falha: ${(e as Error).message}. Provável: DNS wildcard ausente, TLS não emitido ou host não conhecido pela plataforma.`,
      });
    } finally {
      setProbing(false);
    }
  }

  const items = [
    {
      ok: !!formSlug,
      label: "public_slug preenchido",
      hint: "Slug obrigatório para gerar URL e roteamento.",
    },
    {
      ok: domainMatches,
      label: `domain = ${expected ?? "<slug>.impulsionando.com.br"}`,
      hint: domainMatches ? "OK" : "Ajuste o campo Domínio acima e salve.",
    },
    {
      ok: !!tenant.vitrine_enabled,
      label: "vitrine_enabled = true",
      hint: "Deve estar ligado para aparecer publicamente.",
    },
    {
      ok: !!parsed,
      label: "Slug reconhecido pelo detector de subdomínio",
      hint: parsed ? `Detectado: ${parsed.slug}` : "Slug caiu na lista de reservados (www, app, admin…).",
    },
  ];

  return (
    <Card className="p-5 bg-muted/20">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <h3 className="font-semibold">Checklist de subdomínio</h3>
      </div>

      <ul className="space-y-2 text-sm">
        {items.map((i) => (
          <li key={i.label} className="flex items-start gap-2">
            {i.ok
              ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              : <XCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />}
            <div>
              <div className={i.ok ? "" : "font-medium"}>{i.label}</div>
              <div className="text-xs text-muted-foreground">{i.hint}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 pt-4 border-t space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Button size="sm" variant="outline" onClick={probe} disabled={!expected || probing}>
            {probing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5 mr-1.5" />}
            Testar {expected ?? "subdomínio"}
          </Button>
          {expected && (
            <a href={`https://${expected}`} target="_blank" rel="noopener" className="text-xs text-primary hover:underline">
              abrir em nova aba →
            </a>
          )}
        </div>
        {probeResult && (
          <div className={`text-xs p-2 rounded border ${probeResult.ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
            {probeResult.note}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground space-y-1">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <div className="font-medium text-foreground mb-1">Requisitos de infra (fora do app)</div>
            <ol className="list-decimal ml-4 space-y-0.5">
              <li>Registro <code>A</code> wildcard <code>*.impulsionando.com.br → 185.158.133.1</code> no DNS.</li>
              <li>Domínio wildcard adicionado no Publish/Custom Domain da Lovable para este projeto.</li>
              <li>Certificado TLS wildcard emitido (Lovable provisiona automaticamente após verificação).</li>
              <li>Este tenant com <code>public_slug</code>, <code>domain</code> e <code>vitrine_enabled</code> corretos (checklist acima).</li>
            </ol>
            <p className="mt-2">
              Com os 4 itens verdes, ao acessar <code>{expected ?? "<slug>.impulsionando.com.br"}</code> a app carrega e o
              redirecionador (RootComponent) leva para <code>/vitrine/{formSlug || "<slug>"}</code>.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
