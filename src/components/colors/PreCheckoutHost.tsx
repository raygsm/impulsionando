/**
 * PreCheckoutHost — monte uma vez por página. Escuta o evento global
 * disparado por `openColorsPreCheckout(...)` e abre o modal.
 */
import { useEffect, useState } from "react";
import PreCheckoutModal, { type PreCheckoutProduct } from "./PreCheckoutModal";
import { COLORS_PRECHECKOUT_EVENT, type OpenPreCheckoutDetail } from "@/lib/colors-precheckout-bus";

export default function PreCheckoutHost() {
  const [state, setState] = useState<{ open: boolean; product?: PreCheckoutProduct; origin?: string }>({ open: false });

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<OpenPreCheckoutDetail>).detail;
      if (!detail?.product) return;
      setState({ open: true, product: detail.product, origin: detail.origin });
    };
    window.addEventListener(COLORS_PRECHECKOUT_EVENT, onOpen);
    return () => window.removeEventListener(COLORS_PRECHECKOUT_EVENT, onOpen);
  }, []);

  if (!state.open || !state.product) return null;
  return (
    <PreCheckoutModal
      open={state.open}
      onClose={() => setState({ open: false })}
      product={state.product}
      origin={state.origin}
    />
  );
}
