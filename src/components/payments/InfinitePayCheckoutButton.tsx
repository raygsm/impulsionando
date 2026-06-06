import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { createInfinitePayCheckout } from "@/lib/infinitepay.functions";
import { toast } from "sonner";

export interface InfinitePayItem {
  quantity: number;
  /** Preço em centavos. R$ 497,00 = 49700 */
  price: number;
  description: string;
}

interface Props {
  customer: { name: string; email: string; phone_number: string };
  items: InfinitePayItem[];
  modulo_id?: string | null;
  plano_id?: string | null;
  empresa_id?: string | null;
  cliente_id?: string | null;
  /** Quando true, não chama a InfinitePay e marca pagamento como PAGO — DEMO. */
  demo?: boolean;
  label?: string;
  className?: string;
}

export function InfinitePayCheckoutButton(props: Props) {
  const create = useServerFn(createInfinitePayCheckout);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const r = await create({
        data: {
          environment: props.demo ? "demo" : "production",
          customer: props.customer,
          items: props.items,
          modulo_id: props.modulo_id ?? null,
          plano_id: props.plano_id ?? null,
          empresa_id: props.empresa_id ?? null,
          cliente_id: props.cliente_id ?? null,
        },
      });

      if (r.demo) {
        toast.success("PAGO — DEMO: pedido simulado registrado.");
        return;
      }

      toast.info("Você será direcionado para o checkout seguro da InfinitePay.");
      if (r.checkout_url) {
        window.location.href = r.checkout_url;
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar checkout. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} className={props.className}>
      {loading ? (
        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando checkout...</>
      ) : (
        <>{props.label ?? "Pagar com InfinitePay"}<ExternalLink className="w-4 h-4 ml-2" /></>
      )}
    </Button>
  );
}
