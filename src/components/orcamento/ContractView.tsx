/**
 * Contrato objetivo exibido na etapa 10 do wizard.
 * Renderiza apenas HTML semântico — imprimível via window.print().
 */
import { computeQuote, formatBRL } from "@/lib/pricing";
import { getModule } from "@/data/moduleCatalog";

export interface ContractData {
  quoteNumber: string;
  leadName: string;
  leadEmail: string | null;
  leadWhatsapp: string;
  companyName: string | null;
  companyTaxId: string | null;
  companyLegalName: string | null;
  category: string | null;
  segment: string | null;
  modules: string[];
}

export function ContractView({ data }: { data: ContractData }) {
  const totals = computeQuote(data.modules);
  const today = new Date().toLocaleDateString("pt-BR");

  return (
    <article className="prose prose-sm max-w-none text-foreground bg-card p-6 rounded-lg border border-border">
      <header className="mb-6 not-prose">
        <h2 className="text-xl font-bold mb-1">Contrato de Contratação — Impulsionando Tecnologia</h2>
        <p className="text-sm text-muted-foreground">
          Nº {data.quoteNumber} • Emitido em {today}
        </p>
      </header>

      <section className="mb-5 not-prose">
        <h3 className="font-semibold text-base mb-2">1. Partes</h3>
        <div className="text-sm space-y-1">
          <p>
            <strong>Contratante:</strong> {data.leadName}
            {data.companyName && <> — {data.companyName}</>}
            {data.companyTaxId && <> (CNPJ {data.companyTaxId})</>}
          </p>
          <p>
            <strong>Contato:</strong> {data.leadWhatsapp}
            {data.leadEmail && <> • {data.leadEmail}</>}
          </p>
          <p>
            <strong>Contratada:</strong> Impulsionando Tecnologia — plataforma de gestão e
            relacionamento entregue como serviço (SaaS).
          </p>
        </div>
      </section>

      <section className="mb-5 not-prose">
        <h3 className="font-semibold text-base mb-2">2. Módulos contratados</h3>
        {totals.lineItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum módulo selecionado.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {totals.lineItems.map((it) => {
              const mod = getModule(it.slug);
              return (
                <li key={it.slug} className="flex justify-between">
                  <span>
                    {mod?.name ?? it.slug}
                    {mod?.requiresExternalCredentials && (
                      <span className="text-xs text-muted-foreground"> • depende de credenciais externas</span>
                    )}
                  </span>
                  <span className="tabular-nums text-muted-foreground">{formatBRL(it.priceCents)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mb-5 not-prose">
        <h3 className="font-semibold text-base mb-2">3. Valores</h3>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Subtotal mensal</span>
            <span className="tabular-nums">{formatBRL(totals.subtotalCents)}</span>
          </div>
          {totals.discountCents > 0 && (
            <div className="flex justify-between text-emerald-700 dark:text-emerald-500">
              <span>Desconto progressivo ({totals.discountPct}%)</span>
              <span className="tabular-nums">- {formatBRL(totals.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
            <span>Total mensal</span>
            <span className="tabular-nums">{formatBRL(totals.totalCents)}</span>
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            Cobrança mensal recorrente, com vencimento no mesmo dia do mês da contratação.
            Sem multa por cancelamento. Valores em Reais (R$).
          </p>
        </div>
      </section>

      <section className="mb-5 not-prose">
        <h3 className="font-semibold text-base mb-2">4. Prazo de ativação</h3>
        <p className="text-sm">
          Ativação inicial em até 5 dias úteis. Recursos que dependem de credenciais externas
          (gateway de pagamento, WhatsApp Business API, integrações de terceiros) serão ativados
          conforme liberação e configuração das credenciais necessárias pelo contratante.
        </p>
      </section>

      <section className="mb-5 not-prose">
        <h3 className="font-semibold text-base mb-2">5. Cancelamento e reembolso</h3>
        <p className="text-sm">
          O contratante pode cancelar a qualquer momento sem multa, com efeito ao final do
          ciclo já pago. Reembolso integral disponível em até 7 dias corridos após a primeira
          cobrança, conforme o Código de Defesa do Consumidor (art. 49).
        </p>
      </section>

      <section className="mb-5 not-prose">
        <h3 className="font-semibold text-base mb-2">6. Suporte e LGPD</h3>
        <p className="text-sm">
          Suporte por WhatsApp e e-mail em horário comercial. A Impulsionando atua como operadora
          de dados pessoais conforme a LGPD (Lei 13.709/2018), tratando os dados exclusivamente
          para entrega do serviço contratado. Detalhes em /privacidade.
        </p>
      </section>

      <section className="not-prose">
        <h3 className="font-semibold text-base mb-2">7. Aceite eletrônico</h3>
        <p className="text-sm">
          Ao marcar os checkboxes e avançar para o pagamento, o contratante declara ter ciência
          dos módulos escolhidos, valores, prazos, regras de uso, condições de cancelamento e
          dependências de credenciais externas, e aceita este contrato de forma eletrônica,
          com registro de data, hora e identificação técnica.
        </p>
      </section>
    </article>
  );
}
