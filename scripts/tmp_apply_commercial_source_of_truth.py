from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"anchor not found: {label}")
    return text.replace(old, new, 1)


# Canonical public domain.
p = Path("src/components/marketing/PublicFooter.tsx")
s = p.read_text()
s = s.replace("https://impulsionandobrasil.com.br", "https://impulsionando.com.br")
p.write_text(s)

p = Path("src/routes/__root.tsx")
s = p.read_text()
s = s.replace('sameAs: ["https://impulsionandobrasil.com.br"],', "sameAs: [],")
p.write_text(s)

# /planos — fail closed while no backend plan is explicitly published.
p = Path("src/routes/planos.tsx")
s = p.read_text()
s = s.replace(
    '{ title: "Planos e Preços — Essencial, Integrado, Avançado e Sob Medida | Impulsionando Tecnologia" },',
    '{ title: "Planos e Soluções — Impulsionando Tecnologia" },',
)
s = s.replace(
    '{ name: "description", content: "Planos atrelados ao salário mínimo: Essencial (½ SM), Integrado (1 SM), Avançado (2 SM) e Sob Medida. Mensal ou anual com 2 meses grátis." },',
    '{ name: "description", content: "Conheça as soluções da Impulsionando. Valores e contratação direta só são exibidos quando publicados pela gestão no catálogo comercial oficial." },',
)
s = s.replace(
    '{ property: "og:description", content: "Do Essencial ao Sob Medida. Anual com 2 meses grátis. Sem fidelidade obrigatória." },',
    '{ property: "og:description", content: "Soluções modulares para empresas. Condições comerciais são publicadas a partir do catálogo oficial da Impulsionando." },',
)
availability = '''  const { data: availability } = useQuery({
    queryKey: ["commercial-availability"],
    queryFn: () => fetchAvailability(),
    staleTime: 60_000,
  });'''
s = replace_once(
    s,
    availability,
    availability
    + '''
  // Fail closed: nenhuma condição comercial é renderizada enquanto o backend
  // não publicar explicitamente pelo menos um plano com show_on_site=true.
  const commercialPublishingReady = availability?.hasPublishedPlans === true;''',
    "planos availability",
)
s = replace_once(
    s,
    '{audience === "white-label" && (',
    '{audience === "white-label" && commercialPublishingReady && (',
    "white label gate",
)
s = replace_once(
    s,
    '{audience === "consumidor" && (',
    '{audience === "consumidor" && commercialPublishingReady && (',
    "consumer gate",
)
s = replace_once(
    s,
    '{audience === "empresas" && (',
    '{audience === "empresas" && commercialPublishingReady && (',
    "company gate",
)
anchor = '''      {audience === "white-label" && commercialPublishingReady && (
        <WhiteLabelPlansPanel />
      )}'''
fallback = '''      {availability && !commercialPublishingReady && (
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 w-full">
          <Card className="p-8 sm:p-10 text-center border-primary/25 bg-primary/5">
            <Badge variant="outline" className="mb-4">Catálogo comercial controlado pelo Core</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Condições comerciais em configuração</h1>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Nenhum plano está publicado para contratação direta neste momento. Para evitar valores desatualizados ou condições não autorizadas, preços e checkout permanecem ocultos até a publicação pela gestão.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild size="lg" className="bg-gradient-primary">
                <Link to="/orcamento">Solicitar proposta</Link>
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={() => openImpulsionito("planos-catalogo-nao-publicado")}>
                Falar com especialista
              </Button>
            </div>
          </Card>
        </section>
      )}

''' + anchor
s = replace_once(s, anchor, fallback, "planos fallback")
p.write_text(s)

# /demo — render published plans from the same backend source, never a static price table.
p = Path("src/routes/demo.index.tsx")
s = p.read_text()
if 'from "@tanstack/react-query"' not in s:
    s = replace_once(
        s,
        'import { createFileRoute, Link } from "@tanstack/react-router";',
        'import { createFileRoute, Link } from "@tanstack/react-router";\nimport { useQuery } from "@tanstack/react-query";\nimport { useServerFn } from "@tanstack/react-start";',
        "demo query imports",
    )
if 'getCommercialAvailability' not in s:
    s = replace_once(
        s,
        'import { openImpulsionito } from "@/lib/impulsionito-tracking";',
        'import { openImpulsionito } from "@/lib/impulsionito-tracking";\nimport { getCommercialAvailability } from "@/lib/commercial.functions";',
        "demo commercial import",
    )
s = replace_once(
    s,
    "function DemoLanding() {\n  return (",
    '''function DemoLanding() {
  const fetchAvailability = useServerFn(getCommercialAvailability);
  const { data: availability } = useQuery({
    queryKey: ["commercial-availability", "demo"],
    queryFn: () => fetchAvailability(),
    staleTime: 60_000,
  });
  const publishedPlans = availability?.publishedPlans ?? [];

  return (''',
    "demo component query",
)
start_marker = "        {/* Planos — etapa final da demonstração */}"
end_marker = "        {/* Especialista */}"
if start_marker not in s or end_marker not in s:
    raise RuntimeError("demo commercial section markers not found")
start = s.index(start_marker)
end = s.index(end_marker, start)
replacement = '''        {/* Condições comerciais — sempre derivadas do catálogo publicado no Core */}
        <section className="mb-6 rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6 sm:p-8">
          <div className="text-center mb-6">
            <Badge className="bg-gradient-primary mb-3 gap-1"><Sparkles className="w-3 h-3" /> Condições comerciais</Badge>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {publishedPlans.length ? "Planos publicados pela gestão" : "Solicite uma proposta para sua operação"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">
              {publishedPlans.length
                ? "Os valores abaixo vêm diretamente do catálogo comercial oficial da Impulsionando."
                : "Nenhum preço está publicado para contratação direta neste momento. Não exibimos valores estimados ou desatualizados."}
            </p>
          </div>
          {publishedPlans.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {publishedPlans.map((plan) => {
                const price = plan.recurring_amount > 0
                  ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(plan.recurring_amount)
                  : "Sob consulta";
                return (
                  <Card key={plan.code} className="p-5 flex flex-col hover-lift">
                    <h3 className="font-semibold text-base">{plan.name}</h3>
                    <div className="text-2xl font-bold mt-1">{price}</div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed flex-1">{plan.description ?? "Condição comercial publicada pela gestão."}</p>
                    <Button asChild size="sm" variant="outline" className="mt-4 focus-ring">
                      <Link to="/planos">{plan.cta ?? (plan.route_to_quote ? "Solicitar proposta" : "Ver condições")} <ArrowRight className="w-3 h-3 ml-1" /></Link>
                    </Button>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild size="lg" className="bg-gradient-primary btn-alive gap-2">
                <Link to="/orcamento">Solicitar proposta <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={() => openImpulsionito("demo-condicoes-comerciais")}>
                <MessageCircle className="w-4 h-4 mr-2" /> Falar com especialista
              </Button>
            </div>
          )}
        </section>

'''
s = s[:start] + replacement + s[end:]
p.write_text(s)

# Verification must reject stale static prices, not require them.
p = Path("scripts/verify-planos-meta.ts")
s = p.read_text()
begin_marker = "  // 3. Preços e quotas exatos"
end_marker = "  // 4. Trial 7 dias + 90 dias"
if begin_marker in s and end_marker in s:
    begin = s.index(begin_marker)
    finish = s.index(end_marker, begin)
    block = '''  // 3. Catálogo comercial: preços antigos não podem ser institucionalizados no HTML.
  const staleCommercialValues = ["R$ 759", "R$ 1.518", "R$ 3.036"];
  const staleFound = staleCommercialValues.filter((value) => html.includes(value));
  add(
    "sem preços comerciais legados hardcoded",
    staleFound.length === 0,
    staleFound.length ? `valores legados encontrados: ${staleFound.join(", ")}` : "catálogo público controlado pelo backend",
  );

'''
    s = s[:begin] + block + s[finish:]
p.write_text(s)

# Ensure no diagnostic tooling remains in the final branch tree.
for tmp in [
    ".github/workflows/tmp-commercial-source-of-truth.yml",
    ".github/workflows/tmp-commercial-source-of-truth-v2.yml",
    ".github/workflows/tmp-commercial-source-of-truth-v3.yml",
    "scripts/tmp_apply_commercial_source_of_truth.py",
]:
    path = Path(tmp)
    if path.exists():
        path.unlink()
