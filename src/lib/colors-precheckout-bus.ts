/**
 * Bus global para abrir o PreCheckoutModal Colors de qualquer lugar
 * (hero, sticky, offer cards, FAB). O host renderiza <PreCheckoutHost />
 * uma vez no topo da página; os botões só chamam openColorsPreCheckout(...).
 */
import type { PreCheckoutProduct } from "@/components/colors/PreCheckoutModal";

const EVT = "colors:open-precheckout";

export type OpenPreCheckoutDetail = {
  product: PreCheckoutProduct;
  origin?: string;
};

export function openColorsPreCheckout(detail: OpenPreCheckoutDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<OpenPreCheckoutDetail>(EVT, { detail }));
}

export const COLORS_PRECHECKOUT_EVENT = EVT;
