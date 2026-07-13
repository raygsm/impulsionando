import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  checkDomainAvailability,
  listCompanyDomains,
  registerDomain,
} from "@/lib/hostinger.functions";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Globe, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/core/dominios/")({
  head: () => ({
    meta: [
      { title: "Domínios · Impulsionando" },
      {
        name: "description",
        content:
          "Registre e gerencie os domínios da sua empresa direto pelo Impulsionando, com checkout transparente via Hostinger.",
      },
    ],
  }),
  component: DomainsPage,
});

function DomainsPage() {
  const { company } = useActiveCompany();
  const qc = useQueryClient();
  const [term, setTerm] = useState("");
  const [years, setYears] = useState(1);

  const check = useServerFn(checkDomainAvailability);
  const list = useServerFn(listCompanyDomains);
  const register = useServerFn(registerDomain);

  const domainsQuery = useQuery({
    queryKey: ["hostinger-domains", company?.id],
    queryFn: () => list({ data: { companyId: company!.id } }),
    enabled: !!company?.id,
  });

  const checkMut = useMutation({
    mutationFn: (domain: string) => check({ data: { domain } }),
  });

  const buyMut = useMutation({
    mutationFn: (domain: string) =>
      register({ data: { companyId: company!.id, domain, years } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Domínio registrado com sucesso.");
        qc.invalidateQueries({ queryKey: ["hostinger-domains", company?.id] });
      } else {
        toast.error(res.error ?? "Não foi possível registrar o domínio.");
      }
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro inesperado"),
  });

  if (!company) {
    return (
      <div className="p-6 text-muted-foreground">
        Selecione uma empresa para gerenciar domínios.
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <header className="flex items-center gap-3">
        <Globe className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Domínios da empresa</h1>
          <p className="text-sm text-muted-foreground">
            Checkout transparente via Hostinger — o domínio já é vinculado ao
            seu tenant Impulsionando.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Registrar novo domínio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="minhaempresa.com.br"
              value={term}
              onChange={(e) => setTerm(e.target.value.trim().toLowerCase())}
            />
            <Button
              onClick={() => checkMut.mutate(term)}
              disabled={!term || checkMut.isPending}
            >
              {checkMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Verificar
            </Button>
          </div>

          {checkMut.data && (
            <div className="rounded-md border p-4 text-sm space-y-3">
              {checkMut.data.ok ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{term}</span>
                    <Badge variant="secondary">
                      {(checkMut.data.data as any)?.available
                        ? "Disponível"
                        : "Indisponível"}
                    </Badge>
                  </div>
                  {(checkMut.data.data as any)?.available && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">Anos:</label>
                      <select
                        className="border rounded px-2 py-1 text-sm"
                        value={years}
                        onChange={(e) => setYears(Number(e.target.value))}
                      >
                        {[1, 2, 3, 5, 10].map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        onClick={() => buyMut.mutate(term)}
                        disabled={buyMut.isPending}
                      >
                        {buyMut.isPending && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Registrar agora
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-destructive">
                  {checkMut.data.error ?? "Falha ao consultar disponibilidade."}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Domínios já vinculados</CardTitle>
        </CardHeader>
        <CardContent>
          {domainsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (domainsQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum domínio registrado ainda.
            </p>
          ) : (
            <ul className="divide-y">
              {(domainsQuery.data as any[]).map((d) => (
                <li key={d.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{d.domain}</div>
                    <div className="text-xs text-muted-foreground">
                      Expira em{" "}
                      {d.expires_at
                        ? new Date(d.expires_at).toLocaleDateString("pt-BR")
                        : "—"}
                    </div>
                  </div>
                  <Badge variant={d.status === "active" ? "default" : "secondary"}>
                    {d.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
