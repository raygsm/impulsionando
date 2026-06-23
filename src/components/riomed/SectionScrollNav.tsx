/**
 * @deprecated Use `@/components/core/ScrollSpyNav` directly.
 * Backward-compat shim with Rio Med's section defaults.
 */
import { ScrollSpyNav, type ScrollSpySection } from "@/components/core/ScrollSpyNav";

const DEFAULTS: ScrollSpySection[] = [
  { id: "publicos", label: "Públicos" },
  { id: "lineas", label: "Líneas" },
  { id: "productos", label: "Productos" },
];

export function SectionScrollNav({
  sections = DEFAULTS,
}: {
  sections?: ScrollSpySection[];
}) {
  return <ScrollSpyNav sections={sections} activeColorVar="--riomed-primary" />;
}
