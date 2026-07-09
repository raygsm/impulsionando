# CORE_WHITELABEL_COMMERCIAL

**Fonte única oficial do modelo comercial White Label — Ecossistema Impulsionando.**
Este documento prevalece sobre qualquer proposta, tabela, e-mail, apresentação, landing page ou material de vendas anterior. Qualquer divergência deve ser corrigida para refletir o que está aqui.

- **Status:** vigente
- **Escopo:** todos os parceiros White Label (novos e renovações)
- **Última atualização:** 09/07/2026
- **Responsável:** Núcleo Impulsionando (Comercial + Financeiro + Implantação)

---

## 1. Modelo comercial

O White Label Impulsionando opera com **plano único por domínio**, sem tabela de "planos" (Basic/Pro/Enterprise). Recursos, módulos e limites são os mesmos para todos os clientes do parceiro — o que varia é o **volume de domínios ativos**.

| Item | Valor |
|---|---|
| Preço por domínio/mês (tabela cheia) | **R$ 299,90** |
| Mínimo contratado | **10 domínios** |
| Valor mínimo mensal | **R$ 2.999,00** |
| Ciclo de cobrança | mensal, recorrente |
| Reajuste | anual, por IPCA (índice oficial) |
| Fidelidade | nenhuma |
| Setup / adesão | isento |

**Um "domínio" = um cliente final do parceiro** (um tenant ativo dentro da operação White Label do parceiro), independente do subdomínio, domínio próprio ou volume de usuários daquele cliente.

---

## 2. Descontos por volume

Aplicados **em tempo real** conforme o número de domínios ativos ao fechamento do ciclo. O desconto incide sobre o valor unitário e é recalculado automaticamente ao subir ou descer de faixa.

| Faixa (domínios ativos) | Desconto | Preço unitário | Mensalidade base |
|---|---|---|---|
| 10 (mínimo) | 0% | R$ 299,90 | R$ 2.999,00 |
| 11 a 50 | 10% | R$ 269,91 | de R$ 2.969,01 a R$ 13.495,50 |
| 51 a 100 | 15% | R$ 254,92 | de R$ 13.000,92 a R$ 25.492,00 |
| 101 ou mais | 20% | R$ 239,92 | a partir de R$ 24.231,92 |

Regra: o desconto vigente é o da faixa em que o volume se encontra no **momento do fechamento do ciclo**. Não há proporcionalidade retroativa entre faixas.

---

## 3. O que está incluso

Incluso na mensalidade por domínio, sem cobrança adicional:

- Plataforma completa Impulsionando (CRM, Agenda, PDV, Financeiro, Delivery, Marketplace, Vitrine, BI, Área do Cliente)
- Marca 100% configurável (logo, paleta, tipografia, e-mails transacionais, app)
- Domínio próprio do cliente (`sistemas.suamarca.com` ou domínio completo)
- Console do Parceiro (gestão de clientes, planos internos, cobrança, permissões)
- Atualizações, correções, novos módulos e melhorias contínuas
- Suporte técnico ao parceiro (canal dedicado)
- Backups, monitoramento, infraestrutura e SLA operacional
- Integrações nativas do Core (Mercado Pago, N8N, Impulsionito, autenticação, RLS multi-tenant)

---

## 4. Serviços cobrados à parte

Os seguintes serviços **não estão incluídos** na mensalidade por domínio e são contratados separadamente, por pacote, conforme uso de cada cliente do parceiro:

- **WhatsApp Business API** (mensagens, templates aprovados, provedores oficiais)
- **VoIP / Telefonia** (linhas, ramais, gravação, DID)
- **SMS transacional e marketing**
- **E-mail transacional em alto volume** (acima da cota inclusa)
- **Envelopes de assinatura eletrônica**
- **Serviços profissionais sob demanda** (migrações complexas, customizações específicas, treinamentos in-company)

Esses serviços seguem tabelas próprias vigentes no Core Impulsionando e podem ser repassados pelo parceiro aos clientes finais com a margem que julgar adequada.

---

## 5. Simulador comercial

O simulador oficial está publicado em:

- `/white-label` (landing pública — bloco de investimento)
- `/white-label/parceiro` (console do parceiro — planejamento interno)

Componente: `src/components/whitelabel/WhiteLabelSimulator.tsx`.

O simulador calcula em tempo real:

1. Faixa de desconto atual
2. Preço unitário aplicado
3. Mensalidade total
4. Domínios restantes até a próxima faixa
5. Economia adicional estimada ao atingir a próxima faixa

Ele é a única fonte de cálculo aceita para propostas comerciais. Planilhas paralelas não substituem o simulador.

---

## 6. Regras de expansão

- **Ativação de novo domínio:** entra no ciclo imediatamente, pró-rata do dia da ativação.
- **Desativação:** encerra ao final do ciclo em curso; não há devolução proporcional.
- **Transferência de titularidade** entre parceiros: sob análise, requer aprovação do Núcleo Impulsionando.
- **Downgrade abaixo de 10 domínios:** não permitido enquanto contrato ativo. A cobrança mínima permanece em R$ 2.999,00/mês mesmo com menos de 10 domínios ativos.
- **Migração de faixa (para cima ou para baixo):** automática, aplicada no próximo fechamento.
- **Suspensão temporária de domínio:** conta como ativo enquanto a base do cliente estiver preservada; para deixar de contar, o domínio deve ser desativado formalmente.

---

## 7. Exemplos de cálculo

### Exemplo A — Parceiro iniciante (10 domínios)
- 10 × R$ 299,90 = **R$ 2.999,00/mês**
- Anual: **R$ 35.988,00**

### Exemplo B — Parceiro em crescimento (32 domínios)
- Faixa: 11–50 (10% off)
- 32 × R$ 269,91 = **R$ 8.637,12/mês**
- Faltam 19 domínios para atingir 15% de desconto
- Economia adicional estimada ao subir de faixa: ~R$ 480/mês
- Anual: **R$ 103.645,44**

### Exemplo C — Parceiro consolidado (75 domínios)
- Faixa: 51–100 (15% off)
- 75 × R$ 254,92 = **R$ 19.119,00/mês**
- Faltam 26 domínios para atingir 20% de desconto
- Anual: **R$ 229.428,00**

### Exemplo D — Parceiro enterprise (150 domínios)
- Faixa: 101+ (20% off)
- 150 × R$ 239,92 = **R$ 35.988,00/mês**
- Anual: **R$ 431.856,00**

### Comparativo de economia acumulada (vs. tabela cheia)

| Domínios | Tabela cheia/mês | Com desconto/mês | Economia/mês | Economia/ano |
|---|---|---|---|---|
| 10 | R$ 2.999,00 | R$ 2.999,00 | R$ 0,00 | R$ 0,00 |
| 32 | R$ 9.596,80 | R$ 8.637,12 | R$ 959,68 | R$ 11.516,16 |
| 75 | R$ 22.492,50 | R$ 19.119,00 | R$ 3.373,50 | R$ 40.482,00 |
| 150 | R$ 44.985,00 | R$ 35.988,00 | R$ 8.997,00 | R$ 107.964,00 |

---

## 8. Perguntas frequentes (FAQ oficial)

**1. Existem "planos" no White Label?**
Não. O plano é único. Todo cliente do parceiro recebe a mesma stack. O que muda é o volume.

**2. Posso começar com menos de 10 domínios?**
Não. O mínimo contratado é 10, mesmo que o parceiro ainda não tenha 10 clientes ativos.

**3. Posso vender módulos separados aos meus clientes?**
Sim, comercialmente. Do lado Impulsionando, todos os módulos já estão liberados por domínio — o parceiro decide o que expõe ou empacota internamente.

**4. WhatsApp está incluso?**
Não. É contratado por pacote separado, por conta do custo real da API oficial da Meta.

**5. O desconto de faixa vale desde o primeiro mês?**
Sim, no ciclo em que o parceiro ultrapassa a faixa. Não é retroativo.

**6. Posso ter mais de um parceiro na mesma marca?**
Não. Cada operação White Label é vinculada a um único CNPJ contratante.

**7. Tem fidelidade?**
Não. Cancelamento a qualquer momento, com efeito no próximo ciclo.

**8. Como funciona o reajuste?**
Anual, IPCA, aplicado na data de aniversário do contrato.

**9. Posso repassar valores diferentes aos meus clientes?**
Sim. O preço final ao cliente do parceiro é livre — o Impulsionando cobra o parceiro pela tabela acima.

**10. Custos de gateway (Mercado Pago) entram na mensalidade?**
Não. Taxas de meios de pagamento são de responsabilidade da operação do parceiro / cliente final.

---

## 9. Orientações para o Comercial

- Nunca prometer "plano Basic", "plano Pro", "plano Enterprise" — **não existem**.
- Sempre abrir o simulador em `/white-label` na frente do prospect.
- Explicar visualmente a **próxima faixa** para transformar volume em argumento (upsell natural).
- Fechar contrato com mínimo de **10 domínios** — se o prospect não sustenta 10, ofertar Core direto (não White Label).
- Deixar explícito, por escrito, que **WhatsApp, VoIP, SMS e telefonia são à parte**.
- Não conceder desconto fora das faixas oficiais. Descontos ad-hoc precisam de aprovação do Núcleo.
- Enviar proposta sempre citando este documento como anexo/referência.

## 10. Orientações para o Financeiro

- Emitir NF-e do parceiro (não do cliente final do parceiro).
- Cobrança mensal, no aniversário do contrato.
- Recalcular a faixa **no dia do fechamento** com base em domínios ativos daquele momento.
- Serviços à parte (WhatsApp, VoIP, SMS, telefonia) entram como linhas separadas na mesma fatura, pelo consumo do ciclo.
- Inadimplência: notificação em D+3, suspensão de novos provisionamentos em D+10, bloqueio operacional em D+15 (não afeta backup e dados por 90 dias).
- Reajuste anual por IPCA aplicado automaticamente na data de aniversário.

## 11. Orientações para Implantação

- SLA de publicação da marca do parceiro: **48h úteis** após kit de marca completo recebido.
- Kit mínimo do parceiro: logo (SVG), paleta, tipografia, domínio, dados fiscais, responsável técnico.
- Domínio do cliente do parceiro sobe em até 24h após apontamento DNS correto.
- Console do Parceiro liberado no D+1 da assinatura, para o parceiro começar a cadastrar clientes.
- Treinamento inicial do parceiro: incluso, 2 sessões remotas de até 90 minutos.
- Migrações de dados de sistemas legados: escopo separado, cobrado como Serviço Profissional.

---

## 12. Pendências futuras

Itens fora do escopo comercial atual, mapeados para próximas rodadas:

- Publicar página institucional dedicada com este modelo (`/white-label/comercial`).
- Adicionar simulador embutido no dashboard demo do parceiro (`/demo/white-label`) com base fictícia.
- Contrato-modelo White Label em PDF, gerado a partir deste documento.
- Painel financeiro do parceiro com projeção da próxima faixa e economia acumulada.
- API pública para o parceiro consultar sua fatura corrente e domínios ativos.
- Programa de bonificação por indicação parceiro → parceiro (a definir com o Núcleo).
- Pacote enterprise acima de 500 domínios com condições sob consulta.

---

**Governança:** qualquer alteração neste documento exige aprovação conjunta de Comercial + Financeiro + Núcleo Impulsionando e nova versão datada. Materiais de venda desatualizados devem ser recolhidos e substituídos.
