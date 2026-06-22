// Rodapé padrão Impulsionando.
// Uso: <SiteFooter tenantName="CHRISMED" slogan="Saúde com tecnologia" />
// O bloco "Produzido e Gerenciado por Impulsionando Tecnologia" também é
// renderizado globalmente em __root.tsx via <PoweredByImpulsionando />, então
// este componente foca no copyright do cliente.

export interface SiteFooterProps {
  tenantName: string;
  slogan?: string | null;
  className?: string;
  /** Conteúdo extra antes da linha de copyright (links, redes, etc.). */
  children?: React.ReactNode;
}

export function SiteFooter({
  tenantName,
  slogan,
  className,
  children,
}: SiteFooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer
      className={
        "border-t border-border/60 bg-background/60 text-sm text-muted-foreground " +
        (className ?? "")
      }
    >
      {children ? <div className="container mx-auto px-4 py-6">{children}</div> : null}
      <div className="container mx-auto px-4 py-4 text-center">
        © {year} {tenantName}
        {slogan ? <span className="mx-1">·</span> : null}
        {slogan ? <span className="italic">{slogan}</span> : null}
      </div>
    </footer>
  );
}

/** Tira institucional global — renderizada em __root.tsx para todas as rotas. */
export function PoweredByImpulsionando() {
  return (
    <div
      data-impulsionando-powered-by
      className="w-full border-t border-border/40 bg-background/80 px-4 py-2 text-center text-[11px] tracking-wide text-muted-foreground"
    >
      Produzido e Gerenciado por{" "}
      <a
        href="https://impulsionando.com.br"
        target="_blank"
        rel="noreferrer"
        className="font-medium text-foreground hover:underline"
      >
        Impulsionando Tecnologia
      </a>
    </div>
  );
}
