/**
 * DemoVoucher — exibe o voucher emitido pela pesquisa, com copy-to-clipboard.
 * DemoJourney — visualização da jornada "QR → consumo → voucher → retorno".
 */
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Gift, QrCode, ShoppingBag, Heart, Repeat } from "lucide-react";
import { toast } from "sonner";

export type DemoVoucher = {
  code: string;
  name: string;
  rule: string;
  validity_label: string | null;
  audience: string | null;
  channel: string | null;
};

export function DemoVoucherCard({ voucher, maskedName }: { voucher: DemoVoucher; maskedName?: string }) {
  const copy = () => {
    navigator.clipboard
      ?.writeText(voucher.code)
      .then(() => toast.success(`Código ${voucher.code} copiado`))
      .catch(() => toast.error("Não foi possível copiar"));
  };
  return (
    <Card className="p-4 space-y-3 border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30">
      <div className="flex items-start gap-2">
        <Gift className="w-5 h-5 text-emerald-700 dark:text-emerald-300 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            {maskedName ? `Pronto, ${maskedName}!` : "Voucher liberado"}
          </p>
          <p className="text-xs text-emerald-900/80 dark:text-emerald-100/80">{voucher.name}</p>
        </div>
      </div>

      <div className="bg-background rounded-md border border-dashed border-emerald-300 dark:border-emerald-800 p-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Código</p>
          <p className="font-mono text-lg font-bold tracking-widest">{voucher.code}</p>
        </div>
        <Button size="sm" variant="outline" onClick={copy} className="gap-1">
          <Copy className="w-4 h-4" /> Copiar
        </Button>
      </div>

      <div className="text-xs space-y-1">
        <p><strong>Regra:</strong> {voucher.rule}</p>
        {voucher.validity_label && <p><strong>Validade:</strong> {voucher.validity_label}</p>}
        <div className="flex gap-1 flex-wrap pt-1">
          {voucher.audience && <Badge variant="secondary" className="text-[10px]">Público: {voucher.audience}</Badge>}
          {voucher.channel && <Badge variant="outline" className="text-[10px]">Canal: {voucher.channel}</Badge>}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground border-t pt-2">
        Em produção, esse voucher entra automaticamente no CRM e dispara um lembrete por WhatsApp
        próximo da data de validade.
      </p>
    </Card>
  );
}

const STEPS: Array<{ icon: typeof QrCode; title: string; desc: string }> = [
  { icon: QrCode, title: "QR escaneado", desc: "Visita anônima vira identificável no painel." },
  { icon: ShoppingBag, title: "Cardápio + pedido", desc: "Mix de produtos e ticket médio capturados em tempo real." },
  { icon: Heart, title: "Pesquisa rápida", desc: "Preferências e composição da mesa alimentam o CRM." },
  { icon: Gift, title: "Voucher emitido", desc: "Recompensa personalizada cria gatilho de retorno." },
  { icon: Repeat, title: "Cliente volta", desc: "Próxima visita o reconhece e sobe LTV do restaurante." },
];

export function DemoJourney({ activeIndex = 0 }: { activeIndex?: number }) {
  return (
    <Card className="p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold">Jornada de relacionamento</p>
        <p className="text-xs text-muted-foreground">
          Cada etapa abaixo já está medida no Core. O dono enxerga em qual ponto cada cliente está.
        </p>
      </div>
      <ol className="space-y-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i <= activeIndex;
          return (
            <li
              key={s.title}
              className={`flex items-start gap-3 rounded-md border p-2.5 ${
                done ? "border-primary/40 bg-primary/5" : "border-border bg-background"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-medium">{i + 1}. {s.title}</p>
                <p className="text-muted-foreground">{s.desc}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
