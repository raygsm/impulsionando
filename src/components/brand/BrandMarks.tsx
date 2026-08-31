import { cn } from "@/lib/utils";
import { BRAND_ASSETS } from "@/lib/brand-assets";

export function ColorsMark({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <img
      src={BRAND_ASSETS.colors.mark}
      alt={BRAND_ASSETS.colors.alt}
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full object-cover ring-1 ring-white/20", className)}
      draggable={false}
    />
  );
}

export function WmpMark({
  className,
  plate = false,
}: {
  className?: string;
  plate?: boolean;
}) {
  const img = (
    <img
      src={BRAND_ASSETS.wmp.lockup}
      alt={BRAND_ASSETS.wmp.alt}
      width={160}
      height={160}
      className={cn("h-11 w-auto max-h-12 object-contain object-left", !plate && className)}
      draggable={false}
    />
  );
  if (!plate) return img;
  return (
    <span className={cn("inline-flex items-center rounded-md bg-white px-1.5 py-0.5 shadow-sm", className)}>
      {img}
    </span>
  );
}

export function RiomedMark({
  variant = "light",
  className,
}: {
  variant?: "light" | "inverse";
  className?: string;
}) {
  const src = variant === "inverse" ? BRAND_ASSETS.riomed.inverse : BRAND_ASSETS.riomed.light;
  return (
    <img
      src={src}
      alt={BRAND_ASSETS.riomed.alt}
      width={220}
      height={64}
      className={cn("h-11 w-auto object-contain object-left", className)}
      draggable={false}
    />
  );
}

export function MarocasMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <img
      src={BRAND_ASSETS.marocas.mark}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      aria-hidden
      draggable={false}
    />
  );
}

export function MarocasLogo({ className, plate = false }: { className?: string; plate?: boolean }) {
  return (
    <span className={cn("inline-flex items-center", plate && "rounded-xl bg-white px-2.5 py-1.5 shadow-sm ring-1 ring-black/5")}>
      <img
        src={BRAND_ASSETS.marocas.lockup}
        alt={BRAND_ASSETS.marocas.alt}
        width={270}
        height={100}
        className={cn("h-10 w-auto object-contain object-left sm:h-11", className)}
        draggable={false}
      />
    </span>
  );
}
