import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyBillingStatus } from "@/lib/billing.functions";
import { useActiveCompany } from "@/hooks/use-active-company";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldAlert, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/conta-suspensa")({
  head: () => ({ meta: [{ title: "Serviço temporariamente indisponível — Impulsionando" }] }),
  component: SuspendedPage,
});

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function SuspendedPage() {
  const { companyId } = useActiveCompany();
  const fn = useServerFn(getMyBillingStatus);
  const { data } = useQuery({
    queryKey: ["my-billing-status", companyId],
    enabled: !!companyId,
    queryFn: () => fn({ data: { companyId } }),
  });

  const inv = (data && "openInvoice" in data ? data.openInvoice : null) ?? null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="max-w-xl w-full p-8 shadow-elegant">
        <div className="flex items-center gap-3 mb-4 text-amber-600">
          <ShieldAlert className="w-8 h-8" />
          <h1 className="text-xl font-semibold">Serviço temporariamente indisponível</h1>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Identificamos uma pendência financeira na sua assinatura. O acesso administrativo foi
          temporariamente suspenso conforme a política contratual. Após a confirmação do pagamento,
          a reativação é <strong>automática</strong>.
        </p>

        {inv && (
          <div className="rounded-md border bg-card p-4 space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor</span>
              <strong>{fmt(Number(inv.amount))}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vencimento</span>
              <strong>{new Date(inv.due_date).toLocaleDateString("pt-BR")}</strong>
            </div>
            {inv.pix_key && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground">Chave PIX</span>
                <code className="text-xs">{inv.pix_key}</code>
              </div>
            )}
            {inv.pix_copy_paste && (
              <div className="pt-2">
                <div className="text-xs text-muted-foreground mb-1">PIX copia e cola</div>
                <div className="bg-muted p-2 rounded text-[10px] break-all font-mono">
                  {inv.pix_copy_paste}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    navigator.clipboard.writeText(inv.pix_copy_paste ?? "");
                    toast.success("Código PIX copiado");
                  }}
                >
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copiar PIX
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-50 p-3 rounded-md mb-4">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>
            Já efetuou o pagamento? A baixa é automática assim que o PIX é confirmado.
            Caso o acesso não retorne em até 10 minutos, fale com a Impulsionando.
          </span>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link to="/auth">Sair da conta</Link>
          </Button>
          <Button asChild className="flex-1">
            <a
              href="https://wa.me/5521993075000?text=Olá%2C%20preciso%20de%20suporte%20financeiro"
              target="_blank"
              rel="noreferrer"
            >
              Falar com a Impulsionando <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          </Button>
        </div>
      </Card>
    </div>
  );
}
