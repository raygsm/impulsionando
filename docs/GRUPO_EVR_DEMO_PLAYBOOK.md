# Grupo EVR — Playbook de demonstração executiva

## Objetivo
Demonstrar valor econômico e operacional em poucos minutos sem apresentar funcionalidades como concluídas quando ainda dependem de integração externa ou dados reais.

## Roteiro principal
1. Entrar no Portal Executivo do Grupo EVR.
2. Escolher **Consolidado Grupo EVR**.
3. Mostrar visão por empresa e mapa origem → destino → faturador.
4. Entrar no **Instituto EVR**.
5. Mostrar agenda, ocupação, cancelamentos, no-show e fila de antecipação.
6. Simular uma vaga liberada e a recuperação via paciente elegível da fila.
7. Mostrar atendimento/pedido clínico e a opção de o paciente autorizar envio para orçamento na **Ative-se Pharma**.
8. Trocar de contexto para **Ative-se Pharma** sem novo login.
9. Mostrar recebimento do pedido, validação farmacêutica, orçamento, aprovação, pagamento, produção, qualidade e entrega.
10. Mostrar PDV/estoque/lote/validade/perdas/margem.
11. Voltar ao Consolidado e mostrar a atribuição: empresa de origem, empresa destinatária, empresa faturadora e receita gerada entre empresas.
12. Abrir a **Área do Paciente/PWA** e mostrar agenda, documentos liberados, prescrições/pedidos, financeiro, notificações e consentimentos.

## Frase de fechamento comercial
“Vocês deixam de administrar três operações isoladas e passam a enxergar um único ecossistema econômico, sem perder a separação clínica, fiscal e gerencial de cada empresa.”

## Portões de prontidão
### DEMONSTRÁVEL
- front navegável;
- contextos empresariais visíveis;
- PWA/área do paciente navegável;
- jornadas desenhadas;
- sem dados falsos apresentados como reais.

### FUNCIONAL EM STAGING
- migrations aplicadas em ambiente seguro;
- RLS validado;
- autenticação e permissões validadas;
- agenda com concorrência testada;
- atribuição intercompany persistida;
- fluxo farmácia persistido;
- integrações externas com sandbox/homologação.

### PRONTO PARA PRODUÇÃO
- build/typecheck/CI aprovado;
- backup e rollback definidos;
- emissor fiscal homologado e configurado por empresa;
- pagamentos e webhooks testados;
- consentimentos revisados;
- política de acesso clínico/farmácia validada;
- observabilidade e alertas ativos;
- DNS/subdomínio publicado e verificado.

## O que nunca afirmar sem evidência
- emissão fiscal automática ativa;
- pagamento liquidando em produção;
- prescrição controlada integrada a sistemas oficiais;
- estoque real sincronizado;
- aplicativo nativo publicado em lojas;
- dados executivos reais carregados.

## Métricas-chave para a venda
- receita consolidada por empresa;
- origem e destino de cada conversão;
- receita intercompany gerada;
- conversão clínica → farmácia;
- vagas recuperadas por antecipação;
- valor recuperado de agenda;
- no-show e cancelamentos;
- ticket e margem da Ative-se;
- recorrência e recompra;
- estoque em risco de vencimento;
- SLA de produção e entrega.
