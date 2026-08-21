# Grupo EVR — Checklist de Prontidão Comercial e Go-live

## Status desta branch
- Front institucional EVR: IMPLEMENTADO NA BRANCH
- Portal executivo multiempresa: IMPLEMENTADO NA BRANCH
- Contexto persistente: IMPLEMENTADO NA BRANCH
- PWA/área do paciente: IMPLEMENTADO NA BRANCH
- Agenda inteligente / antecipação: ESTRUTURA IMPLEMENTADA NA BRANCH
- Ative-se Pharma / operação: ESTRUTURA IMPLEMENTADA NA BRANCH
- Atribuição intercompany: MODELO IMPLEMENTADO NA BRANCH
- Fiscal: MODELO IMPLEMENTADO; PROVEDOR REAL PENDENTE
- Pagamentos reais: DEPENDE DE CREDENCIAIS/CONFIGURAÇÃO DA EMPRESA
- NF real: DEPENDE DE PROVEDOR FISCAL HOMOLOGADO E CNPJ EMISSOR
- Supabase production migrations: NÃO APLICADAS
- DNS `grupoevr.impulsionando.com.br`: NÃO PUBLICADO/VALIDADO
- CI/build/lint/tests: PENDENTE
- Merge na main: NÃO REALIZADO

## Critérios obrigatórios antes de produção
1. Reconciliar `feat/grupo-evr` com a `main` atual e resolver conflitos sem regressão.
2. Executar `npm run build`.
3. Executar `npm run lint`.
4. Executar `npm test`.
5. Executar `npm run test:rls` e demais suítes RLS aplicáveis.
6. Executar `npm run ci:security`.
7. Executar `npm run test:e2e` para jornadas críticas.
8. Executar varredura de contraste/acessibilidade.
9. Validar schema das migrations EVR contra banco de staging.
10. Validar RLS por empresa: Instituto EVR, Dr. Responde, Ative-se Pharma.
11. Validar que marketing/farmácia não acessam prontuário sem autorização específica.
12. Validar concorrência na agenda e na aceitação de vaga antecipada.
13. Validar idempotência de pagamento, pedido, webhook e emissão fiscal.
14. Configurar CNPJs/emitentes/contas reais somente após confirmação oficial.
15. Configurar provedor fiscal homologado e testar homologação antes de produção.
16. Configurar pagamentos reais por empresa e confirmar destino financeiro.
17. Confirmar contatos oficiais, identidade visual definitiva e credenciais profissionais publicáveis.
18. Publicar e validar DNS/SSL somente após aprovação do build final.
19. Testar PWA em iOS/Android e comportamento de atualização.
20. Executar roteiro comercial ponta a ponta em ambiente de demonstração controlado.

## Roteiro de aceite comercial
1. Login do gestor.
2. Escolha do contexto Grupo EVR / Instituto EVR / Dr. Responde / Ative-se Pharma.
3. Visualização de indicadores por empresa.
4. Entrada de lead/paciente.
5. Agendamento.
6. Simulação de cancelamento e recuperação da vaga via antecipação.
7. Atendimento e geração de pedido/prescrição conforme regra aplicável.
8. Consentimento do paciente para encaminhamento à Ative-se.
9. Recepção do pedido na farmácia.
10. Validação farmacêutica.
11. Orçamento.
12. Aprovação e pagamento.
13. Produção/qualidade.
14. Retirada/entrega.
15. Emissão fiscal pelo CNPJ correto.
16. Retorno ao BI consolidado.
17. Exibição de origem, destino, empresa faturadora e receita gerada entre empresas.

## Regra de demonstração
Dados demonstrativos devem ser identificados como DEMO. Nenhum dado fictício deve ser apresentado como produção real.

## Regra de segurança
Nenhuma migration, credencial, DNS, pagamento real ou emissão fiscal deve ser ativado em produção antes de validação e plano de rollback.
