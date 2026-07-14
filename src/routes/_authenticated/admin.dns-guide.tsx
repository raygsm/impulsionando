/**
 * /admin/dns-guide — Guia visual para configurar o DNS wildcard
 * *.impulsionando.com.br apontando para a infraestrutura independente, com exemplos
 * por provedor e troubleshooting de 404.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  ShieldCheck, Copy, ExternalLink, AlertTriangle, CheckCircle2, Globe, Server,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/dns-guide")({
  head: () => ({
    meta: [
      { title: "Guia DNS Wildcard · Admin Impulsionando" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DnsGuidePage,
});

const APEX_A_TARGET = import.meta.env.VITE_DNS_A_TARGET ?? "IP_DA_INFRA_INDEPENDENTE";
const WILDCARD_HOST = "*.impulsionando.com.br";
const INDEPENDENT_PROXY_TARGET = import.meta.env.VITE_DNS_CNAME_TARGET ?? "impulsionando.com.br";

function CopyBtn({ value, label }: { value: string; label?: string }) {
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label ?? "Copiado"}: ${value}`); }}
      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      type="button"
    >
      <Copy className="w-3 h-3" /> copiar
    </button>
  );
}

function DnsRow({ type, name, value, ttl = "3600" }: { type: string; name: string; value: string; ttl?: string }) {
  return (
    <tr className="border-b last:border-b-0">
      <td className="py-2 pr-3"><Badge variant="outline">{type}</Badge></td>
      <td className="py-2 pr-3 font-mono text-xs">{name} <CopyBtn value={name} label="Name" /></td>
      <td className="py-2 pr-3 font-mono text-xs">{value} <CopyBtn value={value} label="Value" /></td>
      <td className="py-2 pr-3 text-xs text-muted-foreground">{ttl}</td>
    </tr>
  );
}

function DnsGuidePage() {
  const [host, setHost] = useState("impulsity.impulsionando.com.br");

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <ShieldCheck className="h-4 w-4 text-primary" /> Admin · Infra
        </div>
        <h1 className="text-3xl font-bold">Guia DNS wildcard para tenants</h1>
        <p className="text-muted-foreground mt-1.5 max-w-2xl">
          Configure <code>*.impulsionando.com.br</code> uma única vez para que qualquer novo tenant
          (ex.: <code>chrismed.impulsionando.com.br</code>, <code>dqa.impulsionando.com.br</code>) funcione automaticamente.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/tenants-editor">← Editor de tenants</Link>
          </Button>
        </div>
      </div>

      {/* Registros essenciais */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Server className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Registros DNS que você precisa criar</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Adicione estes registros no provedor DNS de <code>impulsionando.com.br</code>. Basta configurar uma vez —
          novos tenants passam a resolver automaticamente.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b">
              <tr><th className="py-2 pr-3 text-left">Tipo</th><th className="py-2 pr-3 text-left">Nome</th><th className="py-2 pr-3 text-left">Valor</th><th className="py-2 pr-3 text-left">TTL</th></tr>
            </thead>
            <tbody>
              <DnsRow type="A" name="*" value={APEX_A_TARGET} />
              <DnsRow type="TXT" name="_site_verification" value="impulsionando_verify=<código do painel>" />
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-xs text-muted-foreground bg-muted/40 rounded p-3">
          <strong>Importante:</strong> o campo <em>Nome</em> aceita <code>*</code> (asterisco) na maioria dos provedores — isso cria um
          registro wildcard que responde por <em>qualquer</em> subdomínio. Se seu provedor exigir o formato completo, use{" "}
          <code>*.impulsionando.com.br</code>.
        </div>
      </Card>

      {/* Provedores */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Passo a passo por provedor</h2>
        </div>

        <Tabs defaultValue="registrobr">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="registrobr">Registro.br</TabsTrigger>
            <TabsTrigger value="cloudflare">Cloudflare</TabsTrigger>
            <TabsTrigger value="godaddy">GoDaddy</TabsTrigger>
            <TabsTrigger value="hostgator">HostGator / cPanel</TabsTrigger>
            <TabsTrigger value="route53">AWS Route 53</TabsTrigger>
          </TabsList>

          <TabsContent value="registrobr" className="mt-4 space-y-3 text-sm">
            <ol className="list-decimal ml-5 space-y-1.5">
              <li>Acesse <a className="text-primary hover:underline" href="https://registro.br/" target="_blank" rel="noopener">registro.br</a> → login → domínio <code>impulsionando.com.br</code>.</li>
              <li>Vá em <strong>DNS &gt; Editar zona</strong>.</li>
              <li>Adicione registro: Tipo <code>A</code>, Nome <code>*</code>, Dados <code>{APEX_A_TARGET}</code>.</li>
              <li>Adicione registro: Tipo <code>TXT</code>, Nome <code>_site_verification</code>, Dados <code>impulsionando_verify=&lt;seu código&gt;</code>.</li>
              <li>Salvar e aguardar propagação (5–30 min normalmente, até 72h no pior caso).</li>
            </ol>
          </TabsContent>

          <TabsContent value="cloudflare" className="mt-4 space-y-3 text-sm">
            <ol className="list-decimal ml-5 space-y-1.5">
              <li>Cloudflare Dashboard → domínio <code>impulsionando.com.br</code> → <strong>DNS &gt; Records</strong>.</li>
              <li><strong>Add record</strong>: Type <code>A</code>, Name <code>*</code>, IPv4 <code>{APEX_A_TARGET}</code>.</li>
              <li>
                Proxy status: <Badge variant="outline">DNS only</Badge> (nuvem cinza) —{" "}
                <strong>não</strong> ative proxy laranja no wildcard, pois a infraestrutura independente emite o TLS.
                Se precisar do proxy, use CNAME apontando para <code>{INDEPENDENT_PROXY_TARGET}</code> e marque
                <em> "Domain uses Cloudflare or a similar proxy" </em> ao conectar no painel infraestrutura independente.
              </li>
              <li>Adicione TXT <code>_site_verification</code> = <code>impulsionando_verify=&lt;código&gt;</code>.</li>
            </ol>
          </TabsContent>

          <TabsContent value="godaddy" className="mt-4 space-y-3 text-sm">
            <ol className="list-decimal ml-5 space-y-1.5">
              <li>Meus produtos → <strong>DNS</strong> ao lado do domínio.</li>
              <li>Adicionar → Tipo <code>A</code> → Host <code>*</code> → Aponta para <code>{APEX_A_TARGET}</code> → TTL 1 hora.</li>
              <li>Adicionar → Tipo <code>TXT</code> → Host <code>_site_verification</code> → Valor <code>impulsionando_verify=&lt;código&gt;</code>.</li>
            </ol>
          </TabsContent>

          <TabsContent value="hostgator" className="mt-4 space-y-3 text-sm">
            <ol className="list-decimal ml-5 space-y-1.5">
              <li>cPanel → <strong>Zone Editor</strong> → Manage no domínio.</li>
              <li>+ A Record → Name <code>*.impulsionando.com.br</code> → Address <code>{APEX_A_TARGET}</code>.</li>
              <li>+ TXT Record → Name <code>_site_verification.impulsionando.com.br</code> → Record <code>impulsionando_verify=&lt;código&gt;</code>.</li>
            </ol>
          </TabsContent>

          <TabsContent value="route53" className="mt-4 space-y-3 text-sm">
            <ol className="list-decimal ml-5 space-y-1.5">
              <li>Route 53 → Hosted zones → <code>impulsionando.com.br</code>.</li>
              <li><strong>Create record</strong> → Record name <code>*</code> → Type <code>A</code> → Value <code>{APEX_A_TARGET}</code> → TTL 300.</li>
              <li>Create record → Name <code>_site_verification</code> → Type <code>TXT</code> → Value <code>"impulsionando_verify=&lt;código&gt;"</code>.</li>
            </ol>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Verificação */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <h2 className="text-xl font-semibold">Verificar propagação DNS</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 text-sm">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Host para testar</div>
            <input
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className="w-full h-9 rounded-md border bg-background px-3 text-sm"
              placeholder="tenant.impulsionando.com.br"
            />
          </div>
          <div className="flex items-end gap-2 flex-wrap">
            <Button asChild variant="outline" size="sm">
              <a href={`https://dnschecker.org/#A/${host}`} target="_blank" rel="noopener">
                DNSChecker.org <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`https://www.whatsmydns.net/#A/${host}`} target="_blank" rel="noopener">
                WhatsMyDNS <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`https://${host}`} target="_blank" rel="noopener">
                Abrir subdomínio <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Você deve ver o valor <code>{APEX_A_TARGET}</code> aparecendo na maioria dos servidores. Se aparecer outro IP,
          existe um registro conflitante — remova-o.
        </p>
      </Card>

      {/* Troubleshooting */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-semibold">Continua 404 — o que fazer</h2>
        </div>
        <div className="space-y-4 text-sm">
          <Issue
            title="1. O DNS já resolve, mas retorna 404 da infraestrutura independente"
            body="Isso é o mais comum. O DNS está OK, mas o wildcard *.impulsionando.com.br não foi adicionado no Publish → Custom Domain do projeto na infraestrutura independente. Adicione o domínio wildcard lá; a plataforma vai emitir o TLS e passar a rotear."
          />
          <Issue
            title="2. Erro de certificado (NET::ERR_CERT_COMMON_NAME_INVALID)"
            body="O DNS resolve, mas o TLS wildcard ainda não foi provisionado. Aguarde a emissão (Let's Encrypt, alguns minutos) ou verifique se existe um registro CAA bloqueando Let's Encrypt."
          />
          <Issue
            title="3. DNS não resolve (NXDOMAIN, servidor não encontrado)"
            body={`O wildcard não está criado ou não propagou. Confirme no DNSChecker que * (ou o host de teste) retorna ${APEX_A_TARGET}. Cuidado com registros CNAME conflitantes no mesmo nome.`}
          />
          <Issue
            title="4. Resolve para outro IP (ex.: 76.76.x.x)"
            body="Existe um registro específico sobrescrevendo o wildcard (ex.: um A record explícito para 'chrismed'). Remova o registro específico ou aponte-o também para IP_DA_INFRA_INDEPENDENTE."
          />
          <Issue
            title="5. Cloudflare com proxy laranja ativo no wildcard"
            body="Sem o modo proxy configurado no painel infraestrutura independente, o Cloudflare intercepta o TLS e quebra a validação. Ou desligue o proxy no wildcard (nuvem cinza) ou marque 'Domain uses Cloudflare or a similar proxy' ao conectar."
          />
          <Issue
            title="6. Página abre mas mostra outro tenant / vitrine errada"
            body="O wildcard funciona, mas o tenant não está com public_slug batendo o subdomínio. Ajuste no /admin/tenants-editor: public_slug = 'chrismed' faz chrismed.impulsionando.com.br redirecionar para /vitrine/chrismed."
          />
        </div>
      </Card>
    </div>
  );
}

function Issue({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border p-3 bg-muted/20">
      <div className="font-medium mb-1">{title}</div>
      <p className="text-muted-foreground text-xs leading-relaxed">{body}</p>
    </div>
  );
}
