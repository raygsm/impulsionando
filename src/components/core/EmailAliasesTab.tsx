import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listEmailAliases, upsertEmailAlias, deleteEmailAlias } from "@/lib/tenant-email-aliases.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save, AtSign, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const PURPOSES = [
  { value: "contato", label: "Contato" },
  { value: "financeiro", label: "Financeiro" },
  { value: "suporte", label: "Suporte" },
  { value: "comercial", label: "Comercial" },
  { value: "no-reply", label: "No-reply" },
  { value: "custom", label: "Personalizado" },
];

const SUGGESTED = [
  { alias: "contato", purpose: "contato" },
  { alias: "financeiro", purpose: "financeiro" },
  { alias: "suporte", purpose: "suporte" },
  { alias: "comercial", purpose: "comercial" },
  { alias: "no-reply", purpose: "no-reply" },
];

export function EmailAliasesTab({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listEmailAliases);
  const upsertFn = useServerFn(upsertEmailAlias);
  const deleteFn = useServerFn(deleteEmailAlias);

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-email-aliases", companyId],
    queryFn: () => listFn({ data: { companyId } }),
  });

  const [draft, setDraft] = useState<{ alias: string; purpose: string; forward_to: string; is_default: boolean }>({
    alias: "",
    purpose: "contato",
    forward_to: "",
    is_default: false,
  });

  const upsert = useMutation({
    mutationFn: (vars: Parameters<typeof upsertFn>[0]["data"]) => upsertFn({ data: vars }),
    onSuccess: () => {
      toast.success("E-mail do time salvo.");
      qc.invalidateQueries({ queryKey: ["tenant-email-aliases", companyId] });
      setDraft({ alias: "", purpose: "contato", forward_to: "", is_default: false });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Removido.");
      qc.invalidateQueries({ queryKey: ["tenant-email-aliases", companyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const identity = data?.identity;
  const aliases = data?.aliases ?? [];
  const domain = identity?.custom_domain || identity?.full_domain;
  const dnsOk = identity?.dns_status === "active";
  const existingAliasSet = new Set(aliases.map((a) => a.alias));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><AtSign className="h-5 w-5" /> E-mails do time</CardTitle>
        <div className="text-sm text-muted-foreground">
          Aliases em <span className="font-mono">{domain ?? "—"}</span>
          {identity && (
            dnsOk
              ? <Badge variant="default" className="ml-2"><ShieldCheck className="h-3 w-3 mr-1" /> DNS ativo</Badge>
              : <Badge variant="outline" className="ml-2"><ShieldAlert className="h-3 w-3 mr-1" /> DNS {identity.dns_status}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="text-muted-foreground py-6 text-center">Carregando…</div>
        ) : !identity ? (
          <div className="text-muted-foreground py-6 text-center">Provisione o subdomínio do tenant primeiro em <a className="underline" href="/onboarding">/onboarding</a>.</div>
        ) : (
          <>
            {SUGGESTED.filter((s) => !existingAliasSet.has(s.alias)).length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground self-center">Sugestões:</span>
                {SUGGESTED.filter((s) => !existingAliasSet.has(s.alias)).map((s) => (
                  <Button
                    key={s.alias}
                    size="sm"
                    variant="outline"
                    onClick={() => upsert.mutate({ companyId, alias: s.alias, purpose: s.purpose as never, is_active: true, is_default: aliases.length === 0 && s.alias === "contato" })}
                  >
                    <Plus className="h-3 w-3 mr-1" /> {s.alias}@
                  </Button>
                ))}
              </div>
            )}

            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="p-2">Endereço</th>
                    <th className="p-2">Finalidade</th>
                    <th className="p-2">Encaminhar para</th>
                    <th className="p-2">DNS</th>
                    <th className="p-2">Ativo</th>
                    <th className="p-2">Padrão</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {aliases.length === 0 ? (
                    <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Nenhum alias ainda. Use as sugestões acima ou crie um.</td></tr>
                  ) : aliases.map((a) => (
                    <tr key={a.id} className="border-b">
                      <td className="p-2 font-mono">{a.full_address}</td>
                      <td className="p-2"><Badge variant="secondary">{a.purpose}</Badge></td>
                      <td className="p-2 text-xs text-muted-foreground">{a.forward_to ?? "—"}</td>
                      <td className="p-2"><Badge variant={a.dns_status === "active" ? "default" : "outline"}>{a.dns_status}</Badge></td>
                      <td className="p-2">
                        <Switch
                          checked={a.is_active}
                          onCheckedChange={(v) => upsert.mutate({ companyId, id: a.id, alias: a.alias, purpose: a.purpose as never, forward_to: a.forward_to, is_active: v, is_default: a.is_default })}
                        />
                      </td>
                      <td className="p-2">
                        <Switch
                          checked={a.is_default}
                          onCheckedChange={(v) => upsert.mutate({ companyId, id: a.id, alias: a.alias, purpose: a.purpose as never, forward_to: a.forward_to, is_active: a.is_active, is_default: v })}
                        />
                      </td>
                      <td className="p-2 text-right">
                        <Button size="sm" variant="ghost" onClick={() => remove.mutate(a.id)} disabled={remove.isPending}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-md border p-4 space-y-3">
              <div className="font-medium">Novo alias</div>
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_2fr_auto] gap-3 items-end">
                <div>
                  <Label className="text-xs">Alias</Label>
                  <div className="flex">
                    <Input value={draft.alias} onChange={(e) => setDraft({ ...draft, alias: e.target.value.toLowerCase() })} placeholder="contato" />
                    <span className="inline-flex items-center px-2 text-xs text-muted-foreground bg-muted border border-l-0 rounded-r-md">@{domain}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Finalidade</Label>
                  <Select value={draft.purpose} onValueChange={(v) => setDraft({ ...draft, purpose: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PURPOSES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Encaminhar para (opcional)</Label>
                  <Input type="email" value={draft.forward_to} onChange={(e) => setDraft({ ...draft, forward_to: e.target.value })} placeholder="time@empresa.com" />
                </div>
                <Button
                  onClick={() => upsert.mutate({
                    companyId,
                    alias: draft.alias,
                    purpose: draft.purpose as never,
                    forward_to: draft.forward_to || null,
                    is_active: true,
                    is_default: draft.is_default,
                  })}
                  disabled={!draft.alias || upsert.isPending}
                >
                  <Save className="h-4 w-4 mr-2" /> Adicionar
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
