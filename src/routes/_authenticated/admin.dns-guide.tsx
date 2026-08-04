import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Globe, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/dns-guide")({
  head: () => ({
    meta: [
      { title: "Guia DNS dinâmico · Admin Impulsionando" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DnsGuidePage,
});

function DnsGuidePage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" /> Admin · Infra
        </div>
        <h1 className="text-3xl font-bold">Domínios oficiais sem IP fixo</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          O endpoint do Lovable é dado operacional do provedor. Nunca replique um IP ou hostname
          visto em outro projeto.
        </p>
      </div>

      <Card className="mb-6 p-6">
        <div className="mb-3 flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Procedimento oficial</h2>
        </div>
        <ol className="ml-5 list-decimal space-y-3 text-sm">
          <li>
            No projeto Lovable correto, abra <strong>Project → Settings → Domains</strong>.
          </li>
          <li>Conecte o domínio ou subdomínio oficial exato do cliente.</li>
          <li>
            Se usar Cloudflare como proxy, habilite{" "}
            <strong>Domain uses Cloudflare or a similar proxy</strong>.
          </li>
          <li>Copie exatamente o A, CNAME e/ou TXT exibido pelo Lovable naquele momento.</li>
          <li>
            No provedor DNS autoritativo, substitua registros conflitantes e aguarde o status{" "}
            <Badge variant="outline">Live</Badge>.
          </li>
          <li>
            Use{" "}
            <Link className="text-primary underline" to="/core/dominios">
              Core → Domínios
            </Link>{" "}
            para descobrir o endpoint propagado e validar HTTPS.
          </li>
        </ol>
      </Card>

      <Card className="mb-6 p-6 text-sm">
        <h2 className="mb-3 text-xl font-semibold">Cloudflare e Hostinger</h2>
        <ul className="ml-5 list-disc space-y-2 text-muted-foreground">
          <li>
            Hostinger pode continuar como registrador ou DNS autoritativo; não deve recompilar uma
            segunda versão do frontend.
          </li>
          <li>
            Cloudflare pode operar como DNS/CDN. HTML e o contrato de versão não são armazenados;
            assets versionados podem usar cache.
          </li>
          <li>
            Quando o proxy estiver ativo, o DNS público pode mostrar IPs da Cloudflare. Isso é
            esperado e não identifica a origem.
          </li>
          <li>
            A verificação compara build ID, commit e fingerprint dos assets, não o IP público.
          </li>
        </ul>
      </Card>

      <Card className="p-6 text-sm">
        <h2 className="mb-3 text-xl font-semibold">Diagnóstico</h2>
        <ul className="ml-5 list-disc space-y-2 text-muted-foreground">
          <li>
            <strong>NXDOMAIN:</strong> o registro exigido pelo Lovable ainda não existe ou não
            propagou.
          </li>
          <li>
            <strong>SSL inválido:</strong> confirme que o domínio está Live no Lovable e que não
            existe registro conflitante.
          </li>
          <li>
            <strong>Versão divergente:</strong> o monitor limpa o cache quando o token Cloudflare
            está no Vault e repete a prova.
          </li>
          <li>
            <strong>Tenant incorreto:</strong> revise `domain`, `subdomain` e `public_slug` no
            cadastro, sem alterar o endpoint do provedor.
          </li>
        </ul>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <a
            href="https://docs.lovable.dev/features/custom-domain"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentação oficial do Lovable <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </Button>
      </Card>
    </div>
  );
}
