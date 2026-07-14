import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

type Target = "index" | "sobre" | "catalogo" | "contato" | "admin";

export function BrandLinkTo({
  target,
  slug,
  className,
  style,
  onClick,
  children,
}: {
  target: Target;
  slug: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  children: ReactNode;
}) {
  const params = { brand: slug };
  const shared = { params, className, style, onClick } as const;
  if (target === "index") return <Link to="/templates/$brand" {...shared}>{children}</Link>;
  if (target === "sobre") return <Link to="/templates/$brand/sobre" {...shared}>{children}</Link>;
  if (target === "catalogo") return <Link to="/templates/$brand/catalogo" {...shared}>{children}</Link>;
  if (target === "contato") return <Link to="/templates/$brand/contato" {...shared}>{children}</Link>;
  return <Link to="/templates/$brand/admin" {...shared}>{children}</Link>;
}
