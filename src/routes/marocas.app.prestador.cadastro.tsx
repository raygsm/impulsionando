import { createFileRoute } from "@tanstack/react-router";
import { MarocasAppShell } from "@/components/marocas/MarocasAppShell";
import { Section } from "@/components/marocas/MarocasUI";

export const Route = createFileRoute("/marocas/app/prestador/cadastro")({
  head: () => ({ meta: [{ title: "Meus dados — Prestador Marocas" }, { name: "robots", content: "noindex" }] }),
  component: CadastroPage,
});

function CadastroPage() {
  return (
    <MarocasAppShell
      title="Meus dados"
      description="Informações cadastrais, documentos e dados bancários para repasse."
      breadcrumbs={[{ label: "Prestador", to: "/marocas/app/prestador" }, { label: "Meus dados" }]}
    >
      <Section title="Dados pessoais">
        <form className="rounded-xl border bg-card p-5 grid md:grid-cols-2 gap-4">
          {[
            { l: "Nome completo", v: "Sandra Marques" },
            { l: "CPF", v: "•••.•••.•••-00" },
            { l: "Telefone", v: "(21) 99999-0000" },
            { l: "E-mail", v: "sandra@example.com" },
            { l: "Categoria", v: "Limpeza" },
            { l: "PIX", v: "sandra@example.com" },
          ].map((f) => (
            <label key={f.l} className="text-sm">
              <span className="text-xs font-medium text-muted-foreground">{f.l}</span>
              <input defaultValue={f.v} className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </label>
          ))}
          <div className="md:col-span-2 flex justify-end">
            <button type="button" className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90">Salvar</button>
          </div>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">Persistência real e KYC serão conectados pelo Codex.</p>
      </Section>
    </MarocasAppShell>
  );
}
