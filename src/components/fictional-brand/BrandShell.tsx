import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useBrand } from "./BrandThemeProvider";

type NavKey = "index" | "sobre" | "catalogo" | "contato" | "admin";
const NAV: { key: NavKey; label: string }[] = [
  { key: "index", label: "Início" },
  { key: "sobre", label: "Sobre" },
  { key: "catalogo", label: "Catálogo" },
  { key: "contato", label: "Contato" },
  { key: "admin", label: "Painel" },
];

function BrandLink({
  target,
  slug,
  className,
  style,
  onClick,
  children,
  ariaLabel,
}: {
  target: NavKey;
  slug: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const params = { brand: slug };
  const shared = { params, className, style, onClick, "aria-label": ariaLabel } as const;
  if (target === "index") return <Link to="/templates/$brand" {...shared}>{children}</Link>;
  if (target === "sobre") return <Link to="/templates/$brand/sobre" {...shared}>{children}</Link>;
  if (target === "catalogo") return <Link to="/templates/$brand/catalogo" {...shared}>{children}</Link>;
  if (target === "contato") return <Link to="/templates/$brand/contato" {...shared}>{children}</Link>;
  return <Link to="/templates/$brand/admin" {...shared}>{children}</Link>;
}

export function BrandShell({ children, active }: { children: ReactNode; active: NavKey }) {
  const brand = useBrand();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ background: brand.palette.surface, color: brand.palette.ink }}>
      <div
        className="text-[11px] px-4 py-1.5 text-center"
        style={{ background: brand.palette.ink, color: brand.palette.primaryFg }}
      >
        Você está numa demonstração fictícia da Impulsionando ·{" "}
        <Link to="/onboarding-site" className="underline underline-offset-2 font-semibold">
          Quero um site assim para minha empresa
        </Link>
      </div>

      <header
        className="sticky top-0 z-40 backdrop-blur"
        style={{ background: `${brand.palette.surface}ee`, borderBottom: `1px solid ${brand.palette.ink}14` }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center gap-6 h-16">
          <BrandLink target="index" slug={brand.slug} className="flex items-center gap-2.5" ariaLabel={brand.companyName}>
            <span
              className="grid h-9 w-9 place-items-center rounded-lg"
              style={{ background: brand.palette.primary, color: brand.palette.primaryFg }}
              dangerouslySetInnerHTML={{ __html: brand.logo.mark }}
            />
            <span
              className="text-lg font-bold tracking-tight"
              style={{ fontFamily: brand.typography.heading, color: brand.palette.ink }}
            >
              {brand.logo.wordmark}
            </span>
          </BrandLink>

          <nav className="hidden md:flex items-center gap-1 ml-auto text-sm">
            {NAV.map((item) => {
              const isActive = item.key === active;
              return (
                <BrandLink
                  key={item.key}
                  target={item.key}
                  slug={brand.slug}
                  className="px-3 py-2 rounded-md font-medium transition"
                  style={{
                    color: isActive ? brand.palette.primary : brand.palette.ink,
                    background: isActive ? `${brand.palette.primary}12` : "transparent",
                  }}
                >
                  {item.label}
                </BrandLink>
              );
            })}
          </nav>

          <div className="ml-auto md:ml-0 hidden md:block">
            <BrandLink
              target="contato"
              slug={brand.slug}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold"
              style={{ background: brand.palette.primary, color: brand.palette.primaryFg }}
            >
              Fale conosco
            </BrandLink>
          </div>

          <button
            className="md:hidden ml-auto rounded-md p-2"
            style={{ color: brand.palette.ink }}
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t px-4 py-3 space-y-1" style={{ borderColor: `${brand.palette.ink}14` }}>
            {NAV.map((item) => (
              <BrandLink
                key={item.key}
                target={item.key}
                slug={brand.slug}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium"
                style={{ color: brand.palette.ink }}
              >
                {item.label}
              </BrandLink>
            ))}
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="mt-16" style={{ background: brand.palette.ink, color: brand.palette.primaryFg }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span
                className="grid h-9 w-9 place-items-center rounded-lg"
                style={{ background: brand.palette.primary, color: brand.palette.primaryFg }}
                dangerouslySetInnerHTML={{ __html: brand.logo.mark }}
              />
              <span className="text-lg font-bold" style={{ fontFamily: brand.typography.heading }}>
                {brand.companyName}
              </span>
            </div>
            <p className="mt-3 text-sm opacity-80 max-w-sm">{brand.tagline}</p>
            <p className="mt-4 text-xs opacity-60">{brand.domainFake}</p>
          </div>
          <div className="text-sm">
            <div className="font-semibold mb-2" style={{ color: brand.palette.accent }}>Contato</div>
            <p className="opacity-80">{brand.contact.phone}</p>
            <p className="opacity-80">{brand.contact.email}</p>
            <p className="opacity-80 mt-2">{brand.contact.address}</p>
          </div>
          <div className="text-sm">
            <div className="font-semibold mb-2" style={{ color: brand.palette.accent }}>Navegação</div>
            <ul className="space-y-1 opacity-80">
              {NAV.map((n) => (
                <li key={n.key}>
                  <BrandLink target={n.key} slug={brand.slug} className="hover:underline">
                    {n.label}
                  </BrandLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div
          className="border-t py-4 text-center text-xs opacity-60"
          style={{ borderColor: `${brand.palette.primaryFg}20` }}
        >
          © {new Date().getFullYear()} {brand.companyName} · Empresa fictícia · Demonstração{" "}
          <Link to="/" className="underline">Impulsionando</Link>
        </div>
      </footer>
    </div>
  );
}
